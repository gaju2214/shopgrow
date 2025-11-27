const express = require('express');
const router = express.Router();
const salesController = require('../controllers/salesController');
const auth = require('../middleware/auth');

router.use(auth);


router.post('/', salesController.createSale);
router.get('/', salesController.getAllSales);
router.get('/analytics', salesController.getSalesAnalytics);
router.get('/report', salesController.getSalesReport);
router.get('/history', salesController.getSalesHistory);
router.get('/:id', salesController.getSaleById);

module.exports = router;