const express = require('express');
const cors = require('cors');
const config = require('./config');
const analyticsRoutes = require('./routes/analytics');
const requestLogger = require('./middleware/requestLogger');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(requestLogger);

// Routes
app.use('/api/analytics', analyticsRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'analyzer-api' });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    service: 'Honeypot Analyzer API',
    version: '1.0.0',
    endpoints: [
      'GET /api/analytics/summary',
      'GET /api/analytics/attacks',
      'GET /api/analytics/attackers',
      'GET /api/analytics/detections',
      'GET /api/analytics/logs',
      'GET /api/analytics/timeline',
      'GET /api/analytics/report'
    ]
  });
});

// Error handlers
app.use(notFoundHandler);
app.use(errorHandler);

// Start server
app.listen(config.server.port, () => {
  console.log(`[ANALYZER API] Server running on port ${config.server.port}`);
  console.log(`[ANALYZER API] Environment: ${config.server.env}`);
  console.log(`[ANALYZER API] Endpoints: http://localhost:${config.server.port}/api/analytics`);
});
