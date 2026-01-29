import { z } from 'zod';

// ============================================================
// AUTH SCHEMAS
// ============================================================

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const signupSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  timezone: z.string().optional(), // IANA timezone string, defaults to UTC if not provided
});

export const updateProfileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').optional(),
  avatar: z
    .string()
    // Allow https URLs or base64 data URLs for common image types
    .regex(
      /^(https:\/\/|data:image\/(jpeg|png|webp);base64,).*/i,
      'Avatar must be a secure image URL or data URI'
    )
    .max(2_000_000, 'Avatar data is too large')
    .optional(),
  email: z.string().email('Invalid email address').optional(),
});

export const changeEmailSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(6, 'Current password is required'),
    newPassword: z.string().min(8, 'New password must be at least 8 characters'),
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    path: ['newPassword'],
    message: 'New password must be different from current password',
  });

export const emailPreferencesSchema = z.object({
  habitReminders: z.boolean().optional(),
  taskDueReminders: z.boolean().optional(),
  weeklySummary: z.boolean().optional(),
  monthlySummary: z.boolean().optional(),
  staleProjectAlerts: z.boolean().optional(),
  reviewDueReminders: z.boolean().optional(),
  streakMilestones: z.boolean().optional(),
  aiInsights: z.boolean().optional(),
  inactivityReminders: z.boolean().optional(),
});

export const updateUserSettingsSchema = z.object({
  theme: z.enum(['light', 'dark', 'system']).optional(),
  compactMode: z.boolean().optional(),
  showWelcomeOnLogin: z.boolean().optional(),
  viewMode: z.enum(['focus', 'power']).optional(),
  timezone: z.string().optional(), // IANA timezone string (e.g., "America/New_York")
  emailPreferences: emailPreferencesSchema.optional(),
});

// ============================================================
// WORKSPACE SCHEMAS
// ============================================================

export const createWorkspaceSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  type: z.enum(['personal', 'family']),
});

export const inviteToWorkspaceSchema = z.object({
  email: z.string().email('Invalid email address'),
});

// ============================================================
// PROJECT SCHEMAS
// ============================================================

export const createProjectSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  workspaceId: z.string().uuid('Invalid workspace ID'),
  areaIds: z.array(z.string()).min(1, 'At least one area is required'),
  statusId: z.string().min(1, 'Status is required'),
  startDate: z.string().datetime({ message: 'Invalid start date' }),
  targetDate: z.string().datetime({ message: 'Invalid target date' }),
  cadenceId: z.string().min(1, 'Cadence is required'),
  priorityId: z.string().min(1, 'Priority is required'),
  objective: z.string().min(1, 'Objective is required'),
  successMetric: z.string().min(1, 'Success metric is required'),
  confidenceId: z.string().min(1, 'Confidence level is required'),
  failureCriteria: z.string().optional(),
  tagIds: z.array(z.string()).optional().default([]),
  ownerId: z.string().uuid('Invalid owner ID').optional().nullable(),
});

export const updateProjectSchema = createProjectSchema.partial().omit({ workspaceId: true });

export const updateProjectStatusSchema = z.object({
  statusId: z.string().min(1, 'Status is required'),
});

// ============================================================
// CHECKLIST SCHEMAS
// ============================================================

export const addChecklistItemSchema = z.object({
  text: z.string().min(1, 'Text is required'),
});

// ============================================================
// KEY DECISION SCHEMAS
// ============================================================

export const addKeyDecisionSchema = z.object({
  context: z.string().min(1, 'Context is required'),
  options: z.array(z.string()).min(2, 'At least 2 options are required'),
  chosen: z.string().min(1, 'Chosen option is required'),
  rationale: z.string().min(1, 'Rationale is required'),
});

// ============================================================
// REVIEW SCHEMAS
// ============================================================

export const addReviewSchema = z.object({
  projectId: z.string().uuid('Invalid project ID'),
  notes: z.string(),
  progress: z.string().min(1, 'Progress is required'),
  blockers: z.string(),
  changes: z.string(),
  nextStep: z.string(),
});

// ============================================================
// TASK SCHEMAS
// ============================================================

export const recurrenceTypeSchema = z.enum([
  'none',
  'daily',
  'weekly',
  'monthly',
  'yearly',
  'custom',
]);

