const {
  loginUser,
  registerUser,
  getUserById,
} = require("../services/auth.service");
const { ok, created, fail } = require("../utils/response");

async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return fail(res, "Email y contraseña son obligatorios", 400);
    }

    const data = await loginUser({ email, password });

    return ok(res, data, "Login correcto");
  } catch (error) {
    console.error("Login error:", error.message);
    return fail(res, error.message || "Error en login", 401);
  }
}

async function register(req, res) {
  try {
    const { full_name, email, password, role } = req.body;

    if (!full_name || !email || !password) {
      return fail(
        res,
        "Nombre completo, email y contraseña son obligatorios",
        400
      );
    }

    const data = await registerUser({
      full_name,
      email,
      password,
      role,
    });

    return created(res, data, "Usuario registrado correctamente");
  } catch (error) {
    console.error("Register error:", error.message);
    return fail(res, error.message || "Error al registrar usuario", 400);
  }
}

async function me(req, res) {
  try {
    const userId = req.user?.uid;

    if (!userId) {
      return fail(res, "No autenticado", 401);
    }

    const user = await getUserById(userId);

    if (!user) {
      return fail(res, "Usuario no encontrado", 404);
    }

    return ok(res, user, "Usuario autenticado");
  } catch (error) {
    console.error("Me error:", error.message);
    return fail(res, "Error al obtener usuario", 500);
  }
}

module.exports = {
  login,
  register,
  me,
};