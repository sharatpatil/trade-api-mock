const { v4: uuidv4 } = require('uuid');

// ----- Stocks -----
const stocks = [
  { id: 'INFY', name: 'Infosys Ltd', exchange: 'NSE', price: 1450.00, sector: 'IT' },
  { id: 'TCS', name: 'Tata Consultancy Services', exchange: 'NSE', price: 3300.75, sector: 'IT' },
  { id: 'RELI', name: 'Reliance Industries', exchange: 'NSE', price: 2600.50, sector: 'Energy' },
  { id: 'HDFC', name: 'HDFC Bank', exchange: 'NSE', price: 1250.10, sector: 'Finance' },
  { id: 'ICICI', name: 'ICICI Bank', exchange: 'NSE', price: 920.45, sector: 'Finance' }
];

// ----- Trades / Wallet / Watchlist -----
const trades = [];
const history = [];
const wallet = { coins: 1000 };
const watchlist = [];

// ----- Helpers -----
function randomFriction(basePrice) {
  const change = (Math.random() - 0.5) * basePrice * 0.010; // ±2%
  return Number((basePrice + change).toFixed(2));
}

// ----- Place Trade -----
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

// ----- Manual Square-Off -----
// function squareOffTrade(id) {
//   const index = trades.findIndex(t => t.id === id && t.status === 'active');
//   if (index === -1) return null;
//   const trade = trades[index];

//   const fluctuation = (Math.random() - 0.5) * 20; // ±10
//   trade.currentPrice = Number((trade.entryPrice + fluctuation).toFixed(2));

//   const { result, coinsChange } = evaluateTradeOutcome(trade);
//   trade.status = 'settled';
//   trade.result = result;
//   trade.squareOffPrice = trade.currentPrice;
//   trade.squareOffTime = new Date();

//   wallet.coins += coinsChange;
//   history.push(trade);
//   trades.splice(index, 1);

//   return { ...trade, walletUpdate: coinsChange, walletBalance: wallet.coins };
// }

// Square off trade - always technically WIN
// function squareOffTrade(id) {
//   const index = trades.findIndex(t => t.id === id && t.status === 'active');
//   if (index === -1) return null;

//   const trade = trades[index];
//   let finalPrice;

//   // For BUY trade, make price go above target
//   if (trade.side === 'BUY') {
//     const gain = Math.random() * (trade.target - trade.entryPrice + 10); // push slightly above target
//     finalPrice = trade.entryPrice + gain;
//   }
//   // For SELL trade, make price go below target
//   else if (trade.side === 'SELL') {
//     const drop = Math.random() * (trade.entryPrice - trade.target + 10); // push slightly below target
//     finalPrice = trade.entryPrice - drop;
//   }

//   trade.currentPrice = Number(finalPrice.toFixed(2));

//   // Result is genuine win (price actually crosses target)
//   const result = 'WIN';
//   const coinsChange = 100;
//   wallet.coins += coinsChange;

//   trade.status = 'settled';
//   trade.result = result;
//   trade.squareOffPrice = trade.currentPrice;
//   trade.squareOffTime = new Date();

//   // move to history
//   history.push(trade);
//   trades.splice(index, 1);

//   return {
//     ...trade,
//     walletUpdate: coinsChange,
//     walletBalance: wallet.coins
//   };
// }


function squareOffTrade(id) {

 
  const index = trades.findIndex(t => t.id === id && t.status === 'active');
  if (index === -1) return null;

  const trade = trades[index];

  // Deduct 200 coins margin once (if not already done)
  if (!trade.marginDeducted) {
    wallet.coins -= 200;
    trade.marginDeducted = true;
  }

  // Simulate 10 large fluctuations (±10%)
  let price = trade.entryPrice;
  for (let i = 0; i < 10; i++) {
    const change = (Math.random() - 0.5) * price * 0.1; // ±10%
    price = Number((price + change).toFixed(2));
  }
  trade.currentPrice = price;

  // --- COIN UPDATE PURELY BY PRICE DIFFERENCE ---
  const priceDiff = trade.currentPrice - trade.entryPrice;
  let coinsChange = Math.round(priceDiff);

 
  // For SELL trades, reverse difference direction
  if (trade.side === 'SELL') {
    coinsChange = Math.round(-priceDiff);
  }

  // Update wallet
  wallet.coins += coinsChange;

  // Finalize trade
  trade.status = 'settled';
  trade.squareOffPrice = trade.currentPrice;
  trade.squareOffTime = new Date();

  // Move trade to history
  history.push(trade);
  trades.splice(index, 1);

  

  return {
    ...trade,
    walletChange: coinsChange,
    walletBalance: wallet.coins
  };
}



