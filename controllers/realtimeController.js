const { stocks } = require('../data/inMemoryStore');
const { getPriceFromNSC } = require('../config/nscApi');
const { getLivePrice } = require('../data/inMemoryStore');

/**
 * GET /api/realtime/price/:id
 * Returns a mocked "live" price for given stock id. Tries to use NSC; falls back to randomly jittered in-memory price.
 */
function getPrice(req, res) {
  const symbol = req.params.id.toUpperCase();
  const price = getLivePrice(symbol);
  res.json({
    stockId: symbol,
    currentPrice: price,
    updatedAt: new Date()
  });
}

/**
 * GET /api/realtime/list
 * Return small stream-like snapshot for many stocks
 */
async function listPrices(req, res) {
  // build promises to request NSC for a few items, but since nscApi falls back, it's safe
  const snapshot = await Promise.all(stocks.slice(0, 10).map(async s => {
    const nsc = await getPriceFromNSC(s.id);
    const jitter = (Math.random() - 0.5) * (s.price * 0.01);
    return {
      stockId: s.id,
      name: s.name,
      price: Number(((nsc.price ?? s.price) + jitter).toFixed(2)),
      source: nsc.source ?? 'in-memory',
      ts: nsc.timestamp ?? Date.now()
    };
  }));
  res.json({ snapshot });
}

module.exports = {
  getPrice,
  listPrices
};
