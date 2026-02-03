const express = require('express');
const { initLogger } = require('./logger/logger');
const adminRoutes = require('./routes/admin');
const searchRoutes = require('./routes/search');
const sshRoutes = require('./routes/ssh');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Initialize logger
initLogger();

// Mount honeypot routes
app.use('/admin', adminRoutes);
app.use('/search', searchRoutes);
app.use('/ssh', sshRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Server is running',
    endpoints: [
      'POST /admin/login',
      'GET /search?q=',
      'POST /ssh/login'
    ]
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`[HONEYPOT] Server running on port ${PORT}`);
  console.log('[HONEYPOT] Monitoring for attacks...');
});
