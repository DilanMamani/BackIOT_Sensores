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

    const { deviceCode, metrics } = payload;

    if (!deviceCode || !metrics || typeof metrics !== "object") {
      throw new Error("Payload inválido");
    }

    const sampledAt = new Date().toISOString();

    // 1. Obtener device
    const deviceRes = await client.query(
      `select id, code from devices where code = $1 limit 1`,
      [deviceCode]
    );

    const device = deviceRes.rows[0];
    if (!device) throw new Error("Dispositivo no encontrado");

    // 2. Guardar batch
    const batchRes = await client.query(
      `insert into reading_batches (device_id, source_ip, transport, payload)
       values ($1, $2, 'http', $3::jsonb)
       returning id`,
      [device.id, sourceIp, JSON.stringify({ ...payload, sampledAt })]
    );

    const batchId = batchRes.rows[0].id;

    // 3. Riesgo
    const { riskLevel, riskScore } = calculateRisk(metrics);

    // 4. Crear sample
    const sampleRes = await client.query(
      `insert into device_samples (
        batch_id, device_id, sampled_at, received_at,
        risk_level, risk_score, metadata
      )
      values ($1, $2, $3::timestamptz, now(), $4, $5, '{}'::jsonb)
      returning id, sampled_at`,
      [batchId, device.id, sampledAt, riskLevel, riskScore]
    );

    const sample = sampleRes.rows[0];

    // =========================================
    // 🔥 OPTIMIZACIÓN: precargar TODO
    // =========================================

    const metricCodes = Object.keys(metrics);

    // metric_types
    const metricTypesRes = await client.query(
      `select id, code from metric_types where code = any($1)`,
      [metricCodes]
    );

    const metricTypeMap = {};
    metricTypesRes.rows.forEach((m) => {
      metricTypeMap[m.code] = m.id;
    });

    // device_sensors
    const deviceSensorsRes = await client.query(
      `select id, label from device_sensors where device_id = $1`,
      [device.id]
    );

    const sensorMap = {};
    deviceSensorsRes.rows.forEach((s) => {
      sensorMap[s.label] = s.id;
    });

    // thresholds
    const thresholdsRes = await client.query(
      `select metric_type_id, severity, operator, value_1, value_2
       from metric_thresholds
       where is_active = true
         and (device_id is null or device_id = $1)`,
      [device.id]
    );

    const thresholdsMap = {};
    thresholdsRes.rows.forEach((t) => {
      if (!thresholdsMap[t.metric_type_id]) {
        thresholdsMap[t.metric_type_id] = [];
      }
      thresholdsMap[t.metric_type_id].push(t);
    });

    // =========================================
    // 🔥 BATCH INSERT metrics
    // =========================================

    const metricValues = [];
    const alertsToInsert = [];

    let paramIndex = 1;
    const queryParams = [];

    for (const [metricCode, metricValue] of Object.entries(metrics)) {
      const numericValue = Number(metricValue);
      if (Number.isNaN(numericValue)) continue;

      const metricTypeId = metricTypeMap[metricCode];
      if (!metricTypeId) continue;

      const sensorLabel = METRIC_TO_SENSOR_LABEL[metricCode];
      const deviceSensorId = sensorMap[sensorLabel] || null;

      const thresholds = thresholdsMap[metricTypeId] || [];
      const status = evaluateMetricStatus(numericValue, thresholds);

      metricValues.push(`(
        $${paramIndex++}, $${paramIndex++}, $${paramIndex++},
        $${paramIndex++}, $${paramIndex++}, $${paramIndex++},
        'ok', $${paramIndex++}, '{}'::jsonb
      )`);

      queryParams.push(
        sample.id,
        device.id,
        deviceSensorId,
        metricTypeId,
        numericValue,
        numericValue,
        status
      );

      // SOLO alertas danger (optimización)
      if (status === "danger") {
        alertsToInsert.push({
          deviceSensorId,
          metricTypeId,
          metricCode,
          value: numericValue,
        });
      }
    }

    // INSERT MASIVO
    if (metricValues.length) {
      await client.query(
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
        values ${metricValues.join(",")}
        `,
        queryParams
      );
    }

    // =========================================
    // 🔥 INSERT ALERTS (solo si hay)
    // =========================================

    for (const alert of alertsToInsert) {
      await client.query(
        `
        insert into alerts (
          device_id,
          device_sensor_id,
          sample_id,
          metric_type_id,
          level,
          code,
          title,
          message,
          current_value,
          is_resolved,
          metadata
        )
        values ($1,$2,$3,$4,'danger',$5,$6,$7,$8,false,'{}')
        `,
        [
          device.id,
          alert.deviceSensorId,
          sample.id,
          alert.metricTypeId,
          alert.metricCode,
          `Alerta en ${alert.metricCode}`,
          `Valor crítico detectado`,
          alert.value,
        ]
      );
    }

    // actualizar last_seen
    await client.query(
      `update devices set last_seen_at = now() where id = $1`,
      [device.id]
    );

    await client.query("COMMIT");

    return {
      sampleId: sample.id,
      deviceCode: device.code,
      sampledAt: sample.sampled_at,
      riskLevel,
      riskScore,
      snapshot: {
        device_code: device.code,
        sampled_at: sample.sampled_at,
        risk_level: riskLevel,
        risk_score: riskScore,
        ...metrics

      }
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