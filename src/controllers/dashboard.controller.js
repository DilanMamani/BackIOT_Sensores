const { ok, fail } = require("../utils/response");
const {
  getSnapshotByDeviceCode,
  getSeriesByDeviceCode,
} = require("../services/dashboard.service");

const getSnapshot = async (req, res) => {
  try {
    const deviceCode = req.query.deviceCode || "esp32-node-001";
    const data = await getSnapshotByDeviceCode(deviceCode);

    if (!data) {
      return fail(res, 404, "No se encontró snapshot para ese dispositivo");
    }

    return ok(res, data, "Snapshot obtenido correctamente");
  } catch (error) {
    console.error("Error en getSnapshot:", error.message);
    return fail(res, 500, "Error al obtener snapshot");
  }
};

const getSeries = async (req, res) => {
  try {
    const deviceCode = req.query.deviceCode || "esp32-node-001";
    const range = req.query.range || "1h";

    const data = await getSeriesByDeviceCode(deviceCode, range);
    return ok(res, data, "Series obtenidas correctamente");
  } catch (error) {
    console.error("Error en getSeries:", error.message);
    return fail(res, 500, "Error al obtener series");
  }
};

module.exports = {
  getSnapshot,
  getSeries,
};