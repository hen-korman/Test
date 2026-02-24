# Dynamic Slack Group Builder - Scenario Documentation

## Business Context

Organizations using HiBob as their HR system and Slack for communication need a way to dynamically create and manage Slack channels and user groups based on employee attributes. Manual group management becomes unsustainable as organizations grow.

### Problem Statement
- Creating Slack channels/groups for specific employee segments (by department, location, team) is manual and error-prone
- Employee changes in HiBob (department transfers, new hires, location changes) aren't reflected in Slack groups
- No visual way to build complex group criteria combining multiple employee attributes
- No automated enforcement to keep channel membership in sync with HR data

### Expected Outcomes
- HR/Operations can create Slack channels or user groups in minutes
- Groups accurately reflect current employee data from HiBob
- Criteria templates can be saved and reused
- Scheduled syncs keep membership aligned with HR criteria automatically

## Technical Specifications

### Data Flow

```
HiBob API → Backend (criteria matching engine) → Slack API
    ↑                    ↑                          ↑
    |              Frontend UI                      |
    |         (drag & drop builder)                 |
    └──── Employee Fields & Data ───── Channel/Group Creation
                                       Bulk Add to Existing
                                       Scheduled Sync Enforcement
```

### Backend Services

| Service | File | Purpose |
|---------|------|---------|
| HiBobService | `hibob.service.ts` | Fetches employee data and field metadata from HiBob API |
| SlackService | `slack.service.ts` | Creates channels/groups, manages members, lists targets |
| CriteriaService | `criteria.service.ts` | Matches employees against defined criteria rules |
| SyncService | `sync.service.ts` | Timer-based scheduled sync with enforcement logic |
| TemplateService | `template.service.ts` | Persists and manages saved criteria templates |

### API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/employees/fields` | Available HiBob fields for criteria building |
| GET | `/api/employees` | All active employees |
| POST | `/api/employees/match` | Match employees against criteria group |
| GET | `/api/groups/channels` | List existing Slack channels |
| GET | `/api/groups/usergroups` | List existing Slack user groups |
| POST | `/api/groups/create` | Create new channel or user group from criteria |
| POST | `/api/groups/bulk-add` | Bulk add matched employees to existing target |
| GET | `/api/sync` | List scheduled syncs |
| POST | `/api/sync` | Create new sync schedule |
| PUT | `/api/sync/:id` | Update sync (toggle, interval, etc.) |
| DELETE | `/api/sync/:id` | Delete sync schedule |
| POST | `/api/sync/:id/run` | Manually trigger sync |
| GET | `/api/templates` | List saved templates |
| POST | `/api/templates` | Save criteria template |
| PUT | `/api/templates/:id` | Update template |
| DELETE | `/api/templates/:id` | Delete template |

### Criteria Matching Engine

The criteria engine supports:
- **Operators**: equals, not_equals, contains, not_contains, starts_with, ends_with, in, not_in, is_empty, is_not_empty
- **Logic**: AND (all criteria must match) or OR (any criterion must match)
- **Field types**: text, list, multi-list with appropriate operators per type

### Scheduled Sync Engine

The sync service provides:
- **Timer-based execution**: Configurable intervals from 5 minutes to 24 hours
- **Add mode**: Only adds missing members (default)
- **Exclusive mode**: Adds missing and removes non-matching members
- **Run history**: Tracks last run timestamp and results (added/removed/unchanged/errors)
- **Manual trigger**: Run sync on demand via API or UI
- **Enable/disable**: Toggle syncs without deleting them

### Frontend Components

| Component | Purpose |
|-----------|---------|
| FieldPalette | Left sidebar with draggable HiBob fields |
| DropZone | Central area where criteria are dropped and configured |
| CriterionCard | Individual criterion with operator/value controls |
| EmployeeList | Right panel showing matched employees in real-time |
| CreateGroupModal | Modal for creating channels/groups or bulk-adding to existing |
| SyncManager | Modal for creating and managing sync schedules |
| TemplatePanel | Save/load criteria templates |

## Error Handling

- **HiBob auth failure**: Logs error, falls back to mock data in development
- **Slack API errors**: Returns descriptive error messages to frontend
- **No matches**: Prevents target creation with zero members
- **Missing Slack IDs**: Warns about employees without Slack configuration
- **Sync failures**: Logged with errors array; does not stop timer

## Testing Procedures

1. Start in mock mode (no credentials): `npm run dev`
2. Verify fields load in left palette
3. Drag a field to the builder, set criteria
4. Confirm employee preview updates
5. Test AND/OR logic toggle
6. Open "Add to Slack" → test Create New with Channel and User Group types
7. Test "Add to Existing" tab — select a channel, bulk add
8. Open "Sync Schedule" → create a sync, run now, verify results
9. Save and load templates
10. With real credentials: verify end-to-end with actual Slack workspace

## Maintenance Notes

- HiBob field structure may change: update `normalizeFields()` in `hibob.service.ts`
- Slack API scopes needed: see README for full list
- Templates stored in `backend/data/templates.json` (file-based; consider database for production)
- Syncs stored in `backend/data/syncs.json` (file-based; consider database for production)
- Sync timers are in-process; restarting the server re-initializes all timers
- Rate limiting configured: 200 requests per 15 minutes
