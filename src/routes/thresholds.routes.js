const express = require("express");
const {
  getThresholdsController,
  createThresholdController,
  updateThresholdController,
  deleteThresholdController,
} = require("../controllers/thresholds.controller");
const { authMiddleware } = require("../middlewares/auth.middleware");

const router = express.Router();

router.get("/", getThresholdsController);
router.post("/", authMiddleware, createThresholdController);
router.patch("/:id", authMiddleware, updateThresholdController);
router.delete("/:id", authMiddleware, deleteThresholdController);

module.exports = router;
