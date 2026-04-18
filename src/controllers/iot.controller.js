const { created, fail } = require("../utils/response");
const { createSample } = require("../services/iot.service");
const { getSnapshotByDeviceCode } = require("../services/dashboard.service");
const { getIO } = require("../sockets/socket");

const postSample = async (req, res) => {
  try {
    const sourceIp =
      req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
      req.socket.remoteAddress ||
      null;

    const result = await createSample(req.body, sourceIp);
    const snapshot = await getSnapshotByDeviceCode(result.deviceCode);

    console.log("Nueva muestra guardada:", result);
    console.log("Emitir snapshot:update para:", result.deviceCode);

    const io = getIO();
    io.emit("snapshot:update", snapshot);

    return created(
      res,
      {
        result,
        snapshot,
      },
      "Muestra recibida y guardada correctamente"
    );
  } catch (error) {
    console.error("Error en postSample:", error.message);
    return fail(res, 500, error.message || "Error al guardar muestra");
  }
};

module.exports = {
  postSample,
};