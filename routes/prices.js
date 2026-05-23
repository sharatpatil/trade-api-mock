const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/priceController');

// Load / refresh prices from SheetDB
router.get('/refresh', ctrl.refresh);

// Fetch live prices on demand
router.get('/refresh_live', ctrl.refreshLiveMarket);

// Get cached prices without hitting external APIs
router.get('/cached', ctrl.getCached);

// Fetch live prices on demand
router.get('/', ctrl.getAll);

module.exports = router;
