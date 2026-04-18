const { Pool } = require("pg");
require("dotenv").config();

if (!process.env.DATABASE_URL) {
  throw new Error("Falta la variable DATABASE_URL en el archivo .env");
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

pool.on("connect", () => {
  console.log("Conectado a PostgreSQL/Neon");
});

pool.on("error", (err) => {
  console.error("Error inesperado en PostgreSQL:", err.message);
});

const testDbConnection = async () => {
  try {
    const result = await pool.query("select now() as current_time");
    console.log("Prueba DB OK:", result.rows[0].current_time);
  } catch (error) {
    console.error("Error al probar conexión con la DB:", error.message);
    throw error;
  }
};

module.exports = {
  pool,
  testDbConnection,
};