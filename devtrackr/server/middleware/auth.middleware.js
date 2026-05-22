const jwt = require('jsonwebtoken');
const env = require('../config/env');
const User = require('../models/User');

module.exports = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    if (!authHeader) {
      return res.status(401).json({ error: 'Access denied. No authorization header provided.' });
    }

    const token = authHeader.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'Access denied. Malformed token format.' });
    }

    const decoded = jwt.verify(token, env.JWT_SECRET);
    
    // Find the user and attach to the request
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(401).json({ error: 'Authentication failed. User no longer exists.' });
    }

    req.user = user;
    req.token = token;
    next();
  } catch (error) {
    console.error(`[AUTH MIDDLEWARE ERROR] Token verification failed: ${error.message}`);
    return res.status(401).json({ error: 'Access denied. Invalid or expired token.' });
  }
};
