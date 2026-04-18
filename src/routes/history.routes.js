const express = require("express");
const { getHistory } = require("../controllers/history.controller");

const router = express.Router();

router.get("/", getHistory);

module.exports = router;