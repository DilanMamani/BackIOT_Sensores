const { createReport, getAllReports, getReportById, getMyReports, updateReportStatus } = require('../services/reports.service');
const { ok, created, fail } = require('../utils/response');
const { getIO } = require('../sockets/socket');

async function createReportHandler(req, res) {
  try {
    console.log('FILE:', req.file);      // ← agregá esta línea
    console.log('BODY:', req.body);
    const { incident_type, description, urgency_level, latitude, longitude, location_name } = req.body;
    const user_id = req.user?.uid;
    const photo_url = req.file?.path || null;

    if (!incident_type || !description || !urgency_level) {
      return fail(res, 400, 'Tipo, descripción y urgencia son obligatorios');
    }

    const report = await createReport({
      user_id, incident_type, description,
      urgency_level, latitude, longitude,
      location_name, photo_url
    });

    // Emitir en tiempo real a todos los conectados
    const io = getIO();
    io.emit('new_report', report);

    return created(res, report, 'Reporte creado correctamente');
  } catch (error) {
    console.error('Create report error:', error.message);
    return fail(res, 500, 'Error al crear reporte');
  }
}

async function getAllReportsHandler(req, res) {
  try {
    const reports = await getAllReports();
    return ok(res, reports, 'Reportes obtenidos correctamente');
  } catch (error) {
    console.error('Get reports error:', error.message);
    return fail(res, 500, 'Error al obtener reportes');
  }
}

async function getReportByIdHandler(req, res) {
  try {
    const { id } = req.params;
    const report = await getReportById(id);

    if (!report) return fail(res, 404, 'Reporte no encontrado');

    return ok(res, report, 'Reporte obtenido correctamente');
  } catch (error) {
    console.error('Get report error:', error.message);
    return fail(res, 500, 'Error al obtener reporte');
  }
}

async function getMyReportsHandler(req, res) {
  try {
    const user_id = req.user?.uid;
    const reports = await getMyReports(user_id);
    return ok(res, reports, 'Tus reportes obtenidos correctamente');
  } catch (error) {
    console.error('Get my reports error:', error.message);
    return fail(res, 500, 'Error al obtener tus reportes');
  }
}

async function updateStatusHandler(req, res) {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['pendiente', 'en_revision', 'atendido', 'descartado'];
    if (!validStatuses.includes(status)) {
      return fail(res, 400, 'Estado inválido');
    }

    const report = await updateReportStatus(id, status);
    if (!report) return fail(res, 404, 'Reporte no encontrado');

    // Emitir cambio de estado en tiempo real
    const io = getIO();
    io.emit('report_status_updated', report);

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