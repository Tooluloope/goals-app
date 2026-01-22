// Re-export config types
export * from './config';

// ============================================================
// USER TYPES
// ============================================================

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string | null;
  defaultWorkspaceId: string;
  settings: UserSettings;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserSettings {
  theme: 'light' | 'dark' | 'system';
  compactMode: boolean;
  showWelcomeOnLogin: boolean;
}

// ============================================================
// WORKSPACE TYPES
// ============================================================

export type WorkspaceType = 'personal' | 'family';
export type MemberRole = 'owner' | 'admin' | 'member';

export interface Workspace {
  id: string;
  name: string;
  type: WorkspaceType;
  ownerId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkspaceMember {
  id: string;
  workspaceId: string;
  userId: string;
  role: MemberRole;
  joinedAt: Date;
}

// ============================================================
// PROJECT TYPES
// ============================================================

export interface ChecklistItem {
  id: string;
  projectId: string;
  type: 'requirement' | 'definition_of_done';
  text: string;
  completed: boolean;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface KeyDecision {
  id: string;
  projectId: string;
  date: Date;
  context: string;
  options: string[];
  chosen: string;
  rationale: string;
  createdAt: Date;
}

export interface ReviewNote {
  id: string;
  projectId: string;
  date: Date;
  notes: string;
  progress: string;
  blockers: string;
  changes: string;
  nextStep: string;
  createdAt: Date;
  images?: ImageAttachment[];
}

export interface ProjectMetrics {
  id: string;
  projectId: string;
  primaryMetric?: string | null;
  leadingIndicator?: string | null;
  riskIndicator?: string | null;
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
  statusId: string;
  areaId: string;
  startDate: Date;
  targetDate: Date;
  cadenceId: string;
  priorityId: string;
  successMetric: string;
  lastReviewDate?: Date | null;
  confidenceId: string;
  objective: string;
  failureCriteria?: string | null;
  createdAt: Date;
  updatedAt: Date;
  // Relations (populated when fetched)
  requirements?: ChecklistItem[];
  definitionOfDone?: ChecklistItem[];
  keyDecisions?: KeyDecision[];
  tasks?: Task[];
  metrics?: ProjectMetrics;
  reviewNotes?: ReviewNote[];
  retrospective?: Retrospective;
  images?: ImageAttachment[];
}

// ============================================================
// TASK TYPES
// ============================================================

export type RecurrenceType = 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom';

export interface Task {
  id: string;
  projectId: string;
  title: string;
  statusId: string;
  dueDate?: Date | null;
  assignedToId?: string | null;
  createdAt: Date;
  updatedAt: Date;
  images?: ImageAttachment[];
  // Recurrence fields
  isRecurring: boolean;
  recurrenceType: RecurrenceType;
  recurrenceInterval: number;
  recurrenceDays: number[]; // 0=Sun, 1=Mon, ..., 6=Sat
  nextOccurrence?: Date | null;
  parentTaskId?: string | null;
  completedAt?: Date | null;
  streak: number;
}

// ============================================================
// IMAGE ATTACHMENT TYPES
// ============================================================

export interface ImageAttachment {
  id: string;
  filename: string;
  url: string;
  mimeType: string;
  size: number;
  caption?: string | null;
  createdAt: Date;
  // Polymorphic relations
  projectId?: string | null;
  taskId?: string | null;
  reviewNoteId?: string | null;
}

// ============================================================
// NOTIFICATION TYPES
// ============================================================

export type NotificationType = 'DueSoon' | 'Overdue' | 'ReviewDue' | 'StaleProject' | 'DailyFocus';

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  projectId?: string | null;
  taskId?: string | null;
  createdAt: Date;
  readAt?: Date | null;
}

// ============================================================
// AUTH TYPES
// ============================================================

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponse {
  user: Omit<User, 'createdAt' | 'updatedAt'> & {
    createdAt: string;
    updatedAt: string;
  };
  accessToken: string;
  refreshToken: string;
}

// ============================================================
// API RESPONSE TYPES
// ============================================================

export interface ApiResponse<T> {
  data: T;
  success: boolean;
  error?: string;
}

// ============================================================
// UI STATE TYPES (Frontend only)
// ============================================================

export interface FilterState {
  areaIds: string[];
  priorityIds: string[];
  assignedTo: string[];
  dueSoon: boolean;
  reviewDue: boolean;
}

// ============================================================
// HELPER TYPES
// ============================================================

export interface ProjectProgress {
  completed: number;
  total: number;
  percentage: number;
}

// ============================================================
// JOURNAL TYPES
// ============================================================

export type Mood = 'terrible' | 'bad' | 'neutral' | 'good' | 'great';

export interface JournalEntry {
  id: string;
  userId: string;
  date: Date;
  mood?: Mood | null;
  prompt?: string | null;
  content: string;
  wins?: string | null;
  challenges?: string | null;
  gratitude?: string | null;
  photoUrl?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================
// HABIT TYPES
// ============================================================

export interface Habit {
  id: string;
  userId: string;
  name: string;
  icon: string;
  color: string;
  order: number;
  isArchived: boolean;
  createdAt: Date;
  updatedAt: Date;
  // Populated when fetched
  logs?: HabitLog[];
  // Computed fields (from API)
  currentStreak?: number;
  longestStreak?: number;
  completedToday?: boolean;
}

export interface HabitLog {
  id: string;
  habitId: string;
  date: Date;
  completed: boolean;
  notes?: string | null;
  createdAt: Date;
}

export interface HabitWithStats extends Habit {
  currentStreak: number;
  longestStreak: number;
  completedToday: boolean;
  completionRate: number; // Last 30 days
}

// ============================================================
// WEEKLY & MONTHLY REVIEW TYPES
// ============================================================

export interface WeeklyReview {
  id: string;
  userId: string;
  weekStart: Date; // Monday of the week
  wentWell?: string | null;
  toImprove?: string | null;
  focusNextWeek?: string | null;
  lessonsLearned?: string | null;
  gratitude?: string | null;
  rating?: number | null; // 1-5 star rating
  createdAt: Date;
  updatedAt: Date;
}

export interface MonthlyReview {
  id: string;
  userId: string;
  month: Date; // First day of month
  highlights?: string | null;
  challenges?: string | null;
  goalsAchieved?: string | null;
  goalsForNextMonth?: string | null;
  lessonsLearned?: string | null;
  gratitude?: string | null;
  rating?: number | null; // 1-5 star rating
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================
// STATS TYPES
// ============================================================

export interface DailyStats {
  date: Date;
  habitsCompleted: number;
  habitsTotal: number;
  journalWritten: boolean;
  tasksCompleted: number;
}

export interface WeeklyStats {
  weekStart: Date;
  habitsCompletionRate: number;
  journalEntriesCount: number;
  tasksCompleted: number;
  averageMood?: number;
}

export interface ProgressStats {
  currentStreak: number; // Days in a row with activity
  longestStreak: number;
  totalJournalEntries: number;
  totalHabitsCompleted: number;
  averageHabitCompletionRate: number;
  weeklyReviewsCount: number;
  monthlyReviewsCount: number;
}
