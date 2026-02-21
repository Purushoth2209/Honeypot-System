const fs = require('fs');
const geoIpService = require('./geoIpService');

class LogService {
  /**
   * Parse honeypot log file (newline-delimited JSON)
   */
  parseLogFile(logFilePath) {
    if (!fs.existsSync(logFilePath)) {
      throw new Error(`Log file not found: ${logFilePath}`);
    }

    const content = fs.readFileSync(logFilePath, 'utf-8');
    const lines = content.trim().split('\n').filter(line => line.trim());
    
    const logs = lines.map((line, index) => {
      try {
        return JSON.parse(line);
      } catch (err) {
        console.warn(`Failed to parse line ${index + 1}: ${err.message}`);
        return null;
      }
    }).filter(entry => entry !== null);

    // Enrich logs with geographic data
    return this.enrichWithGeoData(logs);
  }

  /**
   * Enrich logs with geographic data
   */
  enrichWithGeoData(logs) {
    return logs.map(log => {
      if (log.ip) {
        const geoData = geoIpService.getLocation(log.ip);
        return { ...log, geo: geoData };
      }
      return log;
    });
  }

  /**
   * Group logs by IP address
   */
  groupByIP(logs) {
    return logs.reduce((acc, log) => {
      const ip = log.ip || 'unknown';
      if (!acc[ip]) acc[ip] = [];
      acc[ip].push(log);
      return acc;
    }, {});
  }

  /**
   * Group logs by endpoint
   */
  groupByEndpoint(logs) {
    return logs.reduce((acc, log) => {
      const endpoint = log.endpoint || 'unknown';
      if (!acc[endpoint]) acc[endpoint] = [];
      acc[endpoint].push(log);
      return acc;
    }, {});
  }

  /**
   * Filter logs within time window
   */
  filterByTimeWindow(logs, minutes) {
    if (!logs.length) return logs;
    
    const sorted = logs.sort((a, b) => 
      new Date(a.timestamp) - new Date(b.timestamp)
    );
    
    const windows = [];
    let currentWindow = [sorted[0]];
    
    for (let i = 1; i < sorted.length; i++) {
      const timeDiff = (new Date(sorted[i].timestamp) - new Date(currentWindow[0].timestamp)) / 1000 / 60;
      
      if (timeDiff <= minutes) {
        currentWindow.push(sorted[i]);
      } else {
        windows.push([...currentWindow]);
        currentWindow = [sorted[i]];
      }
    }
    
    if (currentWindow.length) windows.push(currentWindow);
    
    return windows.length > 0 ? windows.reduce((max, w) => w.length > max.length ? w : max) : [];
  }

  /**
   * Filter logs by criteria
   */
  filterLogs(logs, filters = {}) {
    let filtered = [...logs];

    if (filters.ip) {
      filtered = filtered.filter(log => log.ip === filters.ip);
    }

    if (filters.attackType) {
      filtered = filtered.filter(log => log.attackType === filters.attackType);
    }

    if (filters.endpoint) {
      filtered = filtered.filter(log => log.endpoint === filters.endpoint);
    }

    return filtered;
  }

  /**
   * Paginate logs
   */
  paginateLogs(logs, limit, offset) {
    return logs.slice(offset, offset + limit);
  }
}

module.exports = new LogService();
