const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'Username is required'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    index: true
  },
  passwordHash: {
    type: String,
    required: [true, 'Password hash is required']
  },
  githubAccessToken: {
    type: String,
    default: null
  },
  githubUsername: {
    type: String,
    default: null
  },
  githubId: {
    type: String,
    default: null
  },
  geminiApiKey: {
    type: String,
    default: null
  },
  connectedAt: {
    type: Date,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Remove sensitive fields like passwordHash from JSON responses
UserSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.passwordHash;
  delete obj.githubAccessToken; // Keep GitHub token internal
  obj.hasCustomGeminiKey = !!obj.geminiApiKey;
  delete obj.geminiApiKey; // Keep API key internal to the database
  return obj;
};

module.exports = mongoose.model('User', UserSchema);
