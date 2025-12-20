const { v4: uuidv4 } = require('uuid');

/* ---------------------------------------------------------
   STOCKS
--------------------------------------------------------- */
const stocks = [
    {
    id: 'NIFTY',
    name: 'NIFTY 50',
    exchange: 'NSE',
    price: 19500.00,
    sector: 'Index'
  },
  
  {
    id: 'GOLD',
    name: 'Gold Futures',
    exchange: 'MCX',
    price: 62000.00,
    sector: 'Commodity'
  },
  { id: 'INFY', name: 'Infosys Ltd', exchange: 'NSE', price: 1450.00, sector: 'IT' },
  { id: 'TCS', name: 'Tata Consultancy Services', exchange: 'NSE', price: 3300.75, sector: 'IT' },
  { id: 'RELI', name: 'Reliance Industries', exchange: 'NSE', price: 2600.50, sector: 'Energy' },
  { id: 'HDFC', name: 'HDFC Bank', exchange: 'NSE', price: 1250.10, sector: 'Finance' },
  { id: 'ICICI', name: 'ICICI Bank', exchange: 'NSE', price: 920.45, sector: 'Finance' },

  

];



let userWatchlists = {
  1: [],   // user 1 watchlist
  2: []    // user 2 watchlist
};

/* ---------------------------------------------------------
   DATA STORAGE
--------------------------------------------------------- */
const trades = [];
const history = [];

const watchlist = [];

const livePrices = {
  INFY: 1500,
  TCS: 3550,
  RELI: 2400,
  HDFC: 1600,
  ICICI: 950,
  NIFTY:19500,
  GOLD:62000
};


/* ---------------------------------------------------------
   USERS (AUTH + WALLET)
--------------------------------------------------------- */
const users = [
  {
    id: 1,
    phone: "9999999999",
    walletCoins: 950,
    badgeLevel: 1,
    joinedAt: new Date("2025-01-01"),
    stats: { totalTrades: 0, wins: 0, losses: 0 }
  },
  {
    id: 2,
    phone: "8888888888",
    walletCoins: 1250,
    badgeLevel: 4,
    joinedAt: new Date("2025-01-02"),
    stats: { totalTrades: 20, wins: 14, losses: 6 }
  }
];

const otps = {};


/* ---------------------------------------------------------
   HELPERS
--------------------------------------------------------- */
function getUserById(id) {
  return users.find(u => u.id == id);
}

function getBadgeLevel(coins) {
  if (coins >= 1300) return 5;
  if (coins >= 1200) return 4;
  if (coins >= 1100) return 3;
  if (coins >= 1000) return 2;
  return 1;
}

function getLivePrice(symbol) {
  fluctuateAndMonitor()
  if (!livePrices[symbol]) livePrices[symbol] = 1000 + Math.random() * 1000;

  const base = livePrices[symbol];
  const fluctuation = (Math.random() - 0.5) * 10;
  const newPrice = Number((base + fluctuation).toFixed(2));
  livePrices[symbol] = newPrice;

  return newPrice;
}


/* ---------------------------------------------------------
   PLACE TRADE
--------------------------------------------------------- */
function placeTrade(data) {
  const user = getUserById(data.userId);
  if (!user) throw new Error("Invalid userId");

  const trade = {
    id: uuidv4(),
    userId: data.userId,
    stockId: data.stockId,
    qty: data.qty,
    entryPrice: data.price,
    side: data.side,
    target: data.target,
    stopLoss: data.stopLoss,
    currentPrice: data.price,
    status: 'active',
    createdAt: new Date()
  };

  trades.push(trade);
  return trade;
}


function fluctuateAndMonitor() {
  const now = new Date();

  trades.slice().forEach(trade => {
    // update live price
    trade.currentPrice = getLivePrice(trade.stockId);

    let hitTarget = false;
    let hitSL = false;

    if (trade.side === "BUY") {
      hitTarget = trade.currentPrice >= trade.target;
      hitSL = trade.currentPrice <= trade.stopLoss;
    } else {
      hitTarget = trade.currentPrice <= trade.target;
      hitSL = trade.currentPrice >= trade.stopLoss;
    }

    if (!hitTarget && !hitSL) return;

    // -------- AUTO SQUARE OFF --------
    trade.status = 'settled';
    trade.squareOffPrice = trade.currentPrice;
    trade.squareOffTime = now;

    const diff = trade.squareOffPrice - trade.entryPrice;
    let coins = Math.round(diff);
    if (trade.side === "SELL") coins = -coins;

    const bonus = 50;
    const finalCoins = coins + bonus;

    trade.coinsEarned = coins > 0 ? coins : 0;
    trade.coinsLost = coins < 0 ? Math.abs(coins) : 0;
    trade.bonus = bonus;
    trade.totalCoinsChange = finalCoins;

    // ---- USER WALLET UPDATE ----
    const user = users.find(u => u.id === trade.userId);
    if (user) {
      user.walletCoins += finalCoins;
      user.badgeLevel = getBadgeLevel(user.walletCoins);
      user.stats.totalTrades += 1;

      if (coins > 0) user.stats.wins += 1;
      if (coins < 0) user.stats.losses += 1;

      trade.walletBalance = user.walletCoins;
    }

    // move trade
    const idx = trades.findIndex(t => t.id === trade.id);
    if (idx !== -1) trades.splice(idx, 1);
    history.push(trade);
  });
}



