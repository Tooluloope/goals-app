/**
 * Mock Data Service
 *
 * This service provides a mock implementation of data operations.
 * In production, replace these functions with actual API calls.
 *
 * The service is designed with clear interfaces so it can be easily
 * swapped out for a real backend (REST API, GraphQL, Firebase, etc.)
 */

import {
  User,
  Workspace,
  Project,
  Task,
  Notification,
  CreateProjectData,
  CreateTaskData,
  AddReviewData,
  ChecklistItem,
  ReviewNote,
  UserSettings,
} from '@/types';
import { seedData } from '@/lib/seed-data';
import { generateId } from '@/lib/utils';

// Simulate network delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
const SIMULATED_DELAY = 300;

// In-memory data store (mimics database)
let users = [...seedData.users];
let workspaces = [...seedData.workspaces];
let projects = [...seedData.projects];
let notifications = [...seedData.notifications];

// ============================================================
// AUTH OPERATIONS
// ============================================================

export async function login(email: string, password: string): Promise<User | null> {
  await delay(SIMULATED_DELAY);

  // Mock validation - in production, this would verify against a real auth provider
  const user = users.find(u => u.email === email);
  if (user && password.length >= 6) {
    return user;
  }
  return null;
}

export async function signup(name: string, email: string, password: string): Promise<User> {
  await delay(SIMULATED_DELAY);

  // Check if user already exists
  if (users.find(u => u.email === email)) {
    throw new Error('User with this email already exists');
  }

  const newUser: User = {
    id: generateId(),
    name,
    email,
    defaultWorkspaceId: '',
    settings: {
      theme: 'light',
      compactMode: false,
      showWelcomeOnLogin: true,
    },
  };

  // Create personal workspace for new user
  const personalWorkspace: Workspace = {
    id: generateId(),
    name: `${name}'s Goals`,
    type: 'personal',
    memberIds: [newUser.id],
  };

  newUser.defaultWorkspaceId = personalWorkspace.id;

  users.push(newUser);
  workspaces.push(personalWorkspace);

  return newUser;
}

export async function getCurrentUser(userId: string): Promise<User | null> {
  await delay(SIMULATED_DELAY);
  return users.find(u => u.id === userId) || null;
}

export async function updateUserSettings(userId: string, settings: Partial<UserSettings>): Promise<User> {
  await delay(SIMULATED_DELAY);

  const userIndex = users.findIndex(u => u.id === userId);
  if (userIndex === -1) throw new Error('User not found');

  users[userIndex] = {
    ...users[userIndex],
    settings: {
      ...users[userIndex].settings,
      ...settings,
    },
  };

  return users[userIndex];
}

// ============================================================
// WORKSPACE OPERATIONS
// ============================================================

export async function getWorkspacesForUser(userId: string): Promise<Workspace[]> {
  await delay(SIMULATED_DELAY);
  return workspaces.filter(ws => ws.memberIds.includes(userId));
}

export async function getWorkspace(workspaceId: string): Promise<Workspace | null> {
  await delay(SIMULATED_DELAY);
  return workspaces.find(ws => ws.id === workspaceId) || null;
}

export async function inviteToWorkspace(workspaceId: string, email: string): Promise<void> {
  await delay(SIMULATED_DELAY);

  const user = users.find(u => u.email === email);
  if (!user) throw new Error('User not found');

  const workspaceIndex = workspaces.findIndex(ws => ws.id === workspaceId);
  if (workspaceIndex === -1) throw new Error('Workspace not found');

  if (!workspaces[workspaceIndex].memberIds.includes(user.id)) {
    workspaces[workspaceIndex].memberIds.push(user.id);
  }
}

// ============================================================
// PROJECT OPERATIONS
// ============================================================

export async function getProjectsForWorkspace(workspaceId: string): Promise<Project[]> {
  await delay(SIMULATED_DELAY);
  return projects.filter(p => p.workspaceId === workspaceId);
}

export async function getProjectsForUser(userId: string): Promise<Project[]> {
  await delay(SIMULATED_DELAY);

  const userWorkspaces = workspaces.filter(ws => ws.memberIds.includes(userId));
  const workspaceIds = userWorkspaces.map(ws => ws.id);

  return projects.filter(p => workspaceIds.includes(p.workspaceId));
}

export async function getProject(projectId: string): Promise<Project | null> {
  await delay(SIMULATED_DELAY);
  return projects.find(p => p.id === projectId) || null;
}

