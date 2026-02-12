const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const config = require('./config');
const analyticsRoutes = require('./routes/analytics');
const requestLogger = require('./middleware/requestLogger');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');
const websocketService = require('./services/websocketService');
const realTimeProcessor = require('./services/realTimeProcessor');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});

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

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log(`[WEBSOCKET] Client connected: ${socket.id}`);
  
  socket.on('disconnect', () => {
    console.log(`[WEBSOCKET] Client disconnected: ${socket.id}`);
  });
});

// Initialize WebSocket service
websocketService.initialize(io);

// Make websocket service available globally
global.websocketService = websocketService;

// Start real-time log processing
realTimeProcessor.start();

// Start server
server.listen(config.server.port, () => {
  console.log(`[ANALYZER API] Server running on port ${config.server.port}`);
  console.log(`[ANALYZER API] Environment: ${config.server.env}`);
  console.log(`[ANALYZER API] Endpoints: http://localhost:${config.server.port}/api/analytics`);
  console.log(`[WEBSOCKET] Socket.IO server ready`);
  console.log(`[REALTIME] Log monitoring active`);
});
