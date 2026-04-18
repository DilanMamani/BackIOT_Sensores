const errorMiddleware = (err, req, res, next) => {
  console.error("Error capturado por middleware:", err);

  const statusCode = err.statusCode || 500;
  const message = err.message || "Error interno del servidor";

  res.status(statusCode).json({
    ok: false,
    message,
  });
};

module.exports = errorMiddleware;