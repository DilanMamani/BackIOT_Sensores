const parseRangeToSqlInterval = (range = "1h") => {
  const allowed = {
    "10s": "10 seconds",
    "30s": "30 seconds",
    "45s": "45 seconds",

    "1m": "1 minute",
    "5m": "5 minutes",
    "10m": "10 minutes",
    "15m": "15 minutes",
    "30m": "30 minutes",
    "45m": "45 minutes",

    "1h": "1 hour",
    "6h": "6 hours",
    "12h": "12 hours",
    "24h": "24 hours",

    "2d": "2 days",
    "7d": "7 days",
    "30d": "30 days",
  };

  return allowed[range] || allowed["1h"];
};

module.exports = {
  parseRangeToSqlInterval,
};