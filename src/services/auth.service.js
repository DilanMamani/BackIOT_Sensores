const bcrypt = require("bcryptjs");
const { pool } = require("../config/db");
const { signToken } = require("../utils/jwt");

async function loginUser({ email, password }) {
  const query = `
    select id, full_name, email, password_hash, role, is_active
    from users
    where email = $1
    limit 1;
  `;

  const { rows } = await pool.query(query, [email]);

  if (!rows.length) {
    throw new Error("Usuario no encontrado");
  }

  const user = rows[0];

  if (!user.is_active) {
    throw new Error("Usuario inactivo");
  }

  const isValidPassword = await bcrypt.compare(password, user.password_hash);

  if (!isValidPassword) {
    throw new Error("Credenciales incorrectas");
  }

  const token = signToken({
    uid: user.id,
    email: user.email,
    role: user.role,
  });

  return {
    token,
    user: {
      id: user.id,
      full_name: user.full_name,
      email: user.email,
      role: user.role,
      is_active: user.is_active,
    },
  };
}

async function registerUser({ full_name, email, password, role = "admin" }) {
  const existingQuery = `
    select id
    from users
    where email = $1
    limit 1;
  `;

  const existing = await pool.query(existingQuery, [email]);

  if (existing.rows.length) {
    throw new Error("Ya existe un usuario con ese correo");
  }

  const password_hash = await bcrypt.hash(password, 10);

  const insertQuery = `
    insert into users (full_name, email, password_hash, role, is_active)
    values ($1, $2, $3, $4, true)
    returning id, full_name, email, role, is_active;
  `;

  const { rows } = await pool.query(insertQuery, [
    full_name,
    email,
    password_hash,
    role,
  ]);

  const user = rows[0];

  const token = signToken({
    uid: user.id,
    email: user.email,
    role: user.role,
  });

  return {
    token,
    user,
  };
}

async function getUserById(id) {
  const query = `
    select id, full_name, email, role, is_active
    from users
    where id = $1
    limit 1;
  `;

  const { rows } = await pool.query(query, [id]);

  return rows[0] || null;
}

module.exports = {
  loginUser,
  registerUser,
  getUserById,
};