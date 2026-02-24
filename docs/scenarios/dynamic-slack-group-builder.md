# Dynamic Slack Group Builder - Scenario Documentation

## Business Context

Organizations using HiBob as their HR system and Slack for communication need a way to dynamically create and manage Slack user groups based on employee attributes. Manual group management becomes unsustainable as organizations grow.

### Problem Statement
- Creating Slack groups for specific employee segments (by department, location, team) is manual and error-prone
- Employee changes in HiBob (department transfers, new hires, location changes) aren't reflected in Slack groups
- No visual way to build complex group criteria combining multiple employee attributes

### Expected Outcomes
- HR/Operations can create Slack groups in minutes instead of hours
- Groups accurately reflect current employee data from HiBob
- Criteria templates can be saved and reused for recurring group needs

## Technical Specifications

### Data Flow

```
HiBob API → Backend (criteria matching engine) → Slack API
    ↑                    ↑                          ↑
    |              Frontend UI                      |
    |         (drag & drop builder)                 |
    └──── Employee Fields & Data ───────── Group Creation
```

### Backend Services

| Service | File | Purpose |
|---------|------|---------|
| HiBobService | `hibob.service.ts` | Fetches employee data and field metadata from HiBob API |
| SlackService | `slack.service.ts` | Creates user groups, channels, manages members in Slack |
| CriteriaService | `criteria.service.ts` | Matches employees against defined criteria rules |
| TemplateService | `template.service.ts` | Persists and manages saved criteria templates |

### API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/employees/fields` | Available HiBob fields for criteria building |
| GET | `/api/employees` | All active employees |
| POST | `/api/employees/match` | Match employees against criteria group |
| GET | `/api/groups/usergroups` | List existing Slack user groups |
| POST | `/api/groups/create` | Create new Slack group from criteria |
| GET | `/api/templates` | List saved templates |
| POST | `/api/templates` | Save criteria template |
| PUT | `/api/templates/:id` | Update template |
| DELETE | `/api/templates/:id` | Delete template |

### Criteria Matching Engine

The criteria engine supports:
- **Operators**: equals, not_equals, contains, not_contains, starts_with, ends_with, in, not_in, is_empty, is_not_empty
- **Logic**: AND (all criteria must match) or OR (any criterion must match)
- **Field types**: text, list, multi-list with appropriate operators per type

### Frontend Components

| Component | Purpose |
|-----------|---------|
| FieldPalette | Left sidebar with draggable HiBob fields |
| DropZone | Central area where criteria are dropped and configured |
| CriterionCard | Individual criterion with operator/value controls |
| EmployeeList | Right panel showing matched employees in real-time |
| CreateGroupModal | Modal for naming and creating Slack group |
| TemplatePanel | Save/load criteria templates |

## Error Handling

- **HiBob auth failure**: Logs error, falls back to mock data in development
- **Slack API errors**: Returns descriptive error messages to frontend
- **No matches**: Prevents group creation with zero members
- **Missing Slack IDs**: Warns about employees without Slack configuration

## Testing Procedures

1. Start in mock mode (no credentials): `npm run dev`
2. Verify fields load in left palette
3. Drag a field to the builder, set criteria
4. Confirm employee preview updates
5. Test AND/OR logic toggle
6. Save and load templates
7. Open group creation modal
8. With real credentials: verify HiBob data fetching and Slack group creation

## Maintenance Notes

- HiBob field structure may change: update `normalizeFields()` in `hibob.service.ts`
- Slack API scopes needed: `usergroups:read`, `usergroups:write`, `channels:manage`, `users:read`, `users:read.email`
- Templates stored in `backend/data/templates.json` (file-based; consider database for production)
- Rate limiting configured: 200 requests per 15 minutes
