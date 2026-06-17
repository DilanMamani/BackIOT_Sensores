const { pool } = require("../config/db");

const listMetricTypes = async () => {
  const query = `
    select id, code, name, unit, value_kind, metric_group, sort_order
    from metric_types
    order by sort_order asc;
  `;

  const { rows } = await pool.query(query);
  return rows;
};

module.exports = {
  listMetricTypes,
};
