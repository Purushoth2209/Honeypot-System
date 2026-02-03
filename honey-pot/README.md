# Rule-Based Deception Honeypot System - Phase 1

A production-style honeypot system designed for attack detection and behavioral analysis. This system exposes fake vulnerable services to attract and log attacker interactions safely.

## What This Honeypot Does

This honeypot implements three deception services that mimic common vulnerable endpoints:

1. **Fake Admin Login API** - Simulates an admin authentication endpoint that always fails but logs all credential attempts
2. **Fake SQL-Vulnerable Search** - Detects SQL injection patterns in search queries
3. **Fake SSH Access** - Logs SSH brute-force attempts and credential stuffing attacks

All interactions are logged in structured JSON format for later analysis. **No real systems are exposed or compromised.**

## Features

- ✅ Safe deception layer (no real authentication or database execution)
- ✅ Pattern-based attack detection (SQL injection, XSS, command injection)
- ✅ Structured JSON logging with timestamps
- ✅ IP tracking and user-agent fingerprinting
- ✅ Brute-force pattern detection

## Project Structure

```
honeypot-system/
├── src/
│   ├── server.js              # Main Express server
│   ├── routes/
│   │   ├── admin.js           # Fake admin login endpoint
│   │   ├── search.js          # SQL injection detection endpoint
│   │   └── ssh.js             # Fake SSH login endpoint
│   ├── logger/
│   │   └── logger.js          # JSON logging utility
│   └── utils/
│       └── attackPatterns.js  # Attack pattern detection rules
├── logs/
│   └── honeypot.log.json      # All attacker interactions
├── package.json
└── README.md
```

## Installation

```bash
# Install dependencies
npm install

# Start the honeypot
npm start

# Or use nodemon for development
npm run dev
```

The server will start on `http://localhost:3000`

## Honeypot Endpoints

### 1. Fake Admin Login
```bash
POST /admin/login
Content-Type: application/json

{
  "username": "admin",
  "password": "password123"
}
```
**Response:** Always returns 401 Unauthorized

### 2. Fake SQL-Vulnerable Search
```bash
GET /search?q=' OR 1=1--
```
**Response:** Returns empty results but logs SQL injection attempt

### 3. Fake SSH Login
```bash
POST /ssh/login
Content-Type: application/json

{
  "username": "root",
  "password": "toor"
}
```
**Response:** Always returns 403 Access Denied

## How Attackers Are Logged

Every interaction is logged to `logs/honeypot.log.json` in newline-delimited JSON format.

### Log Entry Structure

```json
{
  "timestamp": "2024-01-15T10:30:45.123Z",
  "ip": "192.168.1.100",
  "endpoint": "/admin/login",
  "method": "POST",
  "payload": {
    "username": "admin",
    "password": "***"
  },
  "rawPayload": {
    "username": "admin",
    "password": "password123"
  },
  "userAgent": "Mozilla/5.0...",
  "attackType": "AUTH_ATTEMPT",
  "suspicious": false
}
```

### Attack Types Detected

- `AUTH_ATTEMPT` - Admin login attempt
- `SQL_INJECTION` - SQL injection pattern detected
- `XSS` - Cross-site scripting attempt
- `COMMAND_INJECTION` - Command injection pattern
- `SSH_AUTH_ATTEMPT` - SSH login attempt
- `SSH_BRUTE_FORCE` - SSH brute-force with common credentials
- `SEARCH_QUERY` - Normal search query

## Testing the Honeypot

### Test SQL Injection Detection
```bash
curl "http://localhost:3000/search?q=' OR 1=1--"
curl "http://localhost:3000/search?q=admin'--"
curl "http://localhost:3000/search?q='; DROP TABLE users--"
```

### Test Admin Login
```bash
curl -X POST http://localhost:3000/admin/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

### Test SSH Brute-Force
```bash
curl -X POST http://localhost:3000/ssh/login \
  -H "Content-Type: application/json" \
  -d '{"username":"root","password":"password"}'
```

### View Logs
```bash
cat logs/honeypot.log.json | jq
```

## Security Guarantees

- ❌ No real authentication is performed
- ❌ No SQL queries are executed
- ❌ No real SSH connections are made
- ❌ No credentials are validated against real systems
- ✅ All services are fake deception layers
- ✅ Safe for academic and research purposes

## Next Steps (Future Phases)

- Phase 2: Dashboard for log visualization
- Phase 3: Machine learning for behavioral analysis
- Phase 4: Real-time alerting system

## License

MIT - For educational and research purposes only.
