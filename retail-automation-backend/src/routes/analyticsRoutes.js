const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const auth = require('../middleware/auth');

router.get('/daily', auth, analyticsController.getDaily);
router.get('/weekly', auth, analyticsController.getWeekly);
router.get('/top-products', auth, analyticsController.getTopProducts);
router.get('/slow-products', auth, analyticsController.getSlowProducts);
// Admin endpoint - trigger analytics aggregation for authenticated store
router.post('/run', auth, analyticsController.runAggregation);

module.exports = router;
