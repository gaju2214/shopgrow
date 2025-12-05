const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const auth = require('../middleware/auth');

// All routes require authentication
router.use(auth);

// Product CRUD routes
// IMPORTANT: Specific routes must come BEFORE dynamic routes
router.post('/', productController.createProduct);
router.get('/low-stock', productController.getLowStockProducts);
router.get('/', productController.getAllProducts);
router.get('/:id', productController.getProductById);
router.put('/:id', productController.updateProduct);
router.patch('/:id/stock', productController.updateStock);
router.delete('/:id', productController.deleteProduct);

module.exports = router;
