const { getWallet } = require('../data/inMemoryStore');

/**
 * GET /api/wallet/:userId
 */
function getWalletInfo(req, res) {
  const userId = Number(req.params.userId);

  if (!userId) {
    return res.status(400).json({ error: "userId is required" });
  }

  const wallet = getWallet(userId);

  if (!wallet || wallet.error) {
    return res.status(404).json({ error: "User not found" });
  }

  res.json({
    userId,
    coins: wallet.coins,
    badgeLevel: wallet.badge,
    lastUpdated: Date.now()
  });
}

module.exports = { getWalletInfo };
