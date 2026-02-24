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

export interface HiBobField {
  id: string;
  name: string;
  category: string;
  type: string;
  description?: string;
  values?: Array<{ id: string | number; value: string }>;
  jsonPath: string;
}

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

export interface SlackUserGroup {
  id: string;
  name: string;
  handle: string;
  description?: string;
  users: string[];
  userCount: number;
}

export interface SavedTemplate {
  id: string;
  name: string;
  description?: string;
  criteriaGroup: CriteriaGroup;
  createdAt: string;
  updatedAt: string;
}

export interface GroupCreationRequest {
  name: string;
  handle: string;
  description?: string;
  criteriaGroup: CriteriaGroup;
  channelName?: string;
  createChannel: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  count?: number;
  totalEmployees?: number;
}

export const OPERATOR_LABELS: Record<CriterionOperator, string> = {
  equals: 'Equals',
  not_equals: 'Not Equals',
  contains: 'Contains',
  not_contains: 'Does Not Contain',
  starts_with: 'Starts With',
  ends_with: 'Ends With',
  in: 'Is One Of',
  not_in: 'Is Not One Of',
  is_empty: 'Is Empty',
  is_not_empty: 'Is Not Empty',
};

export const OPERATORS_BY_TYPE: Record<string, CriterionOperator[]> = {
  text: ['equals', 'not_equals', 'contains', 'not_contains', 'starts_with', 'ends_with', 'is_empty', 'is_not_empty'],
  list: ['equals', 'not_equals', 'in', 'not_in', 'is_empty', 'is_not_empty'],
  'multi-list': ['contains', 'not_contains', 'is_empty', 'is_not_empty'],
  number: ['equals', 'not_equals', 'is_empty', 'is_not_empty'],
  boolean: ['equals', 'not_equals'],
  date: ['equals', 'not_equals', 'is_empty', 'is_not_empty'],
};
