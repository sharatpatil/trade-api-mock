const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/realtimeController');

router.get('/price/:id', ctrl.getPrice);
router.get('/list', ctrl.listPrices);

module.exports = router;
