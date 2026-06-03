const { pool } = require("../config/db");
const { parseRangeToSqlInterval } = require("../utils/timeRanges");

/**
 * Devuelve el historial de riesgo directamente de device_samples.
 * Una fila por muestra — sin duplicados por sensor.
 */
const getRiskHistoryByRange = async (
  deviceCode = "esp32-node-001",
  range = "24h"
) => {
  const intervalText = parseRangeToSqlInterval(range);

  const { rows } = await pool.query(
    `select
       ds.id          as sample_id,
       ds.sampled_at,
       ds.risk_level,
       ds.risk_score
     from device_samples ds
     join devices d on d.id = ds.device_id
     where d.code = $1
       and ds.sampled_at >= now() - $2::interval
     order by ds.sampled_at desc`,
    [deviceCode, intervalText]
  );

  return rows;
};

const getRiskHistoryByDates = async (
  deviceCode = "esp32-node-001",
  from,
  to
) => {
  const { rows } = await pool.query(
    `select
       ds.id          as sample_id,
       ds.sampled_at,
       ds.risk_level,
       ds.risk_score
     from device_samples ds
     join devices d on d.id = ds.device_id
     where d.code = $1
       and ds.sampled_at between $2::timestamptz and $3::timestamptz
     order by ds.sampled_at desc`,
    [deviceCode, from, to]
  );

  return rows;
};

module.exports = { getRiskHistoryByRange, getRiskHistoryByDates };