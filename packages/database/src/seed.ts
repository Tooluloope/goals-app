import { config } from 'dotenv';
import path from 'path';

// Load .env from monorepo root
config({ path: path.resolve(__dirname, '../../../.env') });

import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const DEFAULT_CONFIG = {
  statuses: [
    {
      id: 'status-todo',
      name: 'To Do',
      color: 'slate',
      order: 1,
      type: 'active',
      showInBoard: true,
      countAsProgress: false,
      isDefault: true,
    },
    {
      id: 'status-doing',
      name: 'Doing',
      color: 'blue',
      order: 2,
      type: 'active',
      showInBoard: true,
      countAsProgress: false,
      isDefault: true,
    },
    {
      id: 'status-done',
      name: 'Done',
      color: 'emerald',
      order: 3,
      type: 'completed',
      showInBoard: true,
      countAsProgress: true,
      isDefault: true,
    },
    {
      id: 'status-failed',
      name: 'Failed',
      color: 'red',
      order: 4,
      type: 'cancelled',
      showInBoard: true,
      countAsProgress: false,
      isDefault: true,
    },
  ],
  areas: [
    {
      id: 'area-faith',
      name: 'Faith',
      color: 'violet',
      order: 1,
      description: 'Spiritual growth and practices',
    },
    {
      id: 'area-family',
      name: 'Family',
      color: 'pink',
      order: 2,
      description: 'Family relationships and activities',
    },
    {
      id: 'area-learning',
      name: 'Learning',
      color: 'sky',
      order: 3,
      description: 'Education and skill development',
    },
    {
      id: 'area-career',
      name: 'Career',
      color: 'emerald',
      order: 4,
      description: 'Professional growth',
    },
    {
      id: 'area-finance',
      name: 'Finance',
      color: 'amber',
      order: 5,
      description: 'Financial goals and management',
    },
    {
      id: 'area-health',
      name: 'Health',
      color: 'red',
      order: 6,
      description: 'Physical and mental wellbeing',
    },
    {
      id: 'area-personal',
      name: 'Personal',
      color: 'purple',
      order: 7,
      description: 'Personal development',
    },
    {
      id: 'area-business',
      name: 'Business',
      color: 'blue',
      order: 8,
      description: 'Business ventures',
    },
  ],
  priorities: [
    { id: 'priority-high', name: 'High', color: 'red', order: 1, level: 1 },
    { id: 'priority-medium', name: 'Medium', color: 'amber', order: 2, level: 2 },
    { id: 'priority-low', name: 'Low', color: 'slate', order: 3, level: 3 },
  ],
  cadences: [
    { id: 'cadence-weekly', name: 'Weekly', color: 'blue', order: 1, days: 7 },
    { id: 'cadence-biweekly', name: 'Bi-weekly', color: 'indigo', order: 2, days: 14 },
    { id: 'cadence-monthly', name: 'Monthly', color: 'purple', order: 3, days: 30 },
    { id: 'cadence-quarterly', name: 'Quarterly', color: 'violet', order: 4, days: 90 },
  ],
  confidences: [
    { id: 'confidence-high', name: 'High', color: 'emerald', order: 1, level: 3 },
    { id: 'confidence-medium', name: 'Medium', color: 'amber', order: 2, level: 2 },
    { id: 'confidence-low', name: 'Low', color: 'red', order: 3, level: 1 },
  ],
  taskStatuses: [
    {
      id: 'task-backlog',
      name: 'Backlog',
      color: 'slate',
      order: 1,
      type: 'pending',
      countAsProgress: false,
    },
    {
      id: 'task-next',
      name: 'Next Action',
      color: 'blue',
      order: 2,
      type: 'active',
      countAsProgress: false,
    },
    {
      id: 'task-done',
      name: 'Done',
      color: 'emerald',
      order: 3,
      type: 'completed',
      countAsProgress: true,
    },
  ],
  defaults: {
    status: 'status-todo',
    priority: 'priority-medium',
    cadence: 'cadence-monthly',
    confidence: 'confidence-medium',
    taskStatus: 'task-next',
  },
  board: {
    showArchivedStatuses: false,
    defaultGroupBy: 'status',
    cardDisplayFields: ['area', 'priority', 'targetDate', 'progress'],
  },
  dashboard: {
    dueSoonDays: 14,
    staleDays: 30,
    maxDailyFocusItems: 5,
    showCompletedInFocus: false,
  },
  notifications: {
    reviewReminders: true,
    dueSoonReminders: true,
    staleProjectReminders: true,
    dailyDigest: false,
  },
};

