const {
  getReportsForMap,
  getDevicesForMap,
  getOpenAlertsForMap,
  getPublicAlertsForMap,
} = require('../services/map.service');
const { ok, fail } = require('../utils/response');

async function getMapReportsController(req, res) {
  try {
    const role  = req.user?.role || 'ciudadano';
    const range = req.query.range || '7d';
    const data  = await getReportsForMap({ range, role });
    return ok(res, data, 'Reportes del mapa obtenidos');
  } catch (e) {
    console.error('Map reports error:', e.message);
    return fail(res, 500, 'Error al obtener reportes del mapa');
  }
}

async function getMapDevicesController(req, res) {
  try {
    if (req.user?.role !== 'admin') return fail(res, 403, 'Acceso denegado');
    const data = await getDevicesForMap();
    return ok(res, data, 'Dispositivos del mapa obtenidos');
  } catch (e) {
    console.error('Map devices error:', e.message);
    return fail(res, 500, 'Error al obtener dispositivos');
  }
}

async function getMapAlertsController(req, res) {
  try {
    const role  = req.user?.role || 'ciudadano';
    const range = req.query.range || '24h';
    if (role === 'admin') {
      return ok(res, await getOpenAlertsForMap(range), 'Alertas obtenidas');
    }
    return ok(res, await getPublicAlertsForMap(), 'Alertas públicas obtenidas');
  } catch (e) {
    console.error('Map alerts error:', e.message);
    return fail(res, 500, 'Error al obtener alertas');
  }
}

module.exports = {
  getMapReportsController,
  getMapDevicesController,
  getMapAlertsController,
};
