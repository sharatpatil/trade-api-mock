const { 
  trades, 
  history, 
  placeTrade, 
  squareOffTrade, 
  getLivePrice,
  getUserById 
} = require('../data/inMemoryStore');

// Utility: Extract userId safely
function extractUserId(req) {
  const userId =
    Number(req.query.userId) ||
    Number(req.body.userId) ||
    Number(req.params.userId);

  return isNaN(userId) ? null : userId;
}

/**
 * POST /api/trades/place
 */
function place(req, res) {
  const userId = extractUserId(req);
  if (!userId) return res.status(400).json({ error: "userId is required" });

  const user = getUserById(userId);
  if (!user) return res.status(404).json({ error: "User not found" });

  const { stockId, qty, price, side, target, stopLoss } = req.body;

  if (!stockId || !qty || !price || !side || !target || !stopLoss) {
    return res.status(400).json({
      error: 'stockId, qty, price, side, target, stopLoss are required'
    });
  }

  try {
    const trade = placeTrade({
      userId,
      stockId: stockId.toUpperCase(),
      qty,
      price,
      side: side.toUpperCase(),
      target,
      stopLoss
    });

    res.status(201).json({
      trade,
      message: 'Trade placed successfully'
    });

  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

/**
 * GET /api/trades/active
 */
function getActive(req, res) {
  const userId = extractUserId(req);
  if (!userId) return res.status(400).json({ error: "userId is required" });

  const user = getUserById(userId);
  if (!user) return res.status(404).json({ error: "User not found" });

  const activeTrades = trades
    .filter(t => t.userId === userId)
    .map(t => {
      const live = getLivePrice(t.stockId);
      const diff = live - t.entryPrice;

      let coins = Math.round(diff);
      if (t.side === "SELL") coins = -coins;

      return {
        ...t,
        currentPrice: live,
        change: diff,
        coinsEarned: coins > 0 ? coins : 0,
        coinsLost: coins < 0 ? Math.abs(coins) : 0,
        totalCoinsChange: coins
      };
    });

  res.json({
    userId,
    count: activeTrades.length,
    trades: activeTrades
  });
}

/**
 * GET /api/trades/settled
 */
function getSettled(req, res) {
  const userId = extractUserId(req);
  if (!userId) return res.status(400).json({ error: "userId is required" });

  const user = getUserById(userId);
  if (!user) return res.status(404).json({ error: "User not found" });

  const settled = history
    .filter(t => t.userId === userId)
    .map(t => ({
      ...t,
      status: 'settled',
      coinsEarned: t.coinsEarned ?? 0,
      coinsLost: t.coinsLost ?? 0,
      bonus: t.bonus ?? 0,
      totalCoinsChange: t.totalCoinsChange ?? 0,
      walletBalance: t.walletBalance ?? user.walletCoins
    }));

  res.json({
    userId,
    count: settled.length,
    trades: settled
  });
}

/**
 * POST /api/trades/squareoff/:id
 */
function squareOff(req, res) {
  const userId = extractUserId(req);
  if (!userId) return res.status(400).json({ error: "userId is required" });

  const user = getUserById(userId);
  if (!user) return res.status(404).json({ error: "User not found" });

  const id = req.params.id;

  const result = squareOffTrade(id, userId);
  
  if (!result)
    return res.status(404).json({ error: 'Active trade not found for square off' });

  res.json({
    trade: result,
    walletUpdate: result.result,
    message: 'Trade squared off'
  });
}

module.exports = {
  place,
  getActive,
  getSettled,
  squareOff
};
