const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const auth = require('../middleware/auth');
const multer = require('multer');
const upload = multer();

// Public routes
router.post('/register', upload.none(), authController.register); // Accept FormData (no files)
router.post('/login', authController.login);

// Protected routes
router.get('/profile', auth, authController.getProfile);

module.exports = router;