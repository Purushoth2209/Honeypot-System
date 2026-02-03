// Attack pattern detection rules
const attackPatterns = {
  sqlInjection: [
    /(\bOR\b|\bAND\b)\s+\d+\s*=\s*\d+/i,
    /UNION\s+SELECT/i,
    /DROP\s+TABLE/i,
    /INSERT\s+INTO/i,
    /DELETE\s+FROM/i,
    /--/,
    /;.*--/,
    /'\s*OR\s*'.*'=/i,
    /'\s*OR\s*1\s*=\s*1/i,
    /admin'--/i,
    /'\s*;\s*DROP/i
  ],
  xss: [
    /<script[^>]*>.*<\/script>/i,
    /javascript:/i,
    /onerror\s*=/i,
    /onload\s*=/i
  ],
  commandInjection: [
    /;\s*(ls|cat|wget|curl|rm|chmod)/i,
    /\|\s*(ls|cat|wget|curl)/i,
    /`.*`/,
    /\$\(.*\)/
  ]
};

/**
 * Detect attack type from payload
 * @param {string} payload - The input to analyze
 * @returns {string|null} - Attack type or null
 */
function detectAttackType(payload) {
  if (!payload) return null;
  
  const payloadStr = String(payload);
  
  if (attackPatterns.sqlInjection.some(pattern => pattern.test(payloadStr))) {
    return 'SQL_INJECTION';
  }
  
  if (attackPatterns.xss.some(pattern => pattern.test(payloadStr))) {
    return 'XSS';
  }
  
  if (attackPatterns.commandInjection.some(pattern => pattern.test(payloadStr))) {
    return 'COMMAND_INJECTION';
  }
  
  return null;
}

/**
 * Check if credentials match common brute-force patterns
 * @param {string} username
 * @param {string} password
 * @returns {boolean}
 */
function isBruteForcePattern(username, password) {
  const commonUsernames = ['admin', 'root', 'user', 'test', 'administrator'];
  const commonPasswords = ['password', '123456', 'admin', 'root', '12345678'];
  
  return commonUsernames.includes(username?.toLowerCase()) || 
         commonPasswords.includes(password?.toLowerCase());
}

module.exports = {
  detectAttackType,
  isBruteForcePattern
};
