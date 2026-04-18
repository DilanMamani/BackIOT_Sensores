const express = require("express");
const {
  getAlerts,
  getOpenAlertsController,
  resolveAlertController,
} = require("../controllers/alerts.controller");

const router = express.Router();

router.get("/", getAlerts);
router.get("/open", getOpenAlertsController);
router.patch("/:alertId/resolve", resolveAlertController);

module.exports = router;