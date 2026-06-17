const { ok, fail } = require("../utils/response");
const { listMetricTypes } = require("../services/metricTypes.service");

const getMetricTypesController = async (_req, res) => {
  try {
    const data = await listMetricTypes();
    return ok(res, data, "Tipos de métrica obtenidos correctamente");
  } catch (error) {
    console.error("Error en getMetricTypesController:", error.message);
    return fail(res, 500, "Error al obtener tipos de métrica");
  }
};

module.exports = {
  getMetricTypesController,
};
