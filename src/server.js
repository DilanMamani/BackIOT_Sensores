const http = require("http");
require("dotenv").config();

const app = require("./app");
const { testDbConnection } = require("./config/db");
const { initSocket } = require("./sockets/socket");
const { Server } = require("socket.io");

const PORT = process.env.PORT || 3000;
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";

const httpServer = http.createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: CLIENT_URL,
    methods: ["GET", "POST"],
    credentials: true,
  },
});

initSocket(io);

const startServer = async () => {
  try {
    await testDbConnection();

    httpServer.listen(PORT, () => {
      console.log(`Servidor corriendo en http://localhost:${PORT}`);
      console.log("Socket.IO listo");
    });
  } catch (error) {
    console.error("No se pudo iniciar el servidor:", error.message);
    process.exit(1);
  }
};

startServer();