// Image attachment schema for task/review uploads
const imageAttachmentSchema = z.object({
  id: z.string(),
  name: z.string(),
  data: z
    .string()
    .regex(
      /^data:image\/(jpeg|png|webp);base64,/i,
      'Image data must be a JPG, PNG, or WebP data URI'
    ), // Base64 encoded image data
  type: z.enum(['image/jpeg', 'image/png', 'image/webp']), // MIME type
  size: z.number().max(5 * 1024 * 1024, 'Image is too large'),
  caption: z.string().optional(),
});

export const createTaskSchema = z.object({
  projectId: z.string().uuid('Invalid project ID'),
  title: z.string().min(1, 'Title is required'),
  statusId: z.string().min(1, 'Status is required'),
  dueDate: z.string().datetime().optional().nullable(),
  assignedToId: z.string().uuid().optional().nullable(),
  // Recurrence fields
  isRecurring: z.boolean().optional().default(false),
  recurrenceType: recurrenceTypeSchema.optional().default('none'),
  recurrenceInterval: z.number().int().min(1).optional().default(1),
  recurrenceDays: z.array(z.number().int().min(0).max(6)).optional().default([]),
  // Image attachments
  images: z.array(imageAttachmentSchema).optional(),
});

export const updateTaskSchema = z.object({
  title: z.string().min(1, 'Title is required').optional(),
  statusId: z.string().min(1).optional(),
  dueDate: z.string().datetime().optional().nullable(),
  assignedToId: z.string().uuid().optional().nullable(),
  // Recurrence fields
  isRecurring: z.boolean().optional(),
  recurrenceType: recurrenceTypeSchema.optional(),
  recurrenceInterval: z.number().int().min(1).optional(),
  recurrenceDays: z.array(z.number().int().min(0).max(6)).optional(),
});

export const updateTaskStatusSchema = z.object({
  statusId: z.string().min(1, 'Status is required'),
});

export const completeRecurringTaskSchema = z.object({
  createNextOccurrence: z.boolean().optional().default(true),
});

// ============================================================
// NOTIFICATION SCHEMAS
// ============================================================

export const markNotificationReadSchema = z.object({
  notificationId: z.string().uuid('Invalid notification ID'),
});

// ============================================================
// JOURNAL SCHEMAS
// ============================================================

export const moodSchema = z.enum(['terrible', 'bad', 'neutral', 'good', 'great']);

export const createJournalEntrySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  mood: moodSchema.optional().nullable(),
  emoji: z.string().max(10).optional().nullable(), // User-selected emoji for the day
  prompt: z.string().optional().nullable(),
  content: z.string().min(1, 'Content is required'),
  wins: z.string().optional().nullable(),
  challenges: z.string().optional().nullable(),
  gratitude: z.string().optional().nullable(),
  photoUrl: z.string().url().optional().nullable(),
});

export const updateJournalEntrySchema = createJournalEntrySchema.partial().omit({ date: true });

// ============================================================
// HABIT SCHEMAS
// ============================================================

export const habitFrequencySchema = z.enum(['daily', 'weekly', 'specific_days']);

export const createHabitSchema = z.object({
  name: z.string().min(1, 'Name is required').max(50, 'Name must be 50 characters or less'),
  icon: z.string().min(1, 'Icon is required'),
  color: z.string().default('primary'),
  order: z.number().int().min(0).optional(),
  // Frequency settings
  frequency: habitFrequencySchema.optional().default('daily'),
  frequencyDays: z.array(z.number().int().min(0).max(6)).optional().default([]),
  // Reminder settings
  reminderEnabled: z.boolean().optional().default(false),
  reminderTime: z
    .string()
    .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Time must be in HH:MM format')
    .optional()
    .nullable(),
  // Goal area
  goalArea: z.string().max(50).optional().nullable(),
});

export const updateHabitSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(50, 'Name must be 50 characters or less')
    .optional(),
  icon: z.string().min(1, 'Icon is required').optional(),
  color: z.string().optional(),
  order: z.number().int().min(0).optional(),
  isArchived: z.boolean().optional(),
  // Frequency settings
  frequency: habitFrequencySchema.optional(),
  frequencyDays: z.array(z.number().int().min(0).max(6)).optional(),
  // Reminder settings
  reminderEnabled: z.boolean().optional(),
  reminderTime: z
    .string()
    .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Time must be in HH:MM format')
    .optional()
    .nullable(),
  // Goal area
  goalArea: z.string().max(50).optional().nullable(),
});

