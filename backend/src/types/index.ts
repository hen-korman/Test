export interface HiBobEmployee {
  id: string;
  displayName: string;
  firstName: string;
  surname: string;
  email: string;
  work?: {
    department?: string;
    title?: string;
    site?: string;
    siteId?: number;
    reportsTo?: { id: string; displayName: string; email: string };
    team?: string;
    secondLevelManager?: string;
    customColumns?: Record<string, unknown>;
  };
  about?: {
    socialData?: {
      slack?: string;
    };
    custom?: Record<string, unknown>;
  };
  personal?: {
    communication?: {
      slackUsername?: string;
    };
    custom?: Record<string, unknown>;
  };
  custom?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface HiBobField {
  id: string;
  name: string;
  category: string;
  type: string;
  description?: string;
  values?: Array<{ id: string | number; value: string }>;
  jsonPath: string;
}

export type CriterionOperator =
  | 'equals'
  | 'not_equals'
  | 'contains'
  | 'not_contains'
  | 'starts_with'
  | 'ends_with'
  | 'in'
  | 'not_in'
  | 'is_empty'
  | 'is_not_empty';

export interface Criterion {
  id: string;
  fieldId: string;
  fieldName: string;
  operator: CriterionOperator;
  value: string | string[];
}

export type LogicOperator = 'AND' | 'OR';

export interface CriteriaGroup {
  id: string;
  name: string;
  logic: LogicOperator;
  criteria: Criterion[];
}

export interface SlackUserGroup {
  id: string;
  name: string;
  handle: string;
  description?: string;
  users: string[];
  userCount: number;
}

export interface SlackChannel {
  id: string;
  name: string;
  topic?: string;
  purpose?: string;
  memberCount: number;
  isPrivate: boolean;
}

export type TargetType = 'channel' | 'usergroup';

export interface CreateTargetRequest {
  targetType: TargetType;
  name: string;
  handle?: string;
  description?: string;
  criteriaGroup: CriteriaGroup;
  isPrivate?: boolean;
}

export interface BulkAddRequest {
  targetType: TargetType;
  targetId: string;
  targetName: string;
  criteriaGroup: CriteriaGroup;
}

export interface MatchedEmployee {
  id: string;
  displayName: string;
  email: string;
  department?: string;
  title?: string;
  site?: string;
  slackId?: string;
  slackUsername?: string;
  avatarUrl?: string;
}

export interface SavedTemplate {
  id: string;
  name: string;
  description?: string;
  criteriaGroup: CriteriaGroup;
  createdAt: string;
  updatedAt: string;
}

export interface ScheduledSync {
  id: string;
  name: string;
  targetType: TargetType;
  targetId: string;
  targetName: string;
  criteriaGroup: CriteriaGroup;
  intervalMinutes: number;
  enforceExclusive: boolean;
  enabled: boolean;
  lastRunAt?: string;
  lastRunResult?: SyncRunResult;
  createdAt: string;
  updatedAt: string;
}

export interface SyncRunResult {
  ranAt: string;
  added: string[];
  removed: string[];
  unchanged: number;
  errors: string[];
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
