const axios = require('axios');
const finnhub = require('finnhub');
const fs = require('fs');
const path = require('path');

function loadEnvFile() {
  const envPath = path.join(process.cwd(), '.env');
  if (!fs.existsSync(envPath)) {
    return;
  }

  const lines = fs.readFileSync(envPath, 'utf8').split(/\r?\n/);
  lines.forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) {
      return;
    }

    const separatorIndex = trimmed.indexOf('=');
    if (separatorIndex === -1) {
      return;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    const value = trimmed.slice(separatorIndex + 1).trim().replace(/^['"]|['"]$/g, '');
    if (key && process.env[key] === undefined) {
      process.env[key] = value;
    }
  });
}

loadEnvFile();

// ============================================================
// CONFIGURATION FLAGS
// ============================================================

const ENABLE_SHEETDB = process.env.ENABLE_SHEETDB === 'true';
console.log(`SheetDB Enabled: ${ENABLE_SHEETDB}`);
console.log(`Primary Price Source: ${ENABLE_SHEETDB ? 'SheetDB + Finnhub' : 'Finnhub (Live Market)'}`);

const stocks = [
  { id: 'NIFTY', name: 'NIFTY 50', exchange: 'NSE', price: 19500.00, sector: 'Index' },
  { id: 'GOLD', name: 'Gold Futures', exchange: 'MCX', price: 62000.00, sector: 'Commodity' },
  { id: 'BTC', name: 'Bitcoin', exchange: 'CRYPTO', price: 430000.00, sector: 'Cryptocurrency' },
  { id: 'INFY', name: 'Infosys Ltd', exchange: 'NSE', price: 1450.00, sector: 'IT' },
  { id: 'TCS', name: 'Tata Consultancy Services', exchange: 'NSE', price: 3300.75, sector: 'IT' },
  { id: 'RELI', name: 'Reliance Industries', exchange: 'NSE', price: 2600.50, sector: 'Energy' },
  { id: 'HDFC', name: 'HDFC Bank', exchange: 'NSE', price: 1250.10, sector: 'Finance' },
  { id: 'ICICI', name: 'ICICI Bank', exchange: 'NSE', price: 920.45, sector: 'Finance' }
];

// ============================================================
// SHEETDB - External Spreadsheet Prices
// ============================================================

const SHEETDB_URL = 'https://sheetdb.io/api/v1/odmg8g0rdk4mh';
const sheetPrices = {};
let sheetLastUpdated = null;

async function refreshSheetPrices() {
  if (!ENABLE_SHEETDB) {
    console.log('SheetDB disabled - skipping refresh');
    return sheetPrices;
  }

  console.log('Refreshing SheetDB prices...');
  try {
    const res = await axios.get(SHEETDB_URL);
    res.data.forEach((row) => {
      sheetPrices[row.id.toUpperCase()] = Number(row.current_price);
    });
    sheetLastUpdated = new Date();
    console.log(`SheetDB updated: ${Object.keys(sheetPrices).join(', ')}`);
    return sheetPrices;
  } catch (err) {
    console.error('SheetDB fetch failed:', err.message);
    return sheetPrices;
  }
}

function getSheetPrice(symbol) {
  if (!ENABLE_SHEETDB) {
    return null;
  }

  return sheetPrices[symbol.toUpperCase()] ?? null;
}

function getAllSheetPrices() {
  return {
    prices: sheetPrices,
    lastUpdated: sheetLastUpdated
  };
}

// ============================================================
// FINNHUB API - Live market prices
// ============================================================

const FINNHUB_API_KEY = process.env.FINNHUB_API_KEY || '';
const finnhubClient = FINNHUB_API_KEY ? new finnhub.DefaultApi(FINNHUB_API_KEY) : null;
const marketPrices = {};
let marketLastUpdated = null;
let usdInrCache = {
  rate: null,
  fetchedAt: 0
};

