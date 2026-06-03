const express = require('express');
const router = express.Router();

const {
  createReportHandler,
  getAllReportsHandler,
  getReportByIdHandler,
  getMyReportsHandler,
  updateStatusHandler,
} = require('../controllers/reports.controller');

const { authMiddleware } = require('../middlewares/auth.middleware');
const { upload } = require('../config/cloudinary');

// Ciudadano: crear reporte con foto
router.post('/',        authMiddleware, upload.single('photo'), createReportHandler);

// Ciudadano: ver sus propios reportes
router.get('/my',       authMiddleware, getMyReportsHandler);

// Admin: ver todos los reportes
router.get('/',         authMiddleware, getAllReportsHandler);

// Ambos: ver un reporte específico
router.get('/:id',      authMiddleware, getReportByIdHandler);

// Admin: cambiar estado
router.patch('/:id/status', authMiddleware, updateStatusHandler);

module.exports = router;