const evaluateMetricStatus = (value, thresholds = []) => {
  let status = "normal";

  for (const threshold of thresholds) {
    const { severity, operator, value_1, value_2 } = threshold;

    let matched = false;

    switch (operator) {
      case "gt":
        matched = value > Number(value_1);
        break;
      case "gte":
        matched = value >= Number(value_1);
        break;
      case "lt":
        matched = value < Number(value_1);
        break;
      case "lte":
        matched = value <= Number(value_1);
        break;
      case "between":
        matched =
          value >= Number(value_1 || 0) && value <= Number(value_2 || 0);
        break;
      default:
        matched = false;
    }

    if (matched && severity === "danger") {
      return "danger";
    }

    if (matched && severity === "warning") {
      status = "warning";
    }
  }

  return status;
};

module.exports = {
  evaluateMetricStatus,
};