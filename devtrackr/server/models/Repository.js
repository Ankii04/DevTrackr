const mongoose = require('mongoose');

const RepositorySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  githubRepoId: {
    type: Number,
    required: true,
    index: true
  },
  fullName: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  description: {
    type: String,
    default: ''
  },
  language: {
    type: String,
    default: 'Unknown'
  },
  isPrivate: {
    type: Boolean,
    default: false
  },
  syncStatus: {
    type: String,
    enum: ['idle', 'syncing', 'completed', 'failed'],
    default: 'idle'
  },
  syncError: {
    type: String,
    default: null
  },
  lastSyncedAt: {
    type: Date,
    default: null
  },
  stats: {
    totalCommits: { type: Number, default: 0 },
    openPRs: { type: Number, default: 0 },
    closedPRs: { type: Number, default: 0 },
    openIssues: { type: Number, default: 0 },
    closedIssues: { type: Number, default: 0 },
    contributorsCount: { type: Number, default: 0 }
  }
}, {
  timestamps: true
});

// Ensure a user can't link the same github repo multiple times
RepositorySchema.index({ userId: 1, githubRepoId: 1 }, { unique: true });

module.exports = mongoose.model('Repository', RepositorySchema);
