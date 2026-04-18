const validateSensorPayload = (body = {}) => {
  const errors = [];
  const {
    sensor_catalog_id,
    pin,
    label,
    sample_order,
    calibration_min,
    calibration_max,
    metadata,
  } = body;

  if (sensor_catalog_id === undefined || Number.isNaN(Number(sensor_catalog_id))) {
    errors.push("sensor_catalog_id es requerido y debe ser numérico");
  }

  if (!label || typeof label !== "string") {
    errors.push("label es requerido y debe ser string");
  }

  if (pin !== undefined && typeof pin !== "string") {
    errors.push("pin debe ser string");
  }

  if (sample_order !== undefined && Number.isNaN(Number(sample_order))) {
    errors.push("sample_order debe ser numérico");
  }

  if (calibration_min !== undefined && Number.isNaN(Number(calibration_min))) {
    errors.push("calibration_min debe ser numérico");
  }

  if (calibration_max !== undefined && Number.isNaN(Number(calibration_max))) {
    errors.push("calibration_max debe ser numérico");
  }

  if (
    metadata !== undefined &&
    (typeof metadata !== "object" || Array.isArray(metadata))
  ) {
    errors.push("metadata debe ser un objeto");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

module.exports = {
  validateSensorPayload,
};