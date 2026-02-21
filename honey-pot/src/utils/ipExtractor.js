/**
 * Extract client IP from request, prioritizing X-Forwarded-For header
 * @param {Object} req - Express request object
 * @returns {string} - Extracted IP address
 */
function extractClientIP(req) {
  // Check X-Forwarded-For header first (for proxy/load balancer scenarios)
  const forwardedFor = req.headers['x-forwarded-for'];
  
  if (forwardedFor) {
    // X-Forwarded-For can contain multiple IPs (client, proxy1, proxy2...)
    // Take the first one (original client IP)
    const ip = forwardedFor.split(',')[0].trim();
    return cleanIPv6Prefix(ip);
  }
  
  // Fallback to direct connection IP
  const directIP = req.ip || req.connection.remoteAddress || req.socket.remoteAddress;
  return cleanIPv6Prefix(directIP);
}

/**
 * Remove IPv6 prefix from IPv4-mapped addresses
 * @param {string} ip - IP address
 * @returns {string} - Cleaned IP address
 */
function cleanIPv6Prefix(ip) {
  if (!ip) return 'unknown';
  return ip.replace('::ffff:', '');
}

module.exports = { extractClientIP };
