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
  timezone: string; // IANA timezone string (e.g., "America/New_York")
  hasSetPassword: boolean; // false for users who signed up via magic link
  emailVerifiedAt?: Date | string | null;
  settings: UserSettings;
  createdAt: Date;
  updatedAt: Date;
}

export interface EmailPreferences {
  habitReminders: boolean;
  taskDueReminders: boolean;
  weeklySummary: boolean;
  monthlySummary: boolean;
  staleProjectAlerts: boolean;
  reviewDueReminders: boolean;
  streakMilestones: boolean;
  aiInsights: boolean;
  inactivityReminders: boolean;
}

export const defaultEmailPreferences: EmailPreferences = {
  habitReminders: true,
  taskDueReminders: true,
  weeklySummary: true,
  monthlySummary: true,
  staleProjectAlerts: true,
  reviewDueReminders: true,
  streakMilestones: true,
  aiInsights: true,
  inactivityReminders: false, // Opt-in by default
};

export interface UserSettings {
  theme: 'light' | 'dark' | 'system';
  compactMode: boolean;
  showWelcomeOnLogin: boolean;
  viewMode?: 'focus' | 'power';
  emailPreferences?: EmailPreferences;
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
  // Populated when fetched
  user?: {
    id: string;
    name: string;
    email: string;
    avatar?: string | null;
  };
}

export type InviteStatus = 'pending' | 'accepted' | 'expired' | 'cancelled';

export interface WorkspaceInvite {
  id: string;
  workspaceId: string;
  email: string;
  token: string;
  invitedById: string;
  role: MemberRole;
  status: InviteStatus;
  expiresAt: Date;
  createdAt: Date;
  acceptedAt?: Date | null;
}

export interface WorkspaceWithMembers extends Workspace {
  members: WorkspaceMember[];
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
  createdById?: string | null;
  date: Date;
  notes: string;
  progress: string;
  blockers: string;
  changes: string;
  nextStep: string;
  createdAt: Date;
  images?: ImageAttachment[];
  createdBy?: {
    id: string;
    name: string;
    avatar?: string | null;
  } | null;
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
  areaIds: string[];
  startDate: Date;
  targetDate: Date;
  cadenceId: string;
  priorityId: string;
  successMetric: string;
  lastReviewDate?: Date | null;
  confidenceId: string;
  objective: string;
  failureCriteria?: string | null;
  tagIds: string[];
  ownerId?: string | null;
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
  // Dependency relations
  blockedBy?: ProjectDependency[];
  blocking?: ProjectDependency[];
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
  // Dependency relations
  blockedBy?: TaskDependency[];
  blocking?: TaskDependency[];
}

// ============================================================
// DEPENDENCY TYPES
// ============================================================

export interface ProjectDependency {
  id: string;
  dependentId: string;
  blockerId: string;
  note?: string | null;
  createdAt: Date;
  // Populated when fetched
  blocker?: Project;
  dependent?: Project;
}

export interface TaskDependency {
  id: string;
  dependentId: string;
  blockerId: string;
  note?: string | null;
  createdAt: Date;
  // Populated when fetched
  blocker?: Task;
  dependent?: Task;
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

export type NotificationType =
  | 'DueSoon'
  | 'Overdue'
  | 'ReviewDue'
  | 'StaleProject'
  | 'DailyFocus'
  | 'BlockerResolved';

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
  tagIds: string[];
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
  emoji?: string | null;
  prompt?: string | null;
  content: string;
  wins?: string | null;
  challenges?: string | null;
  gratitude?: string | null;
  photoUrl?: string | null;
  submitted?: boolean; // True when the day has passed (auto-locked)
  submittedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================
// HABIT TYPES
// ============================================================

export type HabitFrequency = 'daily' | 'weekly' | 'specific_days';

export interface Habit {
  id: string;
  userId: string;
  name: string;
  icon: string;
  color: string;
  order: number;
  isArchived: boolean;
  // Frequency settings
  frequency: HabitFrequency;
  frequencyDays: number[]; // 0=Sun, 1=Mon, ..., 6=Sat for specific days
  // Reminder settings
  reminderEnabled: boolean;
  reminderTime?: string | null; // HH:MM format
  // Goal area
  goalArea?: string | null;
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
  submitted?: boolean; // True when review is finalized (can't be changed)
  submittedAt?: Date | null;
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
  submitted?: boolean; // True when review is finalized (can't be changed)
  submittedAt?: Date | null;
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

// ============================================================
// AI TYPES
// ============================================================

export type SummaryType = 'weekly' | 'monthly' | 'yearly';
export type MessageRole = 'user' | 'assistant';
export type InsightType = 'pattern' | 'recommendation' | 'celebration' | 'warning' | 'milestone';

export interface AiSummary {
  id: string;
  userId: string;
  type: SummaryType;
  periodStart: Date;
  periodEnd: Date;
  content: string;
  metadata: AiSummaryMetadata;
  createdAt: Date;
  updatedAt: Date;
}

export interface AiSummaryMetadata {
  highlights?: string[];
  moodTrend?: 'improving' | 'stable' | 'declining';
  topAchievements?: string[];
  areasForImprovement?: string[];
  habitInsights?: string;
  encouragement?: string;
  suggestedFocus?: string[];
  tokensUsed?: number;
}

export interface AiConversation {
  id: string;
  userId: string;
  title?: string | null;
  createdAt: Date;
  updatedAt: Date;
  messages?: AiMessage[];
}

export interface AiMessage {
  id: string;
  conversationId: string;
  role: MessageRole;
  content: string;
  metadata: AiMessageMetadata;
  createdAt: Date;
}

export interface AiMessageMetadata {
  tokensUsed?: number;
  latencyMs?: number;
  model?: string;
}

export interface AiInsight {
  id: string;
  userId: string;
  type: InsightType;
  title: string;
  content: string;
  confidence: number;
  actionable: boolean;
  dismissed: boolean;
  metadata: Record<string, unknown>;
  createdAt: Date;
  expiresAt?: Date | null;
}

// AI Response Types (for API responses)
export interface AiChatResponse {
  message: AiMessage;
  conversation: AiConversation;
}

export interface AiSummaryResponse {
  summary: AiSummary;
  isNew: boolean; // True if newly generated, false if cached
}

export interface AiInsightsResponse {
  insights: AiInsight[];
  generatedAt: Date;
}

// User Context for AI (aggregated data sent to Claude)
export interface AiUserContext {
  habits: {
    name: string;
    currentStreak: number;
    completionRate: number;
    completedToday: boolean;
  }[];
  journalStreak: number;
  recentMoods: Mood[];
  pendingTasks: number;
  activeProjects: number;
}
