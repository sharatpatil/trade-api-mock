// controllers/profileController.js
const { getUserById, getTotalFloatingPnL } = require('../data/inMemoryStore');

// badge logic
function getBadgeLevel(coins) {
  if (coins >= 1300) return 5;
  if (coins >= 1200) return 4;
  if (coins >= 1100) return 3;
  if (coins >= 1000) return 2;
  return 1;
}

// GET profile by userId
function getProfile(req, res) {
  const userId = req.params.id;

  const user = getUserById(userId);
  if (!user) return res.status(404).json({ error: "User not found" });

  // always recalculate badge
  const badgeLevel = getBadgeLevel(user.walletCoins);
  const floatingPnL = getTotalFloatingPnL(userId);

  return res.json({
    id: user.id,
    phone: user.phone,
    walletCoins: user.walletCoins,
    badgeLevel,
    joinedAt: user.joinedAt,
    stats: user.stats,
    floatingPnL
  });
}

module.exports = { getProfile };
