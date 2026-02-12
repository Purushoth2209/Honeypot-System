# Real-Time Monitoring Implementation

## Overview
This implementation adds WebSocket-based real-time monitoring to the existing Rule-Based Deception Honeypot System.

## Features Added

### Backend (Analyzer Service - Port 4000)
- ✅ Socket.IO server integration
- ✅ Real-time log file monitoring
- ✅ WebSocket event emissions:
  - `new_log` - When new log entries are processed
  - `new_detection` - When rule-based detection is triggered
  - `critical_alert` - When critical severity threats are detected
  - `stats_update` - When summary statistics change
- ✅ CORS configuration for frontend connection
- ✅ Existing REST APIs preserved

### Frontend (React Dashboard)
- ✅ Socket.IO client integration
- ✅ Real-time WebSocket connection management
- ✅ Live Attack Feed component
- ✅ Critical Alert Banner component
- ✅ Real-time counter updates
- ✅ Connection status indicator
- ✅ Proper cleanup on component unmount

## Testing the Implementation

### 1. Start the Backend Services

```bash
# Terminal 1: Start Honeypot (Port 3000)
cd honey-pot
npm start

# Terminal 2: Start Analyzer Service (Port 4000)
cd analyzer-service
npm start
```

### 2. Start the Frontend Dashboard

```bash
# Terminal 3: Start React Dashboard (Port 5173)
cd Dashboard
npm run dev
```

### 3. Test Real-Time Updates

```bash
# Terminal 4: Run real-time attack simulation
cd Honey_pot_system
node test-realtime.js
```

## Expected Behavior

1. **Dashboard loads initial data** via REST APIs
2. **WebSocket connection establishes** (green "Live" indicator)
3. **Running test-realtime.js triggers**:
   - Live Attack Feed updates instantly
   - Stats counters animate with new values
   - Critical alerts show red banner notifications
   - No page refresh required

## Architecture

```
┌─────────────────┐    WebSocket     ┌──────────────────┐
│  React Dashboard│◄────────────────►│ Analyzer Service │
│   (Port 5173)   │    Socket.IO     │   (Port 4000)    │
└─────────────────┘                  └──────────────────┘
         │                                     │
         │ REST APIs (Initial Load)            │ File Monitoring
         │                                     │
         └─────────────────────────────────────┼──────────────┐
                                               │              │
                                    ┌──────────▼────┐  ┌─────▼─────┐
                                    │ Log Processor │  │ Rule Engine│
                                    └───────────────┘  └───────────┘
```

## Key Components

### Backend
- `server.js` - Socket.IO server setup
- `services/websocketService.js` - Event emission logic
- `services/realTimeProcessor.js` - Log monitoring and processing

### Frontend
- `services/websocketService.ts` - WebSocket client management
- `components/LiveAttackFeed.tsx` - Real-time attack display
- `components/CriticalAlertBanner.tsx` - Critical threat notifications
- `App.tsx` - Main component with real-time state management

## Troubleshooting

1. **WebSocket connection fails**: Check if analyzer service is running on port 4000
2. **No real-time updates**: Verify log file exists and has write permissions
3. **Critical alerts not showing**: Ensure attack severity is set to 'critical'
4. **Dashboard shows "Offline"**: Check CORS configuration and network connectivity