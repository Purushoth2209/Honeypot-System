
export type Severity = 'low' | 'medium' | 'high' | 'critical';

export interface SummaryData {
  totalLogs: number;
  totalAttacks: number;
  uniqueAttackers: number;
  timeRange: {
    start: string;
    end: string;
  };
  severityBreakdown: Record<Severity, number>;
}

export interface AttackType {
  type: string;
  count: number;
  severity: Severity;
}

export interface Attacker {
  ip: string;
  behavior: string;
  threatScore: number;
  attackCount: number;
  attackTypes: string[];
  maxSeverity: Severity;
}

export interface Evidence {
  timestamp: string;
  endpoint: string;
  attackType: string;
}

export interface Detection {
  ruleId: string;
  ruleName: string;
  attackType: string;
  severity: Severity;
  ip: string;
  matchedLogs: number;
  evidence: Evidence[];
}

export interface LogEntry {
  timestamp: string;
  ip: string;
  endpoint: string;
  method: string;
  payload: any;
  userAgent: string;
  attackType: string;
  suspicious: boolean;
}

export interface LogsResponse {
  logs: LogEntry[];
  total: number;
  limit: number;
  offset: number;
}

export interface TimelineData {
  time: string;
  count: number;
}

export interface FullReport {
  generatedAt: string;
  summary: SummaryData;
  attacksByType: AttackType[];
  topAttackers: Attacker[];
  detailedDetections: Detection[];
}

export enum ViewMode {
  DASHBOARD = 'DASHBOARD',
  LOGS = 'LOGS',
  ATTACKERS = 'ATTACKERS',
  DETECTIONS = 'DETECTIONS',
  AI_ANALYST = 'AI_ANALYST'
}
