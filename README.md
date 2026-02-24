# Dynamic Slack Group Builder

Build and manage Slack channels and user groups dynamically based on employee criteria from HiBob HR system. Features a drag-and-drop interface for creating group rules, bulk-adding to existing targets, and scheduled membership enforcement.

## Features

- **Drag & Drop Criteria Builder** — Drag employee fields from HiBob to build dynamic rules
- **Real-time Employee Preview** — See matching employees as you build criteria
- **AND/OR Logic** — Combine criteria with AND or OR operators
- **Channels & User Groups** — Create either Slack channels or user groups
- **Bulk Add to Existing** — Add query results to any existing channel or user group
- **Scheduled Sync** — Automatically enforce membership based on criteria on a schedule
- **Exclusive Mode** — Optionally remove members who no longer match the criteria
- **Template System** — Save and reuse criteria templates
- **Mock Mode** — Works without API credentials for demo/development

## Architecture

```
├── backend/          # Node.js + Express + TypeScript API
│   ├── src/
│   │   ├── routes/       # API endpoints (employees, groups, sync, templates)
│   │   ├── services/     # HiBob, Slack, Criteria, Sync, Template services
│   │   ├── types/        # TypeScript type definitions
│   │   └── middleware/    # Logger
│   └── data/             # Template & sync storage (JSON)
│
├── frontend/         # React + TypeScript + Vite + Tailwind CSS
│   ├── src/
│   │   ├── api/          # API client
│   │   ├── components/
│   │   │   ├── CriteriaBuilder/  # Drag & drop builder
│   │   │   ├── EmployeePreview/  # Employee list
│   │   │   ├── GroupManager/     # Create/bulk-add modal + sync manager
│   │   │   ├── Layout/          # Header
│   │   │   └── common/          # Shared components
│   │   └── types/        # TypeScript types
│
└── docs/             # Documentation
```

## Quick Start

### Prerequisites

- Node.js 18+
- npm 9+

### Installation

```bash
npm run install:all
```

### Running in Development (Mock Mode)

No API credentials needed — the app runs with realistic mock data:

```bash
npm run dev
```

- Frontend: http://localhost:5173
- Backend API: http://localhost:3001

### Configuration with Real APIs

Copy the environment template and fill in your credentials:

```bash
cp backend/.env.example backend/.env
```

#### HiBob Setup

1. Create a [Service User](https://apidocs.hibob.com/docs/api-service-users) in HiBob
2. Assign appropriate permissions (read employee data)
3. Add `HIBOB_SERVICE_USER_ID` and `HIBOB_SERVICE_USER_TOKEN` to `.env`

#### Slack Setup

1. Create a [Slack App](https://api.slack.com/apps) with these scopes:
   - `usergroups:read`, `usergroups:write` — manage user groups
   - `channels:manage`, `channels:read` — create and list channels
   - `groups:read` — list private channels
   - `conversations:invite` — invite users to channels
   - `users:read`, `users:read.email` — look up users
2. Install the app to your workspace
3. Add `SLACK_BOT_TOKEN` (xoxb-...) and `SLACK_USER_TOKEN` (xoxp-...) to `.env`

## API Endpoints

| Method | Endpoint                 | Description                             |
| ------ | ------------------------ | --------------------------------------- |
| GET    | `/api/health`            | Health check + mock mode status         |
| GET    | `/api/employees`         | List all employees                      |
| GET    | `/api/employees/fields`  | Get available HiBob fields              |
| POST   | `/api/employees/match`   | Match employees by criteria             |
| GET    | `/api/groups/channels`   | List existing Slack channels            |
| GET    | `/api/groups/usergroups` | List existing Slack user groups         |
| POST   | `/api/groups/create`     | Create new channel or user group        |
| POST   | `/api/groups/bulk-add`   | Bulk add members to existing target     |
| GET    | `/api/sync`              | List scheduled syncs                    |
| POST   | `/api/sync`              | Create a new scheduled sync             |
| PUT    | `/api/sync/:id`          | Update sync (enable/disable, interval)  |
| DELETE | `/api/sync/:id`          | Delete a scheduled sync                 |
| POST   | `/api/sync/:id/run`      | Manually trigger a sync now             |
| GET    | `/api/templates`         | List saved templates                    |
| POST   | `/api/templates`         | Save a criteria template                |
| DELETE | `/api/templates/:id`     | Delete a template                       |

## How It Works

### Building Criteria

1. **Select fields** from the left panel (Department, Site, Team, etc.)
2. **Drag & drop** fields into the criteria builder
3. **Configure rules** — set operators (equals, contains, etc.) and values
4. **Preview matches** — see matching employees in real-time on the right

### Creating a Channel or Group

1. Click **"Add to Slack"** when you have matching employees
2. Choose **"Create New"** tab
3. Select **Channel** or **User Group**
4. Name it, and all matching employees with Slack IDs are added

### Bulk Adding to Existing

1. Click **"Add to Slack"** → switch to **"Add to Existing"** tab
2. Select an existing channel or user group
3. All matching employees are bulk-added to the target

### Scheduled Sync (Membership Enforcement)

1. Click **"Sync Schedule"** button
2. Create a new sync with:
   - A target channel or user group
   - The current criteria (linked at creation time)
   - An interval (5 min to 24 hours)
   - Optional **exclusive mode** (removes members who don't match)
3. The system automatically checks and enforces membership on schedule
4. Manually trigger with **"Run now"** button

## Tech Stack

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS 4, @dnd-kit
- **Backend**: Node.js, Express, TypeScript, Axios
- **APIs**: HiBob People API, Slack Web API
