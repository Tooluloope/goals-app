# Alignia - Monorepo

A full-stack family goals and vision tracking application built with Next.js, NestJS, PostgreSQL, and Prisma.

## Features

- **Authentication**: JWT-based auth with refresh tokens
- **Dashboard**: Daily focus tasks, upcoming deadlines, reviews due, and stale project alerts
- **Kanban Board**: Drag-and-drop goals between Todo, Doing, Done, and Failed columns
- **Project Pages**: Detailed goal tracking with objectives, requirements, tasks, reviews, and retrospectives
- **Calendar View**: Visual overview of task due dates and project deadlines
- **Notifications**: In-app notification feed
- **Settings**: Profile management, workspace switching, notification preferences
- **Mobile-First**: Responsive design with bottom navigation on mobile and sidebar on desktop

## Project Structure

```
goals-app/
├── apps/
│   ├── web/          # Next.js 14 frontend
│   └── api/          # NestJS backend
├── packages/
│   ├── shared/       # Shared types & validation schemas (Zod)
│   └── database/     # Prisma schema & client
├── docker-compose.yml
├── turbo.json
├── package.json
└── pnpm-workspace.yaml
```

## Tech Stack

- **Frontend**: Next.js 14, React, Tailwind CSS, Radix UI, React Query, Zustand
- **Backend**: NestJS, Passport JWT, Prisma
- **Database**: PostgreSQL
- **Monorepo**: Turborepo, pnpm workspaces
- **Validation**: Zod (shared between frontend & backend)

## Prerequisites

- Node.js 18+
- pnpm 8+
- Docker (for PostgreSQL)

## Getting Started

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Start PostgreSQL

```bash
docker-compose up -d
```

### 3. Setup Database

```bash
# Generate Prisma client
pnpm db:generate

# Push schema to database
pnpm db:push

# Seed with demo data (optional)
pnpm db:seed
```

### 4. Start Development Servers

```bash
# Start both web and api
pnpm dev

# Or start individually
pnpm dev:web  # Frontend on http://localhost:3008
pnpm dev:api  # Backend on http://localhost:3001
```

## Available Scripts

| Command             | Description                        |
| ------------------- | ---------------------------------- |
| `pnpm dev`          | Start all apps in development mode |
| `pnpm dev:web`      | Start frontend only                |
| `pnpm dev:api`      | Start backend only                 |
| `pnpm build`        | Build all apps                     |
| `pnpm lint`         | Lint all apps                      |
| `pnpm typecheck`    | Run TypeScript type checking       |
| `pnpm format`       | Format code with Prettier          |
| `pnpm format:check` | Check code formatting              |
| `pnpm db:generate`  | Generate Prisma client             |
| `pnpm db:push`      | Push schema to database            |
| `pnpm db:migrate`   | Run database migrations            |
| `pnpm db:seed`      | Seed database with demo data       |

## Environment Variables

Copy `.env.example` to `.env` and configure:

```env
# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/goals_db

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# API
API_PORT=3001
CORS_ORIGIN=http://localhost:3008

# Frontend
NEXT_PUBLIC_API_URL=http://localhost:3001
```

## Demo Credentials

After running `pnpm db:seed`:

- **Email**: demo@example.com
- **Password**: password123

## API Endpoints

### Authentication

- `POST /api/auth/login` - User login
- `POST /api/auth/signup` - User registration
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - User logout

### Users

- `GET /api/users/me` - Get current user
- `PATCH /api/users/me/settings` - Update user settings

### Workspaces

- `GET /api/workspaces` - List user's workspaces
- `GET /api/workspaces/:id` - Get workspace details
- `POST /api/workspaces/:id/invite` - Invite user to workspace

### Projects

- `GET /api/projects/workspace/:id` - List workspace projects
- `GET /api/projects/:id` - Get project details
- `POST /api/projects` - Create project
- `PUT /api/projects/:id` - Update project
- `PATCH /api/projects/:id/status` - Update project status
- `DELETE /api/projects/:id` - Delete project
- `POST /api/projects/:id/requirements` - Add requirement
- `POST /api/projects/:id/reviews` - Add review

### Tasks

- `GET /api/tasks` - List all tasks
- `POST /api/tasks` - Create task
- `PATCH /api/tasks/:id/status` - Update task status
- `DELETE /api/tasks/:id` - Delete task

### Notifications

- `GET /api/notifications` - List notifications
- `GET /api/notifications/unread-count` - Get unread count
- `PATCH /api/notifications/:id/read` - Mark as read
- `PATCH /api/notifications/read-all` - Mark all as read

