const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/walletController');

router.get('/', ctrl.getWalletInfo);

module.exports = router;
