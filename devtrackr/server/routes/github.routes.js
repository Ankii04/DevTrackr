const express = require('express');
const githubController = require('../controllers/github.controller');
const authMiddleware = require('../middleware/auth.middleware');

const router = express.Router();

// Redirect route returning OAuth connection url
router.get('/connect', authMiddleware, githubController.connect);

// Public connect route for direct login from login page
router.get('/login', githubController.loginRedirect);

// Public callback path mapping redirected user details back to server
router.get('/callback', githubController.callback);

// Fetch connected GitHub repositories
router.get('/repos', authMiddleware, githubController.repos);

// Trigger background async sync pipeline
router.post('/sync/:repoId', authMiddleware, githubController.sync);

module.exports = router;