async function main() {
  console.log('Seeding database...');

  // Create demo user
  const passwordHash = await bcrypt.hash('password123', 10);

  const user = await prisma.user.upsert({
    where: { email: 'demo@example.com' },
    update: {},
    create: {
      email: 'demo@example.com',
      name: 'Demo User',
      passwordHash,
      settings: {
        theme: 'light',
        compactMode: false,
        showWelcomeOnLogin: true,
      },
    },
  });

  console.log('Created user:', user.email);

  // Create personal workspace
  const workspace = await prisma.workspace.upsert({
    where: { id: 'demo-workspace' },
    update: {},
    create: {
      id: 'demo-workspace',
      name: "Demo User's Workspace",
      type: 'personal',
      ownerId: user.id,
    },
  });

  console.log('Created workspace:', workspace.name);

  // Add user as workspace member
  await prisma.workspaceMember.upsert({
    where: {
      workspaceId_userId: {
        workspaceId: workspace.id,
        userId: user.id,
      },
    },
    update: {},
    create: {
      workspaceId: workspace.id,
      userId: user.id,
      role: 'owner',
    },
  });

  // Update user's default workspace
  await prisma.user.update({
    where: { id: user.id },
    data: { defaultWorkspaceId: workspace.id },
  });

  // Create workspace config
  await prisma.workspaceConfig.upsert({
    where: { workspaceId: workspace.id },
    update: { config: DEFAULT_CONFIG },
    create: {
      workspaceId: workspace.id,
      config: DEFAULT_CONFIG,
    },
  });

  console.log('Created workspace config');

  // Create a sample project
  const project = await prisma.project.upsert({
    where: { id: 'demo-project' },
    update: {},
    create: {
      id: 'demo-project',
      workspaceId: workspace.id,
      name: 'Read 12 Books in 2025',
      statusId: 'status-doing',
      areaIds: ['area-learning'],
      priorityId: 'priority-high',
      cadenceId: 'cadence-monthly',
      confidenceId: 'confidence-high',
      startDate: new Date('2025-01-01'),
      targetDate: new Date('2025-12-31'),
      objective: 'Read one book per month to expand knowledge and improve reading habits',
      successMetric: '12 books completed with notes',
    },
  });

  console.log('Created project:', project.name);

  // Create project metrics
  await prisma.projectMetrics.upsert({
    where: { projectId: project.id },
    update: {},
    create: {
      projectId: project.id,
      primaryMetric: 'Books read',
      leadingIndicator: 'Pages read per week',
    },
  });

  // Create some tasks
  const tasks = [
    { title: 'Pick first book to read', statusId: 'task-done' },
    { title: 'Set up reading schedule', statusId: 'task-done' },
    { title: 'Create book notes template', statusId: 'task-next' },
    { title: 'Join a book club', statusId: 'task-backlog' },
  ];

  for (const task of tasks) {
    await prisma.task.create({
      data: {
        projectId: project.id,
        title: task.title,
        statusId: task.statusId,
      },
    });
  }

  console.log('Created tasks');

  // Create some checklist items
  const requirements = [
    { text: 'Read at least 1 book per month', completed: false },
    { text: 'Take notes for each book', completed: false },
    { text: 'Write a short summary after finishing', completed: false },
  ];

  for (let i = 0; i < requirements.length; i++) {
    await prisma.checklistItem.create({
      data: {
        projectId: project.id,
        type: 'requirement',
        text: requirements[i].text,
        completed: requirements[i].completed,
        order: i,
      },
    });
  }

  console.log('Created checklist items');

  console.log('Seeding completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
