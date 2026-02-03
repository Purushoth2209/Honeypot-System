const config = require('../config');
const logService = require('./logService');
const ruleService = require('./ruleService');
const classificationService = require('./classificationService');

class AnalyticsService {
  /**
   * Perform complete analysis on logs
   */
  analyze() {
    const logs = logService.parseLogFile(config.paths.logFile);
    const logsByIP = logService.groupByIP(logs);
    const detections = ruleService.applyRules(logsByIP);
    const classifications = classificationService.classifyAttackers(detections);
    
    return {
      logs,
      logsByIP,
      detections,
      classifications
    };
  }

  /**
   * Get summary statistics
   */
  getSummary() {
    const { logs, detections, classifications } = this.analyze();
    
    const severityBreakdown = detections.reduce((acc, d) => {
      acc[d.severity] = (acc[d.severity] || 0) + 1;
      return acc;
    }, {});
    
    return {
      totalLogs: logs.length,
      totalAttacks: detections.length,
      uniqueAttackers: Object.keys(classifications).length,
      timeRange: {
        start: logs[0]?.timestamp,
        end: logs[logs.length - 1]?.timestamp
      },
      severityBreakdown
    };
  }

  /**
   * Get attacks grouped by type
   */
  getAttacksByType() {
    const { detections } = this.analyze();
    
    const attacksByType = detections.reduce((acc, d) => {
      if (!acc[d.attackType]) acc[d.attackType] = [];
      acc[d.attackType].push(d);
      return acc;
    }, {});
    
    return Object.entries(attacksByType).map(([type, attacks]) => ({
      type,
      count: attacks.length,
      severity: attacks[0]?.severity
    }));
  }

  /**
   * Get top attackers
   */
  getTopAttackers(limit = 10) {
    const { classifications } = this.analyze();
    
    return Object.entries(classifications)
      .sort((a, b) => b[1].threatScore - a[1].threatScore)
      .slice(0, limit)
      .map(([ip, data]) => ({ ip, ...data }));
  }

  /**
   * Get all detections
   */
  getDetections() {
    const { detections } = this.analyze();
    return detections;
  }

  /**
   * Get logs with filters and pagination
   */
  getLogs(filters = {}, pagination = {}) {
    const { logs } = this.analyze();
    
    const filtered = logService.filterLogs(logs, filters);
    
    const limit = Math.min(
      parseInt(pagination.limit) || config.pagination.defaultLimit,
      config.pagination.maxLimit
    );
    const offset = parseInt(pagination.offset) || 0;
    
    const paginated = logService.paginateLogs(filtered, limit, offset);
    
    return {
      logs: paginated,
      total: filtered.length,
      limit,
      offset
    };
  }

  /**
   * Get attack timeline
   */
  getTimeline() {
    const { logs } = this.analyze();
    
    const timeline = logs.reduce((acc, log) => {
      const hour = new Date(log.timestamp).toISOString().slice(0, 13) + ':00:00.000Z';
      if (!acc[hour]) acc[hour] = 0;
      acc[hour]++;
      return acc;
    }, {});
    
    return Object.entries(timeline)
      .map(([time, count]) => ({ time, count }))
      .sort((a, b) => new Date(a.time) - new Date(b.time));
  }

  /**
   * Get complete report
   */
  getReport() {
    const { detections, classifications } = this.analyze();
    const summary = this.getSummary();
    const attacksByType = this.getAttacksByType();
    const topAttackers = this.getTopAttackers();
    
    const behaviorClassification = Object.entries(
      Object.values(classifications).reduce((acc, c) => {
        acc[c.behavior] = (acc[c.behavior] || 0) + 1;
        return acc;
      }, {})
    ).map(([behavior, count]) => ({ behavior, count }));
    
    return {
      generatedAt: new Date().toISOString(),
      summary,
      attacksByType,
      severityBreakdown: summary.severityBreakdown,
      topAttackers,
      behaviorClassification,
      detailedDetections: detections
    };
  }
}

module.exports = new AnalyticsService();
