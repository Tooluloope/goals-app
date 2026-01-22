// Re-export config types
export * from './config';

// User Types
export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  defaultWorkspaceId: string;
  settings: UserSettings;
}

export interface UserSettings {
  theme: 'light' | 'dark' | 'system';
  compactMode: boolean;
  showWelcomeOnLogin: boolean;
}

// Workspace Types
export type WorkspaceType = 'personal' | 'family';

export interface Workspace {
  id: string;
  name: string;
  type: WorkspaceType;
  memberIds: string[];
}

// Project Types - Using configurable IDs
export interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
}

// Image attachment type
export interface ImageAttachment {
  id: string;
  name: string;
  data: string; // Base64 encoded image data
  type: string; // MIME type (e.g., 'image/jpeg', 'image/png')
  size: number; // File size in bytes
  createdAt: string;
  caption?: string;
}

export interface KeyDecision {
  id: string;
  date: string;
  context: string;
  options: string[];
  chosen: string;
  rationale: string;
}

export interface ReviewNote {
  id: string;
  date: string;
  notes: string;
  progress: string;
  blockers: string;
  changes: string;
  nextStep: string;
  images?: ImageAttachment[];
}

export interface ProjectMetrics {
  primaryMetric?: string;
  leadingIndicator?: string;
  riskIndicator?: string;
}

export interface Retrospective {
  outcome: string;
  worked: string;
  didnt: string;
  lessons: string;
  carryForward: string;
}

export interface Project {
  id: string;
  workspaceId: string;
  name: string;
  statusId: string; // Reference to status config ID
  areaId: string; // Reference to area config ID
  startDate: string;
  targetDate: string;
  cadenceId: string; // Reference to cadence config ID
  priorityId: string; // Reference to priority config ID
  successMetric: string;
  lastReviewDate?: string;
  confidenceId: string; // Reference to confidence config ID
  objective: string;
  requirements: ChecklistItem[];
  definitionOfDone: ChecklistItem[];
  keyDecisions: KeyDecision[];
  tasks: Task[];
  metrics: ProjectMetrics;
  reviewNotes: ReviewNote[];
  retrospective?: Retrospective;
  failureCriteria?: string;
  images?: ImageAttachment[];
  createdAt: string;
  updatedAt: string;
}

// Task Types
export interface Task {
  id: string;
  projectId: string;
  title: string;
  statusId: string; // Reference to task status config ID
  dueDate?: string;
  assignedTo?: string;
  images?: ImageAttachment[];
  createdAt: string;
  updatedAt: string;
}

// Notification Types
export type NotificationType = 'DueSoon' | 'Overdue' | 'ReviewDue' | 'StaleProject' | 'DailyFocus';

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  projectId?: string;
  taskId?: string;
  createdAt: string;
  readAt?: string;
}

// UI State Types
export interface FilterState {
  areaIds: string[];
  priorityIds: string[];
  assignedTo: string[];
  dueSoon: boolean;
  reviewDue: boolean;
}

// API Response Types
export interface ApiResponse<T> {
  data: T;
  success: boolean;
  error?: string;
}

// Auth Types
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignupData {
  name: string;
  email: string;
  password: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

// Helper types for progress calculation
export interface ProjectProgress {
  completed: number;
  total: number;
  percentage: number;
}

// Form Types
export interface CreateProjectData {
  name: string;
  workspaceId: string;
  areaId: string;
  statusId: string;
  startDate: string;
  targetDate: string;
  cadenceId: string;
  priorityId: string;
  objective: string;
  successMetric: string;
  confidenceId: string;
}

export interface CreateTaskData {
  projectId: string;
  title: string;
  statusId: string;
  dueDate?: string;
  assignedTo?: string;
  images?: ImageAttachment[];
}

export interface AddReviewData {
  projectId: string;
  notes: string;
  progress: string;
  blockers: string;
  changes: string;
  nextStep: string;
  images?: ImageAttachment[];
}
