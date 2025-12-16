const { stocks } = require('../data/inMemoryStore');
const { getPriceFromNSC } = require('../config/nscApi');
const { getLivePrice } = require('../data/inMemoryStore');


/**
 * GET /api/stocks/popular
 * returns a small list of "popular" stocks (mock).
 */
// function getPopular(req, res) {
//   // const popular = [
//   //   { stockId: 'INFY', name: 'Infosys Ltd' },
//   //   { stockId: 'TCS', name: 'Tata Consultancy Services' },
//   //   { stockId: 'RELIANCE', name: 'Reliance Industries' },
//   //   { stockId: 'HDFCBANK', name: 'HDFC Bank' },
//   //   { stockId: 'SBIN', name: 'State Bank of India' }
//   // ].map(s => ({
//   //   ...s,
//   //   currentPrice: getLivePrice(s.stockId)
//   // }));

//     stocks.map(s => ({
//     ...s,
//     currentPrice: getLivePrice(s.stockId)
//   }));

//   res.json({ count: stocks.length, stocks: stocks, currentPrice:currentPrice });
// }


function getPopular(req, res) {
  const popularStocks = stocks.map(s => ({
    ...s,
    currentPrice: getLivePrice(s.id) // use stock id
  }));

  res.json({
    count: popularStocks.length,
    stocks: popularStocks
  });
}



/**
 * GET /api/stocks/search?q=
 */
function searchStocks(req, res) {
  const q = (req.query.q || '').trim().toLowerCase();
  if (!q) return res.json({ results: [] });
  const results = stocks.filter(s =>
    s.id.toLowerCase().includes(q) ||
    s.name.toLowerCase().includes(q) ||
    s.sector.toLowerCase().includes(q)
  ).map(s => ({ id: s.id, name: s.name, exchange: s.exchange, price: getLivePrice(s.id) }));
  res.json({ query: q, results });
}

/**
 * GET /api/stocks/:id/details
 */
async function stockDetails(req, res) {
  try {
    const id = (req.params.id || '').toUpperCase();
    const found = stocks.find(s => s.id === id);
    if (!found) return res.status(404).json({ error: 'Stock not found' });

    // Try to fetch from NSC (mock) — fallback to live price engine
    let nscPrice = {};
    try {
      nscPrice = await getPriceFromNSC(id);
    } catch (e) {
      nscPrice = {};
    }

    // Always use shared live price engine for consistency
    const livePrice = getLivePrice(id);

    const details = {
      id: found.id,
      name: found.name,
      exchange: found.exchange,
      sector: found.sector,
      price: livePrice, // consistent live price across all APIs
      priceSource: nscPrice.source ?? 'live-simulated',
      lastUpdated: new Date()
    };

    res.json(details);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error fetching stock details' });
  }
}

module.exports = {
  getPopular,
  searchStocks,
  stockDetails
};