### Config

- `GET /api/config/workspace/:id` - Get workspace config
- `PUT /api/config/workspace/:id` - Update workspace config

## Data Model

### Core Entities

- **User**: id, name, email, avatar, settings
- **Workspace**: Personal or Family workspaces with member management
- **Project (Goal)**: Status, area, priority, timeline, checklists, tasks, reviews
- **Task**: Backlog, NextAction, or Done status with optional due dates
- **Notification**: DueSoon, Overdue, ReviewDue, StaleProject, DailyFocus types

### Project Areas

Faith, Family, Learning, Career, Finance, Health, Personal, Business

### Review Cadences

Weekly (7 days), Bi-weekly (14 days), Monthly (30 days), Quarterly (90 days)

## Code Quality

- **Prettier**: Code formatting (configured in `.prettierrc`)
- **Husky**: Git hooks for pre-commit formatting via lint-staged
- **TypeScript**: Strict type checking across all packages

## Architecture Details

### State Management (`apps/web/src/store/`)

| Store             | Purpose                                                              |
| ----------------- | -------------------------------------------------------------------- |
| `auth-store.ts`   | User authentication state, login/logout actions, workspace selection |
| `config-store.ts` | Workspace configuration (statuses, priorities, cadences, etc.)       |
| `ui-store.ts`     | UI state (modals, sidebar, selected items)                           |

### Type System (`packages/shared/`)

All domain types are centralized in the shared package:

- **Entity types**: `User`, `Workspace`, `Project`, `Task`, `Review`, `Notification`
- **Configuration types**: `Status`, `Priority`, `Confidence`, `Cadence`, `Area`
- **DTOs**: `CreateProjectDTO`, `UpdateTaskDTO`, etc.

The web app re-exports these from `@alignia/shared` in `apps/web/src/types/index.ts`.

### Date Handling

The shared types use `Date` objects, but JSON serialization converts them to strings at runtime. The web app includes helpers in `apps/web/src/lib/utils.ts`:

```typescript
toDate(value: Date | string)     // Converts to Date object
toISOString(value: Date | string) // Converts to ISO string
```

### Key Frontend Components

| Directory               | Contents                                                  |
| ----------------------- | --------------------------------------------------------- |
| `components/ui/`        | Reusable UI primitives (Button, Card, Dialog, etc.)       |
| `components/shared/`    | Shared business components (AddProjectModal, ImageUpload) |
| `components/dashboard/` | Dashboard-specific widgets                                |
| `components/project/`   | Project detail page components                            |
| `components/board/`     | Kanban board components                                   |
| `components/layout/`    | App layout, sidebar, header, navigation                   |

## For LLMs/AI Assistants

When working with this codebase:

1. **Type imports**: Always import types from `@goals/shared` for consistency. The web app re-exports them from `@/types`.

2. **Date handling**: Use the `toDate()` helper from `@/lib/utils` when working with dates that may be strings (common after JSON serialization).

3. **API implementation**: Check `apps/api/src/` for endpoint implementations. Controllers are in module directories (e.g., `projects/projects.controller.ts`).

4. **Database schema**: Reference `packages/database/prisma/schema.prisma` for the data model.

5. **UI components**: Custom components are in `apps/web/src/components/ui/` - built on Radix UI primitives.

6. **State management**: Check Zustand stores in `apps/web/src/store/` before adding new global state. Use React Query for server state.

7. **Image handling**: The web app uses `LocalImageAttachment` (base64) for client-side processing, while the shared `ImageAttachment` type uses URLs for server storage.

8. **Configuration entities**: Statuses, priorities, cadences, and confidence levels are workspace-scoped and stored in the database, not hardcoded.

### File Locations Quick Reference

| What              | Where                                          |
| ----------------- | ---------------------------------------------- |
| Prisma schema     | `packages/database/prisma/schema.prisma`       |
| Shared types      | `packages/shared/src/types/`                   |
| API controllers   | `apps/api/src/<module>/<module>.controller.ts` |
| API services      | `apps/api/src/<module>/<module>.service.ts`    |
| Frontend pages    | `apps/web/src/app/`                            |
| React components  | `apps/web/src/components/`                     |
| Zustand stores    | `apps/web/src/store/`                          |
| React Query hooks | `apps/web/src/hooks/`                          |
| Utility functions | `apps/web/src/lib/utils.ts`                    |

## License

MIT
