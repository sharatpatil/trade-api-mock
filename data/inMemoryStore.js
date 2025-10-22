const { v4: uuidv4 } = require('uuid');

// ----- Stocks -----
const stocks = [
  { id: 'INFY', name: 'Infosys Ltd', exchange: 'NSE', price: 1450.00, sector: 'IT' },
  { id: 'TCS', name: 'Tata Consultancy Services', exchange: 'NSE', price: 3300.75, sector: 'IT' },
  { id: 'RELI', name: 'Reliance Industries', exchange: 'NSE', price: 2600.50, sector: 'Energy' },
  { id: 'HDFC', name: 'HDFC Bank', exchange: 'NSE', price: 1250.10, sector: 'Finance' },
  { id: 'ICICI', name: 'ICICI Bank', exchange: 'NSE', price: 920.45, sector: 'Finance' }
];

// ----- Trades -----
const trades = [];
const history = [];
const wallet = { coins: 1000 }; // initial mock wallet
const watchlist = [];



// ----- Helpers -----
function randomFriction(basePrice) {
  const change = (Math.random() - 0.5) * basePrice * 0.02; // ±2%
  return Number((basePrice + change).toFixed(2));
}

// Place a trade
function placeTrade({ stockId, qty, price, side, target, stopLoss, user }) {
  if (!target || !stopLoss) {
    throw new Error("Target and StopLoss are required");
  }

  const id = uuidv4();
  const trade = {
    id,
    stockId,
    qty,
    entryPrice: price,
    side,
    target,
    stopLoss,
    currentPrice: price,
    status: 'active',
    user: user || 'guest',
    createdAt: new Date()
  };

  trades.push(trade);
  return trade;
}


// Square off a trade
function squareOffTrade(id) {
  const index = trades.findIndex(t => t.id === id && t.status === 'active');
  if (index === -1) return null;

  const trade = trades[index];

  // Random simulated current price fluctuation
  const fluctuation = (Math.random() - 0.5) * 20; // +/- 10 Rs
  trade.currentPrice = Number((trade.entryPrice + fluctuation).toFixed(2));

  let result, coinsChange = 0;
  if (
    (trade.side === 'BUY' && trade.currentPrice >= trade.target) ||
    (trade.side === 'SELL' && trade.currentPrice <= trade.target)
  ) {
    result = 'WIN';
    coinsChange = 100;
    wallet.coins += coinsChange;
  } else if (
    (trade.side === 'BUY' && trade.currentPrice <= trade.stopLoss) ||
    (trade.side === 'SELL' && trade.currentPrice >= trade.stopLoss)
  ) {
    result = 'LOSS';
    coinsChange = -100;
    wallet.coins += coinsChange;
  } else {
    result = 'NO RESULT'; // neither hit target nor stop loss
  }

  trade.status = 'settled';
  trade.result = result;
  trade.squareOffPrice = trade.currentPrice;
  trade.squareOffTime = new Date();

  // move to history
  history.push(trade);
  trades.splice(index, 1);

  return {
    ...trade,
    walletUpdate: coinsChange,
    walletBalance: wallet.coins
  };
}

function getWallet() {
  return wallet;
}


// Add stock to watchlist
function addToWatchlist(stockId, name) {
  const exists = watchlist.find(s => s.stockId === stockId);
  if (exists) return { message: 'Already in watchlist', watchlist };
  watchlist.push({ stockId, name, addedAt: new Date() });
  return { message: 'Added to watchlist', watchlist };
}

// Remove stock from watchlist
function removeFromWatchlist(stockId) {
  const index = watchlist.findIndex(s => s.stockId === stockId);
  if (index === -1) return { message: 'Not found', watchlist };
  watchlist.splice(index, 1);
  return { message: 'Removed from watchlist', watchlist };
}


// ---- LIVE PRICE ENGINE ----
const livePrices = {
  INFY: 1500,
  TCS: 3550,
  RELIANCE: 2400,
  HDFCBANK: 1600,
  SBIN: 620
};

function getLivePrice(symbol) {
  // If symbol not tracked, initialize with a random base price
  if (!livePrices[symbol]) {
    livePrices[symbol] = 1000 + Math.random() * 1000;
  }

  // Apply small random movement each call
  const base = livePrices[symbol];
  const fluctuation = (Math.random() - 0.5) * 10; // ±5
  const newPrice = Number((base + fluctuation).toFixed(2));

  // Store and return updated price
  livePrices[symbol] = newPrice;
  return newPrice;
}

// --- USERS & AUTH MOCK STORAGE ---
const users = [];
const otps = {}; // { phone: { code, expiresAt } }

function generateOTP(phone) {
  const code = Math.floor(100000 + Math.random() * 900000); // 6-digit OTP
  otps[phone] = {
    code,
    expiresAt: Date.now() + 2 * 60 * 1000 // 2 minutes validity
  };
  console.log(`Mock OTP for ${phone}: ${code}`);
  return code;
}

function verifyOTP(phone, otp) {
  const entry = otps[phone];
  if (!entry) return { success: false, message: 'No OTP requested' };
  if (Date.now() > entry.expiresAt) return { success: false, message: 'OTP expired' };
  if (String(entry.code) !== String(otp)) return { success: false, message: 'Invalid OTP' };

  // OTP valid — create or get user
  let user = users.find(u => u.phone === phone);
  if (!user) {
    user = { id: users.length + 1, phone, walletCoins: 1000, joinedAt: new Date() };
    users.push(user);
  }

  delete otps[phone];
  return { success: true, user };
}




module.exports = {
  stocks,
  trades,
  history,
  wallet,
  placeTrade,
  squareOffTrade,
  getWallet,
  randomFriction
};


module.exports = {
  ...module.exports,
  watchlist,
  addToWatchlist,
  removeFromWatchlist,
  livePrices,
  getLivePrice,
    generateOTP,
  verifyOTP
};

