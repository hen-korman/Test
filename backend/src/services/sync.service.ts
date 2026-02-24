import * as fs from 'fs';
import * as path from 'path';
import { ScheduledSync, SyncRunResult, CriteriaGroup } from '../types';
import { HiBobService, getMockEmployees } from './hibob.service';
import { SlackService } from './slack.service';
import { CriteriaService } from './criteria.service';
import { logger } from '../middleware/logger';

const SYNCS_FILE = path.join(__dirname, '../../data/syncs.json');

const useMockHiBob = !process.env.HIBOB_SERVICE_USER_ID || !process.env.HIBOB_SERVICE_USER_TOKEN;
const useMockSlack = !process.env.SLACK_BOT_TOKEN;

export class SyncService {
  private syncs: ScheduledSync[] = [];
  private timers: Map<string, ReturnType<typeof setInterval>> = new Map();
  private hibobService: HiBobService;
  private slackService: SlackService;
  private criteriaService: CriteriaService;

  constructor() {
    this.hibobService = new HiBobService();
    this.slackService = new SlackService();
    this.criteriaService = new CriteriaService();
    this.loadSyncs();
    this.startAllTimers();
  }

  private ensureDataDir(): void {
    const dir = path.dirname(SYNCS_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  private loadSyncs(): void {
    try {
      this.ensureDataDir();
      if (fs.existsSync(SYNCS_FILE)) {
        const data = fs.readFileSync(SYNCS_FILE, 'utf-8');
        this.syncs = JSON.parse(data);
      }
    } catch (error: any) {
      logger.warn('Could not load syncs, starting fresh', { error: error.message });
      this.syncs = [];
    }
  }

  private saveSyncs(): void {
    try {
      this.ensureDataDir();
      fs.writeFileSync(SYNCS_FILE, JSON.stringify(this.syncs, null, 2));
    } catch (error: any) {
      logger.error('Failed to save syncs', { error: error.message });
    }
  }

  private startAllTimers(): void {
    for (const sync of this.syncs) {
      if (sync.enabled) {
        this.startTimer(sync);
      }
    }
  }

  private startTimer(sync: ScheduledSync): void {
    this.stopTimer(sync.id);
    const intervalMs = sync.intervalMinutes * 60 * 1000;
    const timer = setInterval(() => this.runSync(sync.id), intervalMs);
    this.timers.set(sync.id, timer);
    logger.info(`Sync timer started: ${sync.name} (every ${sync.intervalMinutes}m)`, { syncId: sync.id });
  }

  private stopTimer(syncId: string): void {
    const existing = this.timers.get(syncId);
    if (existing) {
      clearInterval(existing);
      this.timers.delete(syncId);
    }
  }

  getAll(): ScheduledSync[] {
    return this.syncs;
  }

  getById(id: string): ScheduledSync | undefined {
    return this.syncs.find((s) => s.id === id);
  }

  create(params: {
    name: string;
    targetType: 'channel' | 'usergroup';
    targetId: string;
    targetName: string;
    criteriaGroup: CriteriaGroup;
    intervalMinutes: number;
    enforceExclusive: boolean;
  }): ScheduledSync {
    const sync: ScheduledSync = {
      id: `sync-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      ...params,
      enabled: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.syncs.push(sync);
    this.saveSyncs();
    this.startTimer(sync);
    return sync;
  }

  update(id: string, updates: Partial<Pick<ScheduledSync, 'name' | 'intervalMinutes' | 'enforceExclusive' | 'enabled' | 'criteriaGroup'>>): ScheduledSync {
    const index = this.syncs.findIndex((s) => s.id === id);
    if (index === -1) throw new Error('Sync not found');

    this.syncs[index] = {
      ...this.syncs[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    this.saveSyncs();

    if (updates.enabled === false) {
      this.stopTimer(id);
    } else if (updates.enabled === true || updates.intervalMinutes) {
      this.startTimer(this.syncs[index]);
    }

    return this.syncs[index];
  }

  delete(id: string): void {
    const index = this.syncs.findIndex((s) => s.id === id);
    if (index === -1) throw new Error('Sync not found');

    this.stopTimer(id);
    this.syncs.splice(index, 1);
    this.saveSyncs();
  }

  async runSync(syncId: string): Promise<SyncRunResult> {
    const sync = this.syncs.find((s) => s.id === syncId);
    if (!sync) throw new Error('Sync not found');

    logger.info(`Running sync: ${sync.name}`, { syncId });

    const result: SyncRunResult = {
      ranAt: new Date().toISOString(),
      added: [],
      removed: [],
      unchanged: 0,
      errors: [],
    };

    try {
      const employees = useMockHiBob ? getMockEmployees() : await this.hibobService.getEmployees();
      const matched = this.criteriaService.matchEmployees(employees, sync.criteriaGroup);
      const expectedSlackIds = new Set(
        matched.map((m) => m.slackId).filter((id): id is string => !!id)
      );

      if (useMockSlack) {
        result.added = Array.from(expectedSlackIds);
        result.unchanged = 0;
        logger.info(`[MOCK] Sync ${sync.name}: would set ${expectedSlackIds.size} members`, { syncId });
      } else if (sync.targetType === 'channel') {
        const currentMembers = new Set(await this.slackService.getChannelMembers(sync.targetId));

        const toAdd = [...expectedSlackIds].filter((id) => !currentMembers.has(id));
        if (toAdd.length > 0) {
          const { invited, failed } = await this.slackService.inviteUsersToChannel(sync.targetId, toAdd);
          result.added = invited;
          for (const f of failed) {
            result.errors.push(`Failed to add ${f}`);
          }
        }

        if (sync.enforceExclusive) {
          const toRemove = [...currentMembers].filter((id) => !expectedSlackIds.has(id));
          for (const userId of toRemove) {
            const ok = await this.slackService.removeUserFromChannel(sync.targetId, userId);
            if (ok) {
              result.removed.push(userId);
            } else {
              result.errors.push(`Failed to remove ${userId}`);
            }
          }
        }

        result.unchanged = [...currentMembers].filter((id) => expectedSlackIds.has(id)).length;
      } else {
        const currentMembers = new Set(await this.slackService.getUserGroupMembers(sync.targetId));
        const newMemberList = sync.enforceExclusive
          ? [...expectedSlackIds]
          : [...new Set([...currentMembers, ...expectedSlackIds])];

        if (newMemberList.length > 0) {
          await this.slackService.updateUserGroupMembers(sync.targetId, newMemberList);
        }

        result.added = [...expectedSlackIds].filter((id) => !currentMembers.has(id));
        result.removed = sync.enforceExclusive
          ? [...currentMembers].filter((id) => !expectedSlackIds.has(id))
          : [];
        result.unchanged = [...currentMembers].filter((id) => expectedSlackIds.has(id)).length;
      }
    } catch (error: any) {
      result.errors.push(error.message);
      logger.error(`Sync failed: ${sync.name}`, { syncId, error: error.message });
    }

    const index = this.syncs.findIndex((s) => s.id === syncId);
    if (index !== -1) {
      this.syncs[index].lastRunAt = result.ranAt;
      this.syncs[index].lastRunResult = result;
      this.saveSyncs();
    }

    logger.info(`Sync completed: ${sync.name}`, {
      syncId,
      added: result.added.length,
      removed: result.removed.length,
      unchanged: result.unchanged,
      errors: result.errors.length,
    });

    return result;
  }
}
