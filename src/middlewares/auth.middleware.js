const { verifyToken } = require("../utils/jwt");
const { fail } = require("../utils/response");

function authMiddleware(req, res, next) {
  try {
    const authHeader = req.headers["authorization"];

    if (!authHeader) {
      return fail(res, "Token requerido", 401);
    }

    // Formato esperado: "Bearer token"
    const parts = authHeader.split(" ");

    if (parts.length !== 2 || parts[0] !== "Bearer") {
      return fail(res, "Formato de token inválido", 401);
    }

    const token = parts[1];

    const decoded = verifyToken(token);

    req.user = decoded;

    next();
  } catch (error) {
    console.error("Auth error:", error.message);
    return fail(res, "Token inválido o expirado", 401);
  }
}

module.exports = {
  authMiddleware,
};