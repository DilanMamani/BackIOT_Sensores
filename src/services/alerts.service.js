const { pool } = require("../config/db");
const { parseRangeToSqlInterval } = require("../utils/timeRanges");

const getOpenAlerts = async (deviceCode, range = "24h") => {
  const intervalText = parseRangeToSqlInterval(range);

  const query = `
    select
      a.id,
      a.device_id,
      d.code as device_code,
      d.name as device_name,
      a.device_sensor_id,
      a.sample_id,
      a.sample_metric_id,
      a.metric_type_id,
      mt.code as metric_code,
      mt.name as metric_name,
      a.level,
      a.code,
      a.title,
      a.message,
      a.current_value,
      a.threshold_value,
      a.created_at,
      a.is_resolved
    from alerts a
    join devices d on d.id = a.device_id
    left join metric_types mt on mt.id = a.metric_type_id
    where a.is_resolved = false
      and a.created_at >= now() - $1::interval
      and ($2::text is null or d.code = $2)
    order by a.created_at desc;
  `;

  const { rows } = await pool.query(query, [intervalText, deviceCode || null]);
  return rows;
};

const getAllAlerts = async (deviceCode, range = "24h") => {
  const intervalText = parseRangeToSqlInterval(range);

  const query = `
    select
      a.id,
      a.device_id,
      d.code as device_code,
      d.name as device_name,
      a.device_sensor_id,
      a.sample_id,
      a.sample_metric_id,
      a.metric_type_id,
      mt.code as metric_code,
      mt.name as metric_name,
      a.level,
      a.code,
      a.title,
      a.message,
      a.current_value,
      a.threshold_value,
      a.created_at,
      a.is_resolved,
      a.resolved_at
    from alerts a
    join devices d on d.id = a.device_id
    left join metric_types mt on mt.id = a.metric_type_id
    where a.created_at >= now() - $1::interval
      and ($2::text is null or d.code = $2)
    order by a.created_at desc;
  `;

  const { rows } = await pool.query(query, [intervalText, deviceCode || null]);
  return rows;
};

const resolveAlert = async (alertId) => {
  const query = `
    update alerts
    set
      is_resolved = true,
      resolved_at = now()
    where id = $1
    returning *;
  `;

  const { rows } = await pool.query(query, [alertId]);
  return rows[0] || null;
};

module.exports = {
  getOpenAlerts,
  getAllAlerts,
  resolveAlert,
};