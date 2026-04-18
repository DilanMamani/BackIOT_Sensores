const ok = (res, data, message = "OK") => {
  return res.status(200).json({
    ok: true,
    message,
    data,
  });
};

const created = (res, data, message = "Creado correctamente") => {
  return res.status(201).json({
    ok: true,
    message,
    data,
  });
};

const fail = (res, status = 500, message = "Error interno del servidor") => {
  return res.status(status).json({
    ok: false,
    message,
  });
};

module.exports = {
  ok,
  created,
  fail,
};