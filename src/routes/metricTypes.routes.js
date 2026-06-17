const express = require("express");
const { getMetricTypesController } = require("../controllers/metricTypes.controller");

const router = express.Router();

router.get("/", getMetricTypesController);

module.exports = router;
