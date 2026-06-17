const bcrypt = require('bcryptjs');
const { pool } = require('../config/db');

const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const API = `https://api.telegram.org/bot${TOKEN}`;

// Estado temporal de conversación por chat_id
// { [chatId]: { step: 'email'|'password', email: string } }
const sessions = {};

// ─── HTTP helpers ─────────────────────────────────────────────────────────────
async function apiCall(method, body = {}) {
  const res  = await fetch(`${API}/${method}`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(body),
  });
  return res.json();
}

async function sendMessage(chatId, text, extra = {}) {
  return apiCall('sendMessage', {
    chat_id:    chatId,
    text,
    parse_mode: 'HTML',
    ...extra,
  });
}

// ─── BD helpers ───────────────────────────────────────────────────────────────
async function findAdminByEmail(email) {
  const { rows } = await pool.query(
    `SELECT id, full_name, email, password_hash, role, is_active, telegram_chat_id
     FROM users
     WHERE email = $1
     LIMIT 1`,
    [email.toLowerCase().trim()]
  );
  return rows[0] || null;
}

async function saveChatId(userId, chatId) {
  await pool.query(
    `UPDATE users SET telegram_chat_id = $1, updated_at = now() WHERE id = $2`,
    [chatId, userId]
  );
}

async function removeChatId(chatId) {
  const { rows } = await pool.query(
    `UPDATE users SET telegram_chat_id = NULL, updated_at = now()
     WHERE telegram_chat_id = $1
     RETURNING full_name`,
    [chatId]
  );
  return rows[0] || null;
}

async function findByChatId(chatId) {
  const { rows } = await pool.query(
    `SELECT id, full_name, role FROM users WHERE telegram_chat_id = $1 LIMIT 1`,
    [chatId]
  );
  return rows[0] || null;
}

// ─── Manejadores de comandos / mensajes ───────────────────────────────────────
async function handleStart(chatId) {
  // Si ya está vinculado, informar
  const existing = await findByChatId(chatId);
  if (existing) {
    await sendMessage(chatId,
      `✅ Ya tienes una sesión activa como <b>${existing.full_name}</b>.\n\n` +
      `Usa /salir para cerrar sesión o /estado para ver tu estado.`
    );
    return;
  }

  sessions[chatId] = { step: 'email' };
  await sendMessage(chatId,
    `👋 Bienvenido a <b>SlideWatch</b>\n\n` +
    `Inicia sesión con tu cuenta de administrador para recibir alertas.\n\n` +
    `📧 Escribe tu <b>correo electrónico</b>:`
  );
}

async function handleEstado(chatId) {
  const user = await findByChatId(chatId);
  if (user) {
    await sendMessage(chatId,
      `✅ <b>Sesión activa</b>\n\n` +
      `👤 <b>Usuario:</b> ${user.full_name}\n` +
      `🔔 Recibirás alertas automáticamente en este chat.\n\n` +
      `Usa /salir para cerrar sesión.`
    );
  } else {
    await sendMessage(chatId,
      `❌ No tienes sesión activa.\n\nUsa /start para iniciar sesión.`
    );
  }
}

async function handleSalir(chatId) {
  delete sessions[chatId];
  const user = await removeChatId(chatId);
  if (user) {
    await sendMessage(chatId,
      `👋 Sesión cerrada. Ya no recibirás alertas en este chat.\n\n` +
      `Usa /start para volver a iniciar sesión.`
    );
  } else {
    await sendMessage(chatId,
      `No tenías una sesión activa.\n\nUsa /start para iniciar sesión.`
    );
  }
}

async function handleEmailStep(chatId, text) {
  const email = text.trim();

  // Validación básica de formato
  if (!email.includes('@')) {
    await sendMessage(chatId, `⚠️ Eso no parece un correo válido. Escribe tu <b>correo electrónico</b>:`);
    return;
  }

  sessions[chatId] = { step: 'password', email };
  await sendMessage(chatId,
    `🔑 Escribe tu <b>contraseña</b>:\n\n` +
    `<i>Puedes borrar el mensaje después si lo deseas.</i>`
  );
}

