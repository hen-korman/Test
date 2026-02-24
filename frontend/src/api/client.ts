import axios from 'axios';
import type {
  HiBobField,
  MatchedEmployee,
  CriteriaGroup,
  SavedTemplate,
  SlackUserGroup,
  SlackChannel,
  CreateTargetRequest,
  BulkAddRequest,
  ScheduledSync,
  SyncRunResult,
  ApiResponse,
} from '../types';

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

// ── Employees ──

export async function fetchFields(): Promise<HiBobField[]> {
  const res = await api.get<ApiResponse<HiBobField[]>>('/employees/fields');
  return res.data.data || [];
}

export async function fetchEmployees(): Promise<MatchedEmployee[]> {
  const res = await api.get<ApiResponse<MatchedEmployee[]>>('/employees');
  return res.data.data || [];
}

export async function matchEmployees(criteriaGroup: CriteriaGroup): Promise<{
  matched: MatchedEmployee[];
  count: number;
  totalEmployees: number;
}> {
  const res = await api.post<ApiResponse<MatchedEmployee[]>>('/employees/match', { criteriaGroup });
  return {
    matched: res.data.data || [],
    count: res.data.count || 0,
    totalEmployees: res.data.totalEmployees || 0,
  };
}

// ── Groups & Channels ──

export async function fetchUserGroups(): Promise<SlackUserGroup[]> {
  const res = await api.get<ApiResponse<SlackUserGroup[]>>('/groups/usergroups');
  return res.data.data || [];
}

export async function fetchChannels(): Promise<SlackChannel[]> {
  const res = await api.get<ApiResponse<SlackChannel[]>>('/groups/channels');
  return res.data.data || [];
}

export async function createTarget(request: CreateTargetRequest): Promise<{
  target: any;
  matchedEmployees: MatchedEmployee[];
  message: string;
}> {
  const res = await api.post<ApiResponse<any> & { message?: string }>('/groups/create', request);
  if (!res.data.success) throw new Error(res.data.error || 'Failed to create');
  return { ...res.data.data, message: res.data.message || '' };
}

export async function bulkAdd(request: BulkAddRequest): Promise<{
  addedCount: number;
  message: string;
}> {
  const res = await api.post<ApiResponse<any> & { message?: string }>('/groups/bulk-add', request);
  if (!res.data.success) throw new Error(res.data.error || 'Failed to bulk add');
  return { addedCount: res.data.data?.addedCount || 0, message: res.data.message || '' };
}

// ── Templates ──

export async function fetchTemplates(): Promise<SavedTemplate[]> {
  const res = await api.get<ApiResponse<SavedTemplate[]>>('/templates');
  return res.data.data || [];
}

export async function createTemplate(
  name: string,
  description: string,
  criteriaGroup: CriteriaGroup
): Promise<SavedTemplate> {
  const res = await api.post<ApiResponse<SavedTemplate>>('/templates', { name, description, criteriaGroup });
  if (!res.data.success) throw new Error(res.data.error || 'Failed to create template');
  return res.data.data!;
}

export async function deleteTemplate(id: string): Promise<void> {
  await api.delete(`/templates/${id}`);
}

// ── Scheduled Syncs ──

export async function fetchSyncs(): Promise<ScheduledSync[]> {
  const res = await api.get<ApiResponse<ScheduledSync[]>>('/sync');
  return res.data.data || [];
}

export async function createSync(params: {
  name: string;
  targetType: 'channel' | 'usergroup';
  targetId: string;
  targetName: string;
  criteriaGroup: CriteriaGroup;
  intervalMinutes: number;
  enforceExclusive: boolean;
}): Promise<ScheduledSync> {
  const res = await api.post<ApiResponse<ScheduledSync>>('/sync', params);
  if (!res.data.success) throw new Error(res.data.error || 'Failed to create sync');
  return res.data.data!;
}

export async function updateSync(id: string, updates: Partial<ScheduledSync>): Promise<ScheduledSync> {
  const res = await api.put<ApiResponse<ScheduledSync>>(`/sync/${id}`, updates);
  if (!res.data.success) throw new Error(res.data.error || 'Failed to update sync');
  return res.data.data!;
}

export async function deleteSync(id: string): Promise<void> {
  await api.delete(`/sync/${id}`);
}

export async function runSyncNow(id: string): Promise<SyncRunResult> {
  const res = await api.post<ApiResponse<SyncRunResult>>(`/sync/${id}/run`);
  if (!res.data.success) throw new Error(res.data.error || 'Failed to run sync');
  return res.data.data!;
}

// ── Health ──

export async function fetchHealth(): Promise<any> {
  const res = await api.get('/health');
  return res.data;
}
