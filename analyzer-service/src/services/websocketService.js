/**
 * WebSocket Service for Real-time Event Broadcasting
 */

class WebSocketService {
  constructor() {
    this.io = null;
  }

  initialize(io) {
    this.io = io;
    console.log('[WEBSOCKET] Service initialized');
  }

  // Emit new log entry
  emitNewLog(logEntry) {
    if (this.io) {
      this.io.emit('new_log', {
        timestamp: new Date().toISOString(),
        data: logEntry
      });
    }
  }

  // Emit new detection
  emitNewDetection(detection) {
    if (this.io) {
      this.io.emit('new_detection', {
        timestamp: new Date().toISOString(),
        data: detection
      });
    }
  }

  // Emit critical alert
  emitCriticalAlert(alert) {
    if (this.io) {
      this.io.emit('critical_alert', {
        timestamp: new Date().toISOString(),
        data: alert
      });
    }
  }

  // Emit stats update
  emitStatsUpdate(stats) {
    if (this.io) {
      this.io.emit('stats_update', {
        timestamp: new Date().toISOString(),
        data: stats
      });
    }
  }

  // Get connected clients count
  getConnectedClients() {
    return this.io ? this.io.engine.clientsCount : 0;
  }
}

module.exports = new WebSocketService();