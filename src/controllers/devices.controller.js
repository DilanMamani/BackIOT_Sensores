const { ok, created, fail } = require("../utils/response");
const {
  getDevices,
  getDeviceByCode,
  getDeviceSensorsByCode,
  createDevice,
  createDeviceSensor,
} = require("../services/devices.service");
const { validateDevicePayload } = require("../validators/device.validator");
const { validateSensorPayload } = require("../validators/sensor.validator");

const getDevicesController = async (_req, res) => {
  try {
    const data = await getDevices();
    return ok(res, data, "Dispositivos obtenidos correctamente");
  } catch (error) {
    console.error("Error en getDevicesController:", error.message);
    return fail(res, 500, "Error al obtener dispositivos");
  }
};

const getDeviceByCodeController = async (req, res) => {
  try {
    const { deviceCode } = req.params;
    const data = await getDeviceByCode(deviceCode);

    if (!data) {
      return fail(res, 404, "Dispositivo no encontrado");
    }

    return ok(res, data, "Dispositivo obtenido correctamente");
  } catch (error) {
    console.error("Error en getDeviceByCodeController:", error.message);
    return fail(res, 500, "Error al obtener dispositivo");
  }
};

const getDeviceSensorsController = async (req, res) => {
  try {
    const { deviceCode } = req.params;
    const data = await getDeviceSensorsByCode(deviceCode);
    return ok(res, data, "Sensores del dispositivo obtenidos correctamente");
  } catch (error) {
    console.error("Error en getDeviceSensorsController:", error.message);
    return fail(res, 500, "Error al obtener sensores del dispositivo");
  }
};

const createDeviceController = async (req, res) => {
  try {
    const validation = validateDevicePayload(req.body);

    if (!validation.isValid) {
      return fail(res, 400, validation.errors.join(" | "));
    }

    const data = await createDevice(req.body);
    return created(res, data, "Dispositivo creado correctamente");
  } catch (error) {
    console.error("Error en createDeviceController:", error.message);
    return fail(res, 500, error.message || "Error al crear dispositivo");
  }
};

const createDeviceSensorController = async (req, res) => {
  try {
    const { deviceCode } = req.params;
    const validation = validateSensorPayload(req.body);

    if (!validation.isValid) {
      return fail(res, 400, validation.errors.join(" | "));
    }

    const data = await createDeviceSensor(deviceCode, req.body);
    return created(res, data, "Sensor agregado correctamente al dispositivo");
  } catch (error) {
    console.error("Error en createDeviceSensorController:", error.message);
    return fail(res, 500, error.message || "Error al agregar sensor");
  }
};

module.exports = {
  getDevicesController,
  getDeviceByCodeController,
  getDeviceSensorsController,
  createDeviceController,
  createDeviceSensorController,
};