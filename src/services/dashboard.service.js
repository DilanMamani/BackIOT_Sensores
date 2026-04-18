const { pool } = require("../config/db");
const { parseRangeToSqlInterval } = require("../utils/timeRanges");

const getSnapshotByDeviceCode = async (deviceCode = "esp32-node-001") => {
  const query = `
    select *
    from v_current_device_snapshot
    where device_code = $1
    limit 1;
  `;

  const { rows } = await pool.query(query, [deviceCode]);
  return rows[0] || null;
};

const getSeriesByDeviceCode = async (
  deviceCode = "esp32-node-001",
  range = "1h"
) => {
  const intervalText = parseRangeToSqlInterval(range);

  const query = `
    select
      ds.sampled_at,
      max(case when mt.code = 'soilPercent' then sm.numeric_value end) as soil,
      max(case when mt.code = 'soilRaw' then sm.numeric_value end) as raw,
      max(case when mt.code = 'vibrationCount' then sm.numeric_value end) as vib,
      max(case when mt.code = 'vibrationDurationMs' then sm.numeric_value end) as dur,
      max(case when mt.code = 'accelMagnitude' then sm.numeric_value end) as accel,
      max(case when mt.code = 'gyroMagnitude' then sm.numeric_value end) as gyro,
      max(case when mt.code = 'accelX' then sm.numeric_value end) as ax,
      max(case when mt.code = 'accelY' then sm.numeric_value end) as ay,
      max(case when mt.code = 'accelZ' then sm.numeric_value end) as az,
      max(case when mt.code = 'gyroX' then sm.numeric_value end) as gx,
      max(case when mt.code = 'gyroY' then sm.numeric_value end) as gy,
      max(case when mt.code = 'gyroZ' then sm.numeric_value end) as gz
    from device_samples ds
    join devices d on d.id = ds.device_id
    join sample_metrics sm on sm.sample_id = ds.id
    join metric_types mt on mt.id = sm.metric_type_id
    where d.code = $1
      and ds.sampled_at >= now() - $2::interval
    group by ds.sampled_at
    order by ds.sampled_at asc;
  `;

  const { rows } = await pool.query(query, [deviceCode, intervalText]);

  return {
    times: rows.map((r) => r.sampled_at),
    soil: rows.map((r) => Number(r.soil || 0)),
    vib: rows.map((r) => Number(r.vib || 0)),
    accel: rows.map((r) => Number(r.accel || 0)),
    gyro: rows.map((r) => Number(r.gyro || 0)),
    raw: rows.map((r) => Number(r.raw || 0)),
    dur: rows.map((r) => Number(r.dur || 0)),
    ax: rows.map((r) => Number(r.ax || 0)),
    ay: rows.map((r) => Number(r.ay || 0)),
    az: rows.map((r) => Number(r.az || 0)),
    gx: rows.map((r) => Number(r.gx || 0)),
    gy: rows.map((r) => Number(r.gy || 0)),
    gz: rows.map((r) => Number(r.gz || 0)),
  };
};

module.exports = {
  getSnapshotByDeviceCode,
  getSeriesByDeviceCode,
};