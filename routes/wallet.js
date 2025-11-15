const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/walletController');

router.get('/', ctrl.getWalletInfo);        // default user = 1
router.get('/:userId', ctrl.getWalletInfo); // specific user


module.exports = router;
