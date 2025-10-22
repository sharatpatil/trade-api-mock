const { watchlist, addToWatchlist, removeFromWatchlist } = require('../data/inMemoryStore');

/**
 * GET /api/watchlist
 */
function getWatchlist(req, res) {
  res.json({ count: watchlist.length, watchlist });
}

/**
 * POST /api/watchlist/add
 */
function add(req, res) {
  const { stockId, name } = req.body;
  if (!stockId || !name) {
    return res.status(400).json({ error: 'stockId and name are required' });
  }
  const result = addToWatchlist(stockId.toUpperCase(), name);
  res.json(result);
}

/**
 * DELETE /api/watchlist/remove/:id
 */
function remove(req, res) {
  const id = req.params.id.toUpperCase();
  const result = removeFromWatchlist(id);
  res.json(result);
}

module.exports = { getWatchlist, add, remove };
