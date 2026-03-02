const axios = require('axios');
const stocks = [
 
  {
    id: 'BTC',
    name: 'Bitcoin',
    exchange: 'CRYPTO',
    price: 430000.00, // example INR price
    sector: 'Cryptocurrency'
  },

  { id: 'INFY', name: 'Infosys Ltd', exchange: 'NSE', price: 1450.00, sector: 'IT' },
 
];



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

const API_KEY = `8949d8cf48874f73a18063d28b4b022c`;

const marketPrices = {};
let marketLastUpdated = null;

async function refreshMarketPrices() {
  try {

    const uniqueSymbols = stocks.map(stock => stock.id);

    for (const symbol of uniqueSymbols) {

      let apiSymbol = symbol;
      let livePrice = null;

      // 🔹 Internal → API Mapping
      if (symbol === "RELI") apiSymbol = "RELIANCE";
      if (symbol === "HDFC") apiSymbol = "HDFCBANK";
      if (symbol === "ICICI") apiSymbol = "ICICIBANK";
      if (symbol === "NIFTY") apiSymbol = "^NSEI";
      if (symbol === "TCS") apiSymbol = "TCS";

      console.log(apiSymbol)
      // 🔹 BTC (Crypto)
      if (symbol === "BTC") {
        // const btcRes = await axios.get(
        //   "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=inr"
        // );
        //  console.log(btcRes)
        // livePrice = btcRes.data.bitcoin.inr;
       
      } else {
        const response = await axios.get(
          `https://api.twelvedata.com/price?symbol=${apiSymbol}&exchange=NSE&apikey=${API_KEY}`
        );

        console.log(response)
        if (response.data.price) {
          livePrice = Number(Number(response.data.price).toFixed(2));
        }
      }

      if (livePrice) {
        marketPrices[symbol] = livePrice;
      }
    }

    marketLastUpdated = new Date();

    return marketPrices;

  } catch (err) {
   console.error(`Failed for symbol ${symbol}:`, err.response?.data || err.message);
    throw err;
  }
}

// Get price
function getSheetPrice(symbol) {
  return sheetPrices[symbol.toUpperCase()] ?? null;
}

function getMarketPrice(symbol) {
  return marketPrices[symbol.toUpperCase()] ?? null;
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
  getAllSheetPrices,
  refreshMarketPrices,
  getMarketPrice
};
