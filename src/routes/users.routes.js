const express = require("express");
const router = express.Router();

const { listUsers } = require("../controllers/users.controller");
const { authMiddleware } = require("../middlewares/auth.middleware");

// Listar usuarios
router.get("/", authMiddleware, listUsers);

module.exports = router;