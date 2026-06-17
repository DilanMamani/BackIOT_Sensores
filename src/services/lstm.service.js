const fetch = (...args) => import('node-fetch').then(({ default: f }) => f(...args));

const LSTM_URL = process.env.LSTM_SERVICE_URL || 'http://localhost:5001';

const predictRisk = async (deviceCode) => {
  const res = await fetch(`${LSTM_URL}/predict/${encodeURIComponent(deviceCode)}`);

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`LSTM service error ${res.status}: ${text}`);
  }

  return res.json();
};

const checkLstmHealth = async () => {
  const res = await fetch(`${LSTM_URL}/health`);
  return res.json();
};

module.exports = { predictRisk, checkLstmHealth };
