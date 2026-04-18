const express = require("express");
const {
  getDevicesController,
  getDeviceByCodeController,
  getDeviceSensorsController,
  createDeviceController,
  createDeviceSensorController,
} = require("../controllers/devices.controller");

const router = express.Router();

router.get("/", getDevicesController);
router.post("/", createDeviceController);

router.get("/:deviceCode", getDeviceByCodeController);
router.get("/:deviceCode/sensors", getDeviceSensorsController);
router.post("/:deviceCode/sensors", createDeviceSensorController);

module.exports = router;