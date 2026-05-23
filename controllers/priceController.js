const {
  refreshSheetPrices,
  getAllSheetPrices,
  getAllMarketPrices,
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
async function getAll(req, res) {
  try {
    const prices = await refreshMarketPrices();
    res.json({
      prices,
      lastUpdated: new Date()
    });
  } catch (err) {
    res.status(500).json({
      error: 'Failed to fetch live prices'
    });
  }
}

function getCached(req, res) {
  res.json({
    market: getAllMarketPrices(),
    sheet: getAllSheetPrices()
  });
}

module.exports = {
  refresh,
  getAll,
  getCached,
  refreshLiveMarket
};
