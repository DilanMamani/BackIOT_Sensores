const { pool } = require('../config/db');
const { parseRangeToSqlInterval } = require('../utils/timeRanges');

/**
 * Reportes para el mapa.
 * Admin: todos los estados.
 * Ciudadano: excluye "descartado", máximo 7d.
 */
const getReportsForMap = async ({ range = '7d', role = 'ciudadano' }) => {
  const effectiveRange = role === 'ciudadano' ? '7d' : range;
  const intervalText   = parseRangeToSqlInterval(effectiveRange);

  const statusFilter = role === 'ciudadano'
    ? "AND cr.status != 'descartado'"
    : '';

  const query = `
    SELECT
      cr.id,
      cr.incident_type,
      cr.description,
      cr.urgency_level,
      cr.status,
      cr.latitude,
      cr.longitude,
      cr.location_name,
      cr.photo_url,
      cr.reported_at,
      cr.updated_at,
      u.full_name AS reporter_name
    FROM citizen_reports cr
    LEFT JOIN users u ON cr.user_id = u.id
    WHERE cr.reported_at >= now() - $1::interval
      AND cr.latitude  IS NOT NULL
      AND cr.longitude IS NOT NULL
      ${statusFilter}
    ORDER BY cr.reported_at DESC;
  `;

  const { rows } = await pool.query(query, [intervalText]);
  return rows;
};

/**
 * Dispositivos con coordenadas. Solo admin.
 */
const getDevicesForMap = async () => {
  const { rows } = await pool.query(`
    SELECT
      d.id, d.code, d.name, d.description,
      d.status, d.is_active, d.last_seen_at,
      d.firmware_version, d.connection_mode,
      l.name      AS location_name,
      l.latitude,
      l.longitude
    FROM devices d
    LEFT JOIN locations l ON l.id = d.location_id
    WHERE l.latitude  IS NOT NULL
      AND l.longitude IS NOT NULL
    ORDER BY d.id ASC;
  `);
  return rows;
};

/**
 * Alertas abiertas detalladas. Solo admin.
 */
const getOpenAlertsForMap = async (range = '24h') => {
  const intervalText = parseRangeToSqlInterval(range);
  const { rows } = await pool.query(`
    SELECT
      a.id, a.device_id,
      d.code  AS device_code,
      d.name  AS device_name,
      a.level, a.title, a.message,
      a.current_value, a.threshold_value,
      mt.code AS metric_code,
      mt.name AS metric_name,
      mt.unit,
      a.created_at,
      a.is_resolved
    FROM alerts a
    JOIN devices  d  ON d.id  = a.device_id
    LEFT JOIN metric_types mt ON mt.id = a.metric_type_id
    WHERE a.is_resolved = false
      AND a.created_at >= now() - $1::interval
    ORDER BY a.created_at DESC;
  `, [intervalText]);
  return rows;
};

/**
 * Alertas públicas reducidas para ciudadano (solo level + code, sin datos internos).
 */
const getPublicAlertsForMap = async () => {
  const { rows } = await pool.query(`
    SELECT
      a.id,
      d.code  AS device_code,
      a.level,
      a.title,
      a.created_at
    FROM alerts a
    JOIN devices d ON d.id = a.device_id
    WHERE a.is_resolved = false
      AND a.created_at >= now() - interval '7 days'
    ORDER BY a.created_at DESC;
  `);
  return rows;
};

module.exports = {
  getReportsForMap,
  getDevicesForMap,
  getOpenAlertsForMap,
  getPublicAlertsForMap,
};
