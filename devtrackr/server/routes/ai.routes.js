const express = require('express');
const aiController = require('../controllers/ai.controller');
const authMiddleware = require('../middleware/auth.middleware');
const { aiLimiter } = require('../middleware/rateLimit.middleware');

const router = express.Router();

// Require authorization for all AI operations
router.use(authMiddleware);

router.post('/:repoId/sprint-summary', aiLimiter, aiController.getSprintSummary);
router.post('/:repoId/commit-insights', aiLimiter, aiController.getCommitInsights);
router.post('/:repoId/bottlenecks', aiLimiter, aiController.getBottlenecks);
router.post('/:repoId/prioritize', aiLimiter, aiController.getPrioritization);
router.get('/:repoId/reports', aiController.getReportsHistory);

module.exports = router;
