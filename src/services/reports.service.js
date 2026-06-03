const { pool } = require('../config/db');

async function createReport(data) {
  const { user_id, incident_type, description, urgency_level, latitude, longitude, location_name, photo_url } = data;

  const query = `
    INSERT INTO citizen_reports 
      (user_id, incident_type, description, urgency_level, latitude, longitude, location_name, photo_url)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING *;
  `;

  const { rows } = await pool.query(query, [
    user_id, incident_type, description, urgency_level,
    latitude, longitude, location_name, photo_url
  ]);

  return rows[0];
}

async function getAllReports() {
  const query = `
    SELECT 
      cr.*,
      u.full_name as reporter_name
    FROM citizen_reports cr
    LEFT JOIN users u ON cr.user_id = u.id
    ORDER BY cr.reported_at DESC;
  `;
  const { rows } = await pool.query(query);
  return rows;
}

async function getReportById(id) {
  const query = `
    SELECT 
      cr.*,
      u.full_name as reporter_name
    FROM citizen_reports cr
    LEFT JOIN users u ON cr.user_id = u.id
    WHERE cr.id = $1;
  `;
  const { rows } = await pool.query(query, [id]);
  return rows[0] || null;
}

async function getMyReports(user_id) {
  const query = `
    SELECT * FROM citizen_reports
    WHERE user_id = $1
    ORDER BY reported_at DESC;
  `;
  const { rows } = await pool.query(query, [user_id]);
  return rows;
}

async function updateReportStatus(id, status) {
  const query = `
    UPDATE citizen_reports
    SET status = $1, updated_at = now()
    WHERE id = $2
    RETURNING *;
  `;
  const { rows } = await pool.query(query, [status, id]);
  return rows[0] || null;
}

module.exports = {
  createReport,
  getAllReports,
  getReportById,
  getMyReports,
  updateReportStatus,
};