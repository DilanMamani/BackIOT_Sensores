const { ok, created, fail } = require("../utils/response");
const {
  listThresholds,
  createThreshold,
  updateThreshold,
  deleteThreshold,
} = require("../services/thresholds.service");
const { pool } = require("../config/db");

const VALID_SEVERITIES = ["warning", "danger"];
const VALID_OPERATORS = ["gt", "gte", "lt", "lte", "between"];

const getThresholdsController = async (req, res) => {
  try {
    const deviceCode = req.query.deviceCode || null;
    const data = await listThresholds(deviceCode);
    return ok(res, data, "Reglas de alerta obtenidas correctamente");
  } catch (error) {
    console.error("Error en getThresholdsController:", error.message);
    return fail(res, 500, "Error al obtener reglas de alerta");
  }
};

const createThresholdController = async (req, res) => {
  try {
    const {
      metricTypeId,
      severity,
      operator,
      value1,
      value2,
      deviceCode,
      messageTemplate,
    } = req.body;

    if (!metricTypeId || !severity || !operator || value1 === undefined) {
      return fail(
        res,
        400,
        "metricTypeId, severity, operator y value1 son obligatorios"
      );
    }

    if (!VALID_SEVERITIES.includes(severity)) {
      return fail(res, 400, "severity debe ser 'warning' o 'danger'");
    }

    if (!VALID_OPERATORS.includes(operator)) {
      return fail(
        res,
        400,
        "operator debe ser uno de: gt, gte, lt, lte, between"
      );
    }

    let deviceId = null;
    if (deviceCode) {
      const { rows } = await pool.query(
        `select id from devices where code = $1`,
        [deviceCode]
      );
      if (!rows[0]) {
        return fail(res, 404, "Dispositivo no encontrado");
      }
      deviceId = rows[0].id;
    }

    const data = await createThreshold({
      metricTypeId,
      severity,
      operator,
      value1,
      value2: value2 ?? null,
      deviceId,
      messageTemplate: messageTemplate ?? null,
    });

    return created(res, data, "Regla de alerta creada correctamente");
  } catch (error) {
    console.error("Error en createThresholdController:", error.message);
    return fail(res, 500, error.message || "Error al crear regla de alerta");
  }
};

const updateThresholdController = async (req, res) => {
  try {
    const { id } = req.params;
    const { severity, operator, value1, value2, messageTemplate, isActive } =
      req.body;

    if (severity !== undefined && !VALID_SEVERITIES.includes(severity)) {
      return fail(res, 400, "severity debe ser 'warning' o 'danger'");
    }

    if (operator !== undefined && !VALID_OPERATORS.includes(operator)) {
      return fail(
        res,
        400,
        "operator debe ser uno de: gt, gte, lt, lte, between"
      );
    }

    const data = await updateThreshold(id, {
      severity,
      operator,
      value_1: value1,
      value_2: value2,
      message_template: messageTemplate,
      is_active: isActive,
    });

    if (!data) {
      return fail(res, 404, "Regla de alerta no encontrada");
    }

    return ok(res, data, "Regla de alerta actualizada correctamente");
  } catch (error) {
    console.error("Error en updateThresholdController:", error.message);
    return fail(res, 500, "Error al actualizar regla de alerta");
  }
};

const deleteThresholdController = async (req, res) => {
  try {
    const { id } = req.params;
    const data = await deleteThreshold(id);

    if (!data) {
      return fail(res, 404, "Regla de alerta no encontrada");
    }

    return ok(res, data, "Regla de alerta eliminada correctamente");
  } catch (error) {
    console.error("Error en deleteThresholdController:", error.message);
    return fail(res, 500, "Error al eliminar regla de alerta");
  }
};

module.exports = {
  getThresholdsController,
  createThresholdController,
  updateThresholdController,
  deleteThresholdController,
};
