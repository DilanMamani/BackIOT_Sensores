const express = require("express");
const router = express.Router();

const { login, register, me } = require("../controllers/auth.controller");
const { authMiddleware } = require("../middlewares/auth.middleware");

// Login
router.post("/login", login);

// Registro
router.post("/register", register);

// Usuario autenticado
router.get("/me", authMiddleware, me);

module.exports = router;