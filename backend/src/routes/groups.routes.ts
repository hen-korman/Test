import { Router, Request, Response } from 'express';
import { SlackService } from '../services/slack.service';
import { HiBobService, getMockEmployees } from '../services/hibob.service';
import { CriteriaService } from '../services/criteria.service';
import { CreateTargetRequest, BulkAddRequest } from '../types';
import { logger } from '../middleware/logger';

const router = Router();
const slackService = new SlackService();
const hibobService = new HiBobService();
const criteriaService = new CriteriaService();

const useMockHiBob = !process.env.HIBOB_SERVICE_USER_ID || !process.env.HIBOB_SERVICE_USER_TOKEN;
const useMockSlack = !process.env.SLACK_BOT_TOKEN;

// ── List existing targets ──

router.get('/usergroups', async (_req: Request, res: Response) => {
  try {
    if (useMockSlack) {
      return res.json({
        success: true,
        data: [
          { id: 'ug-mock-1', name: 'Engineering Team', handle: 'engineering', description: 'All engineers', users: ['U01SARAH', 'U02DAVID', 'U04AMIT', 'U06YOSSI'], userCount: 4 },
          { id: 'ug-mock-2', name: 'Tel Aviv Office', handle: 'tel-aviv', description: 'TLV team', users: ['U01SARAH', 'U02DAVID', 'U04AMIT', 'U06YOSSI', 'U09TAMAR', 'U11SHIRA'], userCount: 6 },
        ],
      });
    }
    const groups = await slackService.listUserGroups();
    res.json({ success: true, data: groups });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/channels', async (_req: Request, res: Response) => {
  try {
    if (useMockSlack) {
      return res.json({
        success: true,
        data: [
          { id: 'ch-mock-1', name: 'general', topic: 'Company-wide announcements', purpose: '', memberCount: 12, isPrivate: false },
          { id: 'ch-mock-2', name: 'engineering', topic: 'Engineering discussions', purpose: '', memberCount: 6, isPrivate: false },
          { id: 'ch-mock-3', name: 'random', topic: 'Non-work banter', purpose: '', memberCount: 12, isPrivate: false },
          { id: 'ch-mock-4', name: 'tlv-office', topic: 'Tel Aviv office', purpose: '', memberCount: 6, isPrivate: false },
          { id: 'ch-mock-5', name: 'design-team', topic: 'Design discussions', purpose: '', memberCount: 2, isPrivate: true },
        ],
      });
    }
    const channels = await slackService.listChannels();
    res.json({ success: true, data: channels });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ── Create new channel or user group ──

router.post('/create', async (req: Request, res: Response) => {
  try {
    const body: CreateTargetRequest = req.body;

    if (!body.name || !body.criteriaGroup || !body.targetType) {
      return res.status(400).json({ success: false, error: 'name, targetType, and criteriaGroup are required' });
    }

    if (body.targetType === 'usergroup' && !body.handle) {
      return res.status(400).json({ success: false, error: 'handle is required for user groups' });
    }

    const employees = useMockHiBob ? getMockEmployees() : await hibobService.getEmployees();
    const matched = criteriaService.matchEmployees(employees, body.criteriaGroup);

    if (matched.length === 0) {
      return res.status(400).json({ success: false, error: 'No employees match the given criteria' });
    }

    const slackUserIds = matched.map((m) => m.slackId).filter((id): id is string => !!id);
    if (slackUserIds.length === 0) {
      return res.status(400).json({ success: false, error: 'Matched employees have no Slack IDs configured in HiBob' });
    }

    if (useMockSlack) {
      const mockId = `${body.targetType === 'channel' ? 'ch' : 'ug'}-mock-${Date.now()}`;
      const label = body.targetType === 'channel' ? `#${body.name}` : `@${body.handle}`;

      logger.info(`Mock mode: would create Slack ${body.targetType}`, {
        name: body.name,
        memberCount: slackUserIds.length,
      });

      return res.json({
        success: true,
        data: {
          target: {
            id: mockId,
            name: body.name,
            handle: body.handle,
            description: body.description,
            memberCount: slackUserIds.length,
            targetType: body.targetType,
          },
          matchedEmployees: matched,
          slackUserIds,
        },
        message: `[MOCK] Created ${body.targetType} ${label} with ${slackUserIds.length} members`,
      });
    }

    if (body.targetType === 'channel') {
      const channel = await slackService.createChannel(body.name, body.isPrivate);
      await slackService.inviteUsersToChannel(channel.id, slackUserIds);

      res.json({
        success: true,
        data: { target: { ...channel, targetType: 'channel' }, matchedEmployees: matched, slackUserIds },
        message: `Created channel #${channel.name} with ${slackUserIds.length} members`,
      });
    } else {
      const userGroup = await slackService.createUserGroup(body.name, body.handle!, body.description);
      await slackService.updateUserGroupMembers(userGroup.id, slackUserIds);

      res.json({
        success: true,
        data: { target: { ...userGroup, targetType: 'usergroup' }, matchedEmployees: matched, slackUserIds },
        message: `Created user group @${body.handle} with ${slackUserIds.length} members`,
      });
    }
  } catch (error: any) {
    logger.error('Failed to create target', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
});

// ── Bulk add to existing channel or user group ──

router.post('/bulk-add', async (req: Request, res: Response) => {
  try {
    const body: BulkAddRequest = req.body;

    if (!body.targetType || !body.targetId || !body.criteriaGroup) {
      return res.status(400).json({ success: false, error: 'targetType, targetId, and criteriaGroup are required' });
    }

    const employees = useMockHiBob ? getMockEmployees() : await hibobService.getEmployees();
    const matched = criteriaService.matchEmployees(employees, body.criteriaGroup);

    if (matched.length === 0) {
      return res.status(400).json({ success: false, error: 'No employees match the given criteria' });
    }

    const slackUserIds = matched.map((m) => m.slackId).filter((id): id is string => !!id);
    if (slackUserIds.length === 0) {
      return res.status(400).json({ success: false, error: 'Matched employees have no Slack IDs configured in HiBob' });
    }

    if (useMockSlack) {
      logger.info(`Mock mode: would bulk-add ${slackUserIds.length} users to ${body.targetType} ${body.targetId}`);

      return res.json({
        success: true,
        data: {
          targetType: body.targetType,
          targetId: body.targetId,
          targetName: body.targetName,
          addedCount: slackUserIds.length,
          matchedEmployees: matched,
          slackUserIds,
        },
        message: `[MOCK] Added ${slackUserIds.length} members to ${body.targetType === 'channel' ? '#' : '@'}${body.targetName}`,
      });
    }

    if (body.targetType === 'channel') {
      const { invited, failed } = await slackService.inviteUsersToChannel(body.targetId, slackUserIds);

      res.json({
        success: true,
        data: {
          targetType: body.targetType,
          targetId: body.targetId,
          targetName: body.targetName,
          addedCount: invited.length,
          failedCount: failed.length,
          matchedEmployees: matched,
        },
        message: `Added ${invited.length} members to #${body.targetName}${failed.length > 0 ? ` (${failed.length} failed)` : ''}`,
      });
    } else {
      const currentMembers = await slackService.getUserGroupMembers(body.targetId);
      const mergedMembers = [...new Set([...currentMembers, ...slackUserIds])];
      await slackService.updateUserGroupMembers(body.targetId, mergedMembers);
      const newlyAdded = slackUserIds.filter((id) => !currentMembers.includes(id));

      res.json({
        success: true,
        data: {
          targetType: body.targetType,
          targetId: body.targetId,
          targetName: body.targetName,
          addedCount: newlyAdded.length,
          alreadyMemberCount: slackUserIds.length - newlyAdded.length,
          matchedEmployees: matched,
        },
        message: `Added ${newlyAdded.length} new members to @${body.targetName}`,
      });
    }
  } catch (error: any) {
    logger.error('Failed to bulk add', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
