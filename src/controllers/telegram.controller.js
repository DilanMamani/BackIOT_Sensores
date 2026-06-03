const {
  linkTelegramChatId,
  unlinkTelegramChatId,
  getAdminChatIds,
  sendMessage,
} = require('../services/telegram.service');
const { ok, fail } = require('../utils/response');

/**
 * POST /api/telegram/link
 * Body: { chat_id: 123456789 }
 * Vincula el chat_id de Telegram al usuario autenticado.
 * El usuario debe obtener su chat_id desde el bot (@userinfobot o el propio bot).
 */
async function linkChatId(req, res) {
  try {
    const userId = req.user?.uid;
    const { chat_id } = req.body;

    if (!chat_id || isNaN(Number(chat_id))) {
      return fail(res, 400, 'chat_id inválido. Debe ser el ID numérico de Telegram.');
    }

    const user = await linkTelegramChatId(userId, Number(chat_id));
    if (!user) return fail(res, 404, 'Usuario no encontrado');

    // Enviar mensaje de confirmación al usuario
    try {
      await sendMessage(
        Number(chat_id),
        `✅ <b>Cuenta vinculada correctamente</b>\n\nHola <b>${user.full_name}</b>, a partir de ahora recibirás alertas del sistema SlideWatch en este chat.`
      );
    } catch {
      // No es crítico si el mensaje de bienvenida falla
    }

    return ok(res, { telegram_chat_id: user.telegram_chat_id }, 'Telegram vinculado correctamente');
  } catch (e) {
    console.error('linkChatId error:', e.message);
    return fail(res, 500, 'Error al vincular Telegram');
  }
}

/**
 * DELETE /api/telegram/link
 * Desvincula el chat_id del usuario autenticado.
 */
async function unlinkChatId(req, res) {
  try {
    const userId = req.user?.uid;
    const user   = await unlinkTelegramChatId(userId);
    if (!user) return fail(res, 404, 'Usuario no encontrado');
    return ok(res, null, 'Telegram desvinculado correctamente');
  } catch (e) {
    console.error('unlinkChatId error:', e.message);
    return fail(res, 500, 'Error al desvincular Telegram');
  }
}

/**
 * GET /api/telegram/status
 * Devuelve si el usuario actual tiene Telegram vinculado.
 */
async function getTelegramStatus(req, res) {
  try {
    const userId = req.user?.uid;
    const { rows } = await require('../config/db').pool.query(
      'SELECT telegram_chat_id FROM users WHERE id = $1',
      [userId]
    );
    const linked = !!(rows[0]?.telegram_chat_id);
    return ok(res, { linked, chat_id: rows[0]?.telegram_chat_id || null }, 'Estado de Telegram');
  } catch (e) {
    return fail(res, 500, 'Error al obtener estado de Telegram');
  }
}

/**
 * GET /api/telegram/admins
 * Solo admin. Lista qué admins tienen Telegram vinculado.
 */
async function getLinkedAdmins(req, res) {
  try {
    if (req.user?.role !== 'admin') return fail(res, 403, 'Acceso denegado');
    const admins = await getAdminChatIds();
    return ok(res, admins, 'Admins con Telegram vinculado');
  } catch (e) {
    return fail(res, 500, 'Error al obtener admins vinculados');
  }
}

module.exports = {
  linkChatId,
  unlinkChatId,
  getTelegramStatus,
  getLinkedAdmins,
};
