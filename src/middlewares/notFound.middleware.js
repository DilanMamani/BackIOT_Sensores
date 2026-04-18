const notFoundMiddleware = (req, res, next) => {
  res.status(404).json({
    ok: false,
    message: `Ruta no encontrada: ${req.method} ${req.originalUrl}`,
  });
};

module.exports = notFoundMiddleware;