const validateIotSamplePayload = (body = {}) => {
  const errors = [];

  const { deviceCode, sampledAt, metrics } = body;

  if (!deviceCode || typeof deviceCode !== "string") {
    errors.push("deviceCode es requerido y debe ser string");
  }

  if (sampledAt !== undefined && Number.isNaN(Date.parse(sampledAt))) {
    errors.push("sampledAt debe ser una fecha válida si se envía");
  }

  if (!metrics || typeof metrics !== "object" || Array.isArray(metrics)) {
    errors.push("metrics es requerido y debe ser un objeto");
  }

  if (metrics && typeof metrics === "object" && !Array.isArray(metrics)) {
    const metricKeys = Object.keys(metrics);

    if (metricKeys.length === 0) {
      errors.push("metrics no puede estar vacío");
    }

    for (const key of metricKeys) {
      const value = metrics[key];
      if (typeof value !== "number" && typeof value !== "string") {
        errors.push(`La métrica ${key} debe ser numérica o string numérico`);
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

module.exports = {
  validateIotSamplePayload,
};