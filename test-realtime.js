#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const LOG_FILE = path.join(__dirname, '../honey-pot/logs/honeypot.log.json');

// Sample attack logs to simulate real-time events
const sampleAttacks = [
  {
    timestamp: new Date().toISOString(),
    ip: '192.168.1.100',
    method: 'POST',
    endpoint: '/admin/login',
    payload: { username: 'admin', password: 'admin123' },
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    attackType: 'BRUTE_FORCE',
    severity: 'high',
    suspicious: true
  },
  {
    timestamp: new Date(Date.now() + 2000).toISOString(),
    ip: '10.0.0.50',
    method: 'GET',
    endpoint: '/api/users?id=1\' OR 1=1--',
    payload: {},
    userAgent: 'curl/7.68.0',
    attackType: 'SQL_INJECTION',
    severity: 'critical',
    suspicious: true
  },
  {
    timestamp: new Date(Date.now() + 4000).toISOString(),
    ip: '172.16.0.25',
    method: 'POST',
    endpoint: '/search',
    payload: { q: '<script>alert(\"XSS\")</script>' },
    userAgent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36',
    attackType: 'XSS',
    severity: 'medium',
    suspicious: true
  }
];

async function simulateRealTimeAttacks() {
  console.log('🚨 Starting real-time attack simulation...');
  console.log(`📁 Log file: ${LOG_FILE}`);
  
  // Ensure log file exists
  if (!fs.existsSync(LOG_FILE)) {
    fs.writeFileSync(LOG_FILE, JSON.stringify([], null, 2));
  }
  
  // Read existing logs
  let logs = [];
  try {
    const content = fs.readFileSync(LOG_FILE, 'utf8');
    logs = JSON.parse(content);
  } catch (error) {
    console.log('Creating new log file...');
    logs = [];
  }
  
  // Add sample attacks with delays
  for (let i = 0; i < sampleAttacks.length; i++) {
    const attack = sampleAttacks[i];
    logs.push(attack);
    
    // Write to file to trigger real-time processing
    fs.writeFileSync(LOG_FILE, JSON.stringify(logs, null, 2));
    
    console.log(`✅ Added attack ${i + 1}: ${attack.attackType} from ${attack.ip}`);
    
    // Wait before next attack
    if (i < sampleAttacks.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
  }
  
  console.log('🎯 Attack simulation complete!');
  console.log('💡 Check your dashboard for real-time updates');
}

// Run simulation
simulateRealTimeAttacks().catch(console.error);