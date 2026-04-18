const healthCheck = async (_req, res) => {
  try {
    return res.status(200).json({
      ok: true,
      message: "API funcionando correctamente",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      message: "Error en health check",
      error: error.message,
    });
  }
};

module.exports = {
  healthCheck,
};