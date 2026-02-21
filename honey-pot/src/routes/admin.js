const express = require('express');
const router = express.Router();
const { logInteraction } = require('../logger/logger');
const { extractClientIP } = require('../utils/ipExtractor');

/**
 * Fake Admin Login - Always fails, logs all attempts
 */
router.post('/login', (req, res) => {
  const { username, password } = req.body;
  const ip = extractClientIP(req);
  const userAgent = req.get('user-agent');
  
  // Log the authentication attempt
  logInteraction({
    ip,
    endpoint: '/admin/login',
    method: 'POST',
    payload: {
      username,
      password: password ? '***' : undefined // Mask password in logs
    },
    rawPayload: { username, password }, // Keep raw for analysis
    userAgent,
    attackType: 'AUTH_ATTEMPT'
  });
  
  // Always deny access - this is a honeypot
  res.status(401).json({
    success: false,
    message: 'Invalid credentials'
  });
});

module.exports = router;
