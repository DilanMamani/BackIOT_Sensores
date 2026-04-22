const express = require("express");
const cors = require("cors");
require("dotenv").config();

const healthRoutes = require("./routes/health.routes");
const dashboardRoutes = require("./routes/dashboard.routes");
const historyRoutes = require("./routes/history.routes");
const iotRoutes = require("./routes/iot.routes");
const alertsRoutes = require("./routes/alerts.routes");
const devicesRoutes = require("./routes/devices.routes");
const locationsRoutes = require("./routes/locations.routes");

const notFoundMiddleware = require("./middlewares/notFound.middleware");
const errorMiddleware = require("./middlewares/error.middleware");
const authRoutes = require("./routes/auth.routes");
const usersRoutes = require("./routes/users.routes");

const app = express();

app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (_req, res) => {
  res.json({
    ok: true,
    message: "Backend IoT funcionando",
  });
});

app.use("/api/health", healthRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/history", historyRoutes);
app.use("/api/iot", iotRoutes);
app.use("/api/alerts", alertsRoutes);
app.use("/api/devices", devicesRoutes);
app.use("/api/locations", locationsRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/users", usersRoutes);
app.use(notFoundMiddleware);
app.use(errorMiddleware);

module.exports = app;