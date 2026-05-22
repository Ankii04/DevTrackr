const Repository = require('../models/Repository');
const CommitSnapshot = require('../models/CommitSnapshot');
const PullRequest = require('../models/PullRequest');
const analyticsService = require('../services/analytics.service');

// Helper to verify repository ownership
async function verifyRepoOwnership(repoId, userId) {
  const repo = await Repository.findOne({ _id: repoId, userId });
  if (!repo) {
    const error = new Error('Repository not found or access denied');
    error.statusCode = 404;
    throw error;
  }
  return repo;
}

/**
 * @desc    Get commit frequency over last 30 days
 * @route   GET /api/analytics/:repoId/commits
 * @access  Private (JWT protected)
 */
exports.getCommits = async (req, res, next) => {
  const { repoId } = req.params;
  const days = req.query.days ? parseInt(req.query.days) : null;

  try {
    await verifyRepoOwnership(repoId, req.user._id);
    const data = await analyticsService.getCommitFrequency(repoId, days);
    res.json(data);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get contributor statistics (contributions leaderboards + inactive contributors list)
 * @route   GET /api/analytics/:repoId/contributors
 * @access  Private (JWT protected)
 */
exports.getContributors = async (req, res, next) => {
  const { repoId } = req.params;
  const thresholdDays = req.query.threshold ? parseInt(req.query.threshold) : 14;

  try {
    await verifyRepoOwnership(repoId, req.user._id);
    const active = await analyticsService.getContributorStats(repoId);
    const inactive = await analyticsService.getInactiveContributors(repoId, thresholdDays);
    
    res.json({
      active,
      inactive
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get Pull Requests stats and average cycle times
 * @route   GET /api/analytics/:repoId/prs
 * @access  Private (JWT protected)
 */
exports.getPRs = async (req, res, next) => {
  const { repoId } = req.params;

  try {
    await verifyRepoOwnership(repoId, req.user._id);
    const data = await analyticsService.getPRStats(repoId);
    res.json(data);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get Issues stats
 * @route   GET /api/analytics/:repoId/issues
 * @access  Private (JWT protected)
 */
exports.getIssues = async (req, res, next) => {
  const { repoId } = req.params;

  try {
    const repo = await verifyRepoOwnership(repoId, req.user._id);
    // Return structured issues stats cached in Repository stats
    res.json({
      open: repo.stats.openIssues || 0,
      closed: repo.stats.closedIssues || 0,
      total: (repo.stats.openIssues || 0) + (repo.stats.closedIssues || 0),
      resolutionRate: (repo.stats.openIssues + repo.stats.closedIssues) > 0
        ? parseFloat((repo.stats.closedIssues / (repo.stats.openIssues + repo.stats.closedIssues) * 100).toFixed(2))
        : 0
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get weekly sprint velocity (commits speed over last 4 weeks)
 * @route   GET /api/analytics/:repoId/velocity
 * @access  Private (JWT protected)
 */
exports.getVelocity = async (req, res, next) => {
  const { repoId } = req.params;

  try {
    await verifyRepoOwnership(repoId, req.user._id);
    const data = await analyticsService.getSprintVelocity(repoId);
    res.json(data);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get raw list of commits (last 100)
 * @route   GET /api/analytics/:repoId/raw-commits
 * @access  Private (JWT protected)
 */
exports.getRawCommits = async (req, res, next) => {
  const { repoId } = req.params;
  try {
    await verifyRepoOwnership(repoId, req.user._id);
    const commits = await CommitSnapshot.find({ repositoryId: repoId })
      .sort({ date: -1 })
      .limit(100);
    res.json(commits);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get raw list of pull requests
 * @route   GET /api/analytics/:repoId/raw-prs
 * @access  Private (JWT protected)
 */
exports.getRawPRs = async (req, res, next) => {
  const { repoId } = req.params;
  try {
    await verifyRepoOwnership(repoId, req.user._id);
    const prs = await PullRequest.find({ repositoryId: repoId })
      .sort({ createdAt: -1 });
    res.json(prs);
  } catch (error) {
    next(error);
  }
};
