// Re-export everything from shared package (includes config types)
export * from '@goals/shared';

// Extended web-only helpers
export type TaskWithProject = import('@goals/shared').Task & {
  project?: { id: string; name: string; workspaceId: string };
};

// ============================================================
// WEB-SPECIFIC TYPES (not in shared)
// ============================================================

// Auth State (frontend only)
export interface AuthState {
  user: import('@goals/shared').User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

// Legacy form types (deprecated - use DTOs from @goals/shared instead)
export interface CreateProjectData {
  name: string;
  workspaceId: string;
  areaIds: string[];
  statusId: string;
  startDate: string;
  targetDate: string;
  cadenceId: string;
  priorityId: string;
  objective: string;
  successMetric: string;
  confidenceId: string;
  tagIds?: string[];
  ownerId?: string;
}

export interface CreateTaskData {
  projectId: string;
  title: string;
  statusId: string;
  dueDate?: string;
  assignedToId?: string;
  images?: import('@goals/shared').ImageAttachment[];
  // Recurrence fields
  isRecurring?: boolean;
  recurrenceType?: import('@goals/shared').RecurrenceType;
  recurrenceInterval?: number;
  recurrenceDays?: number[];
}

export interface AddReviewData {
  projectId: string;
  notes: string;
  progress: string;
  blockers: string;
  changes: string;
  nextStep: string;
  images?: import('@goals/shared').ImageAttachment[];
}

// Local image attachment for client-side processing (base64 data)
// Different from shared ImageAttachment which uses URLs for server storage
export interface LocalImageAttachment {
  id: string;
  name: string;
  data: string; // Base64 encoded image data
  type: string; // MIME type (e.g., 'image/jpeg', 'image/png')
  size: number;
  createdAt: string;
  caption?: string;
}

// Login form types
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignupData {
  name: string;
  email: string;
  password: string;
}
