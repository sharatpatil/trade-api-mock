const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/tradesController');

router.post('/place', ctrl.place);
router.get('/active', ctrl.getActive);
router.get('/settled', ctrl.getSettled);
// router.post('/settle/:id', ctrl.settle);
router.post('/squareoff/:id', ctrl.squareOff);

module.exports = router;


    