# Dynamic Slack Group Builder

Build and manage Slack user groups dynamically based on employee criteria from HiBob HR system. Features a drag-and-drop interface for creating group rules.

## Features

- **Drag & Drop Criteria Builder** — Drag employee fields from HiBob to build dynamic group rules
- **Real-time Employee Preview** — See matching employees as you build criteria
- **AND/OR Logic** — Combine criteria with AND or OR operators
- **Slack Group Creation** — Create Slack user groups and channels directly
- **Template System** — Save and reuse criteria templates
- **Mock Mode** — Works without API credentials for demo/development

## Architecture

```
├── backend/          # Node.js + Express + TypeScript API
│   ├── src/
│   │   ├── routes/       # API endpoints
│   │   ├── services/     # HiBob, Slack, Criteria, Template services
│   │   ├── types/        # TypeScript type definitions
│   │   └── middleware/    # Logger, error handling
│   └── data/             # Template storage (JSON)
│
├── frontend/         # React + TypeScript + Vite + Tailwind CSS
│   ├── src/
│   │   ├── api/          # API client
│   │   ├── components/   # React components
│   │   │   ├── CriteriaBuilder/  # Drag & drop builder
│   │   │   ├── EmployeePreview/  # Employee list
│   │   │   ├── GroupManager/     # Group creation modal + templates
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
   - `channels:manage` — create channels
   - `users:read`, `users:read.email` — look up users
2. Install the app to your workspace
3. Add `SLACK_BOT_TOKEN` (xoxb-...) and `SLACK_USER_TOKEN` (xoxp-...) to `.env`

## API Endpoints

| Method | Endpoint               | Description                     |
| ------ | ---------------------- | ------------------------------- |
| GET    | `/api/health`          | Health check + mock mode status |
| GET    | `/api/employees`       | List all employees              |
| GET    | `/api/employees/fields`| Get available HiBob fields      |
| POST   | `/api/employees/match` | Match employees by criteria     |
| GET    | `/api/groups/usergroups` | List Slack user groups        |
| POST   | `/api/groups/create`   | Create Slack group from criteria|
| GET    | `/api/templates`       | List saved templates            |
| POST   | `/api/templates`       | Save a criteria template        |
| DELETE | `/api/templates/:id`   | Delete a template               |

## How It Works

1. **Select fields** from the left panel (Department, Site, Team, etc.)
2. **Drag & drop** fields into the criteria builder
3. **Configure rules** — set operators (equals, contains, etc.) and values
4. **Preview matches** — see matching employees in real-time on the right
5. **Create group** — click to create a Slack user group with matched employees
6. **Save templates** — save criteria for reuse

## Tech Stack

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS 4, @dnd-kit
- **Backend**: Node.js, Express, TypeScript, Axios
- **APIs**: HiBob People API, Slack Web API