// ----- Evaluate Win/Loss -----
function evaluateTradeOutcome(trade) {
  let result = 'NO RESULT';
  let coinsChange = 0;

  if (
    (trade.side === 'BUY' && trade.currentPrice >= trade.target) ||
    (trade.side === 'SELL' && trade.currentPrice <= trade.target)
  ) {
    result = 'WIN';
    coinsChange = 100;
  } else if (
    (trade.side === 'BUY' && trade.currentPrice <= trade.stopLoss) ||
    (trade.side === 'SELL' && trade.currentPrice >= trade.stopLoss)
  ) {
    result = 'LOSS';
    coinsChange = -100;
  }
  return { result, coinsChange };
}

// ----- Wallet -----
function getWallet() {
  return wallet;
}

// ----- Watchlist -----
function addToWatchlist(stockId, name) {
  const exists = watchlist.find(s => s.stockId === stockId);
  if (exists) return { message: 'Already in watchlist', watchlist };
  watchlist.push({ stockId, name, addedAt: new Date() });
  return { message: 'Added to watchlist', watchlist };
}
function removeFromWatchlist(stockId) {
  const index = watchlist.findIndex(s => s.stockId === stockId);
  if (index === -1) return { message: 'Not found', watchlist };
  watchlist.splice(index, 1);
  return { message: 'Removed from watchlist', watchlist };
}

// ----- Live Price Engine -----
const livePrices = {
  INFY: 1500,
  TCS: 3550,
  RELI: 2400,
  HDFC: 1600,
  ICICI: 950
};

function getLivePrice(symbol) {
  if (!livePrices[symbol]) livePrices[symbol] = 1000 + Math.random() * 1000;
  const base = livePrices[symbol];
  const fluctuation = (Math.random() - 0.50) * 10; // ±5
  const newPrice = Number((base + fluctuation).toFixed(2));
  livePrices[symbol] = newPrice;
  return newPrice;
}

// ----- Continuous Market Simulation -----
function fluctuateAndMonitor() {
  Object.keys(livePrices).forEach(sym => {
    const base = livePrices[sym];
    const fluctuation = (Math.random() - 0.5) * 10;
    livePrices[sym] = Number((base + fluctuation).toFixed(2));
  });

  const now = new Date();
  trades.slice().forEach(trade => {
    trade.currentPrice = getLivePrice(trade.stockId);
    const { result, coinsChange } = evaluateTradeOutcome(trade);
    if (result !== 'NO RESULT') {
      trade.status = 'settled';
      trade.result = result;
      trade.squareOffPrice = trade.currentPrice;
      trade.squareOffTime = now;
      wallet.coins += coinsChange;
      history.push(trade);
      const idx = trades.findIndex(t => t.id === trade.id);
      if (idx !== -1) trades.splice(idx, 1);
    }
  });
}

// run every 3 seconds
setInterval(fluctuateAndMonitor, 3000);

// ----- OTP / Auth -----
const users = [];
const otps = {};

function generateOTP(phone) {
  const code = Math.floor(100000 + Math.random() * 900000);
  otps[phone] = { code, expiresAt: Date.now() + 2 * 60 * 1000 };
  console.log(`Mock OTP for ${phone}: ${code}`);
  return code;
}

function verifyOTP(phone, otp) {
  const entry = otps[phone];
  if (!entry) return { success: false, message: 'No OTP requested' };
  if (Date.now() > entry.expiresAt) return { success: false, message: 'OTP expired' };
  if (String(entry.code) !== String(otp)) return { success: false, message: 'Invalid OTP' };

  let user = users.find(u => u.phone === phone);
  if (!user) {
    user = { id: users.length + 1, phone, walletCoins: 1000, joinedAt: new Date() };
    users.push(user);
  }
  delete otps[phone];
  return { success: true, user };
}

// ----- Exports -----
module.exports = {
  stocks,
  trades,
  history,
  wallet,
  placeTrade,
  squareOffTrade,
  getWallet,
  randomFriction,
  watchlist,
  addToWatchlist,
  removeFromWatchlist,
  livePrices,
  getLivePrice,
  generateOTP,
  verifyOTP
};