// Override these if your Finnhub account uses different exchange symbols.
const FINNHUB_SYMBOL_MAPPING = {
  NIFTY: process.env.FINNHUB_SYMBOL_NIFTY || 'NSE:NIFTY',
  INFY: process.env.FINNHUB_SYMBOL_INFY || 'NSE:INFY',
  TCS: process.env.FINNHUB_SYMBOL_TCS || 'NSE:TCS',
  RELI: process.env.FINNHUB_SYMBOL_RELI || 'NSE:RELIANCE',
  HDFC: process.env.FINNHUB_SYMBOL_HDFC || 'NSE:HDFCBANK',
  ICICI: process.env.FINNHUB_SYMBOL_ICICI || 'NSE:ICICIBANK',
  GOLD: process.env.FINNHUB_SYMBOL_GOLD || 'OANDA:XAU_USD',
  BTC: process.env.FINNHUB_SYMBOL_BTC || 'BINANCE:BTCUSDT'
};

const YAHOO_SYMBOL_MAPPING = {
  NIFTY: process.env.YAHOO_SYMBOL_NIFTY || '^NSEI',
  INFY: process.env.YAHOO_SYMBOL_INFY || 'INFY.NS',
  TCS: process.env.YAHOO_SYMBOL_TCS || 'TCS.NS',
  RELI: process.env.YAHOO_SYMBOL_RELI || 'RELIANCE.NS',
  HDFC: process.env.YAHOO_SYMBOL_HDFC || 'HDFCBANK.NS',
  ICICI: process.env.YAHOO_SYMBOL_ICICI || 'ICICIBANK.NS',
  GOLD: process.env.YAHOO_SYMBOL_GOLD || 'GC=F',
  BTC: process.env.YAHOO_SYMBOL_BTC || 'BTC-INR'
};

const YAHOO_FIRST_SYMBOLS = new Set(['BTC']);
const GOLD_TROY_OUNCE_GRAMS = 31.1034768;
const GOLD_PRICE_GRAMS = 10;

function formatError(err) {
  if (!err) {
    return 'Unknown error';
  }

  if (typeof err === 'string') {
    return err;
  }

  return err.response?.status || err.message || JSON.stringify(err);
}

function getFinnhubQuote(symbol) {
  return new Promise((resolve, reject) => {
    finnhubClient.quote(symbol, (error, data) => {
      if (error) {
        reject(error);
        return;
      }

      resolve(data);
    });
  });
}

async function getYahooQuote(symbol) {
  const response = await axios.get(
    `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}`,
    {
      params: {
        range: '1d',
        interval: '1m'
      },
      timeout: 8000
    }
  );

  const meta = response.data?.chart?.result?.[0]?.meta;
  const price = meta?.regularMarketPrice || meta?.previousClose;
  return Number(price);
}

async function getUsdInrRate() {
  const now = Date.now();
  const cacheAgeMs = now - usdInrCache.fetchedAt;

  if (usdInrCache.rate && cacheAgeMs < 5 * 60 * 1000) {
    return usdInrCache.rate;
  }

  const rate = await getYahooQuote(process.env.YAHOO_SYMBOL_USDINR || 'INR=X');
  if (!Number(rate) || rate <= 0) {
    throw new Error('USD/INR rate unavailable');
  }

  usdInrCache = {
    rate,
    fetchedAt: now
  };

  return rate;
}

async function normalizePrice(symbol, price) {
  if (symbol === 'GOLD') {
    const usdInr = await getUsdInrRate();
    return (price * usdInr * GOLD_PRICE_GRAMS) / GOLD_TROY_OUNCE_GRAMS;
  }

  if (symbol === 'BTC') {
    return price;
  }

  return price;
}

