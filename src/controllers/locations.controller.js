const { created, fail } = require("../utils/response");
const { createLocation } = require("../services/locations.service");
const { validateLocationPayload } = require("../validators/location.validator");

const createLocationController = async (req, res) => {
  try {
    const validation = validateLocationPayload(req.body);

    if (!validation.isValid) {
      return fail(res, 400, validation.errors.join(" | "));
    }

    const data = await createLocation(req.body);
    return created(res, data, "Ubicación creada correctamente");
  } catch (error) {
    console.error("Error en createLocationController:", error.message);
    return fail(res, 500, "Error al crear ubicación");
  }
};

module.exports = {
  createLocationController,
};