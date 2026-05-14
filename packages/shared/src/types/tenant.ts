export interface Tenant {
  id: string;
  name: string;
  matchField: string;
  matchValue: string;
  slackChannelId: string;
  active: boolean;
  createdAt: string;
}

export interface CreateTenantDto {
  name: string;
  matchField: string;
  matchValue: string;
  slackChannelId: string;
  active?: boolean;
}

export interface UpdateTenantDto {
  name?: string;
  matchField?: string;
  matchValue?: string;
  slackChannelId?: string;
  active?: boolean;
}
