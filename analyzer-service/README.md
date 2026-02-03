# Analyzer Service - Production-Grade Architecture

Backend REST API service for honeypot analytics and log visualization with clean architecture.

## Architecture Overview

```
analyzer-service/
├── src/
│   ├── config/              # Configuration management
│   │   └── index.js         # Centralized config
│   ├── controllers/         # Request handlers
│   │   └── analyticsController.js
│   ├── services/            # Business logic
│   │   ├── analyticsService.js
│   │   ├── logService.js
│   │   ├── ruleService.js
│   │   └── classificationService.js
│   ├── routes/              # API routes
│   │   └── analytics.js
│   ├── middleware/          # Express middleware
│   │   ├── errorHandler.js
│   │   └── requestLogger.js
│   ├── utils/               # Utility functions
│   ├── server.js            # Express app setup
│   └── analyzer.js          # CLI analyzer (legacy)
├── rules/
│   └── rules.json           # Detection rules
├── reports/
│   └── attack-report.json   # Generated reports
└── package.json
```

## Design Patterns

### 1. **Layered Architecture**
- **Controllers**: Handle HTTP requests/responses
- **Services**: Contain business logic
- **Config**: Centralized configuration
- **Middleware**: Cross-cutting concerns

### 2. **Separation of Concerns**
- Each service has a single responsibility
- Controllers are thin, services are fat
- Configuration is externalized

### 3. **Dependency Injection**
- Services are singletons
- Easy to test and mock

## Quick Start

```bash
cd analyzer-service
npm install
npm start
```

Server runs on `http://localhost:4000`

## API Endpoints

### Analytics Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/analytics/summary` | Overall statistics |
| GET | `/api/analytics/attacks` | Attacks by type |
| GET | `/api/analytics/attackers` | Top attackers |
| GET | `/api/analytics/detections` | All detections |
| GET | `/api/analytics/logs` | Filtered logs |
| GET | `/api/analytics/timeline` | Attack timeline |
| GET | `/api/analytics/report` | Complete report |

### Health Check

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Service health status |

## Service Layer

### AnalyticsService
Orchestrates the complete analysis pipeline.

```javascript
const analyticsService = require('./services/analyticsService');

// Get summary
const summary = analyticsService.getSummary();

// Get attacks by type
const attacks = analyticsService.getAttacksByType();

// Get top attackers
const attackers = analyticsService.getTopAttackers(10);
```

### LogService
Handles log parsing and filtering.

```javascript
const logService = require('./services/logService');

// Parse logs
const logs = logService.parseLogFile(logPath);

// Group by IP
const grouped = logService.groupByIP(logs);

// Filter logs
const filtered = logService.filterLogs(logs, { ip: '127.0.0.1' });
```

### RuleService
Evaluates detection rules.

```javascript
const ruleService = require('./services/ruleService');

// Apply rules
const detections = ruleService.applyRules(logsByIP);
```

### ClassificationService
Classifies attacker behavior.

```javascript
const classificationService = require('./services/classificationService');

// Classify attackers
const classifications = classificationService.classifyAttackers(detections);
```

## Configuration

Edit `src/config/index.js`:

```javascript
module.exports = {
  server: {
    port: 4000,
    env: 'development'
  },
  paths: {
    logFile: '../honey-pot/logs/honeypot.log.json',
    rulesFile: '../rules/rules.json'
  },
  pagination: {
    defaultLimit: 100,
    maxLimit: 1000
  }
};
```

## Middleware

### Request Logger
Logs all incoming requests with duration.

### Error Handler
Global error handling with proper status codes.

## Example Usage

### Get Summary
```bash
curl http://localhost:4000/api/analytics/summary
```

### Get Logs with Filters
```bash
curl "http://localhost:4000/api/analytics/logs?limit=10&attackType=SQL_INJECTION"
```

### Get Top Attackers
```bash
curl "http://localhost:4000/api/analytics/attackers?limit=5"
```

## Frontend Integration

```javascript
// React/Vue/Angular example
const API_BASE = 'http://localhost:4000/api/analytics';

async function fetchSummary() {
  const response = await fetch(`${API_BASE}/summary`);
  const { data } = await response.json();
  return data;
}

async function fetchLogs(filters) {
  const params = new URLSearchParams(filters);
  const response = await fetch(`${API_BASE}/logs?${params}`);
  const { data } = await response.json();
  return data;
}
```

## Development

```bash
# Start with auto-reload
npm run dev

# Run CLI analyzer
npm run analyze
```

## Environment Variables

```bash
PORT=4000
NODE_ENV=development
```

## Error Handling

All endpoints return consistent error format:

```json
{
  "success": false,
  "error": "Error message"
}
```

## Testing

```bash
# Test all endpoints
curl http://localhost:4000/health
curl http://localhost:4000/api/analytics/summary
curl http://localhost:4000/api/analytics/attacks
curl http://localhost:4000/api/analytics/attackers
curl http://localhost:4000/api/analytics/detections
curl http://localhost:4000/api/analytics/logs
curl http://localhost:4000/api/analytics/timeline
curl http://localhost:4000/api/analytics/report
```

## Production Deployment

1. Set environment variables
2. Use process manager (PM2)
3. Enable HTTPS
4. Add rate limiting
5. Add authentication

```bash
# PM2 example
pm2 start src/server.js --name analyzer-api
pm2 logs analyzer-api
```

## License

MIT - For educational and research purposes only.
