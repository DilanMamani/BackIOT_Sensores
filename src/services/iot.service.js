const { pool } = require("../config/db");
const { evaluateMetricStatus } = require("./threshold.service");
const { METRIC_TO_SENSOR_LABEL } = require("../constants/metricSensorMap");

const calculateRisk = (metrics = {}) => {
  const soil = Number(metrics.soilPercent || 0);
  const vib = Number(metrics.vibrationCount || 0);
  const accel = Number(metrics.accelMagnitude || 0);
  const gyro = Number(metrics.gyroMagnitude || 0);

  let score = 0;

  if (soil >= 60) score += 20;
  if (soil >= 80) score += 20;

  if (vib >= 3) score += 15;
  if (vib >= 8) score += 20;

  if (accel >= 1.3) score += 15;
  if (accel >= 2.2) score += 15;

  if (gyro >= 0.8) score += 10;
  if (gyro >= 1.5) score += 15;

  let riskLevel = "normal";
  if (score >= 70) riskLevel = "danger";
  else if (score >= 30) riskLevel = "warning";

  return {
    riskLevel,
    riskScore: score,
  };
};

const createSample = async (payload, sourceIp = null) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const { deviceCode, sampledAt, metrics } = payload;

    if (!deviceCode || !metrics || typeof metrics !== "object") {
      throw new Error("Payload inválido. Se requiere deviceCode y metrics.");
    }

    const sampledAtFinal = sampledAt || new Date().toISOString();

    const deviceResult = await client.query(
      `
      select id, code
      from devices
      where code = $1
      limit 1
      `,
      [deviceCode]
    );

    const device = deviceResult.rows[0];

    if (!device) {
      throw new Error("Dispositivo no encontrado");
    }

    const batchPayload = {
      ...payload,
      sampledAt: sampledAtFinal,
    };

    const batchResult = await client.query(
      `
      insert into reading_batches (device_id, source_ip, transport, payload)
      values ($1, $2, 'http', $3::jsonb)
      returning id
      `,
      [device.id, sourceIp, JSON.stringify(batchPayload)]
    );

    const batchId = batchResult.rows[0].id;

    const { riskLevel, riskScore } = calculateRisk(metrics);

    const sampleResult = await client.query(
      `
      insert into device_samples (
        batch_id,
        device_id,
        sampled_at,
        received_at,
        risk_level,
        risk_score,
        metadata
      )
      values ($1, $2, $3::timestamptz, now(), $4, $5, '{}'::jsonb)
      returning id, sampled_at
      `,
      [batchId, device.id, sampledAtFinal, riskLevel, riskScore]
    );

    const sample = sampleResult.rows[0];

    for (const [metricCode, metricValue] of Object.entries(metrics)) {
      const numericValue = Number(metricValue);

      if (Number.isNaN(numericValue)) {
        continue;
      }

      const metricTypeResult = await client.query(
        `
        select id, code
        from metric_types
        where code = $1
        limit 1
        `,
        [metricCode]
      );

      const metricType = metricTypeResult.rows[0];
      if (!metricType) continue;

      const sensorLabel = METRIC_TO_SENSOR_LABEL[metricCode] || null;
      let deviceSensorId = null;

      if (sensorLabel) {
        const deviceSensorResult = await client.query(
          `
          select id
          from device_sensors
          where device_id = $1 and label = $2
          limit 1
          `,
          [device.id, sensorLabel]
        );

        deviceSensorId = deviceSensorResult.rows[0]?.id || null;
      }

      const thresholdResult = await client.query(
        `
        select severity, operator, value_1, value_2, message_template
        from metric_thresholds
        where metric_type_id = $1
          and is_active = true
          and (device_id is null or device_id = $2)
        order by case when severity = 'danger' then 1 else 2 end
        `,
        [metricType.id, device.id]
      );

      const status = evaluateMetricStatus(numericValue, thresholdResult.rows);

      const metricInsertResult = await client.query(
        `
        insert into sample_metrics (
          sample_id,
          device_id,
          device_sensor_id,
          metric_type_id,
          numeric_value,
          raw_numeric_value,
          quality,
          status,
          metadata
        )
        values ($1, $2, $3, $4, $5, $6, 'ok', $7, '{}'::jsonb)
        returning id
        `,
        [
          sample.id,
          device.id,
          deviceSensorId,
          metricType.id,
          numericValue,
          numericValue,
          status,
        ]
      );

      const sampleMetricId = metricInsertResult.rows[0].id;

      if (status === "warning" || status === "danger") {
        await client.query(
          `
          insert into alerts (
            device_id,
            device_sensor_id,
            sample_id,
            sample_metric_id,
            metric_type_id,
            level,
            code,
            title,
            message,
            current_value,
            threshold_value,
            is_resolved,
            metadata
          )
          values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, null, false, '{}'::jsonb)
          `,
          [
            device.id,
            deviceSensorId,
            sample.id,
            sampleMetricId,
            metricType.id,
            status,
            metricCode,
            `Alerta en ${metricCode}`,
            `La métrica ${metricCode} entró en estado ${status}.`,
            numericValue,
          ]
        );
      }
    }

    await client.query(
      `
      update devices
      set last_seen_at = now()
      where id = $1
      `,
      [device.id]
    );

    await client.query("COMMIT");

    return {
      sampleId: sample.id,
      deviceCode: device.code,
      sampledAt: sample.sampled_at,
      riskLevel,
      riskScore,
    };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

module.exports = {
  createSample,
};