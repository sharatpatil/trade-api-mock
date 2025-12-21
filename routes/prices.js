const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/priceController');

// Load / refresh prices from SheetDB
router.post('/refresh', ctrl.refresh);

// Get cached prices
router.get('/', ctrl.getAll);

module.exports = router;
