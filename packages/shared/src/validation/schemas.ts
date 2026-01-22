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
});

export const updateUserSettingsSchema = z.object({
  theme: z.enum(['light', 'dark', 'system']).optional(),
  compactMode: z.boolean().optional(),
  showWelcomeOnLogin: z.boolean().optional(),
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
  areaId: z.string().min(1, 'Area is required'),
  statusId: z.string().min(1, 'Status is required'),
  startDate: z.string().datetime({ message: 'Invalid start date' }),
  targetDate: z.string().datetime({ message: 'Invalid target date' }),
  cadenceId: z.string().min(1, 'Cadence is required'),
  priorityId: z.string().min(1, 'Priority is required'),
  objective: z.string().min(1, 'Objective is required'),
  successMetric: z.string().min(1, 'Success metric is required'),
  confidenceId: z.string().min(1, 'Confidence level is required'),
  failureCriteria: z.string().optional(),
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

export const createTaskSchema = z.object({
  projectId: z.string().uuid('Invalid project ID'),
  title: z.string().min(1, 'Title is required'),
  statusId: z.string().min(1, 'Status is required'),
  dueDate: z.string().datetime().optional().nullable(),
  assignedToId: z.string().uuid().optional().nullable(),
});

export const updateTaskSchema = z.object({
  title: z.string().min(1, 'Title is required').optional(),
  statusId: z.string().min(1).optional(),
  dueDate: z.string().datetime().optional().nullable(),
  assignedToId: z.string().uuid().optional().nullable(),
});

export const updateTaskStatusSchema = z.object({
  statusId: z.string().min(1, 'Status is required'),
});

// ============================================================
// NOTIFICATION SCHEMAS
// ============================================================

export const markNotificationReadSchema = z.object({
  notificationId: z.string().uuid('Invalid notification ID'),
});

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
export type UpdateWorkspaceConfigDto = z.infer<typeof updateWorkspaceConfigSchema>;
