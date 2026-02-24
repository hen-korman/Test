# Slack API Integration Guide

## Overview

The application creates and manages Slack user groups and channels via the Slack Web API.

## Authentication

Slack uses OAuth Bearer tokens:

```
Authorization: Bearer xoxb-your-bot-token
```

Two token types are used:
- **Bot Token** (`xoxb-`): For reading user groups, creating channels, inviting users
- **User Token** (`xoxp-`): For creating/updating user groups (required if workspace restricts bot permissions)

## Slack App Setup

### 1. Create Slack App

1. Go to https://api.slack.com/apps
2. Click "Create New App" → "From scratch"
3. Name: "Group Builder" (or preferred name)
4. Select your workspace

### 2. Required OAuth Scopes

**Bot Token Scopes**:
- `usergroups:read` — List user groups
- `channels:manage` — Create channels
- `conversations:invite` — Invite users to channels (Bot token needs `groups:write` for private channels)
- `users:read` — Read user info
- `users:read.email` — Look up users by email

**User Token Scopes**:
- `usergroups:write` — Create and update user groups

### 3. Install to Workspace

1. Go to "Install App" in your Slack App settings
2. Click "Install to Workspace"
3. Authorize the requested permissions
4. Copy both the Bot Token and User Token

## API Methods Used

### usergroups.create
Creates a new user group.
```json
POST /usergroups.create
{
  "name": "Engineering Team",
  "handle": "engineering",
  "description": "All engineers"
}
```

### usergroups.users.update
Sets the members of a user group (replaces all existing members).
```json
POST /usergroups.users.update
{
  "usergroup": "S0123456",
  "users": "U01,U02,U03"
}
```
**Note**: Cannot set empty user list. Use `usergroups.disable` to remove all members.

### conversations.create
Creates a new Slack channel.
```json
POST /conversations.create
{
  "name": "engineering-team",
  "is_private": false
}
```

### conversations.invite
Invites users to a channel.
```json
POST /conversations.invite
{
  "channel": "C0123456",
  "users": "U01,U02,U03"
}
```
Users are invited in batches of 30 to avoid API limits.

### users.lookupByEmail
Finds a Slack user ID by email address. Useful as fallback when HiBob doesn't store Slack IDs.

## Error Handling

| Error | Meaning | Action |
|-------|---------|--------|
| `not_authed` | Missing/invalid token | Check SLACK_BOT_TOKEN |
| `missing_scope` | Token lacks required scope | Add scope in Slack App settings |
| `name_taken` | User group handle exists | Use different handle |
| `already_in_channel` | User already in channel | Ignored (not an error) |
| `is_archived` | Channel is archived | Unarchive or use different channel |

## Limitations

- Guests and bot users cannot be added to user groups
- User group creation/update may require user token (not bot token) depending on workspace settings
- `usergroups.users.update` replaces ALL members — partial updates not supported
- Rate limits apply: ~50 requests per minute for most methods
