const { getUserById, addCoinsToWallet } = require('../data/inMemoryStore');

/**
 * GET /api/wallet?userId=1
 */
function getWalletInfo(req, res) {
  const userId = Number(req.query.userId);

  if (!userId)
    return res.status(400).json({ error: "userId is required" });

  const user = getUserById(userId);
  if (!user)
    return res.status(404).json({ error: "User not found" });

  res.json({
    userId: user.id,
    walletCoins: user.walletCoins,
    badgeLevel: user.badgeLevel,
    stats: user.stats
  });
}

/**
 * POST /api/wallet/add
 */
function addCoins(req, res) {
  const { userId, coins } = req.body;

  if (!userId || typeof coins !== 'number')
    return res.status(400).json({ error: "userId and coins are required" });

  const wallet = addCoinsToWallet(userId, coins);
  if (!wallet)
    return res.status(404).json({ error: "User not found" });

  res.json({
    success: true,
    message: "Wallet updated",
    wallet
  });
}

module.exports = {
  getWalletInfo,
  addCoins
};
