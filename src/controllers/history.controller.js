const { ok, fail } = require("../utils/response");
const {
  getHistoryByRange,
  getHistoryByDates,
} = require("../services/history.service");
const { mapRowsToHistory } = require("../utils/historyMapper");

const getHistory = async (req, res) => {
  try {
    const deviceCode = req.query.deviceCode || "esp32-node-001";
    const range = req.query.range || "1h";
    const { from, to } = req.query;

    let rows = [];

    if (from && to) {
      rows = await getHistoryByDates(deviceCode, from, to);
    } else {
      rows = await getHistoryByRange(deviceCode, range);
    }

    const data = mapRowsToHistory(rows);

    return ok(res, data, "Histórico obtenido correctamente");
  } catch (error) {
    console.error("Error en getHistory:", error.message);
    return fail(res, 500, "Error al obtener histórico");
  }
};

module.exports = {
  getHistory,
};