async function refreshMarketPrices() {
  console.log('Refreshing market prices...');

  for (const [ourSymbol, finnhubSymbol] of Object.entries(FINNHUB_SYMBOL_MAPPING)) {
    let livePrice = null;
    let source = null;
    let finnhubIssue = null;
    const preferYahoo = YAHOO_FIRST_SYMBOLS.has(ourSymbol);

    try {
      if (finnhubClient && !preferYahoo) {
        const quote = await getFinnhubQuote(finnhubSymbol);

        if (quote && Number(quote.c) > 0) {
          livePrice = await normalizePrice(ourSymbol, Number(quote.c));
          source = `Finnhub ${finnhubSymbol}`;
        } else {
          finnhubIssue = `No Finnhub price returned for ${ourSymbol} (${finnhubSymbol})`;
        }
      } else if (!preferYahoo) {
        finnhubIssue = 'Finnhub API key not configured. Set FINNHUB_API_KEY in .env';
      }
    } catch (err) {
      finnhubIssue = `Finnhub quote failed for ${ourSymbol} (${finnhubSymbol}): ${formatError(err)}`;
    }

    if (!livePrice && YAHOO_SYMBOL_MAPPING[ourSymbol]) {
      try {
        const yahooSymbol = YAHOO_SYMBOL_MAPPING[ourSymbol];
        const yahooPrice = await getYahooQuote(yahooSymbol);

        if (Number(yahooPrice) > 0) {
          livePrice = await normalizePrice(ourSymbol, yahooPrice);
          source = `Yahoo ${yahooSymbol}`;
        } else {
          console.warn(`No Yahoo price returned for ${ourSymbol} (${yahooSymbol})`);
        }
      } catch (err) {
        console.warn(`Yahoo quote failed for ${ourSymbol} (${YAHOO_SYMBOL_MAPPING[ourSymbol]}): ${formatError(err)}`);
      }
    }

    if (livePrice) {
      marketPrices[ourSymbol] = Number(livePrice.toFixed(2));
      console.log(`${ourSymbol} (${source}): ${marketPrices[ourSymbol]}`);
    } else if (finnhubIssue) {
      console.warn(finnhubIssue);
    }
  }

  marketLastUpdated = new Date();
  console.log(`Market prices updated at ${marketLastUpdated.toLocaleTimeString()}`);
  return marketPrices;
}

function getMarketPrice(symbol) {
  return marketPrices[symbol.toUpperCase()] ?? null;
}

function getAllMarketPrices() {
  return {
    prices: marketPrices,
    lastUpdated: marketLastUpdated
  };
}

// ============================================================
// UPSTOX API INTEGRATION
// ============================================================

const UPSTOX_API_KEY = process.env.UPSTOX_API_KEY || 'YOUR_ACCESS_TOKEN';
const UPSTOX_URL = 'https://api.upstox.com/v2/market-quote/ltp';

const UPSTOX_INSTRUMENT_MAPPING = {
  INFY: 'NSE_EQ|INE009A01021',
  TCS: 'NSE_EQ|INE467B01029',
  RELI: 'NSE_EQ|INE002A01018',
  HDFC: 'NSE_EQ|INE040A01034',
  ICICI: 'NSE_EQ|INE090A01021',
  NIFTY: 'NSE_INDEX|Nifty50'
};

const upstoxPrices = {};
let upstoxLastUpdated = null;

