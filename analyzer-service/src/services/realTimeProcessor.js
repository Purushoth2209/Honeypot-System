const fs = require('fs');
const path = require('path');
const logService = require('./logService');
const ruleService = require('./ruleService');

class RealTimeProcessor {
  constructor() {
    this.logFile = path.join(__dirname, '../../../honey-pot/logs/honeypot.log.json');
    this.lastProcessedSize = 0;
    this.isWatching = false;
  }

  start() {
    if (this.isWatching) return;
    
    console.log('[REALTIME] Starting log monitoring...');
    this.isWatching = true;
    
    // Initialize file size
    if (fs.existsSync(this.logFile)) {
      this.lastProcessedSize = fs.statSync(this.logFile).size;
    }
    
    // Watch for file changes
    fs.watchFile(this.logFile, { interval: 1000 }, (curr, prev) => {
      if (curr.size > this.lastProcessedSize) {
        this.processNewLogs();
        this.lastProcessedSize = curr.size;
      }
    });
  }

  stop() {
    if (!this.isWatching) return;
    
    console.log('[REALTIME] Stopping log monitoring...');
    fs.unwatchFile(this.logFile);
    this.isWatching = false;
  }

  processNewLogs() {
    try {
      const logs = logService.parseLogFile(this.logFile);
      if (logs.length === 0) return;

      // Get the latest log entry
      const latestLog = logs[logs.length - 1];
      
      // Emit new log event
      if (global.websocketService) {
        global.websocketService.emitNewLog(latestLog);
      }

      // Check if this log triggers any rules
      const logsByIP = { [latestLog.ip]: [latestLog] };
      const detections = ruleService.applyRules(logsByIP);
      
      if (detections.length > 0) {
        const detection = detections[0];
        
        // Emit new detection
        if (global.websocketService) {
          global.websocketService.emitNewDetection(detection);
          
          // If critical severity, emit critical alert
          if (detection.severity === 'critical') {
            global.websocketService.emitCriticalAlert({
              ip: detection.ip,
              attackType: detection.attackType,
              ruleName: detection.ruleName,
              severity: detection.severity,
              timestamp: new Date().toISOString()
            });
          }
        }
      }

      // Emit stats update
      this.emitStatsUpdate(logs);
      
    } catch (error) {
      console.error('[REALTIME] Error processing new logs:', error.message);
    }
  }

  emitStatsUpdate(logs) {
    if (!global.websocketService) return;

    const stats = {
      totalLogs: logs.length,
      totalAttacks: logs.filter(log => log.attackType !== 'NONE').length,
      uniqueAttackers: new Set(logs.map(log => log.ip)).size,
      criticalAlerts: logs.filter(log => log.severity === 'critical').length,
      lastUpdate: new Date().toISOString()
    };

    global.websocketService.emitStatsUpdate(stats);
  }
}

module.exports = new RealTimeProcessor();