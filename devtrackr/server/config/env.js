require('dotenv').config();

const requiredEnvVars = [
  'MONGO_URI',
  'JWT_SECRET',
  'GITHUB_CLIENT_ID',
  'GITHUB_CLIENT_SECRET',
  'GITHUB_REDIRECT_URI',
  'GEMINI_API_KEY'
];

// Check for missing environment variables
const missing = requiredEnvVars.filter(key => !process.env[key]);
if (missing.length > 0) {
  console.warn(`[WARNING] Missing environment variables: ${missing.join(', ')}`);
}

module.exports = {
  PORT: process.env.PORT || 5000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  MONGO_URI: process.env.MONGO_URI || 'mongodb://localhost:27017/devtrackr',
  JWT_SECRET: process.env.JWT_SECRET || 'devtrackr_fallback_secret_key_12345',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  GITHUB_CLIENT_ID: process.env.GITHUB_CLIENT_ID || '',
  GITHUB_CLIENT_SECRET: process.env.GITHUB_CLIENT_SECRET || '',
  GITHUB_REDIRECT_URI: process.env.GITHUB_REDIRECT_URI || 'http://localhost:5000/api/github/callback',
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || ''
};
