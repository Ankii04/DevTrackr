const express = require('express');
const analyticsController = require('../controllers/analytics.controller');
const authMiddleware = require('../middleware/auth.middleware');

const router = express.Router();

// Require authorization for all analytics
router.use(authMiddleware);

router.get('/:repoId/commits', analyticsController.getCommits);
router.get('/:repoId/contributors', analyticsController.getContributors);
router.get('/:repoId/prs', analyticsController.getPRs);
router.get('/:repoId/issues', analyticsController.getIssues);
router.get('/:repoId/velocity', analyticsController.getVelocity);
router.get('/:repoId/raw-commits', analyticsController.getRawCommits);
router.get('/:repoId/raw-prs', analyticsController.getRawPRs);

module.exports = router;
