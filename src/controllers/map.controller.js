const {
  getReportsForMap,
  getDevicesForMap,
  getOpenAlertsForMap,
  getPublicAlertsForMap,
} = require('../services/map.service');
const { ok, fail } = require('../utils/response');

/**
 * GET /api/map/reports?range=7d
 * Admin: cualquier rango válido.
 * Ciudadano: forzado a 7d.
 */
async function getMapReportsController(req, res) {
  try {
    const role = req.user?.role || 'ciudadano';
    const range = req.query.range || '7d';

    const reports = await getReportsForMap({ range, role });
    return ok(res, reports, 'Reportes del mapa obtenidos');
  } catch (error) {
    console.error('Map reports error:', error.message);
    return fail(res, 500, 'Error al obtener reportes del mapa');
  }
}

/**
 * GET /api/map/devices
 * Solo admin.
 */
async function getMapDevicesController(req, res) {
  try {
    const role = req.user?.role || 'ciudadano';
    if (role !== 'admin') {
      return fail(res, 403, 'Acceso denegado');
    }

    const devices = await getDevicesForMap();
    return ok(res, devices, 'Dispositivos del mapa obtenidos');
  } catch (error) {
    console.error('Map devices error:', error.message);
    return fail(res, 500, 'Error al obtener dispositivos del mapa');
  }
}

/**
 * GET /api/map/alerts?range=24h
 * Admin: alertas completas con detalles.
 * Ciudadano: solo level + device_code (sin datos internos).
 */
async function getMapAlertsController(req, res) {
  try {
    const role = req.user?.role || 'ciudadano';
    const range = req.query.range || '24h';

    if (role === 'admin') {
      const alerts = await getOpenAlertsForMap(range);
      return ok(res, alerts, 'Alertas del mapa obtenidas');
    } else {
      // Ciudadano solo ve alertas públicas reducidas
      const alerts = await getPublicAlertsForMap();
      return ok(res, alerts, 'Alertas públicas obtenidas');
    }
  } catch (error) {
    console.error('Map alerts error:', error.message);
    return fail(res, 500, 'Error al obtener alertas del mapa');
  }
}

module.exports = {
  getMapReportsController,
  getMapDevicesController,
  getMapAlertsController,
};
