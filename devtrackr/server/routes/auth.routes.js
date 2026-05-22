const express = require('express');
const { body } = require('express-validator');
const authController = require('../controllers/auth.controller');
const authMiddleware = require('../middleware/auth.middleware');

const router = express.Router();

// Signup Route validation & binding
router.post(
  '/signup',
  [
    body('username', 'Username is required').notEmpty().trim(),
    body('email', 'Please enter a valid email address').isEmail().normalizeEmail(),
    body('password', 'Password must be at least 6 characters long').isLength({ min: 6 })
  ],
  authController.signup
);

// Login Route validation & binding
router.post(
  '/login',
  [
    body('email', 'Please enter a valid email address').isEmail().normalizeEmail(),
    body('password', 'Password is required').notEmpty()
  ],
  authController.login
);

// Get current user profile
router.get('/me', authMiddleware, authController.me);
router.post('/disconnect-github', authMiddleware, authController.disconnectGithub);
router.put('/settings', authMiddleware, authController.updateSettings);

module.exports = router;
