const { pool } = require("../config/db");
const { parseRangeToSqlInterval } = require("../utils/timeRanges");

const BASE_METRICS = [
  "soilPercent",
  "soilRaw",
  "vibrationDetected",
  "vibrationCount",
  "vibrationDurationMs",
  "accelX",
  "accelY",
  "accelZ",
  "gyroX",
  "gyroY",
  "gyroZ",
  "accelMagnitude",
  "gyroMagnitude",
];

const getHistoryByRange = async (
  deviceCode = "esp32-node-001",
  range = "1h"
) => {
  const intervalText = parseRangeToSqlInterval(range);

  const query = `
    select
      ds.sampled_at,
      mt.code as metric_code,
      sm.numeric_value,
      sm.status
    from sample_metrics sm
    join device_samples ds on ds.id = sm.sample_id
    join metric_types mt on mt.id = sm.metric_type_id
    join devices d on d.id = sm.device_id
    where d.code = $1
      and ds.sampled_at >= now() - $2::interval
      and mt.code = any($3)
    order by ds.sampled_at asc, mt.code asc;
  `;

  const { rows } = await pool.query(query, [
    deviceCode,
    intervalText,
    BASE_METRICS,
  ]);

  return rows;
};

const getHistoryByDates = async (
  deviceCode = "esp32-node-001",
  from,
  to
) => {
  const query = `
    select
      ds.sampled_at,
      mt.code as metric_code,
      sm.numeric_value,
      sm.status
    from sample_metrics sm
    join device_samples ds on ds.id = sm.sample_id
    join metric_types mt on mt.id = sm.metric_type_id
    join devices d on d.id = sm.device_id
    where d.code = $1
      and ds.sampled_at between $2::timestamptz and $3::timestamptz
      and mt.code = any($4)
    order by ds.sampled_at asc, mt.code asc;
  `;

  const { rows } = await pool.query(query, [
    deviceCode,
    from,
    to,
    BASE_METRICS,
  ]);

  return rows;
};

module.exports = {
  getHistoryByRange,
  getHistoryByDates,
};