export const logHabitSchema = z.object({
  habitId: z.string().uuid('Invalid habit ID'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  completed: z.boolean().default(true),
  notes: z.string().optional().nullable(),
});

export const toggleHabitLogSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
});

// ============================================================
// WEEKLY REVIEW SCHEMAS
// ============================================================

export const createWeeklyReviewSchema = z.object({
  weekStart: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Week start must be in YYYY-MM-DD format'),
  wentWell: z.string().optional().nullable(),
  toImprove: z.string().optional().nullable(),
  focusNextWeek: z.string().optional().nullable(),
  lessonsLearned: z.string().optional().nullable(),
  gratitude: z.string().optional().nullable(),
  rating: z.number().int().min(1).max(5).optional().nullable(),
  submitted: z.boolean().optional(),
});

export const updateWeeklyReviewSchema = createWeeklyReviewSchema
  .partial()
  .omit({ weekStart: true });

// ============================================================
// MONTHLY REVIEW SCHEMAS
// ============================================================

export const createMonthlyReviewSchema = z.object({
  month: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Month must be in YYYY-MM-DD format (first day of month)'),
  highlights: z.string().optional().nullable(),
  challenges: z.string().optional().nullable(),
  goalsAchieved: z.string().optional().nullable(),
  goalsForNextMonth: z.string().optional().nullable(),
  lessonsLearned: z.string().optional().nullable(),
  gratitude: z.string().optional().nullable(),
  rating: z.number().int().min(1).max(5).optional().nullable(),
  submitted: z.boolean().optional(),
});

export const updateMonthlyReviewSchema = createMonthlyReviewSchema.partial().omit({ month: true });

// ============================================================
// CONFIG SCHEMAS
// ============================================================

export const updateWorkspaceConfigSchema = z.object({
  statuses: z
    .array(
      z.object({
        id: z.string(),
        name: z.string(),
        color: z.string(),
        order: z.number(),
        type: z.enum(['active', 'completed', 'cancelled']),
        showInBoard: z.boolean(),
        countAsProgress: z.boolean(),
        isDefault: z.boolean().optional(),
        isArchived: z.boolean().optional(),
      })
    )
    .optional(),
  areas: z
    .array(
      z.object({
        id: z.string(),
        name: z.string(),
        color: z.string(),
        order: z.number(),
        description: z.string().optional(),
        isDefault: z.boolean().optional(),
        isArchived: z.boolean().optional(),
      })
    )
    .optional(),
  priorities: z
    .array(
      z.object({
        id: z.string(),
        name: z.string(),
        color: z.string(),
        order: z.number(),
        level: z.number(),
        isDefault: z.boolean().optional(),
        isArchived: z.boolean().optional(),
      })
    )
    .optional(),
  cadences: z
    .array(
      z.object({
        id: z.string(),
        name: z.string(),
        color: z.string(),
        order: z.number(),
        days: z.number(),
        isDefault: z.boolean().optional(),
        isArchived: z.boolean().optional(),
      })
    )
    .optional(),
  confidences: z
    .array(
      z.object({
        id: z.string(),
        name: z.string(),
        color: z.string(),
        order: z.number(),
        level: z.number(),
        isDefault: z.boolean().optional(),
        isArchived: z.boolean().optional(),
      })
    )
    .optional(),
  taskStatuses: z
    .array(
      z.object({
        id: z.string(),
        name: z.string(),
        color: z.string(),
        order: z.number(),
        type: z.enum(['pending', 'active', 'completed']),
        countAsProgress: z.boolean(),
        isDefault: z.boolean().optional(),
        isArchived: z.boolean().optional(),
      })
    )
    .optional(),
  tags: z
    .array(
      z.object({
        id: z.string(),
        name: z.string(),
        color: z.string(),
        icon: z.string().optional(),
        order: z.number(),
        isDefault: z.boolean().optional(),
        isArchived: z.boolean().optional(),
      })
    )
    .optional(),
  defaults: z
    .object({
      status: z.string(),
      priority: z.string(),
      cadence: z.string(),
      confidence: z.string(),
      taskStatus: z.string(),
    })
    .optional(),
  board: z
    .object({
      showArchivedStatuses: z.boolean(),
      defaultGroupBy: z.enum(['status', 'area', 'priority']),
      cardDisplayFields: z.array(z.string()),
    })
    .optional(),
  dashboard: z
    .object({
      dueSoonDays: z.number(),
      staleDays: z.number(),
      maxDailyFocusItems: z.number(),
      showCompletedInFocus: z.boolean(),
    })
    .optional(),
  notifications: z
    .object({
      reviewReminders: z.boolean(),
      dueSoonReminders: z.boolean(),
      staleProjectReminders: z.boolean(),
      dailyDigest: z.boolean(),
    })
    .optional(),
});

