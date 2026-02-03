const fs = require('fs');
const path = require('path');

const LOG_FILE = path.join(__dirname, '../../logs/honeypot.log.json');

/**
 * Log honeypot interaction to JSON file
 * @param {Object} logData - Structured log data
 */
function logInteraction(logData) {
  const logEntry = {
    timestamp: new Date().toISOString(),
    ...logData
  };
  
  // Append log entry as newline-delimited JSON
  const logLine = JSON.stringify(logEntry) + '\n';
  
  fs.appendFile(LOG_FILE, logLine, (err) => {
    if (err) {
      console.error('Failed to write log:', err);
    }
  });
  
  // Also log to console for monitoring
  console.log('[HONEYPOT]', JSON.stringify(logEntry));
}

/**
 * Initialize log file
 */
function initLogger() {
  const logsDir = path.dirname(LOG_FILE);
  
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
  }
  
  if (!fs.existsSync(LOG_FILE)) {
    fs.writeFileSync(LOG_FILE, '');
  }
  
  console.log(`[HONEYPOT] Logger initialized. Logs: ${LOG_FILE}`);
}

module.exports = {
  logInteraction,
  initLogger
};
