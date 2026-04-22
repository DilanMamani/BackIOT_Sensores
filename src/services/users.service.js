const { pool } = require("../config/db");

async function getAllUsers() {
  const query = `
    select id, full_name, email, role, is_active, created_at, updated_at
    from users
    order by id asc;
  `;

  const { rows } = await pool.query(query);
  return rows;
}

module.exports = {
  getAllUsers,
};