// ============================================================
// AI SCHEMAS
// ============================================================

export const summaryTypeSchema = z.enum(['weekly', 'monthly', 'yearly']);
export const insightTypeSchema = z.enum([
  'pattern',
  'recommendation',
  'celebration',
  'warning',
  'milestone',
]);

export const createAiConversationSchema = z.object({
  title: z.string().max(100).optional().nullable(),
});

export const sendAiMessageSchema = z.object({
  message: z.string().min(1, 'Message is required').max(4000, 'Message too long'),
});

export const generateSummarySchema = z.object({
  type: summaryTypeSchema,
  periodStart: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  forceRegenerate: z.boolean().optional().default(false),
});

export const generateInsightsSchema = z.object({
  types: z.array(insightTypeSchema).optional(),
});

export const dismissInsightSchema = z.object({
  insightId: z.string().uuid('Invalid insight ID'),
});

// ============================================================
// TYPE EXPORTS
// ============================================================

export type LoginDto = z.infer<typeof loginSchema>;
export type SignupDto = z.infer<typeof signupSchema>;
export type UpdateUserSettingsDto = z.infer<typeof updateUserSettingsSchema>;
export type CreateWorkspaceDto = z.infer<typeof createWorkspaceSchema>;
export type InviteToWorkspaceDto = z.infer<typeof inviteToWorkspaceSchema>;
export type CreateProjectDto = z.infer<typeof createProjectSchema>;
export type UpdateProjectDto = z.infer<typeof updateProjectSchema>;
export type UpdateProjectStatusDto = z.infer<typeof updateProjectStatusSchema>;
export type AddChecklistItemDto = z.infer<typeof addChecklistItemSchema>;
export type AddKeyDecisionDto = z.infer<typeof addKeyDecisionSchema>;
export type AddReviewDto = z.infer<typeof addReviewSchema>;
export type CreateTaskDto = z.infer<typeof createTaskSchema>;
export type UpdateTaskDto = z.infer<typeof updateTaskSchema>;
export type UpdateTaskStatusDto = z.infer<typeof updateTaskStatusSchema>;
export type CompleteRecurringTaskDto = z.infer<typeof completeRecurringTaskSchema>;
export type UpdateWorkspaceConfigDto = z.infer<typeof updateWorkspaceConfigSchema>;

// Journal DTOs
export type CreateJournalEntryDto = z.infer<typeof createJournalEntrySchema>;
export type UpdateJournalEntryDto = z.infer<typeof updateJournalEntrySchema>;

// Habit DTOs
export type CreateHabitDto = z.infer<typeof createHabitSchema>;
export type UpdateHabitDto = z.infer<typeof updateHabitSchema>;
export type LogHabitDto = z.infer<typeof logHabitSchema>;
export type ToggleHabitLogDto = z.infer<typeof toggleHabitLogSchema>;

// Review DTOs
export type CreateWeeklyReviewDto = z.infer<typeof createWeeklyReviewSchema>;
export type UpdateWeeklyReviewDto = z.infer<typeof updateWeeklyReviewSchema>;
export type CreateMonthlyReviewDto = z.infer<typeof createMonthlyReviewSchema>;
export type UpdateMonthlyReviewDto = z.infer<typeof updateMonthlyReviewSchema>;

// AI DTOs
export type CreateAiConversationDto = z.infer<typeof createAiConversationSchema>;
export type SendAiMessageDto = z.infer<typeof sendAiMessageSchema>;
export type GenerateSummaryDto = z.infer<typeof generateSummarySchema>;
export type GenerateInsightsDto = z.infer<typeof generateInsightsSchema>;
export type DismissInsightDto = z.infer<typeof dismissInsightSchema>;
