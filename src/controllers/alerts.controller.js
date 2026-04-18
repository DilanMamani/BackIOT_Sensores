const { ok, fail } = require("../utils/response");
const {
  getOpenAlerts,
  getAllAlerts,
  resolveAlert,
} = require("../services/alerts.service");

const getAlerts = async (req, res) => {
  try {
    const deviceCode = req.query.deviceCode || null;
    const range = req.query.range || "24h";

    const data = await getAllAlerts(deviceCode, range);
    return ok(res, data, "Alertas obtenidas correctamente");
  } catch (error) {
    console.error("Error en getAlerts:", error.message);
    return fail(res, 500, "Error al obtener alertas");
  }
};

const getOpenAlertsController = async (req, res) => {
  try {
    const deviceCode = req.query.deviceCode || null;
    const range = req.query.range || "24h";

    const data = await getOpenAlerts(deviceCode, range);
    return ok(res, data, "Alertas abiertas obtenidas correctamente");
  } catch (error) {
    console.error("Error en getOpenAlerts:", error.message);
    return fail(res, 500, "Error al obtener alertas abiertas");
  }
};

const resolveAlertController = async (req, res) => {
  try {
    const { alertId } = req.params;
    const data = await resolveAlert(alertId);

    if (!data) {
      return fail(res, 404, "Alerta no encontrada");
    }

    return ok(res, data, "Alerta resuelta correctamente");
  } catch (error) {
    console.error("Error en resolveAlertController:", error.message);
    return fail(res, 500, "Error al resolver alerta");
  }
};

module.exports = {
  getAlerts,
  getOpenAlertsController,
  resolveAlertController,
};