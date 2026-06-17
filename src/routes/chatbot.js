const { Router } = require('express');
const { enviarMensaje } = require('../controllers/chatbot');
const { authMiddleware } = require('../middlewares/auth.middleware');

const router = Router();

/**
 * POST /api/chatbot/mensaje
 * Body: { mensaje: string, historial: Array<{ role: 'user'|'model', content: string }> }
 */
router.post('/mensaje', authMiddleware, enviarMensaje);

module.exports = router;