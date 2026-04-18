const { pool } = require("../config/db");

const createLocation = async ({
  name,
  description = null,
  latitude = null,
  longitude = null,
}) => {
  const query = `
    insert into locations (name, description, latitude, longitude)
    values ($1, $2, $3, $4)
    returning *;
  `;

  const values = [
    name,
    description,
    latitude !== null ? Number(latitude) : null,
    longitude !== null ? Number(longitude) : null,
  ];

  const { rows } = await pool.query(query, values);
  return rows[0];
};

module.exports = {
  createLocation,
};