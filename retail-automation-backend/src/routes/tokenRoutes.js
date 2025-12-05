const express = require('express');
const router = express.Router();
const tokenController = require('../controllers/tokenController');
const { authenticateToken } = require('../middleware/auth');

// All routes are protected
router.use(authenticateToken);

// Get token by store and platform
router.get('/store/:storeId/platform/:platform', tokenController.getToken);

// Save or update Instagram token
router.post('/instagram', tokenController.saveInstagramToken);

// Refresh Instagram token
router.post('/refresh/instagram', tokenController.refreshInstagramToken);

// Delete token
router.delete('/:tokenId', tokenController.deleteToken);

module.exports = router;