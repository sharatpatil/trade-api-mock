const axios = require('axios');

const nscClient = axios.create({
  baseURL: process.env.NSC_API_BASE || 'https://nsc.example.com/api',
  timeout: 3000
});

/**
 * Try to call NSC. If it fails, return a mock response so the API remains functional.
 */
async function getPriceFromNSC(stockId) {
  try {
    // real call (in real world you would pass api-key, params etc.)
    const resp = await nscClient.get(`/price/${encodeURIComponent(stockId)}`);
    return resp.data;
  } catch (err) {
    // fallback mock — structure similar to what a real price API might return
    return {
      stockId,
      price: Number((100 + Math.random() * 200).toFixed(2)),
      timestamp: Date.now(),
      source: 'mock-nsc-fallback'
    };
  }
}

module.exports = {
  nscClient,
  getPriceFromNSC
};
