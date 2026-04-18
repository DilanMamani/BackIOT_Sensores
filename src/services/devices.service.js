const { pool } = require("../config/db");

const getDevices = async () => {
  const query = `
    select
      d.id,
      d.code,
      d.name,
      d.description,
      d.installed_at,
      d.last_seen_at,
      d.firmware_version,
      d.connection_mode,
      d.status,
      d.is_active,
      d.metadata,
      l.id as location_id,
      l.name as location_name,
      l.description as location_description,
      l.latitude,
      l.longitude
    from devices d
    left join locations l on l.id = d.location_id
    order by d.id asc;
  `;

  const { rows } = await pool.query(query);
  return rows;
};

const getDeviceByCode = async (deviceCode) => {
  const query = `
    select
      d.id,
      d.code,
      d.name,
      d.description,
      d.installed_at,
      d.last_seen_at,
      d.firmware_version,
      d.connection_mode,
      d.status,
      d.is_active,
      d.metadata,
      l.id as location_id,
      l.name as location_name,
      l.description as location_description,
      l.latitude,
      l.longitude
    from devices d
    left join locations l on l.id = d.location_id
    where d.code = $1
    limit 1;
  `;

  const { rows } = await pool.query(query, [deviceCode]);
  return rows[0] || null;
};

const getDeviceSensorsByCode = async (deviceCode) => {
  const query = `
    select
      ds.id,
      ds.device_id,
      ds.pin,
      ds.label,
      ds.sample_order,
      ds.calibration_min,
      ds.calibration_max,
      ds.metadata,
      ds.is_active,
      sc.id as sensor_catalog_id,
      sc.code as sensor_code,
      sc.name as sensor_name,
      sc.manufacturer,
      sc.communication_type,
      sc.value_kind,
      sc.description
    from device_sensors ds
    join devices d on d.id = ds.device_id
    join sensor_catalog sc on sc.id = ds.sensor_catalog_id
    where d.code = $1
    order by ds.sample_order asc, ds.id asc;
  `;

  const { rows } = await pool.query(query, [deviceCode]);
  return rows;
};

const createDevice = async ({
  code,
  name,
  location_id = null,
  description = null,
  firmware_version = null,
  connection_mode = "wifi",
  status = "active",
  metadata = {},
}) => {
  const query = `
    insert into devices (
      code,
      name,
      location_id,
      description,
      installed_at,
      last_seen_at,
      firmware_version,
      connection_mode,
      status,
      metadata
    )
    values ($1, $2, $3, $4, now(), null, $5, $6, $7, $8::jsonb)
    returning *;
  `;

  const values = [
    code,
    name,
    location_id !== null ? Number(location_id) : null,
    description,
    firmware_version,
    connection_mode,
    status,
    JSON.stringify(metadata || {}),
  ];

  const { rows } = await pool.query(query, values);
  return rows[0];
};

const createDeviceSensor = async (
  deviceCode,
  {
    sensor_catalog_id,
    pin = null,
    label,
    sample_order = null,
    calibration_min = null,
    calibration_max = null,
    metadata = {},
  }
) => {
  const device = await getDeviceByCode(deviceCode);

  if (!device) {
    throw new Error("Dispositivo no encontrado");
  }

  const query = `
    insert into device_sensors (
      device_id,
      sensor_catalog_id,
      pin,
      label,
      sample_order,
      calibration_min,
      calibration_max,
      metadata
    )
    values ($1, $2, $3, $4, $5, $6, $7, $8::jsonb)
    returning *;
  `;

  const values = [
    Number(device.id),
    Number(sensor_catalog_id),
    pin,
    label,
    sample_order !== null ? Number(sample_order) : null,
    calibration_min !== null ? Number(calibration_min) : null,
    calibration_max !== null ? Number(calibration_max) : null,
    JSON.stringify(metadata || {}),
  ];

  const { rows } = await pool.query(query, values);
  return rows[0];
};

module.exports = {
  getDevices,
  getDeviceByCode,
  getDeviceSensorsByCode,
  createDevice,
  createDeviceSensor,
};