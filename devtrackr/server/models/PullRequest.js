const mongoose = require('mongoose');

const PullRequestSchema = new mongoose.Schema({
  repositoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Repository',
    required: true,
    index: true
  },
  githubPrId: {
    type: Number,
    required: true
  },
  number: {
    type: Number,
    required: true
  },
  title: {
    type: String,
    required: true
  },
  state: {
    type: String,
    enum: ['open', 'closed', 'merged'],
    required: true
  },
  author: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    required: true
  },
  closedAt: {
    type: Date,
    default: null
  },
  mergedAt: {
    type: Date,
    default: null
  },
  cycleTimeHours: {
    type: Number,
    default: null // Will be calculated in background sync when closed/merged
  }
});

PullRequestSchema.index({ repositoryId: 1, githubPrId: 1 }, { unique: true });

module.exports = mongoose.model('PullRequest', PullRequestSchema);
