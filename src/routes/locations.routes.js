const express = require("express");
const { createLocationController } = require("../controllers/locations.controller");

const router = express.Router();

router.post("/", createLocationController);

module.exports = router;