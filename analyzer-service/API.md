# Analyzer API Service

Backend REST API service for honeypot analytics and log visualization.

## Quick Start

```bash
cd analyzer-service
npm install
npm start
```

Server runs on `http://localhost:4000`

## API Endpoints

### 1. GET /api/analytics/summary
Get overall attack summary statistics.

**Response:**
```json
{
  "success": true,
  "data": {
    "totalLogs": 19,
    "totalAttacks": 6,
    "uniqueAttackers": 1,
    "timeRange": {
      "start": "2026-02-02T15:57:40.236Z",
      "end": "2026-02-02T15:57:49.435Z"
    },
    "severityBreakdown": {
      "high": 2,
      "critical": 2,
      "medium": 2
    }
  }
}
```

### 2. GET /api/analytics/attacks
Get attacks grouped by type.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "type": "SQL_INJECTION",
      "count": 1,
      "severity": "high"
    }
  ]
}
```

### 3. GET /api/analytics/attackers
Get top attackers with threat scores.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "ip": "::ffff:127.0.0.1",
      "behavior": "MULTI_VECTOR_ATTACKER",
      "threatScore": 100,
      "attackCount": 6,
      "attackTypes": ["SQL_INJECTION", "BRUTE_FORCE"],
      "maxSeverity": "critical"
    }
  ]
}
```

### 4. GET /api/analytics/detections
Get all detected attacks with evidence.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "ruleId": "sql_injection",
      "ruleName": "SQL Injection Detection",
      "attackType": "SQL_INJECTION",
      "severity": "high",
      "ip": "::ffff:127.0.0.1",
      "matchedLogs": 5,
      "evidence": [...]
    }
  ]
}
```

### 5. GET /api/analytics/logs
Get honeypot logs with filtering and pagination.

**Query Parameters:**
- `limit` (default: 100) - Number of logs per page
- `offset` (default: 0) - Pagination offset
- `ip` (optional) - Filter by IP address
- `attackType` (optional) - Filter by attack type

**Example:**
```bash
curl "http://localhost:4000/api/analytics/logs?limit=10&ip=::ffff:127.0.0.1"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "logs": [...],
    "total": 19,
    "limit": 10,
    "offset": 0
  }
}
```

### 6. GET /api/analytics/timeline
Get attack timeline grouped by hour.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "time": "2026-02-02T15:00:00.000Z",
      "count": 19
    }
  ]
}
```

### 7. GET /api/analytics/report
Get complete analysis report.

**Response:**
```json
{
  "success": true,
  "data": {
    "generatedAt": "2026-02-02T16:03:34.417Z",
    "summary": {...},
    "attacksByType": [...],
    "severityBreakdown": {...},
    "topAttackers": [...],
    "behaviorClassification": [...],
    "detailedDetections": [...]
  }
}
```

## Testing Endpoints

```bash
# Summary
curl http://localhost:4000/api/analytics/summary

# Attacks by type
curl http://localhost:4000/api/analytics/attacks

# Top attackers
curl http://localhost:4000/api/analytics/attackers

# All detections
curl http://localhost:4000/api/analytics/detections

# Logs with filters
curl "http://localhost:4000/api/analytics/logs?limit=5"

# Timeline
curl http://localhost:4000/api/analytics/timeline

# Full report
curl http://localhost:4000/api/analytics/report
```

## CORS

CORS is enabled for all origins to allow frontend integration.

## Frontend Integration

```javascript
// Fetch summary
const response = await fetch('http://localhost:4000/api/analytics/summary');
const { data } = await response.json();

// Fetch logs with filters
const logs = await fetch('http://localhost:4000/api/analytics/logs?limit=20&attackType=SQL_INJECTION');
const { data: { logs: logData } } = await logs.json();
```

## CLI Analysis (Legacy)

To run one-time analysis and generate JSON report:
```bash
npm run analyze
```

## Architecture

- **server.js** - Express API server
- **routes/analytics.js** - API endpoint handlers
- **ruleEngine.js** - Detection rule evaluation
- **classifier.js** - Behavior classification
- **utils/logParser.js** - Log parsing utilities
