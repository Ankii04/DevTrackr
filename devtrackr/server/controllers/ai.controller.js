const Repository = require('../models/Repository');
const AIReport = require('../models/AIReport');
const aiService = require('../services/ai.service');

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
 * @desc    Generate sprint summary report via Gemini
 * @route   POST /api/ai/:repoId/sprint-summary
 * @access  Private (JWT protected + Rate Limited)
 */
exports.getSprintSummary = async (req, res, next) => {
  const { repoId } = req.params;

  try {
    await verifyRepoOwnership(repoId, req.user._id);
    const report = await aiService.generateSprintSummary(repoId, req.user._id);
    res.status(201).json(report);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Generate commit quality and coding patterns insights
 * @route   POST /api/ai/:repoId/commit-insights
 * @access  Private (JWT protected + Rate Limited)
 */
exports.getCommitInsights = async (req, res, next) => {
  const { repoId } = req.params;

  try {
    await verifyRepoOwnership(repoId, req.user._id);
    const report = await aiService.generateCommitInsights(repoId, req.user._id);
    res.status(201).json(report);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Detect stale PRs, orphaned issues and hotspots
 * @route   POST /api/ai/:repoId/bottlenecks
 * @access  Private (JWT protected + Rate Limited)
 */
exports.getBottlenecks = async (req, res, next) => {
  const { repoId } = req.params;

  try {
    await verifyRepoOwnership(repoId, req.user._id);
    const report = await aiService.generateBottlenecks(repoId, req.user._id);
    res.status(201).json(report);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Generate impact-effort prioritized task backlog
 * @route   POST /api/ai/:repoId/prioritize
 * @access  Private (JWT protected + Rate Limited)
 */
exports.getPrioritization = async (req, res, next) => {
  const { repoId } = req.params;

  try {
    await verifyRepoOwnership(repoId, req.user._id);
    const report = await aiService.generateTaskPrioritization(repoId, req.user._id);
    res.status(201).json(report);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get historical generated AI reports for a repository
 * @route   GET /api/ai/:repoId/reports
 * @access  Private (JWT protected)
 */
exports.getReportsHistory = async (req, res, next) => {
  const { repoId } = req.params;

  try {
    await verifyRepoOwnership(repoId, req.user._id);
    const reports = await AIReport.find({ repositoryId: repoId })
      .sort({ generatedAt: -1 })
      .limit(30);
    res.json(reports);
  } catch (error) {
    next(error);
  }
};
