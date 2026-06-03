const express = require('express');
const router  = express.Router();

const { authMiddleware } = require('../middlewares/auth.middleware');
const {
  linkChatId,
  unlinkChatId,
  getTelegramStatus,
  getLinkedAdmins,
} = require('../controllers/telegram.controller');

// Todos requieren autenticación
router.use(authMiddleware);

// Vincular chat_id al usuario actual
router.post('/link',    linkChatId);

// Desvincular chat_id del usuario actual
router.delete('/link',  unlinkChatId);

// Ver si el usuario actual tiene Telegram vinculado
router.get('/status',   getTelegramStatus);

// Solo admin: ver qué admins tienen Telegram vinculado
router.get('/admins',   getLinkedAdmins);

module.exports = router;
