const express = require('express');
const router = express.Router();
const { logInteraction } = require('../logger/logger');
const { isBruteForcePattern } = require('../utils/attackPatterns');
const { extractClientIP } = require('../utils/ipExtractor');

/**
 * Fake SSH Access - Always denies, logs brute-force behavior
 */
router.post('/login', (req, res) => {
  const { username, password } = req.body;
  const ip = extractClientIP(req);
  const userAgent = req.get('user-agent');
  
  // Detect brute-force patterns
  const isBruteForce = isBruteForcePattern(username, password);
  
  // Log the SSH attempt
  logInteraction({
    ip,
    endpoint: '/ssh/login',
    method: 'POST',
    payload: {
      username,
      password: password ? '***' : undefined
    },
    rawPayload: { username, password },
    userAgent,
    attackType: isBruteForce ? 'SSH_BRUTE_FORCE' : 'SSH_AUTH_ATTEMPT',
    suspicious: isBruteForce
  });
  
  // Always deny access
  res.status(403).json({
    success: false,
    message: 'Access denied'
  });
});

module.exports = router;
