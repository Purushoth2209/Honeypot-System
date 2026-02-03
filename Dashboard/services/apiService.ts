import { 
  SummaryData, AttackType, Attacker, Detection, 
  LogsResponse, TimelineData, FullReport 
} from '../types';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api/analytics';

async function fetchAPI<T>(endpoint: string): Promise<T> {
  const response = await fetch(`${API_BASE}${endpoint}`);
  const json = await response.json();
  if (!json.success) throw new Error(json.error || 'API request failed');
  return json.data;
}

export const apiService = {
  getSummary: async (): Promise<SummaryData> => {
    return fetchAPI<SummaryData>('/summary');
  },
  
  getAttacks: async (): Promise<AttackType[]> => {
    return fetchAPI<AttackType[]>('/attacks');
  },
  
  getAttackers: async (limit?: number): Promise<Attacker[]> => {
    const params = limit ? `?limit=${limit}` : '';
    return fetchAPI<Attacker[]>(`/attackers${params}`);
  },
  
  getDetections: async (): Promise<Detection[]> => {
    return fetchAPI<Detection[]>('/detections');
  },
  
  getLogs: async (params?: { limit?: number; offset?: number; ip?: string; attackType?: string }): Promise<LogsResponse> => {
    const queryParams = params ? '?' + new URLSearchParams(params as any).toString() : '';
    return fetchAPI<LogsResponse>(`/logs${queryParams}`);
  },
  
  getTimeline: async (): Promise<TimelineData[]> => {
    return fetchAPI<TimelineData[]>('/timeline');
  },
  
  getFullReport: async (): Promise<FullReport> => {
    return fetchAPI<FullReport>('/report');
  },
  
  getHealth: async (): Promise<{ status: string; service: string }> => {
    const response = await fetch('http://localhost:4000/health');
    return response.json();
  }
};
