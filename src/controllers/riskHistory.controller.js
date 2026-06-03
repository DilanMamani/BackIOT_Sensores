const { ok, fail } = require("../utils/response");
const {
  getRiskHistoryByRange,
  getRiskHistoryByDates,
} = require("../services/riskHistory.service");

const getRiskHistory = async (req, res) => {
  try {
    const deviceCode = req.query.deviceCode || "esp32-node-001";
    const range      = req.query.range      || "24h";
    const { from, to } = req.query;

    const rows = (from && to)
      ? await getRiskHistoryByDates(deviceCode, from, to)
      : await getRiskHistoryByRange(deviceCode, range);

    return ok(res, rows, "Historial de riesgo obtenido correctamente");
  } catch (error) {
    console.error("Error en getRiskHistory:", error.message);
    return fail(res, 500, "Error al obtener historial de riesgo");
  }
};

module.exports = { getRiskHistory };