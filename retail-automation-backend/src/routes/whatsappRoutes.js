const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const whatsappController = require('../controllers/whatsappController');

// Apply auth middleware to all routes
router.use(auth);

/**
 * New Multi-tenant Endpoints
 */

// POST /api/whatsapp/send - Send custom message
router.post('/send', whatsappController.sendMessage);

// GET /api/whatsapp/messages - List all messages for store
router.get('/messages', whatsappController.getMessages);

// POST /api/whatsapp/broadcast-stock-update - Broadcast stock update to opted-in customers
router.post('/broadcast-stock-update', whatsappController.triggerStockUpdate);

// POST /api/whatsapp/test-birthday - Manual birthday message test
router.post('/test-birthday', whatsappController.testBirthdayMessage);

/**
 * Legacy Endpoints (for backward compatibility)
 */

// POST /api/whatsapp/send-video - Send video message
router.post('/send-video', whatsappController.sendVideoMessage);

// POST /api/whatsapp/send-template - Send template message
router.post('/send-template', whatsappController.sendTemplateMessage);

// POST /api/whatsapp/send-image - Send image message
router.post('/send-image', whatsappController.sendImageMessage);

module.exports = router;