const {
  createReport,
  getAllReports,
  getReportById,
  getMyReports,
  updateReportStatus,
} = require('../services/reports.service');
const { ok, created, fail } = require('../utils/response');
const { getIO } = require('../sockets/socket');
const { emitMapReportNew, emitMapReportStatusUpdated } = require('../sockets/mapSocket');

async function createReportHandler(req, res) {
  try {
    console.log('FILE:', req.file);      // ← agregá esta línea
    console.log('BODY:', req.body);
    const { incident_type, description, urgency_level, latitude, longitude, location_name } = req.body;
    const user_id   = req.user?.uid;
    const photo_url = req.file?.path || null;

    if (!incident_type || !description || !urgency_level) {
      return fail(res, 400, 'Tipo, descripción y urgencia son obligatorios');
    }

    const report = await createReport({
      user_id, incident_type, description,
      urgency_level, latitude, longitude,
      location_name, photo_url,
    });

    // Evento existente (sin cambios)
    getIO().emit('new_report', report);
    // Evento del mapa
    emitMapReportNew(report);

    return created(res, report, 'Reporte creado correctamente');
  } catch (error) {
    console.error('Create report error:', error.message);
    return fail(res, 500, 'Error al crear reporte');
  }
}

async function getAllReportsHandler(req, res) {
  try {
    return ok(res, await getAllReports(), 'Reportes obtenidos correctamente');
  } catch (error) {
    console.error('Get reports error:', error.message);
    return fail(res, 500, 'Error al obtener reportes');
  }
}

async function getReportByIdHandler(req, res) {
  try {
    const report = await getReportById(req.params.id);
    if (!report) return fail(res, 404, 'Reporte no encontrado');

    return ok(res, report, 'Reporte obtenido correctamente');
  } catch (error) {
    console.error('Get report error:', error.message);
    return fail(res, 500, 'Error al obtener reporte');
  }
}

async function getMyReportsHandler(req, res) {
  try {
    return ok(res, await getMyReports(req.user?.uid), 'Tus reportes obtenidos correctamente');
  } catch (error) {
    return fail(res, 500, 'Error al obtener tus reportes');
  }
}

async function updateStatusHandler(req, res) {
  try {
    const { id }     = req.params;
    const { status } = req.body;

    const validStatuses = ['pendiente', 'en_revision', 'atendido', 'descartado'];
    if (!validStatuses.includes(status)) {
      return fail(res, 400, 'Estado inválido');
    }

    const report = await updateReportStatus(id, status);
    if (!report) return fail(res, 404, 'Reporte no encontrado');

    // Evento existente (sin cambios)
    getIO().emit('report_status_updated', report);
    // Evento del mapa — incluye status 'descartado' para que el frontend lo filtre
    emitMapReportStatusUpdated(report);

    return ok(res, report, 'Estado actualizado correctamente');
  } catch (error) {
    console.error('Update status error:', error.message);
    return fail(res, 500, 'Error al actualizar estado');
  }
}

module.exports = {
  createReportHandler,
  getAllReportsHandler,
  getReportByIdHandler,
  getMyReportsHandler,
  updateStatusHandler,
};