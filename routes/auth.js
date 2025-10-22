const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/authController');

router.post('/request-otp', ctrl.requestOTP);
router.post('/verify-otp', ctrl.verifyUserOTP);

module.exports = router;
