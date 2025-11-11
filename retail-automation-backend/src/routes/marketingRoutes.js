console.log('Loaded marketingRoutes.js');
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const marketingController = require('../controllers/marketingController');

const instagramService = require('../services/instagramService');
// Test Instagram post endpoint
router.post('/test-instagram', async (req, res) => {
	try {
		// Example payload, you can change these values or pass via req.body
		const result = await instagramService.publishStockUpdate({
			store: { id: 'test-store' },
			product: { id: 'test-product' },
			caption: req.body.caption || 'Test Instagram Post',
			images: [req.body.image_url || 'https://via.placeholder.com/600x400.png?text=Test+Image']
		});
		res.json({ success: true, result });
	} catch (err) {
		// Return more detailed error info if available
		if (err.response && err.response.data) {
			res.status(500).json({ success: false, error: err.response.data });
		} else {
			res.status(500).json({ success: false, error: err.message || err });
		}
	}
});
router.get('/test', (req, res) => res.json({ success: true, message: 'Test route works!' }));
router.use(auth);
router.get('/pending', marketingController.getPending);
router.post('/:id/approve', marketingController.approve);
module.exports = router;
