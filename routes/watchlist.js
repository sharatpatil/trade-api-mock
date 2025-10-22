const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/watchlistController');

router.get('/', ctrl.getWatchlist);
router.post('/add', ctrl.add);
router.delete('/remove/:id', ctrl.remove);

module.exports = router;
