const express = require("express");
const { postSample } = require("../controllers/iot.controller");
const validateIotSampleMiddleware = require("../middlewares/validateIotSample.middleware");

const router = express.Router();

router.post("/samples", validateIotSampleMiddleware, postSample);

module.exports = router;