import axios, { AxiosInstance } from 'axios';
import { SlackUserGroup } from '../types';
import { logger } from '../middleware/logger';

export class SlackService {
  private client: AxiosInstance;
  private botToken: string;
  private userToken: string;

  constructor() {
    this.botToken = process.env.SLACK_BOT_TOKEN || '';
    this.userToken = process.env.SLACK_USER_TOKEN || '';

    if (!this.botToken) {
      logger.warn('Slack bot token not configured - using mock mode');
    }

    this.client = axios.create({
      baseURL: 'https://slack.com/api',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
      },
    });
  }

  private getAuthHeaders(useUserToken = false) {
    const token = useUserToken ? this.userToken : this.botToken;
    return { Authorization: `Bearer ${token}` };
  }

  async createUserGroup(name: string, handle: string, description?: string): Promise<SlackUserGroup> {
    try {
      const response = await this.client.post(
        '/usergroups.create',
        { name, handle, description: description || '' },
        { headers: this.getAuthHeaders(true) }
      );

      if (!response.data.ok) {
        throw new Error(`Slack API error: ${response.data.error}`);
      }

      const ug = response.data.usergroup;
      return {
        id: ug.id,
        name: ug.name,
        handle: ug.handle,
        description: ug.description,
        users: ug.users || [],
        userCount: ug.user_count || 0,
      };
    } catch (error: any) {
      logger.error('Failed to create Slack user group', { error: error.message });
      throw new Error(`Failed to create user group: ${error.message}`);
    }
  }

  async updateUserGroupMembers(usergroupId: string, userIds: string[]): Promise<SlackUserGroup> {
    if (userIds.length === 0) {
      throw new Error('Cannot set an empty user list for a user group');
    }

    try {
      const response = await this.client.post(
        '/usergroups.users.update',
        {
          usergroup: usergroupId,
          users: userIds.join(','),
        },
        { headers: this.getAuthHeaders(true) }
      );

      if (!response.data.ok) {
        throw new Error(`Slack API error: ${response.data.error}`);
      }

      const ug = response.data.usergroup;
      return {
        id: ug.id,
        name: ug.name,
        handle: ug.handle,
        description: ug.description,
        users: response.data.users || userIds,
        userCount: userIds.length,
      };
    } catch (error: any) {
      logger.error('Failed to update user group members', { error: error.message });
      throw new Error(`Failed to update user group members: ${error.message}`);
    }
  }

  async createChannel(name: string): Promise<{ id: string; name: string }> {
    try {
      const response = await this.client.post(
        '/conversations.create',
        { name, is_private: false },
        { headers: this.getAuthHeaders() }
      );

      if (!response.data.ok) {
        throw new Error(`Slack API error: ${response.data.error}`);
      }

      return {
        id: response.data.channel.id,
        name: response.data.channel.name,
      };
    } catch (error: any) {
      logger.error('Failed to create Slack channel', { error: error.message });
      throw new Error(`Failed to create channel: ${error.message}`);
    }
  }

  async inviteUsersToChannel(channelId: string, userIds: string[]): Promise<void> {
    const batchSize = 30;
    for (let i = 0; i < userIds.length; i += batchSize) {
      const batch = userIds.slice(i, i + batchSize);
      try {
        const response = await this.client.post(
          '/conversations.invite',
          { channel: channelId, users: batch.join(',') },
          { headers: this.getAuthHeaders() }
        );

        if (!response.data.ok && response.data.error !== 'already_in_channel') {
          logger.warn(`Failed to invite some users to channel`, {
            error: response.data.error,
            batch: i / batchSize,
          });
        }
      } catch (error: any) {
        logger.error(`Failed to invite batch ${i / batchSize} to channel`, { error: error.message });
      }
    }
  }

  async listUserGroups(): Promise<SlackUserGroup[]> {
    try {
      const response = await this.client.get('/usergroups.list', {
        params: { include_users: true, include_disabled: false },
        headers: this.getAuthHeaders(),
      });

      if (!response.data.ok) {
        throw new Error(`Slack API error: ${response.data.error}`);
      }

      return (response.data.usergroups || []).map((ug: any) => ({
        id: ug.id,
        name: ug.name,
        handle: ug.handle,
        description: ug.description,
        users: ug.users || [],
        userCount: ug.user_count || (ug.users || []).length,
      }));
    } catch (error: any) {
      logger.error('Failed to list user groups', { error: error.message });
      throw new Error(`Failed to list user groups: ${error.message}`);
    }
  }

  async lookupUserByEmail(email: string): Promise<string | null> {
    try {
      const response = await this.client.get('/users.lookupByEmail', {
        params: { email },
        headers: this.getAuthHeaders(),
      });

      if (!response.data.ok) return null;
      return response.data.user?.id || null;
    } catch {
      return null;
    }
  }
}