/* ---------------------------------------------------------
   SQUARE OFF TRADE (USER-BASED WALLET UPDATE)
--------------------------------------------------------- */
function squareOffTrade(id) {
  const trade = trades.find(t => t.id === id);
  if (!trade) return null;

  const user = getUserById(trade.userId);
  if (!user) return null;

  // Big fluctuation: ±10%
  const bigFluctuation = trade.entryPrice * (Math.random() * 0.2 - 0.1);
  trade.currentPrice = Number((trade.entryPrice + bigFluctuation).toFixed(2));

  trade.status = 'settled';
  trade.squareOffPrice = trade.currentPrice;
  trade.squareOffTime = new Date();

  const diff = trade.squareOffPrice - trade.entryPrice;
  let coins = Math.round(diff);

  if (trade.side === "SELL") coins = -coins;

  const bonus = 50;
  const totalCoins = coins + bonus;

  // Trade record
  trade.coinsEarned = coins > 0 ? coins : 0;
  trade.coinsLost  = coins < 0 ? Math.abs(coins) : 0;
  trade.bonus = bonus;
  trade.totalCoinsChange = totalCoins;

  // Wallet update
  user.walletCoins += totalCoins;
  user.badgeLevel = getBadgeLevel(user.walletCoins);

  // Stats
  user.stats.totalTrades++;
  if (coins > 0) user.stats.wins++;
  if (coins < 0) user.stats.losses++;

  trade.walletBalance = user.walletCoins;

  // Move to history
  history.push(trade);
  trades.splice(trades.indexOf(trade), 1);

  return trade;
}


/* ---------------------------------------------------------
   WATCHLIST
--------------------------------------------------------- */
// function addToWatchlist(stockId, name) {
//   const exists = watchlist.find(s => s.stockId === stockId);
//   if (exists) return { message: 'Already in watchlist', watchlist };
//   watchlist.push({ stockId, name, addedAt: new Date() });
//   return { message: 'Added to watchlist', watchlist };
// }

// function removeFromWatchlist(stockId) {
//   const index = watchlist.findIndex(s => s.stockId === stockId);
//   if (index === -1) return { message: 'Not found' };
//   watchlist.splice(index, 1);
//   return { message: 'Removed' };
// }


/* ---------------------------------------------------------
   OTP AUTH
--------------------------------------------------------- */
function generateOTP(phone) {
  const code = Math.floor(100000 + Math.random() * 900000);
  otps[phone] = { code, expiresAt: Date.now() + 2 * 60 * 1000 };
  return code;
}

function verifyOTP(phone, otp) {
  const entry = otps[phone];
  if (!entry) return { success: false, message: 'No OTP requested' };
  if (Date.now() > entry.expiresAt) return { success: false, message: 'OTP expired' };
  if (String(entry.code) !== String(otp)) return { success: false, message: 'Invalid OTP' };

  let user = users.find(u => u.phone === phone);

  if (!user) {
    user = {
      id: users.length + 1,
      phone,
      walletCoins: 1000,
      badgeLevel: getBadgeLevel(1000),
      joinedAt: new Date(),
      stats: { totalTrades: 0, wins: 0, losses: 0 }
    };
    users.push(user);
  }

  delete otps[phone];
  return { success: true, user };
}


function getWatchlistByUser(userId) {
  if (!userWatchlists[userId]) userWatchlists[userId] = [];
  return userWatchlists[userId];
}

function addToWatchlist(userId, stockId, name) {
  if (!userWatchlists[userId]) userWatchlists[userId] = [];

  const exists = userWatchlists[userId].find(i => i.stockId === stockId);
  if (!exists) {
    userWatchlists[userId].push({
      stockId,
      name,
      addedAt: new Date()
    });
  }

  return userWatchlists[userId];
}

function removeFromWatchlist(userId, stockId) {
  if (!userWatchlists[userId]) userWatchlists[userId] = [];

  userWatchlists[userId] = userWatchlists[userId].filter(i => i.stockId !== stockId);

  return userWatchlists[userId];
}


/* ---------------------------------------------------------
   EXPORTS
--------------------------------------------------------- */
module.exports = {
  stocks,
  trades,
  history,
  watchlist,

  getUserById,
  placeTrade,
  squareOffTrade,
  getLivePrice,

  addToWatchlist,
  removeFromWatchlist,

  users,

  generateOTP,
  verifyOTP,
  getBadgeLevel,
  getWatchlistByUser,
  
};
