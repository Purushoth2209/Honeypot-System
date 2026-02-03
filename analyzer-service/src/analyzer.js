#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { parseLogFile, groupByIP } = require('./utils/logParser');
const { applyRules } = require('./ruleEngine');
const { classifyAttackers } = require('./classifier');

// Configuration
const LOG_FILE = path.join(__dirname, '../../honey-pot/logs/honeypot.log.json');
const REPORT_FILE = path.join(__dirname, '../reports/attack-report.json');

/**
 * Generate attack report from detections and classifications
 */
function generateReport(logs, detections, classifications) {
  const attacksByType = detections.reduce((acc, d) => {
    if (!acc[d.attackType]) acc[d.attackType] = [];
    acc[d.attackType].push(d);
    return acc;
  }, {});
  
  const severityBreakdown = detections.reduce((acc, d) => {
    acc[d.severity] = (acc[d.severity] || 0) + 1;
    return acc;
  }, {});
  
  const topAttackers = Object.entries(classifications)
    .sort((a, b) => b[1].threatScore - a[1].threatScore)
    .slice(0, 10)
    .map(([ip, data]) => ({ ip, ...data }));
  
  const report = {
    generatedAt: new Date().toISOString(),
    summary: {
      totalLogs: logs.length,
      totalAttacks: detections.length,
      uniqueAttackers: Object.keys(classifications).length,
      timeRange: {
        start: logs[0]?.timestamp,
        end: logs[logs.length - 1]?.timestamp
      }
    },
    attacksByType: Object.entries(attacksByType).map(([type, attacks]) => ({
      type,
      count: attacks.length,
      severity: attacks[0]?.severity
    })),
    severityBreakdown,
    topAttackers,
    behaviorClassification: Object.entries(
      Object.values(classifications).reduce((acc, c) => {
        acc[c.behavior] = (acc[c.behavior] || 0) + 1;
        return acc;
      }, {})
    ).map(([behavior, count]) => ({ behavior, count })),
    detailedDetections: detections
  };
  
  return report;
}

/**
 * Save report to JSON file
 */
function saveReport(report) {
  const reportsDir = path.dirname(REPORT_FILE);
  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
  }
  
  fs.writeFileSync(REPORT_FILE, JSON.stringify(report, null, 2));
  console.log(`✓ Report saved: ${REPORT_FILE}`);
}

/**
 * Main analyzer function
 */
function analyze() {
  console.log('='.repeat(60));
  console.log('🔍 HONEYPOT LOG ANALYZER');
  console.log('='.repeat(60));
  console.log();
  
  try {
    // Parse logs
    console.log(`[1/5] Parsing logs from: ${LOG_FILE}`);
    const logs = parseLogFile(LOG_FILE);
    console.log(`  ✓ Parsed ${logs.length} log entries`);
    
    if (logs.length === 0) {
      console.log('\n⚠ No logs to analyze. Run the honeypot and attack simulator first.');
      return;
    }
    
    // Group by IP
    console.log('\n[2/5] Grouping logs by IP address');
    const logsByIP = groupByIP(logs);
    console.log(`  ✓ Found ${Object.keys(logsByIP).length} unique IP addresses`);
    
    // Apply detection rules
    console.log('\n[3/5] Applying detection rules');
    const detections = applyRules(logsByIP);
    console.log(`  ✓ Detected ${detections.length} attacks`);
    
    // Classify attackers
    console.log('\n[4/5] Classifying attacker behavior');
    const classifications = classifyAttackers(detections);
    console.log(`  ✓ Classified ${Object.keys(classifications).length} attackers`);
    
    // Generate report
    console.log('\n[5/5] Generating attack report');
    const report = generateReport(logs, detections, classifications);
    saveReport(report);
    
    // Display summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 ANALYSIS SUMMARY');
    console.log('='.repeat(60));
    console.log(`Total Logs:        ${report.summary.totalLogs}`);
    console.log(`Total Attacks:     ${report.summary.totalAttacks}`);
    console.log(`Unique Attackers:  ${report.summary.uniqueAttackers}`);
    console.log('\nAttacks by Type:');
    report.attacksByType.forEach(a => {
      console.log(`  - ${a.type}: ${a.count} (${a.severity})`);
    });
    console.log('\nTop Attacker:');
    if (report.topAttackers[0]) {
      const top = report.topAttackers[0];
      console.log(`  IP: ${top.ip}`);
      console.log(`  Behavior: ${top.behavior}`);
      console.log(`  Threat Score: ${top.threatScore}/100`);
    }
    console.log('\n' + '='.repeat(60));
    
  } catch (error) {
    console.error('\n✗ Analysis failed:', error.message);
    process.exit(1);
  }
}

// Run analyzer
if (require.main === module) {
  analyze();
}

module.exports = { analyze };
