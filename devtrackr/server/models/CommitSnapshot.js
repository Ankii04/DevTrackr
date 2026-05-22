const mongoose = require('mongoose');

const CommitSnapshotSchema = new mongoose.Schema({
  repositoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Repository',
    required: true,
    index: true
  },
  sha: {
    type: String,
    required: true,
    index: true
  },
  message: {
    type: String,
    required: true
  },
  author: {
    name: { type: String, default: '' },
    email: { type: String, default: '' },
    login: { type: String, default: '', index: true },
    avatarUrl: { type: String, default: '' }
  },
  date: {
    type: Date,
    required: true,
    index: true
  },
  additions: {
    type: Number,
    default: 0
  },
  deletions: {
    type: Number,
    default: 0
  },
  filesChanged: {
    type: Number,
    default: 0
  }
});

// Compound index to guarantee uniqueness of commits per repository
CommitSnapshotSchema.index({ repositoryId: 1, sha: 1 }, { unique: true });

module.exports = mongoose.model('CommitSnapshot', CommitSnapshotSchema);