export async function createProject(data: CreateProjectData): Promise<Project> {
  await delay(SIMULATED_DELAY);

  const now = new Date().toISOString();

  const newProject: Project = {
    id: generateId(),
    workspaceId: data.workspaceId,
    name: data.name,
    statusId: data.statusId,
    areaId: data.areaId,
    startDate: data.startDate,
    targetDate: data.targetDate,
    cadenceId: data.cadenceId,
    priorityId: data.priorityId,
    successMetric: data.successMetric,
    confidenceId: data.confidenceId,
    objective: data.objective,
    requirements: [],
    definitionOfDone: [],
    keyDecisions: [],
    tasks: [],
    metrics: {},
    reviewNotes: [],
    createdAt: now,
    updatedAt: now,
  };

  projects.push(newProject);
  return newProject;
}

export async function updateProject(projectId: string, updates: Partial<Project>): Promise<Project> {
  await delay(SIMULATED_DELAY);

  const projectIndex = projects.findIndex(p => p.id === projectId);
  if (projectIndex === -1) throw new Error('Project not found');

  projects[projectIndex] = {
    ...projects[projectIndex],
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  return projects[projectIndex];
}

export async function updateProjectStatus(projectId: string, statusId: string): Promise<Project> {
  return updateProject(projectId, { statusId });
}

export async function deleteProject(projectId: string): Promise<void> {
  await delay(SIMULATED_DELAY);
  projects = projects.filter(p => p.id !== projectId);
}

// ============================================================
// CHECKLIST OPERATIONS
// ============================================================

export async function addRequirement(projectId: string, text: string): Promise<Project> {
  await delay(SIMULATED_DELAY);

  const projectIndex = projects.findIndex(p => p.id === projectId);
  if (projectIndex === -1) throw new Error('Project not found');

  const newItem: ChecklistItem = {
    id: generateId(),
    text,
    completed: false,
  };

  projects[projectIndex].requirements.push(newItem);
  projects[projectIndex].updatedAt = new Date().toISOString();

  return projects[projectIndex];
}

export async function toggleRequirement(projectId: string, itemId: string): Promise<Project> {
  await delay(SIMULATED_DELAY);

  const projectIndex = projects.findIndex(p => p.id === projectId);
  if (projectIndex === -1) throw new Error('Project not found');

  const itemIndex = projects[projectIndex].requirements.findIndex(r => r.id === itemId);
  if (itemIndex === -1) throw new Error('Requirement not found');

  projects[projectIndex].requirements[itemIndex].completed =
    !projects[projectIndex].requirements[itemIndex].completed;
  projects[projectIndex].updatedAt = new Date().toISOString();

  return projects[projectIndex];
}

export async function addDefinitionOfDone(projectId: string, text: string): Promise<Project> {
  await delay(SIMULATED_DELAY);

  const projectIndex = projects.findIndex(p => p.id === projectId);
  if (projectIndex === -1) throw new Error('Project not found');

  const newItem: ChecklistItem = {
    id: generateId(),
    text,
    completed: false,
  };

  projects[projectIndex].definitionOfDone.push(newItem);
  projects[projectIndex].updatedAt = new Date().toISOString();

  return projects[projectIndex];
}

export async function toggleDefinitionOfDone(projectId: string, itemId: string): Promise<Project> {
  await delay(SIMULATED_DELAY);

  const projectIndex = projects.findIndex(p => p.id === projectId);
  if (projectIndex === -1) throw new Error('Project not found');

  const itemIndex = projects[projectIndex].definitionOfDone.findIndex(d => d.id === itemId);
  if (itemIndex === -1) throw new Error('Definition of done item not found');

  projects[projectIndex].definitionOfDone[itemIndex].completed =
    !projects[projectIndex].definitionOfDone[itemIndex].completed;
  projects[projectIndex].updatedAt = new Date().toISOString();

  return projects[projectIndex];
}

// ============================================================
// TASK OPERATIONS
// ============================================================

export async function createTask(data: CreateTaskData): Promise<Task> {
  await delay(SIMULATED_DELAY);

  const projectIndex = projects.findIndex(p => p.id === data.projectId);
  if (projectIndex === -1) throw new Error('Project not found');

  const now = new Date().toISOString();

  const newTask: Task = {
    id: generateId(),
    projectId: data.projectId,
    title: data.title,
    statusId: data.statusId,
    dueDate: data.dueDate,
    assignedTo: data.assignedTo,
    images: data.images,
    createdAt: now,
    updatedAt: now,
  };

  projects[projectIndex].tasks.push(newTask);
  projects[projectIndex].updatedAt = now;

  return newTask;
}

export async function updateTaskStatus(projectId: string, taskId: string, statusId: string): Promise<Task> {
  await delay(SIMULATED_DELAY);

  const projectIndex = projects.findIndex(p => p.id === projectId);
  if (projectIndex === -1) throw new Error('Project not found');

  const taskIndex = projects[projectIndex].tasks.findIndex(t => t.id === taskId);
  if (taskIndex === -1) throw new Error('Task not found');

  const now = new Date().toISOString();

  projects[projectIndex].tasks[taskIndex] = {
    ...projects[projectIndex].tasks[taskIndex],
    statusId,
    updatedAt: now,
  };
  projects[projectIndex].updatedAt = now;

  return projects[projectIndex].tasks[taskIndex];
}

export async function updateTask(projectId: string, taskId: string, updates: Partial<Task>): Promise<Task> {
  await delay(SIMULATED_DELAY);

  const projectIndex = projects.findIndex(p => p.id === projectId);
  if (projectIndex === -1) throw new Error('Project not found');

  const taskIndex = projects[projectIndex].tasks.findIndex(t => t.id === taskId);
  if (taskIndex === -1) throw new Error('Task not found');

  const now = new Date().toISOString();

  projects[projectIndex].tasks[taskIndex] = {
    ...projects[projectIndex].tasks[taskIndex],
    ...updates,
    updatedAt: now,
  };
  projects[projectIndex].updatedAt = now;

  return projects[projectIndex].tasks[taskIndex];
}

export async function deleteTask(projectId: string, taskId: string): Promise<void> {
  await delay(SIMULATED_DELAY);

  const projectIndex = projects.findIndex(p => p.id === projectId);
  if (projectIndex === -1) throw new Error('Project not found');

  projects[projectIndex].tasks = projects[projectIndex].tasks.filter(t => t.id !== taskId);
  projects[projectIndex].updatedAt = new Date().toISOString();
}

// ============================================================
// REVIEW OPERATIONS
// ============================================================

export async function addReview(data: AddReviewData): Promise<Project> {
  await delay(SIMULATED_DELAY);

  const projectIndex = projects.findIndex(p => p.id === data.projectId);
  if (projectIndex === -1) throw new Error('Project not found');

  const now = new Date().toISOString();
  const today = now.split('T')[0];

  const newReview: ReviewNote = {
    id: generateId(),
    date: today,
    notes: data.notes,
    progress: data.progress,
    blockers: data.blockers,
    changes: data.changes,
    nextStep: data.nextStep,
    images: data.images,
  };

  projects[projectIndex].reviewNotes.push(newReview);
  projects[projectIndex].lastReviewDate = today;
  projects[projectIndex].updatedAt = now;

  return projects[projectIndex];
}

// ============================================================
// NOTIFICATION OPERATIONS
// ============================================================

export async function getNotificationsForUser(userId: string): Promise<Notification[]> {
  await delay(SIMULATED_DELAY);
  return notifications.filter(n => n.userId === userId);
}

export async function getUnreadNotificationsCount(userId: string): Promise<number> {
  await delay(SIMULATED_DELAY);
  return notifications.filter(n => n.userId === userId && !n.readAt).length;
}

export async function markNotificationRead(notificationId: string): Promise<Notification> {
  await delay(SIMULATED_DELAY);

  const index = notifications.findIndex(n => n.id === notificationId);
  if (index === -1) throw new Error('Notification not found');

  notifications[index].readAt = new Date().toISOString();
  return notifications[index];
}

export async function markAllNotificationsRead(userId: string): Promise<void> {
  await delay(SIMULATED_DELAY);

  const now = new Date().toISOString();
  notifications = notifications.map(n =>
    n.userId === userId && !n.readAt ? { ...n, readAt: now } : n
  );
}

export async function createNotification(
  userId: string,
  type: Notification['type'],
  title: string,
  body: string,
  projectId?: string,
  taskId?: string
): Promise<Notification> {
  await delay(SIMULATED_DELAY);

  const newNotification: Notification = {
    id: generateId(),
    userId,
    type,
    title,
    body,
    projectId,
    taskId,
    createdAt: new Date().toISOString(),
  };

  notifications.push(newNotification);
  return newNotification;
}

// ============================================================
// UTILITY FUNCTIONS
// ============================================================

// Reset data to seed state (useful for testing)
export function resetToSeedData(): void {
  users = [...seedData.users];
  workspaces = [...seedData.workspaces];
  projects = [...seedData.projects];
  notifications = [...seedData.notifications];
}

// Get all tasks across projects for a user (for calendar view)
export async function getAllTasksForUser(userId: string): Promise<{ task: Task; project: Project }[]> {
  await delay(SIMULATED_DELAY);

  const userProjects = await getProjectsForUser(userId);
  const allTasks: { task: Task; project: Project }[] = [];

  for (const project of userProjects) {
    for (const task of project.tasks) {
      allTasks.push({ task, project });
    }
  }

  return allTasks;
}
