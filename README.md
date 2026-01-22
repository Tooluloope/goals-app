# 2026 Goals Tracker

A production-grade, mobile-first web application for tracking personal and family goals with a Kanban board, project pages, checklists, tasks, reviews, and notifications.

## Features

- **Authentication**: Email/password login with demo credentials
- **Dashboard**: Daily focus tasks, upcoming deadlines, reviews due, and stale project alerts
- **Kanban Board**: Drag-and-drop goals between Todo, Doing, Done, and Failed columns
- **Project Pages**: Detailed goal tracking with objectives, requirements, tasks, reviews, and retrospectives
- **Calendar View**: Visual overview of task due dates and project deadlines
- **Notifications**: In-app notification feed with summary modal on login
- **Settings**: Profile management, workspace switching, notification preferences
- **Mobile-First**: Responsive design with bottom navigation on mobile and sidebar on desktop

## Tech Stack

- **Framework**: Next.js 14 (App Router) + TypeScript
- **Styling**: Tailwind CSS + shadcn/ui components
- **State Management**: Zustand (UI state) + React Query (server state)
- **Forms**: React Hook Form + Zod validation
- **Drag & Drop**: @dnd-kit/core
- **Icons**: Lucide React
- **Date Handling**: date-fns

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Demo Credentials

- **Email**: tolu@example.com
- **Password**: password123

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── auth/              # Authentication pages
│   ├── board/             # Kanban board
│   ├── calendar/          # Calendar view
│   ├── dashboard/         # Main dashboard
│   ├── notifications/     # Notifications feed
│   ├── project/           # Project detail pages
│   └── settings/          # Settings page
├── components/
│   ├── auth/              # Authentication components
│   ├── board/             # Kanban board components
│   ├── dashboard/         # Dashboard widgets
│   ├── layout/            # Layout components (sidebar, nav)
│   ├── notifications/     # Notification components
│   ├── project/           # Project page sections
│   ├── shared/            # Shared modals and components
│   └── ui/                # Base UI components (shadcn/ui)
├── hooks/                 # Custom React hooks
├── lib/                   # Utilities and seed data
├── services/              # Data service layer
├── store/                 # Zustand stores
└── types/                 # TypeScript types
```

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

Weekly (7 days), Monthly (30 days), Quarterly (90 days)

## Extending with a Real Backend

The app uses a mock data service (`src/services/data-service.ts`) designed for easy replacement:

### 1. Replace the Data Service

```typescript
// src/services/data-service.ts

// Instead of in-memory operations, call your API:
export async function getProjectsForWorkspace(workspaceId: string): Promise<Project[]> {
  const response = await fetch(`/api/workspaces/${workspaceId}/projects`);
  return response.json();
}
```

### 2. Add Real Authentication

Replace the mock auth with NextAuth.js or your preferred auth provider:

```typescript
// Install NextAuth
npm install next-auth

// Create API route: src/app/api/auth/[...nextauth]/route.ts
import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

export const authOptions = {
  providers: [
    CredentialsProvider({
      // Configure your auth
    }),
  ],
};

export const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
```

### 3. API Routes Structure (Suggested)

```
/api/auth/*           # Authentication
/api/users/:id        # User management
/api/workspaces/*     # Workspace operations
/api/projects/*       # Project CRUD
/api/notifications/*  # Notifications
```

### 4. Database Schema (Suggested)

Use your preferred database. Example Prisma schema:

```prisma
model User {
  id        String    @id @default(cuid())
  email     String    @unique
  name      String
  projects  Project[]
  workspaces Workspace[] @relation("WorkspaceMembers")
}

model Workspace {
  id       String    @id @default(cuid())
  name     String
  type     String
  members  User[]    @relation("WorkspaceMembers")
  projects Project[]
}

model Project {
  id          String   @id @default(cuid())
  name        String
  status      String
  area        String
  priority    String
  workspace   Workspace @relation(fields: [workspaceId], references: [id])
  workspaceId String
  // ... other fields
}
```

## Key Features Implementation

### Daily Focus Logic

Shows NextAction tasks from Doing projects, prioritized by project priority and deadline.

### Review Due Logic

- Weekly: Due if lastReviewDate > 7 days ago
- Monthly: Due if lastReviewDate > 30 days ago
- Quarterly: Due if lastReviewDate > 90 days ago

### Progress Calculation

```
progress = (completed requirements + completed definition items + done tasks) / total items
```

### Stale Project Detection

Projects in "Doing" status with no updates in 30+ days.

## Customization

### Theme Colors

Edit CSS variables in `src/app/globals.css`:

```css
:root {
  --primary: 222.2 47.4% 11.2%;
  --secondary: 210 40% 96.1%;
  /* ... */
}
```

### Area Colors

Modify `areaColors` in `src/lib/utils.ts` to change goal category colors.

## Scripts

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run ESLint
```

## License

MIT