async function handlePasswordStep(chatId, text) {
  const { email } = sessions[chatId];
  const password  = text.trim();

  // Intentar borrar el mensaje con la contraseña por seguridad
  // (no siempre funciona según permisos del chat)

  await sendMessage(chatId, `⏳ Verificando credenciales…`);

  try {
    const user = await findAdminByEmail(email);

    if (!user) {
      delete sessions[chatId];
      await sendMessage(chatId,
        `❌ <b>Correo o contraseña incorrectos.</b>\n\nUsa /start para intentarlo de nuevo.`
      );
      return;
    }

    if (user.role !== 'admin') {
      delete sessions[chatId];
      await sendMessage(chatId,
        `❌ Esta cuenta no tiene permisos de administrador.\n\nUsa /start para intentarlo con otra cuenta.`
      );
      return;
    }

    if (!user.is_active) {
      delete sessions[chatId];
      await sendMessage(chatId,
        `❌ Esta cuenta está inactiva. Contacta al administrador del sistema.`
      );
      return;
    }

    const passwordOk = await bcrypt.compare(password, user.password_hash);

    if (!passwordOk) {
      delete sessions[chatId];
      await sendMessage(chatId,
        `❌ <b>Correo o contraseña incorrectos.</b>\n\nUsa /start para intentarlo de nuevo.`
      );
      return;
    }

    // Si ya tenía otro chat vinculado, lo reemplaza
    await saveChatId(user.id, chatId);
    delete sessions[chatId];

    await sendMessage(chatId,
      `✅ <b>Sesión iniciada correctamente</b>\n\n` +
      `Hola <b>${user.full_name}</b>, a partir de ahora recibirás las alertas del sistema SlideWatch en este chat.\n\n` +
      `Usa /estado para ver tu estado o /salir para cerrar sesión.`
    );

    console.log(`[telegram-bot] Admin vinculado: ${user.full_name} (chat_id: ${chatId})`);

  } catch (err) {
    delete sessions[chatId];
    console.error('[telegram-bot] Error en login:', err.message);
    await sendMessage(chatId,
      `❌ Error interno. Intenta de nuevo con /start.`
    );
  }
}

// ─── Router de mensajes entrantes ────────────────────────────────────────────
async function handleUpdate(update) {
  const msg = update.message;
  if (!msg || !msg.text) return;

  const chatId = msg.chat.id;
  const text   = msg.text.trim();

  // Comandos
  if (text === '/start')  { await handleStart(chatId);  return; }
  if (text === '/estado') { await handleEstado(chatId); return; }
  if (text === '/salir')  { await handleSalir(chatId);  return; }
  if (text === '/ayuda' || text === '/help') {
    await sendMessage(chatId,
      `<b>Comandos disponibles:</b>\n\n` +
      `/start  — Iniciar sesión\n` +
      `/estado — Ver estado de tu sesión\n` +
      `/salir  — Cerrar sesión\n` +
      `/ayuda  — Ver esta ayuda`
    );
    return;
  }

  // Flujo de login conversacional
  const session = sessions[chatId];
  if (session?.step === 'email')    { await handleEmailStep(chatId, text);    return; }
  if (session?.step === 'password') { await handlePasswordStep(chatId, text); return; }

  // Mensaje sin contexto
  await sendMessage(chatId,
    `Usa /start para iniciar sesión o /ayuda para ver los comandos disponibles.`
  );
}

// ─── Long polling ─────────────────────────────────────────────────────────────
let lastUpdateId = 0;

async function poll() {
  if (!TOKEN) {
    console.warn('[telegram-bot] TELEGRAM_BOT_TOKEN no configurado, bot no iniciado');
    return;
  }

  console.log('[telegram-bot] Bot iniciado con long polling');

  while (true) {
    try {
      const data = await apiCall('getUpdates', {
        offset:          lastUpdateId + 1,
        timeout:         30,           // long polling: espera hasta 30s
        allowed_updates: ['message'],
      });

      if (data.ok && data.result?.length) {
        for (const update of data.result) {
          lastUpdateId = update.update_id;
          handleUpdate(update).catch(e =>
            console.error('[telegram-bot] handleUpdate error:', e.message)
          );
        }
      }
    } catch (err) {
      console.error('[telegram-bot] Poll error:', err.message);
      // Esperar 5s antes de reintentar para no saturar en caso de error de red
      await new Promise(r => setTimeout(r, 5000));
    }
  }
}

function initTelegramBot() {
  // Correr en background sin bloquear el servidor
  poll().catch(e => console.error('[telegram-bot] Fatal:', e.message));
}

module.exports = { initTelegramBot };
