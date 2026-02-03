const fs = require('fs');
const config = require('../config');
const logService = require('./logService');

class RuleService {
  constructor() {
    this.rules = this.loadRules();
  }

  /**
   * Load detection rules from JSON file
   */
  loadRules() {
    const rulesData = fs.readFileSync(config.paths.rulesFile, 'utf-8');
    return JSON.parse(rulesData).rules;
  }

  /**
   * Evaluate a single rule against IP logs
   */
  evaluateRule(rule, ipLogs, ip) {
    const conditions = rule.conditions;
    
    let relevantLogs = ipLogs;
    
    if (conditions.attackTypes) {
      relevantLogs = ipLogs.filter(log => 
        conditions.attackTypes.includes(log.attackType)
      );
    }
    
    if (conditions.endpoint) {
      relevantLogs = relevantLogs.filter(log => log.endpoint === conditions.endpoint);
    }
    
    if (conditions.timeWindowMinutes) {
      relevantLogs = logService.filterByTimeWindow(relevantLogs, conditions.timeWindowMinutes);
    }
    
    if (conditions.minOccurrences && relevantLogs.length < conditions.minOccurrences) {
      return null;
    }
    
    if (conditions.uniqueEndpoints) {
      const logsInWindow = conditions.timeWindowMinutes 
        ? logService.filterByTimeWindow(ipLogs, conditions.timeWindowMinutes)
        : ipLogs;
      
      const uniqueEndpoints = new Set(logsInWindow.map(log => log.endpoint));
      if (uniqueEndpoints.size < conditions.uniqueEndpoints) {
        return null;
      }
    }
    
    if (conditions.minRequests) {
      const logsInWindow = conditions.timeWindowMinutes
        ? logService.filterByTimeWindow(ipLogs, conditions.timeWindowMinutes)
        : ipLogs;
      
      if (logsInWindow.length < conditions.minRequests) {
        return null;
      }
    }
    
    if (conditions.userAgentPatterns) {
      const hasMatchingUA = ipLogs.some(log => {
        const ua = (log.userAgent || '').toLowerCase();
        return conditions.userAgentPatterns.some(pattern => 
          ua.includes(pattern.toLowerCase())
        );
      });
      
      if (!hasMatchingUA) return null;
    }
    
    return {
      ruleId: rule.id,
      ruleName: rule.name,
      attackType: rule.type,
      severity: rule.severity,
      ip,
      matchedLogs: relevantLogs.length,
      evidence: relevantLogs.slice(0, 3).map(log => ({
        timestamp: log.timestamp,
        endpoint: log.endpoint,
        attackType: log.attackType
      }))
    };
  }

  /**
   * Apply all rules to grouped logs
   */
  applyRules(logsByIP) {
    const detections = [];
    
    for (const [ip, logs] of Object.entries(logsByIP)) {
      for (const rule of this.rules) {
        const detection = this.evaluateRule(rule, logs, ip);
        if (detection) {
          detections.push(detection);
        }
      }
    }
    
    return detections;
  }
}

module.exports = new RuleService();
