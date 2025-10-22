const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/stocksController');

router.get('/popular', ctrl.getPopular);
router.get('/search', ctrl.searchStocks);
router.get('/:id/details', ctrl.stockDetails);

module.exports = router;
