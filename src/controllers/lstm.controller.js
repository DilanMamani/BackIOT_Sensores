const { ok, fail } = require('../utils/response');
const { predictRisk, checkLstmHealth } = require('../services/lstm.service');

const getPrediction = async (req, res) => {
  try {
    const { deviceCode } = req.params;
    const result = await predictRisk(deviceCode);
    return ok(res, result, 'Predicción LSTM obtenida');
  } catch (error) {
    console.error('[lstm.controller] Error en predicción:', error.message);
    return fail(res, 500, error.message || 'Error al obtener predicción LSTM');
  }
};

const getHealth = async (_req, res) => {
  try {
    const result = await checkLstmHealth();
    return ok(res, result, 'Microservicio LSTM activo');
  } catch (error) {
    return fail(res, 503, 'Microservicio LSTM no disponible');
  }
};

module.exports = { getPrediction, getHealth };
