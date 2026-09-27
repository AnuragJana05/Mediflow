import {
  User,
  Bed,
  Patient,
  DashboardSummary,
  RecommendationResponse,
  Alert,
  AuditLog,
  SurgeSimulationResponse
} from '../types';

// Flexible API Base URL supporting Vercel deployments (environment variable or relative proxy)
const RAW_API_URL = (import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || '').trim();
const CLEAN_API_URL = RAW_API_URL.replace(/\/+$/, '');
const BASE_URL = CLEAN_API_URL
  ? (CLEAN_API_URL.endsWith('/api') ? CLEAN_API_URL : `${CLEAN_API_URL}/api`)
  : '/api';

function getAuthHeader(): Record<string, string> {
  const token = localStorage.getItem('mediflow_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers = {
    'Content-Type': 'application/json',
    ...getAuthHeader(),
    ...options.headers,
  };

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorDetail = `Request failed with status ${response.status}`;
    try {
      const errJson = await response.json();
      if (errJson.detail) {
        errorDetail = typeof errJson.detail === 'string' ? errJson.detail : JSON.stringify(errJson.detail);
      }
    } catch {
      // ignore
    }
    throw new Error(errorDetail);
  }

  return response.json();
}

export const api = {
  // Auth
  login: async (email: string, password: string) => {
    return request<{ access_token: string; role: string; name: string; user_id: number; email: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },
  getMe: async (): Promise<User> => {
    return request<User>('/auth/me');
  },
  getDemoUsers: async () => {
    return request<Array<{ role: string; title: string; name: string; email: string; password: string; description: string }>>('/auth/demo-users');
  },

  // Dashboard
  getDashboardSummary: async (): Promise<DashboardSummary> => {
    return request<DashboardSummary>('/dashboard');
  },

  // Beds
  getBeds: async (params?: { department?: string; status?: string; floor?: string; has_ventilator?: boolean; has_oxygen?: boolean; has_isolation?: boolean }): Promise<Bed[]> => {
    const q = new URLSearchParams();
    if (params?.department) q.set('department', params.department);
    if (params?.status) q.set('status', params.status);
    if (params?.floor) q.set('floor', params.floor);
    if (params?.has_ventilator !== undefined) q.set('has_ventilator', String(params.has_ventilator));
    if (params?.has_oxygen !== undefined) q.set('has_oxygen', String(params.has_oxygen));
    if (params?.has_isolation !== undefined) q.set('has_isolation', String(params.has_isolation));
    const qs = q.toString() ? `?${q.toString()}` : '';
    return request<Bed[]>(`/beds${qs}`);
  },
  getBed: async (id: string): Promise<Bed> => {
    return request<Bed>(`/beds/${id}`);
  },
  createBed: async (bedData: Partial<Bed>): Promise<Bed> => {
    return request<Bed>('/beds', {
      method: 'POST',
      body: JSON.stringify(bedData),
    });
  },
  updateBedStatus: async (id: string, status: string, notes?: string): Promise<Bed> => {
    return request<Bed>(`/beds/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status, notes }),
    });
  },
  assignBed: async (id: string, patient_id: string, notes?: string): Promise<Bed> => {
    return request<Bed>(`/beds/${id}/assign`, {
      method: 'POST',
      body: JSON.stringify({ patient_id, notes }),
    });
  },
  releaseBed: async (id: string, target_status: string = 'Cleaning'): Promise<Bed> => {
    return request<Bed>(`/beds/${id}/release?target_status=${target_status}`, {
      method: 'POST',
    });
  },

  // Patients
  getPatients: async (params?: { status?: string; priority?: string; department?: string; search?: string }): Promise<Patient[]> => {
    const q = new URLSearchParams();
    if (params?.status) q.set('status', params.status);
    if (params?.priority) q.set('priority', params.priority);
    if (params?.department) q.set('department', params.department);
    if (params?.search) q.set('search', params.search);
    const qs = q.toString() ? `?${q.toString()}` : '';
    return request<Patient[]>(`/patients${qs}`);
  },
  getPatient: async (id: string): Promise<Patient> => {
    return request<Patient>(`/patients/${id}`);
  },
  registerPatient: async (patientData: any): Promise<Patient> => {
    return request<Patient>('/patients', {
      method: 'POST',
      body: JSON.stringify(patientData),
    });
  },
  overridePriority: async (id: string, priority: string, reason: string) => {
    return request<{ message: string; patient_id: string; new_priority: string }>(`/patients/${id}/override-priority`, {
      method: 'POST',
      body: JSON.stringify({ priority, reason }),
    });
  },
  dischargePatient: async (id: string) => {
    return request<{ message: string; patient_id: string; bed_status: string }>(`/patients/${id}/discharge`, {
      method: 'POST',
    });
  },

  // Smart Bed Matching Recommendations
  getRecommendations: async (patientId: string): Promise<RecommendationResponse> => {
    return request<RecommendationResponse>(`/recommendations?patient_id=${patientId}`);
  },
  approveRecommendation: async (patientId: string, bedId: string, notes?: string) => {
    return request<{ success: boolean; message: string; bed_id: string; patient_id: string }>(
      `/recommendations/approve?patient_id=${patientId}`,
      {
        method: 'POST',
        body: JSON.stringify({ bed_id: bedId, notes }),
      }
    );
  },
  rejectRecommendation: async (patientId: string, bedId: string, reason: string) => {
    return request<{ success: boolean; message: string; patient_id: string }>(
      `/recommendations/reject?patient_id=${patientId}`,
      {
        method: 'POST',
        body: JSON.stringify({ bed_id: bedId, reason }),
      }
    );
  },

  // Alerts
  getAlerts: async (params?: { status?: string; severity?: string }): Promise<Alert[]> => {
    const q = new URLSearchParams();
    if (params?.status) q.set('status', params.status);
    if (params?.severity) q.set('severity', params.severity);
    const qs = q.toString() ? `?${q.toString()}` : '';
    return request<Alert[]>(`/alerts${qs}`);
  },
  acknowledgeAlert: async (id: number): Promise<Alert> => {
    return request<Alert>(`/alerts/${id}/acknowledge`, {
      method: 'POST',
      body: JSON.stringify({}),
    });
  },

  // Analytics
  getAnalytics: async (period: 'today' | '7d' | '30d' | 'custom' = 'today') => {
    return request<any>(`/analytics?period=${period}`);
  },

  // Audit Logs
  getAuditLogs: async (params?: { entity?: string; action?: string; user_role?: string; search?: string; limit?: number }): Promise<AuditLog[]> => {
    const q = new URLSearchParams();
    if (params?.entity) q.set('entity', params.entity);
    if (params?.action) q.set('action', params.action);
    if (params?.user_role) q.set('user_role', params.user_role);
    if (params?.search) q.set('search', params.search);
    if (params?.limit) q.set('limit', String(params.limit));
    const qs = q.toString() ? `?${q.toString()}` : '';
    return request<AuditLog[]>(`/audit-logs${qs}`);
  },

  // Surge Simulation
  triggerSurge: async (scenario: string = 'highway_collision', count: number = 14, criticalRatio: number = 0.5): Promise<SurgeSimulationResponse> => {
    return request<SurgeSimulationResponse>('/simulation/surge', {
      method: 'POST',
      body: JSON.stringify({ scenario, patient_count: count, critical_ratio: criticalRatio }),
    });
  },
  resetSurge: async () => {
    return request<{ success: boolean; message: string; cleared_patients: number }>('/simulation/reset', {
      method: 'POST',
    });
  },
};
