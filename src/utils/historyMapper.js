const mapRowsToHistory = (rows) => {
  const grouped = {};

  for (const row of rows) {
    const key = new Date(row.sampled_at).toISOString();

    if (!grouped[key]) {
      grouped[key] = {
        time: key,
        soil: 0,
        vib: 0,
        accel: 0,
        gyro: 0,
        raw: 0,
        dur: 0,
        ax: 0,
        ay: 0,
        az: 0,
        gx: 0,
        gy: 0,
        gz: 0,
        vibrationDetected: 0,
      };
    }

    const item = grouped[key];
    const value = Number(row.numeric_value || 0);

    switch (row.metric_code) {
      case "soilPercent":
        item.soil = value;
        break;
      case "soilRaw":
        item.raw = value;
        break;
      case "vibrationCount":
        item.vib = value;
        break;
      case "vibrationDurationMs":
        item.dur = value;
        break;
      case "vibrationDetected":
        item.vibrationDetected = value;
        break;
      case "accelMagnitude":
        item.accel = value;
        break;
      case "gyroMagnitude":
        item.gyro = value;
        break;
      case "accelX":
        item.ax = value;
        break;
      case "accelY":
        item.ay = value;
        break;
      case "accelZ":
        item.az = value;
        break;
      case "gyroX":
        item.gx = value;
        break;
      case "gyroY":
        item.gy = value;
        break;
      case "gyroZ":
        item.gz = value;
        break;
      default:
        break;
    }
  }

  const records = Object.values(grouped).sort(
    (a, b) => new Date(a.time) - new Date(b.time)
  );

  return {
    times: records.map((r) => r.time),
    soil: records.map((r) => r.soil),
    vib: records.map((r) => r.vib),
    accel: records.map((r) => r.accel),
    gyro: records.map((r) => r.gyro),
    raw: records.map((r) => r.raw),
    dur: records.map((r) => r.dur),
    ax: records.map((r) => r.ax),
    ay: records.map((r) => r.ay),
    az: records.map((r) => r.az),
    gx: records.map((r) => r.gx),
    gy: records.map((r) => r.gy),
    gz: records.map((r) => r.gz),
    vibrationDetected: records.map((r) => r.vibrationDetected),
    records,
  };
};

module.exports = {
  mapRowsToHistory,
};