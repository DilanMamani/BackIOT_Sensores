const express = require("express");
const { getRiskHistory } = require("../controllers/riskHistory.controller");

const router = express.Router();

router.get("/", getRiskHistory);

module.exports = router;