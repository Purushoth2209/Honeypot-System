class ClassificationService {
  /**
   * Classify attacker behavior based on detections
   */
  classifyBehavior(detections) {
    if (!detections || detections.length === 0) {
      return 'UNKNOWN';
    }
    
    const attackTypes = detections.map(d => d.attackType);
    const uniqueTypes = new Set(attackTypes);
    
    if (uniqueTypes.size >= 3) {
      return 'MULTI_VECTOR_ATTACKER';
    }
    
    if (attackTypes.includes('SQL_INJECTION')) {
      return 'SQL_INJECTION_ATTACKER';
    }
    
    if (attackTypes.includes('BRUTE_FORCE')) {
      return 'BRUTE_FORCE_ATTACKER';
    }
    
    if (attackTypes.includes('SCANNING')) {
      return 'SCANNER';
    }
    
    if (attackTypes.includes('BOT')) {
      return 'AUTOMATED_BOT';
    }
    
    if (attackTypes.includes('XSS')) {
      return 'XSS_ATTACKER';
    }
    
    return 'SUSPICIOUS';
  }

  /**
   * Calculate threat score based on detections
   */
  calculateThreatScore(detections) {
    if (!detections || detections.length === 0) return 0;
    
    const severityScores = {
      low: 10,
      medium: 25,
      high: 50,
      critical: 100
    };
    
    const totalScore = detections.reduce((sum, d) => {
      return sum + (severityScores[d.severity] || 0);
    }, 0);
    
    return Math.min(100, totalScore);
  }

  /**
   * Get maximum severity from detections
   */
  getMaxSeverity(detections) {
    const severityOrder = ['low', 'medium', 'high', 'critical'];
    const severities = detections.map(d => d.severity);
    
    for (let i = severityOrder.length - 1; i >= 0; i--) {
      if (severities.includes(severityOrder[i])) {
        return severityOrder[i];
      }
    }
    
    return 'low';
  }

  /**
   * Classify all attackers from detections
   */
  classifyAttackers(detections) {
    const byIP = detections.reduce((acc, detection) => {
      const ip = detection.ip;
      if (!acc[ip]) acc[ip] = [];
      acc[ip].push(detection);
      return acc;
    }, {});
    
    const classifications = {};
    
    for (const [ip, ipDetections] of Object.entries(byIP)) {
      classifications[ip] = {
        behavior: this.classifyBehavior(ipDetections),
        threatScore: this.calculateThreatScore(ipDetections),
        attackCount: ipDetections.length,
        attackTypes: [...new Set(ipDetections.map(d => d.attackType))],
        maxSeverity: this.getMaxSeverity(ipDetections)
      };
    }
    
    return classifications;
  }
}

module.exports = new ClassificationService();
