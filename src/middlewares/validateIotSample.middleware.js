const { validateIotSamplePayload } = require("../validators/iot.validator");

const validateIotSampleMiddleware = (req, res, next) => {
  const validation = validateIotSamplePayload(req.body);

  if (!validation.isValid) {
    return res.status(400).json({
      ok: false,
      message: "Payload inválido",
      errors: validation.errors,
    });
  }

  next();
};

module.exports = validateIotSampleMiddleware;