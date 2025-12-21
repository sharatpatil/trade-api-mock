const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/walletController');

router.get('/', ctrl.getWalletInfo);        // ?userId=1
router.post('/add', ctrl.addCoins);         // add coins

module.exports = router;