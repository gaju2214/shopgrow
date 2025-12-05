const express = require('express');
const router = express.Router();
const instagramController = require('../controllers/instagramController');
const { authenticateToken } = require('../middleware/auth');

// All routes are protected
router.use(authenticateToken);

// Post products to Instagram
router.post('/post', instagramController.postProducts);

module.exports = router;
