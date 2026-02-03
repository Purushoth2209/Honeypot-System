const path = require('path');

module.exports = {
  server: {
    port: process.env.PORT || 4000,
    env: process.env.NODE_ENV || 'development'
  },
  paths: {
    logFile: path.join(__dirname, '../../../honey-pot/logs/honeypot.log.json'),
    rulesFile: path.join(__dirname, '../../rules/rules.json'),
    reportsDir: path.join(__dirname, '../../reports')
  },
  pagination: {
    defaultLimit: 100,
    maxLimit: 1000
  }
};
