const express = require('express');
const { getPrediction, getHealth } = require('../controllers/lstm.controller');

const router = express.Router();

router.get('/health', getHealth);
router.get('/predict/:deviceCode', getPrediction);

module.exports = router;
