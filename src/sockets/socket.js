let ioInstance = null;

const initSocket = (io) => {
  ioInstance = io;

  io.on("connection", (socket) => {
    console.log(`Cliente conectado por WebSocket: ${socket.id}`);

    socket.on("disconnect", () => {
      console.log(`Cliente desconectado: ${socket.id}`);
    });
  });
};

const getIO = () => {
  if (!ioInstance) {
    throw new Error("Socket.IO aún no fue inicializado");
  }
  return ioInstance;
};

module.exports = {
  initSocket,
  getIO,
};