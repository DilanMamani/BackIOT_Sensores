/**
 * telegram.service.js
 * Usa fetch nativo de Node 18+ — no requiere node-fetch.
 * Puedes desinstalar node-fetch: npm uninstall node-fetch
 */

const { pool } = require('../config/db');

const TELEGRAM_API = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}`;

// ─── sendMessage ─────────────────────────────────────────────────────────────
async function sendMessage(chatId, text) {
  const res = await fetch(`${TELEGRAM_API}/sendMessage`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({
      chat_id:    chatId,
      text,
      parse_mode: 'HTML',
    }),
  });

  const data = await res.json();

  if (!data.ok) {
    throw new Error(`Telegram API error: ${data.description}`);
  }

  return data;
}

// ─── getAdminChatIds ──────────────────────────────────────────────────────────
async function getAdminChatIds() {
  const { rows } = await pool.query(`
    SELECT id, full_name, telegram_chat_id
    FROM users
    WHERE role = 'admin'
      AND is_active = true
      AND telegram_chat_id IS NOT NULL
  `);
  return rows;
}

// ─── linkTelegramChatId ───────────────────────────────────────────────────────
async function linkTelegramChatId(userId, chatId) {
  const { rows } = await pool.query(`
    UPDATE users
    SET telegram_chat_id = $1, updated_at = now()
    WHERE id = $2
    RETURNING id, full_name, email, telegram_chat_id
  `, [chatId, userId]);
  return rows[0] || null;
}

// ─── unlinkTelegramChatId ─────────────────────────────────────────────────────
async function unlinkTelegramChatId(userId) {
  const { rows } = await pool.query(`
    UPDATE users
    SET telegram_chat_id = NULL, updated_at = now()
    WHERE id = $1
    RETURNING id, full_name, email
  `, [userId]);
  return rows[0] || null;
}

// ─── logNotification ─────────────────────────────────────────────────────────
// Esta función faltaba — causaba ReferenceError silenciado que cortaba el envío
async function logNotification({ userId, chatId, alertId, messageText, success, errorDetail = null }) {
  try {
    await pool.query(`
      INSERT INTO telegram_notification_log
        (user_id, chat_id, alert_id, message_text, success, error_detail)
      VALUES ($1, $2, $3, $4, $5, $6)
    `, [userId || null, chatId, alertId || null, messageText, success, errorDetail]);
  } catch (e) {
    // El log nunca debe romper el flujo principal
    console.error('[telegram] Error al registrar log:', e.message);
  }
}

// ─── buildAlertMessage ────────────────────────────────────────────────────────
const METRIC_NAME_ES = {
  soilPercent:         'Humedad del suelo',
  soilRaw:             'Valor bruto del suelo',
  vibrationDetected:   'Vibración detectada',
  vibrationCount:      'Conteo de vibraciones',
  vibrationDurationMs: 'Duración de vibración',
  accelX:              'Aceleración X',
  accelY:              'Aceleración Y',
  accelZ:              'Aceleración Z',
  gyroX:               'Giro X',
  gyroY:               'Giro Y',
  gyroZ:               'Giro Z',
  accelMagnitude:      'Magnitud de aceleración',
  gyroMagnitude:       'Magnitud de giro',
};

const LEVEL_ICON = { danger: '🚨', warning: '⚠️', info: 'ℹ️' };

function buildAlertMessage(alert) {
  const icon       = LEVEL_ICON[alert.level] || '⚠️';
  const metricName = METRIC_NAME_ES[alert.metric_code] || alert.metric_code || alert.code;
  const device     = alert.device_name
    ? `${alert.device_name} (<code>${alert.device_code}</code>)`
    : `<code>${alert.device_code}</code>`;
  const value     = alert.current_value != null ? `\n📊 <b>Valor:</b> ${alert.current_value}` : '';
  const threshold = alert.threshold_value != null ? ` / Umbral: ${alert.threshold_value}` : '';
  const time      = new Date().toLocaleString('es-BO', {
    timeZone: 'America/La_Paz',
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

  return (
    `${icon} <b>ALERTA ${alert.level?.toUpperCase()} — SlideWatch</b>\n\n` +
    `📡 <b>Dispositivo:</b> ${device}\n` +
    `🔬 <b>Métrica:</b> ${metricName}` +
    `${value}${threshold}\n` +
    `📝 <b>Detalle:</b> ${alert.message || alert.title || 'Valor crítico detectado'}\n` +
    `🕐 <b>Hora:</b> ${time}`
  );
}

// ─── notifyAdminsAlert ────────────────────────────────────────────────────────
async function notifyAdminsAlert(alert) {
  if (!process.env.TELEGRAM_BOT_TOKEN) {
    console.warn('[telegram] TELEGRAM_BOT_TOKEN no configurado, omitiendo notificación');
    return;
  }

  let admins;
  try {
    admins = await getAdminChatIds();
  } catch (e) {
    console.error('[telegram] No se pudo obtener admins:', e.message);
    return;
  }

  if (!admins.length) {
    console.log('[telegram] No hay admins con Telegram vinculado');
    return;
  }

  const messageText = buildAlertMessage(alert);

  const results = await Promise.allSettled(
    admins.map(async (admin) => {
      try {
        await sendMessage(admin.telegram_chat_id, messageText);
        await logNotification({
          userId:      admin.id,
          chatId:      admin.telegram_chat_id,
          alertId:     alert.id || null,
          messageText,
          success:     true,
        });
        console.log(`[telegram] Alerta enviada a ${admin.full_name} (${admin.telegram_chat_id})`);
      } catch (e) {
        await logNotification({
          userId:      admin.id,
          chatId:      admin.telegram_chat_id,
          alertId:     alert.id || null,
          messageText,
          success:     false,
          errorDetail: e.message,
        });
        console.error(`[telegram] Error enviando a ${admin.full_name}:`, e.message);
      }
    })
  );

  return results;
}

module.exports = {
  sendMessage,
  getAdminChatIds,
  linkTelegramChatId,
  unlinkTelegramChatId,
  notifyAdminsAlert,
  buildAlertMessage,
};