async function refreshUpstoxPrices() {
  try {
    console.log('Refreshing Upstox prices...');
    const instrumentKeys = Object.values(UPSTOX_INSTRUMENT_MAPPING).join(',');

    const response = await axios.get(UPSTOX_URL, {
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${UPSTOX_API_KEY}`
      },
      params: {
        instrument_key: instrumentKeys
      }
    });

    if (response.status === 200 && response.data.data) {
      const data = response.data.data;

      Object.entries(UPSTOX_INSTRUMENT_MAPPING).forEach(([symbol, instrumentKey]) => {
        if (data[instrumentKey] && data[instrumentKey].ltp) {
          upstoxPrices[symbol] = Number(Number(data[instrumentKey].ltp).toFixed(2));
          console.log(`${symbol}: ${upstoxPrices[symbol]}`);
        }
      });

      upstoxLastUpdated = new Date();
      console.log(`Upstox prices updated at ${upstoxLastUpdated.toLocaleTimeString()}`);
    }

    return upstoxPrices;
  } catch (err) {
    if (err.response) {
      console.error(`Upstox API Error (${err.response.status}):`, err.response.data?.message || err.response.statusText);
    } else {
      console.error('Upstox fetch failed:', err.message);
    }
    return upstoxPrices;
  }
}

function getUpstoxPrice(symbol) {
  return upstoxPrices[symbol.toUpperCase()] ?? null;
}

function getAllUpstoxPrices() {
  return {
    prices: upstoxPrices,
    lastUpdated: upstoxLastUpdated
  };
}

// ============================================================
// ZERODHA KITE API INTEGRATION
// ============================================================

const ZERODHA_API_KEY = process.env.ZERODHA_API_KEY || 'YOUR_API_KEY';
const ZERODHA_ACCESS_TOKEN = process.env.ZERODHA_ACCESS_TOKEN || 'YOUR_ACCESS_TOKEN';
const ZERODHA_URL = 'https://api.kite.trade';

const ZERODHA_INSTRUMENT_MAPPING = {
  INFY: '408065',
  TCS: '422401',
  RELI: '4295905',
  HDFC: '341477',
  ICICI: '353265',
  NIFTY: '256265'
};

const zerodhaPrice = {};
let zerodhaLastUpdated = null;

async function refreshZerodhaPrice() {
  try {
    console.log('Refreshing Zerodha prices...');

    if (ZERODHA_ACCESS_TOKEN === 'YOUR_ACCESS_TOKEN') {
      console.warn('Zerodha Access Token not configured. Set ZERODHA_ACCESS_TOKEN in .env');
      return zerodhaPrice;
    }

    const instrumentTokens = Object.values(ZERODHA_INSTRUMENT_MAPPING).join(',');

    const response = await axios.get(`${ZERODHA_URL}/quote`, {
      headers: {
        'X-Kite-Version': '3',
        Authorization: `token ${ZERODHA_API_KEY}:${ZERODHA_ACCESS_TOKEN}`
      },
      params: {
        i: instrumentTokens,
        mode: 'ltp'
      }
    });

    if (response.status === 200 && response.data.data) {
      const data = response.data.data;

      Object.entries(ZERODHA_INSTRUMENT_MAPPING).forEach(([symbol, token]) => {
        if (data[token] && data[token].last_price) {
          zerodhaPrice[symbol] = Number(Number(data[token].last_price).toFixed(2));
          console.log(`${symbol}: ${zerodhaPrice[symbol]}`);
        }
      });

      zerodhaLastUpdated = new Date();
      console.log(`Zerodha prices updated at ${zerodhaLastUpdated.toLocaleTimeString()}`);
    }

    return zerodhaPrice;
  } catch (err) {
    if (err.response) {
      const statusCode = err.response.status;
      const errorMsg = err.response.data?.message || err.response.statusText;

      if (statusCode === 401) {
        console.error('Zerodha Auth Error: Invalid API Key or Access Token');
      } else if (statusCode === 403) {
        console.error('Zerodha Permission Error: Check instrument tokens and permissions');
      } else {
        console.error(`Zerodha API Error (${statusCode}):`, errorMsg);
      }
    } else {
      console.error('Zerodha fetch failed:', err.message);
    }
    return zerodhaPrice;
  }
}

function getZerodhaPrice(symbol) {
  return zerodhaPrice[symbol.toUpperCase()] ?? null;
}

function getAllZerodhaPrice() {
  return {
    prices: zerodhaPrice,
    lastUpdated: zerodhaLastUpdated
  };
}

module.exports = {
  stocks,

  refreshSheetPrices,
  getSheetPrice,
  getAllSheetPrices,

  refreshMarketPrices,
  getMarketPrice,
  getAllMarketPrices,

  refreshUpstoxPrices,
  getUpstoxPrice,
  getAllUpstoxPrices,

  refreshZerodhaPrice,
  getZerodhaPrice,
  getAllZerodhaPrice
};
