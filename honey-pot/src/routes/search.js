const express = require('express');
const router = express.Router();
const { logInteraction } = require('../logger/logger');
const { detectAttackType } = require('../utils/attackPatterns');

/**
 * Fake SQL-vulnerable search endpoint
 * Detects SQL injection patterns and logs them
 */
router.get('/', (req, res) => {
  const query = req.query.q;
  const ip = req.ip || req.connection.remoteAddress;
  const userAgent = req.get('user-agent');
  
  // Detect attack type
  const attackType = detectAttackType(query);
  
  // Log the interaction
  logInteraction({
    ip,
    endpoint: '/search',
    method: 'GET',
    payload: { query },
    userAgent,
    attackType: attackType || 'SEARCH_QUERY',
    suspicious: !!attackType
  });
  
  // Return fake results (never execute real SQL)
  res.json({
    success: true,
    results: [],
    message: attackType ? 'No results found' : `Searching for: ${query}`
  });
});

module.exports = router;
