const express = require("express");
const {
  getSnapshot,
  getSeries,
} = require("../controllers/dashboard.controller");

const router = express.Router();

router.get("/snapshot", getSnapshot);
router.get("/series", getSeries);

module.exports = router;