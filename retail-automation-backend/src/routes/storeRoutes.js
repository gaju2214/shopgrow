const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

// Placeholder - will implement later
router.get('/profile', auth, (req, res) => {
  res.json({ success: true, message: 'Store routes coming soon' });
});

module.exports = router;
