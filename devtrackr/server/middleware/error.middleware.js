const env = require('../config/env');

module.exports = (err, req, res, next) => {
  console.error(`[SERVER EXCEPTION] Caught global error: ${err.message}`);
  if (err.stack) {
    console.error(err.stack);
  }

  // Handle Mongoose cast/validation errors
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map(val => val.message);
    return res.status(400).json({ error: 'Validation Error', details: messages });
  }

  if (err.name === 'CastError') {
    return res.status(400).json({ error: `Resource not found with id of ${err.value}` });
  }

  // Handle duplicate key errors from Mongo
  if (err.code === 11000) {
    return res.status(400).json({ error: 'Duplicate field value entered' });
  }

  // Standard 500 error response
  res.status(err.statusCode || 500).json({
    error: err.message || 'Internal Server Error',
    ...(env.NODE_ENV === 'development' && { stack: err.stack })
  });
};
