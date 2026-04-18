const validateLocationPayload = (body = {}) => {
  const errors = [];
  const { name, description, latitude, longitude } = body;

  if (!name || typeof name !== "string") {
    errors.push("name es requerido y debe ser string");
  }

  if (description !== undefined && typeof description !== "string") {
    errors.push("description debe ser string");
  }

  if (latitude !== undefined && Number.isNaN(Number(latitude))) {
    errors.push("latitude debe ser numérico");
  }

  if (longitude !== undefined && Number.isNaN(Number(longitude))) {
    errors.push("longitude debe ser numérico");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

module.exports = {
  validateLocationPayload,
};