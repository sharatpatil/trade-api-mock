const { getWallet } = require('../data/inMemoryStore');

/**
 * GET /api/wallet
 */
function getWalletInfo(req, res) {
  const wallet = getWallet();
  res.json({ coins: wallet.coins, lastUpdated: Date.now() });
}

module.exports = { getWalletInfo };
