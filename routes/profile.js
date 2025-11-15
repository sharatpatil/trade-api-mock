// routes/profileRoutes.js
const express = require('express');
const router = express.Router();
const { getProfile } = require('../controllers/Create profileController');

router.get('/:id', getProfile);

module.exports = router;
