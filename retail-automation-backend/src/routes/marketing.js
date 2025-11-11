// This file was renamed from marketingRoutes.js for proper route loading
const express = require('express');
const router = express.Router();
const marketingController = require('../controllers/marketingController');
const auth = require('../middleware/auth');


// List pending marketing jobs (admin approval required)
router.get('/pending', auth, marketingController.getPending);

// Approve a marketing job (admin only)
router.post('/approve/:id', auth, marketingController.approve);

// Create a new marketing queue entry
router.post('/queue', auth, marketingController.createQueueEntry);

const instagramService = require('../services/instagramService');
// Public test route for debugging
router.get('/test', (req, res) => {
  res.json({ message: 'Marketing route is working.' });
});

// Test Instagram post endpoint
router.post('/test-instagram', async (req, res) => {
  try {
    const { caption, image_url, video_url } = req.body;
    const result = await instagramService.publishStockUpdate({
      store: { id: 'test-store' },
      product: { id: 'test-product' },
      caption: caption || 'Test Instagram Post',
      images: image_url ? [image_url] : [],
      video_url: video_url || null
    });
    res.json({ success: true, result });
  } catch (err) {
    // Return detailed error info if available from Instagram API
    if (err.response && err.response.data) {
      res.status(500).json({ success: false, error: err.response.data });
    } else {
      res.status(500).json({ success: false, error: err.message || err });
    }
  }
});

module.exports = router;
