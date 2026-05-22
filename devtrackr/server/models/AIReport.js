const mongoose = require('mongoose');

const AIReportSchema = new mongoose.Schema({
  repositoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Repository',
    required: true,
    index: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  reportType: {
    type: String,
    enum: ['sprint', 'contributor', 'bottleneck', 'prioritization'],
    required: true
  },
  generatedAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  content: {
    summary: { type: String, required: true },
    sprintHealth: {
      type: String,
      enum: ['on-track', 'at-risk', 'blocked', 'unknown'],
      default: 'unknown'
    },
    achievements: { type: [String], default: [] },
    blockers: { type: [String], default: [] },
    recommendations: { type: [String], default: [] },
    details: { type: mongoose.Schema.Types.Mixed, default: {} }
  },
  rawPrompt: {
    type: String,
    default: ''
  },
  tokensUsed: {
    type: Number,
    default: 0
  },
  isMock: {
    type: Boolean,
    default: false
  },
  mockReason: {
    type: String,
    default: ''
  }
});

module.exports = mongoose.model('AIReport', AIReportSchema);
