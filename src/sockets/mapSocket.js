const { getIO } = require('./socket');

const emit = (event, payload) => {
  try {
    getIO().emit(event, payload);
  } catch (e) {
    console.error(`[mapSocket] ${event}:`, e.message);
  }
};

const emitMapReportNew           = (report) => emit('map:report_new', report);
const emitMapReportStatusUpdated = (report) => emit('map:report_status_updated', report);
const emitMapAlertNew            = (alert)  => emit('map:alert_new', alert);
const emitMapAlertResolved       = (data)   => emit('map:alert_resolved', data);
const emitMapDeviceSeen          = (data)   => emit('map:device_seen', data);

module.exports = {
  emitMapReportNew,
  emitMapReportStatusUpdated,
  emitMapAlertNew,
  emitMapAlertResolved,
  emitMapDeviceSeen,
};

