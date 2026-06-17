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
      return fail(res, 400, "Email y contraseña son obligatorios");
    }

    const data = await loginUser({ email, password });

    return ok(res, data, "Login correcto");
  } catch (error) {
    console.error("Login error:", error.message);
    return fail(res, 401, error.message || "Error en login");
  }
}

async function register(req, res) {
  try {
    const { full_name, email, password, role } = req.body;

    if (!full_name || !email || !password) {
      return fail(
        res,
        400,
        "Nombre completo, email y contraseña son obligatorios"
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
    return fail(res, 400, error.message || "Error al registrar usuario");
  }
}

async function me(req, res) {
  try {
    const userId = req.user?.uid;

    if (!userId) {
      return fail(res, 401, "No autenticado");
    }

    const user = await getUserById(userId);

    if (!user) {
      return fail(res, 404, "Usuario no encontrado");
    }

    return ok(res, user, "Usuario autenticado");
  } catch (error) {
    console.error("Me error:", error.message);
    return fail(res, 500, "Error al obtener usuario");
  }
}

module.exports = {
  login,
  register,
  me,
};