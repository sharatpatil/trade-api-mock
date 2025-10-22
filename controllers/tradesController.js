const { trades, history, placeTrade, squareOffTrade, getLivePrice  } = require('../data/inMemoryStore');

/**
 * POST /api/trades/place
 */
function place(req, res) {
  const { stockId, qty, price, side, target, stopLoss, user } = req.body;
  if (!stockId || !qty || !price || !side || !target || !stopLoss) {
    return res.status(400).json({
      error: 'stockId, qty, price, side, target, stopLoss are required'
    });
  }

  try {
    const trade = placeTrade({
      stockId: stockId.toUpperCase(),
      qty,
      price,
      side: side.toUpperCase(),
      target,
      stopLoss,
      user
    });
    res.status(201).json({ trade, message: 'Trade placed successfully' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

/**
 * GET /api/trades/active
 */
function getActive(req, res) {
  const active = trades
    .filter(t => t.status === 'active')
    .map(t => {
      const live = getLivePrice(t.stockId);
      const change = Number((live - t.entryPrice).toFixed(2));
      const changePercent = Number(((change / t.entryPrice) * 100).toFixed(2));

      return {
        ...t,
        currentPrice: live,
        change,
        changePercent
      };
    });

  res.json({ count: active.length, trades: active });
}


/**
 * GET /api/trades/settled
 */
function getSettled(req, res) {
  const settled = history;
  res.json({ count: settled.length, trades: settled });
}

/**
 * POST /api/trades/squareoff/:id
 */
function squareOff(req, res) {
  const id = req.params.id;
  const result = squareOffTrade(id);
  if (!result) return res.status(404).json({ error: 'Active trade not found for square off' });
  res.json({ trade: result, message: 'Trade squared off', walletUpdate: result.result });
}

module.exports = {
  place,
  getActive,
  getSettled,
  squareOff
};
