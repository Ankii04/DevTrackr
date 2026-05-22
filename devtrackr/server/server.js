const express = require('express');
const cors = require('cors');
const env = require('./config/env');
const connectDB = require('./config/db');
const { apiLimiter } = require('./middleware/rateLimit.middleware');
const errorHandler = require('./middleware/error.middleware');

// Initialize database connection
connectDB();

const app = express();

// Configure CORS
app.use(cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Parsing middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Enforce general request limiters
app.use(apiLimiter);

// Register routes
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/github', require('./routes/github.routes'));
app.use('/api/analytics', require('./routes/analytics.routes'));
app.use('/api/ai', require('./routes/ai.routes'));

// Basic health check route
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date(),
    uptime: process.uptime()
  });
});

// Fallback Route Handler
app.use((req, res, next) => {
  res.status(404).json({ error: `Not Found: ${req.originalUrl}` });
});

// Global Error Handler Middleware
app.use(errorHandler);

// Start Server
app.listen(env.PORT, () => {
  console.log(`=================================================`);
  console.log(`[SERVER] DevTrackr API running in ${env.NODE_ENV} mode`);
  console.log(`[SERVER] Listening at: http://localhost:${env.PORT}`);
  console.log(`=================================================`);
});
