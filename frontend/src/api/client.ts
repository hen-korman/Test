import axios from 'axios';
import type {
  HiBobField,
  MatchedEmployee,
  CriteriaGroup,
  SavedTemplate,
  SlackUserGroup,
  GroupCreationRequest,
  ApiResponse,
} from '../types';

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

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

export async function fetchUserGroups(): Promise<SlackUserGroup[]> {
  const res = await api.get<ApiResponse<SlackUserGroup[]>>('/groups/usergroups');
  return res.data.data || [];
}

export async function createGroup(request: GroupCreationRequest): Promise<{
  userGroup: SlackUserGroup;
  matchedEmployees: MatchedEmployee[];
  channel: { id: string; name: string } | null;
}> {
  const res = await api.post<ApiResponse<any>>('/groups/create', request);
  if (!res.data.success) throw new Error(res.data.error || 'Failed to create group');
  return res.data.data;
}

export async function fetchTemplates(): Promise<SavedTemplate[]> {
  const res = await api.get<ApiResponse<SavedTemplate[]>>('/templates');
  return res.data.data || [];
}

export async function createTemplate(
  name: string,
  description: string,
  criteriaGroup: CriteriaGroup
): Promise<SavedTemplate> {
  const res = await api.post<ApiResponse<SavedTemplate>>('/templates', {
    name,
    description,
    criteriaGroup,
  });
  if (!res.data.success) throw new Error(res.data.error || 'Failed to create template');
  return res.data.data!;
}

export async function deleteTemplate(id: string): Promise<void> {
  await api.delete(`/templates/${id}`);
}

export async function fetchHealth(): Promise<any> {
  const res = await api.get('/health');
  return res.data;
}
