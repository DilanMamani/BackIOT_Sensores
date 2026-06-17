const { pool } = require("../config/db");

const listThresholds = async (deviceCode = null) => {
  const query = `
    select
      t.id,
      t.device_id,
      d.code as device_code,
      t.device_sensor_id,
      t.metric_type_id,
      mt.code as metric_code,
      mt.name as metric_name,
      t.severity,
      t.operator,
      t.value_1,
      t.value_2,
      t.message_template,
      t.is_active,
      t.created_at,
      t.updated_at
    from metric_thresholds t
    join metric_types mt on mt.id = t.metric_type_id
    left join devices d on d.id = t.device_id
    where ($1::text is null or d.code = $1)
    order by t.created_at desc;
  `;

  const { rows } = await pool.query(query, [deviceCode || null]);
  return rows;
};

const createThreshold = async ({
  metricTypeId,
  severity,
  operator,
  value1,
  value2 = null,
  deviceId = null,
  deviceSensorId = null,
  messageTemplate = null,
}) => {
  const query = `
    insert into metric_thresholds (
      device_id, device_sensor_id, metric_type_id,
      severity, operator, value_1, value_2, message_template
    )
    values ($1, $2, $3, $4, $5, $6, $7, $8)
    returning *;
  `;

  const { rows } = await pool.query(query, [
    deviceId,
    deviceSensorId,
    metricTypeId,
    severity,
    operator,
    value1,
    value2,
    messageTemplate,
  ]);

  return rows[0];
};

const updateThreshold = async (id, fields) => {
  const allowed = [
    "severity",
    "operator",
    "value_1",
    "value_2",
    "message_template",
    "is_active",
  ];

  const setClauses = [];
  const values = [];
  let paramIndex = 1;

  for (const key of allowed) {
    if (fields[key] !== undefined) {
      setClauses.push(`${key} = $${paramIndex}`);
      values.push(fields[key]);
      paramIndex += 1;
    }
  }

  if (setClauses.length === 0) {
    return null;
  }

  values.push(id);

  const query = `
    update metric_thresholds
    set ${setClauses.join(", ")}
    where id = $${paramIndex}
    returning *;
  `;

  const { rows } = await pool.query(query, values);
  return rows[0] || null;
};

const deleteThreshold = async (id) => {
  const { rows } = await pool.query(
    `delete from metric_thresholds where id = $1 returning id;`,
    [id]
  );
  return rows[0] || null;
};

module.exports = {
  listThresholds,
  createThreshold,
  updateThreshold,
  deleteThreshold,
};
