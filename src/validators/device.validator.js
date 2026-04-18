const validateDevicePayload = (body = {}) => {
  const errors = [];
  const {
    code,
    name,
    location_id,
    description,
    firmware_version,
    connection_mode,
    status,
    metadata,
  } = body;

  if (!code || typeof code !== "string") {
    errors.push("code es requerido y debe ser string");
  }

  if (!name || typeof name !== "string") {
    errors.push("name es requerido y debe ser string");
  }

  if (location_id !== undefined && Number.isNaN(Number(location_id))) {
    errors.push("location_id debe ser numérico");
  }

  if (description !== undefined && typeof description !== "string") {
    errors.push("description debe ser string");
  }

  if (firmware_version !== undefined && typeof firmware_version !== "string") {
    errors.push("firmware_version debe ser string");
  }

  if (
    connection_mode !== undefined &&
    !["wifi", "ethernet", "gsm", "lora"].includes(connection_mode)
  ) {
    errors.push("connection_mode inválido");
  }

  if (
    status !== undefined &&
    !["active", "inactive", "maintenance"].includes(status)
  ) {
    errors.push("status inválido");
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
  validateDevicePayload,
};