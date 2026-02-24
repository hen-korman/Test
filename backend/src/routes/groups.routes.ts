import { Router, Request, Response } from 'express';
import { SlackService } from '../services/slack.service';
import { HiBobService, getMockEmployees } from '../services/hibob.service';
import { CriteriaService } from '../services/criteria.service';
import { GroupCreationRequest } from '../types';
import { logger } from '../middleware/logger';

const router = Router();
const slackService = new SlackService();
const hibobService = new HiBobService();
const criteriaService = new CriteriaService();

const useMockHiBob = !process.env.HIBOB_SERVICE_USER_ID || !process.env.HIBOB_SERVICE_USER_TOKEN;
const useMockSlack = !process.env.SLACK_BOT_TOKEN;

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

router.post('/create', async (req: Request, res: Response) => {
  try {
    const body: GroupCreationRequest = req.body;

    if (!body.name || !body.handle || !body.criteriaGroup) {
      return res.status(400).json({ success: false, error: 'name, handle, and criteriaGroup are required' });
    }

    const employees = useMockHiBob ? getMockEmployees() : await hibobService.getEmployees();
    const matched = criteriaService.matchEmployees(employees, body.criteriaGroup);

    if (matched.length === 0) {
      return res.status(400).json({ success: false, error: 'No employees match the given criteria' });
    }

    const slackUserIds = matched
      .map((m) => m.slackId)
      .filter((id): id is string => !!id);

    if (slackUserIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Matched employees have no Slack IDs configured in HiBob',
      });
    }

    if (useMockSlack) {
      logger.info('Mock mode: would create Slack group', {
        name: body.name,
        handle: body.handle,
        memberCount: slackUserIds.length,
        members: slackUserIds,
      });

      return res.json({
        success: true,
        data: {
          userGroup: {
            id: `ug-mock-${Date.now()}`,
            name: body.name,
            handle: body.handle,
            description: body.description,
            users: slackUserIds,
            userCount: slackUserIds.length,
          },
          matchedEmployees: matched,
          channel: body.createChannel
            ? { id: `ch-mock-${Date.now()}`, name: body.channelName || body.handle }
            : null,
        },
        message: `[MOCK] Created group @${body.handle} with ${slackUserIds.length} members`,
      });
    }

    const userGroup = await slackService.createUserGroup(body.name, body.handle, body.description);
    await slackService.updateUserGroupMembers(userGroup.id, slackUserIds);

    let channel = null;
    if (body.createChannel && body.channelName) {
      channel = await slackService.createChannel(body.channelName);
      await slackService.inviteUsersToChannel(channel.id, slackUserIds);
    }

    res.json({
      success: true,
      data: { userGroup, matchedEmployees: matched, channel },
      message: `Created group @${body.handle} with ${slackUserIds.length} members`,
    });
  } catch (error: any) {
    logger.error('Failed to create group', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
