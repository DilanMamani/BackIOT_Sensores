const Groq = require('groq-sdk');
// Importamos tu servicio de reportes que ejecuta el SQL
const { getReportById } = require('../services/reports.service'); 
const { ok, fail } = require('../utils/response');
const groq = new Groq({ apiKey: process.env.GROK_API_KEY });

const SYSTEM_PROMPT = `Eres el asistente virtual oficial de SlideWatch, un sistema de alerta temprana de deslizamientos de tierra. 
Tu objetivo es ayudar a los ciudadanos a entender cómo reportar incidentes, qué hacer en caso de emergencia y consultar el estado de sus reportes.

REGLAS DE RESPUESTA:
1. Mantén un tono calmado, institucional, empático y claro. No seas alarmista.
2. Si el usuario reporta una emergencia inminente (ej. "se está cayendo mi casa"), dile INMEDIATAMENTE que se ponga a salvo y proporcionales los números de emergencia: Policía (110), Bomberos (119) y Defensa Civil (117).
3. Si el usuario te da un ID de reporte, usa la herramienta 'consultar_estado_reporte' para darle información real de la base de datos.
4. Si preguntan cómo reportar, guíalos para que usen el botón "+" en la aplicación.
5. Sé conciso. No des respuestas de más de 3 o 4 párrafos cortos.`;
const tools = [
  {
    type: 'function',
    function: {
      name: 'consultar_estado_reporte',
      description: 'Busca un reporte de incidente específico usando su ID numérico en la base de datos. Úsala cuando el usuario quiera saber el estado de un reporte y te proporcione un número.',
      parameters: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'El ID numérico del reporte.' }
        },
        required: ['id']
      }
    }
  }
];

/**
 * Ejecutor de la herramienta usando tu servicio SQL
 */
async function ejecutarConsultarReporte(args) {
  const { id } = args;
  
  // Llamamos a la función que ya tienes en reports.service.js
  const reporte = await getReportById(id);
  
  if (!reporte) {
    return {
      tipo_respuesta: 'texto',
      mensaje: `No pude encontrar ningún reporte con el ID ${id}. Por favor, verifica el número e intenta de nuevo.`
    };
  }

  // Si lo encuentra, estructuramos la respuesta
  return {
    tipo_respuesta: 'ui_card_reporte',
    datos: reporte,
    mensaje: `Encontré el reporte #${id}. Actualmente su estado es: **${reporte.status}**. Fue reportado por ${reporte.reporter_name} en la ubicación: ${reporte.location_name}.`
  };
}

async function ejecutarTool(toolName, toolArgs) {
  switch (toolName) {
    case 'consultar_estado_reporte':
      return await ejecutarConsultarReporte(toolArgs);
    default:
      return {
        tipo_respuesta: 'texto',
        mensaje: 'Herramienta desconocida.',
      };
  }
}

const enviarMensaje = async (req, res) => {
  try {
    const { mensaje, historial = [] } = req.body;

    if (!mensaje?.trim()) {
      return res.status(400).json({ ok: false, msg: 'El mensaje no puede estar vacío.' });
    }

    const messages = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...historial.map((h) => ({
        role: h.role === 'model' ? 'assistant' : h.role, 
        content: h.content 
      })),
      { role: 'user', content: mensaje }
    ];

    const chatCompletion = await groq.chat.completions.create({
      messages: messages,
      model: 'llama-3.3-70b-versatile',
      tools: tools,
      tool_choice: 'auto'
    });

    const responseMessage = chatCompletion.choices[0].message;
    const toolCalls = responseMessage.tool_calls;

    if (toolCalls && toolCalls.length > 0) {
      const toolCall = toolCalls[0];
      const toolName = toolCall.function.name;
      const toolArgs = JSON.parse(toolCall.function.arguments);

      const respuestaEstructurada = await ejecutarTool(toolName, toolArgs);
      return ok(res, respuestaEstructurada, 'Respuesta del asistente');
    }
    return ok(res, {
    tipo_respuesta: 'texto',
    mensaje: responseMessage.content,
    }, 'Respuesta del asistente');

  } catch (error) {
    console.error('Error en chatbot:', error);
    return res.status(500).json({
      ok: false,
      tipo_respuesta: 'texto',
      mensaje: 'Error interno al procesar tu consulta.',
    });
  }
};

module.exports = { enviarMensaje };
