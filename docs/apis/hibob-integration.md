# HiBob API Integration Guide

## Overview

The application integrates with HiBob's REST API to fetch employee data and field metadata for building dynamic Slack groups.

## Authentication

HiBob uses Service User authentication with Basic Auth:

```
Authorization: Basic base64(SERVICE_USER_ID:SERVICE_USER_TOKEN)
```

### Setting Up a Service User

1. Go to HiBob Admin → Settings → Integrations → Service Users
2. Create a new service user
3. Copy the ID and Token immediately (token shown once)
4. Assign to a permission group with read access to employee data

### Required Permissions

- **Default Employee Fields**: root, about, employment, work categories
- **Custom Fields**: any custom fields you want available as criteria

## Endpoints Used

### GET /v1/company/people/fields
Returns metadata about all available employee fields including:
- Field ID, name, category
- Data type (text, list, date, etc.)
- For list fields: available values

### POST /v1/people/search
Searches employees with optional field selection and filters.

**Request body**:
```json
{
  "fields": [
    "root.id",
    "root.displayName",
    "root.email",
    "work.department",
    "work.title",
    "work.site",
    "work.team",
    "about.socialData.slack"
  ],
  "filters": [
    {
      "fieldPath": "root.status",
      "operator": "equals",
      "values": ["Active"]
    }
  ]
}
```

### GET /v1/company/named-lists/{listId}
Fetches available values for list-type fields (departments, sites, etc.).

## Slack ID in HiBob

The employee's Slack user ID should be stored in HiBob. Common locations:
- `about.socialData.slack` — Social Data section
- `personal.communication.slackUsername` — Personal section
- Custom field — depends on company configuration

## Error Handling

| Status | Meaning | Action |
|--------|---------|--------|
| 200 (empty) | Missing permissions | Check service user permission group |
| 401 | Invalid credentials | Verify SERVICE_USER_ID and TOKEN |
| 403 | Insufficient permissions | Add required permissions to group |
| 429 | Rate limited | Back off and retry |

## Rate Limits

HiBob API has rate limits. The application handles this by:
- Caching field metadata (rarely changes)
- Fetching employees only when criteria match is requested
- Server-side rate limiting to prevent excessive API calls
