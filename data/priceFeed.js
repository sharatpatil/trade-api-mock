const axios = require('axios');

const SHEETDB_URL = 'https://sheetdb.io/api/v1/5bzdefpayyzl1';

// in-memory cache
const sheetPrices = {};
let lastUpdated = null;

// Fetch prices from SheetDB
async function refreshSheetPrices() {
  try {
    const res = await axios.get(SHEETDB_URL);

    res.data.forEach(row => {
      sheetPrices[row.id.toUpperCase()] = Number(row.current_price);
    });

    lastUpdated = new Date();

    // console.log('Sheet prices refreshed:', sheetPrices);
    return sheetPrices;
  } catch (err) {
    console.error('Failed to fetch SheetDB prices:', err.message);
    throw err;
  }
}

// Get price
function getSheetPrice(symbol) {
  return sheetPrices[symbol.toUpperCase()] ?? null;
}

// Get all cached prices
function getAllSheetPrices() {
  return {
    prices: sheetPrices,
    lastUpdated
  };
}

module.exports = {
  refreshSheetPrices,
  getSheetPrice,
  getAllSheetPrices
};
