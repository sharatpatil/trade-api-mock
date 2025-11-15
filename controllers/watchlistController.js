const { 
  getUserById,
  getWatchlistByUser,
  addToWatchlist,
  removeFromWatchlist 
} = require('../data/inMemoryStore');

// Utility — consistent userId extraction
function extractUserId(req) {
  const userId =
    Number(req.query.userId) ||
    Number(req.body.userId) ||
    Number(req.params.userId);

  return isNaN(userId) ? null : userId;
}

/**
 * GET /api/watchlist
 */
function getWatchlist(req, res) {
  const userId = extractUserId(req);
  if (!userId) return res.status(400).json({ error: "userId is required" });

  const user = getUserById(userId);
  if (!user) return res.status(404).json({ error: "User not found" });

  const list = getWatchlistByUser(userId);

  res.json({
    userId,
    count: list.length,
    watchlist: list
  });
}

/**
 * POST /api/watchlist/add
 */
function add(req, res) {
  const userId = extractUserId(req);
  if (!userId) return res.status(400).json({ error: "userId is required" });

  const user = getUserById(userId);
  if (!user) return res.status(404).json({ error: "User not found" });

  const { stockId, name } = req.body;
  if (!stockId || !name) {
    return res.status(400).json({ error: "stockId and name are required" });
  }

  const result = addToWatchlist(userId, stockId.toUpperCase(), name);

  res.json({
    message: "Stock added to watchlist",
    watchlist: result
  });
}

/**
 * DELETE /api/watchlist/remove/:id
 */
function remove(req, res) {
  const userId = extractUserId(req);
  if (!userId) return res.status(400).json({ error: "userId is required" });

  const user = getUserById(userId);
  if (!user) return res.status(404).json({ error: "User not found" });

  const id = req.params.id.toUpperCase();

  const result = removeFromWatchlist(userId, id);

  res.json({
    message: "Removed from watchlist",
    watchlist: result
  });
}

module.exports = { getWatchlist, add, remove };
