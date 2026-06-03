const express = require('express');
const router = express.Router();

const {
  getMapReportsController,
  getMapDevicesController,
  getMapAlertsController,
} = require('../controllers/map.controller');

const { authMiddleware } = require('../middlewares/auth.middleware');

// Todas las rutas requieren autenticación
router.use(authMiddleware);

// Reportes ciudadanos geolocalizados
// Admin: range libre | Ciudadano: forzado a 7d en el controller
router.get('/reports', getMapReportsController);

// Dispositivos IoT (solo admin - validado en controller)
router.get('/devices', getMapDevicesController);

// Alertas abiertas
// Admin: detalladas | Ciudadano: reducidas
router.get('/alerts', getMapAlertsController);

module.exports = router;
