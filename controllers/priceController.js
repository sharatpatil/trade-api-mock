const {
  refreshSheetPrices,
  getAllSheetPrices,
  refreshLiveMarketPrices,
  refreshMarketPrices
} = require('../data/priceFeed');

/**
 * POST /api/prices/refresh
 */
async function refresh(req, res) {
  try {
    const prices = await refreshSheetPrices();
    res.json({
      message: 'Prices refreshed successfully',
      prices,
      lastUpdated: new Date()
    });
  } catch (err) {
    res.status(500).json({
      error: 'Failed to refresh prices'
    });
  }
}


async function refreshLiveMarket(req, res) {
  try {
    const prices = await refreshMarketPrices();
    res.json({
      message: 'Prices refreshed successfully',
      prices,
      lastUpdated: new Date()
    });
  } catch (err) {
    res.status(500).json({
      error: 'Failed to refresh prices'
    });
  }
}


/**
 * GET /api/prices
 */
function getAll(req, res) {
  const data = getAllSheetPrices();
  res.json(data);
}

module.exports = {
  refresh,
  getAll,
  refreshLiveMarket
};
