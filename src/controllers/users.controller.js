const { getAllUsers } = require("../services/users.service");
const { ok, fail } = require("../utils/response");

async function listUsers(req, res) {
  try {
    const users = await getAllUsers();
    return ok(res, users, "Usuarios obtenidos correctamente");
  } catch (error) {
    console.error("List users error:", error.message);
    return fail(res, "Error al obtener usuarios", 500);
  }
}

module.exports = {
  listUsers,
};