import React, { useState, useEffect, useCallback } from 'react';
import { 
  ViewMode, SummaryData, AttackType, Attacker, 
  Detection, LogsResponse, TimelineData 
} from './types';
import { apiService } from './services/apiService';
import { websocketService } from './services/websocketService';
import { PDFReportService } from './services/pdfReportService';
import Sidebar from './components/Sidebar';
import StatCard from './components/StatCard';
import LiveAttackFeed from './components/LiveAttackFeed';
import CriticalAlertBanner from './components/CriticalAlertBanner';
import { Icons, SEVERITY_COLORS, SEVERITY_HEX } from './constants';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, LineChart, Line,
  Cell, PieChart, Pie
} from 'recharts';
import { geminiService } from './services/geminiService';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewMode>(ViewMode.DASHBOARD);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [attacks, setAttacks] = useState<AttackType[]>([]);
  const [attackers, setAttackers] = useState<Attacker[]>([]);
  const [detections, setDetections] = useState<Detection[]>([]);
  const [logsData, setLogsData] = useState<LogsResponse | null>(null);
  const [timeline, setTimeline] = useState<TimelineData[]>([]);
  const [aiAnalysis, setAiAnalysis] = useState<string>('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  
  // Real-time state
  const [liveAttacks, setLiveAttacks] = useState<any[]>([]);
  const [criticalAlert, setCriticalAlert] = useState<any>(null);
  const [isConnected, setIsConnected] = useState(false);
  
  // Alert sound state
  const [alertSoundEnabled, setAlertSoundEnabled] = useState(() => {
    return localStorage.getItem('alertSoundEnabled') !== 'false';
  });
  const [lastAlertTime, setLastAlertTime] = useState(0);
  const alertAudioRef = React.useRef<HTMLAudioElement | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [sum, atk, atr, det, log, line] = await Promise.all([
        apiService.getSummary(),
        apiService.getAttacks(),
        apiService.getAttackers(),
        apiService.getDetections(),
        apiService.getLogs(),
        apiService.getTimeline()
      ]);
      setSummary(sum);
      setAttacks(atk);
      setAttackers(atr);
      setDetections(det);
      setLogsData(log);
      setTimeline(line);
    } catch (error) {
      console.error("Data Fetch Error:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Preload alert sound
    alertAudioRef.current = new Audio('/sounds/soc-alert.wav');
    alertAudioRef.current.volume = 0.4;
    alertAudioRef.current.load();
    
    fetchData();
    initializeWebSocket();
    
    return () => {
      websocketService.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const playAlertSound = () => {
    if (!alertSoundEnabled) return;
    
    const now = Date.now();
    if (now - lastAlertTime < 3000) return; // 3 second cooldown
    
    setLastAlertTime(now);
    
    if (alertAudioRef.current) {
      alertAudioRef.current.currentTime = 0;
      alertAudioRef.current.play().catch(e => {
        console.log('Alert sound play failed (user interaction may be required):', e);
      });
    }
  };

  const toggleAlertSound = () => {
    const newValue = !alertSoundEnabled;
    setAlertSoundEnabled(newValue);
    localStorage.setItem('alertSoundEnabled', String(newValue));
  };

  const initializeWebSocket = async () => {
    try {
      await websocketService.connect();
      setIsConnected(true);
      
      // Set up event listeners
      websocketService.on('new_log', (data) => {
        const logEntry = data.data;
        if (logEntry.attackType !== 'NONE') {
          const newAttack = {
            id: `${logEntry.ip}-${Date.now()}`,
            timestamp: logEntry.timestamp,
            ip: logEntry.ip,
            attackType: logEntry.attackType,
            endpoint: logEntry.endpoint,
            severity: logEntry.severity || 'medium'
          };
          
          setLiveAttacks(prev => [newAttack, ...prev.slice(0, 19)]);
        }
      });
      
      websocketService.on('new_detection', (data) => {
        const detection = data.data;
        setDetections(prev => [detection, ...prev]);
      });
      
      websocketService.on('critical_alert', (data) => {
        const alert = {
          id: `alert-${Date.now()}`,
          ...data.data
        };
        setCriticalAlert(alert);
        playAlertSound();
      });
      
      websocketService.on('stats_update', (data) => {
        const stats = data.data;
        setSummary(prev => prev ? {
          ...prev,
          totalLogs: stats.totalLogs,
          totalAttacks: stats.totalAttacks,
          uniqueAttackers: stats.uniqueAttackers,
          severityBreakdown: {
            ...prev.severityBreakdown,
            critical: stats.criticalAlerts
          }
        } : null);
      });
      
    } catch (error) {
      console.error('Failed to connect to WebSocket:', error);
      setIsConnected(false);
    }
  };

  const runAiLandscapeAnalysis = async () => {
    if (!summary || attackers.length === 0) return;
    setIsAiLoading(true);
    const analysis = await geminiService.analyzeThreatLandscape(summary, attackers, detections);
    setAiAnalysis(analysis);
    setIsAiLoading(false);
  };

  const explainLog = async (log: any) => {
    alert("Analyzing log with Gemini AI... (Check console if results don't show)");
    const explanation = await geminiService.analyzeLog(log);
    alert(`AI Insight:\n\n${explanation}`);
  };

  const downloadPDFReport = () => {
    if (!summary || attacks.length === 0) {
      alert('No data available to generate report');
      return;
    }

    const pdfService = new PDFReportService();
    pdfService.generateReport(summary, attacks, attackers, detections, aiAnalysis || undefined);
    pdfService.download(`honeypot-report-${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const renderDashboard = () => {
    if (!summary) return null;

    const pieData = Object.entries(summary.severityBreakdown).map(([name, value]) => ({
      name: name.toUpperCase(),
      value
    }));

    return (
      <div className="space-y-6">
        {/* Header Section */}
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Security Overview</h1>
            <div className="flex items-center gap-3">
              <p className="text-slate-400">Real-time threat detection and analytics for your infrastructure.</p>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
                <span className={`text-xs font-medium ${isConnected ? 'text-green-400' : 'text-red-400'}`}>
                  {isConnected ? 'Live' : 'Offline'}
                </span>
              </div>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={toggleAlertSound}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors border ${
                alertSoundEnabled
                  ? 'bg-green-900/30 border-green-700 text-green-400 hover:bg-green-900/50'
                  : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'
              }`}
              title={alertSoundEnabled ? 'Alert sound enabled' : 'Alert sound disabled'}
            >
              {alertSoundEnabled ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
                  <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
                  <path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
                  <line x1="22" y1="9" x2="16" y2="15"/>
                  <line x1="16" y1="9" x2="22" y2="15"/>
                </svg>
              )}
              <span className="text-xs font-medium">{alertSoundEnabled ? 'ON' : 'OFF'}</span>
            </button>
            <button 
              onClick={downloadPDFReport}
              className="flex items-center gap-2 px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white rounded-lg transition-colors font-medium shadow-lg shadow-rose-500/20"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
              Download PDF Report
            </button>
            <button 
              onClick={fetchData}
              className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition-colors border border-slate-700"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/><path d="M16 21h5v-5"/></svg>
              Refresh Data
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Total Logs Analysis" value={summary.totalLogs} icon={<Icons.Logs />} trend="+12.5%" />
          <StatCard label="Threats Detected" value={summary.totalAttacks} icon={<Icons.Shield />} trend="+4%" trendColor="text-rose-400" />
          <StatCard label="Unique Attackers" value={summary.uniqueAttackers} icon={<Icons.Users />} />
          <StatCard label="Critical Issues" value={summary.severityBreakdown.critical} icon={<Icons.Dashboard />} trend="Active" trendColor="text-rose-500 animate-pulse" />
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Live Attack Feed */}
          <div className="lg:col-span-1">
            <LiveAttackFeed attacks={liveAttacks} />
          </div>
          
          {/* Timeline Chart */}
          <div className="lg:col-span-1 bg-slate-900 border border-slate-800 p-6 rounded-2xl">
            <h3 className="text-lg font-semibold text-white mb-6">Attack Timeline</h3>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={timeline}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis 
                    dataKey="time" 
                    stroke="#64748b" 
                    fontSize={12} 
                    tickFormatter={(val) => new Date(val).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  />
                  <YAxis stroke="#64748b" fontSize={12} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px' }}
                    labelStyle={{ color: '#94a3b8' }}
                  />
                  <Line type="monotone" dataKey="count" stroke="#f43f5e" strokeWidth={2} dot={{ fill: '#f43f5e', r: 4 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Severity Breakdown */}
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
            <h3 className="text-lg font-semibold text-white mb-6">Severity Distribution</h3>
            <div className="h-[300px] relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={8}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={SEVERITY_HEX[entry.name.toLowerCase()] || '#94a3b8'} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-3xl font-bold text-white mono">{summary.totalAttacks}</span>
                <span className="text-xs text-slate-400 font-medium uppercase">Attacks</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-4">
              {Object.entries(summary.severityBreakdown).map(([key, val]) => (
                 <div key={key} className="flex items-center gap-2 p-2 rounded-lg bg-slate-800/50">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: SEVERITY_HEX[key] }}></div>
                    <span className="text-xs font-medium text-slate-300 capitalize">{key}</span>
                    <span className="ml-auto text-xs font-bold text-white">{val}</span>
                 </div>
              ))}
            </div>
          </div>
        </div>

        {/* Attack Types Table */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
          <div className="p-6 border-b border-slate-800 flex justify-between items-center">
            <h3 className="text-lg font-semibold text-white">Top Attack Vectors</h3>
          </div>
          <table className="w-full text-left">
            <thead className="bg-slate-800/50 text-slate-400 text-xs font-semibold uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4">Vector Type</th>
                <th className="px-6 py-4">Incidents</th>
                <th className="px-6 py-4">Max Severity</th>
                <th className="px-6 py-4">Risk Level</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {attacks.map((atk, idx) => (
                <tr key={idx} className="hover:bg-slate-800/30 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-medium text-slate-200 mono">{atk.type.replace('_', ' ')}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-slate-300 font-semibold">{atk.count}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase border ${SEVERITY_COLORS[atk.severity]}`}>
                      {atk.severity}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="w-full bg-slate-800 rounded-full h-1.5 max-w-[120px]">
                      <div 
                        className="h-full rounded-full" 
                        style={{ 
                          width: `${(atk.count / summary.totalAttacks) * 100}%`,
                          backgroundColor: SEVERITY_HEX[atk.severity]
                        }}
                      ></div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderLogs = () => {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Access Logs</h1>
            <p className="text-slate-400">Deep inspection of raw traffic and suspicious events.</p>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-800/50 text-slate-400 text-xs font-semibold uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4">Timestamp</th>
                  <th className="px-6 py-4">Source IP</th>
                  <th className="px-6 py-4">Method/Endpoint</th>
                  <th className="px-6 py-4">Classification</th>
                  <th className="px-6 py-4 text-right">AI Analysis</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {logsData?.logs.map((log, idx) => (
                  <tr key={idx} className={`hover:bg-slate-800/30 transition-colors ${log.suspicious ? 'bg-rose-500/[0.02]' : ''}`}>
                    <td className="px-6 py-4">
                      <div className="text-xs text-slate-400 mono">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-slate-200 mono">{log.ip}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">{log.method}</span>
                          <span className="text-sm text-slate-200 mono">{log.endpoint}</span>
                        </div>
                        {Object.keys(log.payload).length > 0 && (
                          <div className="mt-1 text-[10px] text-slate-500 truncate max-w-[200px] italic">
                            payload: {JSON.stringify(log.payload)}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {log.attackType !== 'NONE' ? (
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${SEVERITY_COLORS.high}`}>
                          {log.attackType.replace('_', ' ')}
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-600 font-bold uppercase">Safe</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => explainLog(log)}
                        className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-400/10 rounded-lg transition-all"
                        title="Analyze with AI"
                      >
                        <Icons.Brain />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  const renderAttackers = () => {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-white">Top Threats</h1>
        <div className="grid grid-cols-1 gap-6">
          {attackers.map((atr, idx) => (
            <div key={idx} className="bg-slate-900 border border-slate-800 p-8 rounded-2xl flex flex-col md:flex-row gap-8">
              <div className="flex-1">
                <div className="flex items-center gap-4 mb-6">
                  <div className="p-4 bg-rose-500/10 rounded-2xl border border-rose-500/20 text-rose-500">
                    <Icons.Users />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white mono">{atr.ip}</h2>
                    <span className="text-rose-500 text-xs font-bold uppercase tracking-widest">{atr.behavior}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-slate-800/30 p-4 rounded-xl border border-slate-700/30">
                    <div className="text-xs text-slate-400 mb-1 uppercase tracking-tighter">Threat Score</div>
                    <div className="text-xl font-bold text-white mono">{atr.threatScore}</div>
                  </div>
                  <div className="bg-slate-800/30 p-4 rounded-xl border border-slate-700/30">
                    <div className="text-xs text-slate-400 mb-1 uppercase tracking-tighter">Attack Count</div>
                    <div className="text-xl font-bold text-white mono">{atr.attackCount}</div>
                  </div>
                  <div className="bg-slate-800/30 p-4 rounded-xl border border-slate-700/30">
                    <div className="text-xs text-slate-400 mb-1 uppercase tracking-tighter">Max Severity</div>
                    <div className="text-sm font-bold text-rose-500 uppercase">{atr.maxSeverity}</div>
                  </div>
                  <div className="bg-slate-800/30 p-4 rounded-xl border border-slate-700/30">
                    <div className="text-xs text-slate-400 mb-1 uppercase tracking-tighter">Status</div>
                    <div className="text-sm font-bold text-amber-500 uppercase">Blacklisted</div>
                  </div>
                </div>
              </div>

              <div className="md:w-64 bg-slate-800/20 rounded-2xl p-6 border border-slate-800">
                <h4 className="text-xs font-bold text-slate-500 uppercase mb-4 tracking-widest">Techniques Used</h4>
                <div className="flex flex-wrap gap-2">
                  {atr.attackTypes.map((type, tIdx) => (
                    <span key={tIdx} className="px-3 py-1 bg-slate-800 text-slate-300 rounded-lg text-[10px] font-medium border border-slate-700">
                      {type}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderDetections = () => {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-white">Active Detections</h1>
        <div className="grid grid-cols-1 gap-4">
          {detections.map((det, idx) => (
            <div key={idx} className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
               <div className="p-6 flex justify-between items-start bg-slate-800/20">
                  <div className="flex gap-4">
                    <div className={`p-3 rounded-xl border ${SEVERITY_COLORS[det.severity]}`}>
                      <Icons.Shield />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white">{det.ruleName}</h3>
                      <p className="text-sm text-slate-400">Source IP: <span className="mono text-slate-300">{det.ip}</span></p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className={`px-2 py-1 rounded-md text-xs font-bold uppercase border ${SEVERITY_COLORS[det.severity]}`}>
                      {det.severity}
                    </span>
                    <span className="text-xs text-slate-500">Rule ID: {det.ruleId}</span>
                  </div>
               </div>
               <div className="p-6">
                  <h4 className="text-xs font-bold text-slate-500 uppercase mb-4 tracking-widest">Event Evidence</h4>
                  <div className="space-y-3">
                    {det.evidence.map((ev, eIdx) => (
                      <div key={eIdx} className="flex items-center gap-4 p-3 bg-slate-800/40 rounded-xl border border-slate-800">
                        <span className="text-xs text-slate-500 mono">{new Date(ev.timestamp).toLocaleTimeString()}</span>
                        <span className="text-xs font-bold text-rose-400 px-2 py-0.5 rounded-lg bg-rose-500/5">{ev.attackType}</span>
                        <span className="text-sm text-slate-300 mono">{ev.endpoint}</span>
                      </div>
                    ))}
                  </div>
               </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderAiAnalyst = () => {
    return (
      <div className="space-y-6 max-w-4xl mx-auto">
        <div className="text-center space-y-4 mb-12">
          <div className="inline-block p-4 bg-rose-500/10 rounded-full border border-rose-500/20 text-rose-500 mb-2">
            <Icons.Brain />
          </div>
          <h1 className="text-4xl font-bold text-white">Guardian AI Analyst</h1>
          <p className="text-slate-400 max-w-lg mx-auto">
            Leverage Google Gemini 3 Flash to perform deep reasoning over current threat data and security metrics.
          </p>
          <button 
            onClick={runAiLandscapeAnalysis}
            disabled={isAiLoading}
            className="px-8 py-3 bg-rose-500 hover:bg-rose-600 disabled:opacity-50 text-white rounded-xl font-bold shadow-lg shadow-rose-500/20 transition-all flex items-center gap-3 mx-auto"
          >
            {isAiLoading ? 'Analyzing Landscape...' : 'Generate Threat Report'}
            <Icons.Brain />
          </button>
        </div>

        {aiAnalysis ? (
          <>
            <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl animate-in fade-in slide-in-from-bottom-4 duration-700">
              <div className="flex items-center gap-3 mb-6 text-rose-400">
                 <Icons.Brain />
                 <span className="font-bold uppercase tracking-widest text-xs">AI Generated Insights</span>
              </div>
              <div className="prose prose-invert max-w-none whitespace-pre-wrap text-slate-300 leading-relaxed font-light">
                {aiAnalysis}
              </div>
            </div>
            
            <div className="flex justify-center mt-6">
              <button 
                onClick={downloadPDFReport}
                className="flex items-center gap-2 px-6 py-3 bg-rose-500 hover:bg-rose-600 text-white rounded-xl font-bold shadow-lg shadow-rose-500/20 transition-all"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
                Download Complete Report with AI Analysis
              </button>
            </div>
          </>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl border-dashed">
                <h4 className="text-slate-200 font-bold mb-2">Automated Investigation</h4>
                <p className="text-sm text-slate-500">Gemini can analyze patterns across multiple attackers to find shared infrastructure or tooling.</p>
             </div>
             <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl border-dashed">
                <h4 className="text-slate-200 font-bold mb-2">Payload Decoding</h4>
                <p className="text-sm text-slate-500">Explain complex encoded SQL injection or XSS strings in plain language.</p>
             </div>
          </div>
        )}
      </div>
    );
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
          <div className="w-12 h-12 border-4 border-rose-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-400 animate-pulse font-medium">Securing perimeter and loading intelligence...</p>
        </div>
      );
    }

    switch (currentView) {
      case ViewMode.DASHBOARD: return renderDashboard();
      case ViewMode.LOGS: return renderLogs();
      case ViewMode.ATTACKERS: return renderAttackers();
      case ViewMode.DETECTIONS: return renderDetections();
      case ViewMode.AI_ANALYST: return renderAiAnalyst();
      default: return renderDashboard();
    }
  };

  return (
    <>
      <div className="flex min-h-screen">
        <Sidebar currentView={currentView} onViewChange={setCurrentView} />
        <main className="flex-1 p-8 overflow-y-auto max-h-screen bg-slate-950">
          <div className="max-w-7xl mx-auto pb-20">
            {renderContent()}
          </div>
        </main>
      </div>
      
      <CriticalAlertBanner 
        alert={criticalAlert} 
        onDismiss={() => setCriticalAlert(null)} 
      />
    </>
  );
};

export default App;
