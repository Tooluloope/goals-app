/**
 * Configuration Types
 *
 * All configurable aspects of the goals app with sensible defaults.
 * Users can customize these per workspace.
 */

// ============================================================
// CONFIGURABLE ITEMS
// ============================================================

export interface ConfigurableItem {
  id: string;
  name: string;
  color: string;
  icon?: string;
  order: number;
  isDefault?: boolean;
  isArchived?: boolean;
}

export interface StatusConfig extends ConfigurableItem {
  type: 'active' | 'completed' | 'cancelled';
  showInBoard: boolean;
  countAsProgress: boolean;
}

export interface AreaConfig extends ConfigurableItem {
  description?: string;
}

export interface PriorityConfig extends ConfigurableItem {
  level: number;
}

export interface CadenceConfig extends ConfigurableItem {
  days: number;
}

export interface ConfidenceConfig extends ConfigurableItem {
  level: number;
}

export interface TaskStatusConfig extends ConfigurableItem {
  type: 'pending' | 'active' | 'completed';
  countAsProgress: boolean;
}

export interface TagConfig extends ConfigurableItem {
  // Inherits: id, name, color, icon, order, isDefault, isArchived
}

// ============================================================
// WORKSPACE CONFIGURATION
// ============================================================

export interface WorkspaceConfig {
  id: string;
  workspaceId: string;
  statuses: StatusConfig[];
  areas: AreaConfig[];
  priorities: PriorityConfig[];
  cadences: CadenceConfig[];
  confidences: ConfidenceConfig[];
  taskStatuses: TaskStatusConfig[];
  tags: TagConfig[];
  defaults: {
    status: string;
    priority: string;
    cadence: string;
    confidence: string;
    taskStatus: string;
  };
  board: {
    showArchivedStatuses: boolean;
    defaultGroupBy: 'status' | 'area' | 'priority';
    cardDisplayFields: string[];
  };
  dashboard: {
    dueSoonDays: number;
    staleDays: number;
    maxDailyFocusItems: number;
    showCompletedInFocus: boolean;
  };
  notifications: {
    reviewReminders: boolean;
    dueSoonReminders: boolean;
    staleProjectReminders: boolean;
    dailyDigest: boolean;
  };
  customFields?: CustomFieldConfig[];
  createdAt: string;
  updatedAt: string;
}

export interface CustomFieldConfig {
  id: string;
  name: string;
  type: 'text' | 'number' | 'date' | 'select' | 'multiselect' | 'checkbox';
  options?: string[];
  required: boolean;
  showOnCard: boolean;
}

// ============================================================
// DEFAULT CONFIGURATIONS
// ============================================================

export const DEFAULT_STATUSES: StatusConfig[] = [
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
];

export const DEFAULT_AREAS: AreaConfig[] = [
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
];

export const DEFAULT_PRIORITIES: PriorityConfig[] = [
  { id: 'priority-high', name: 'High', color: 'red', order: 1, level: 1 },
  { id: 'priority-medium', name: 'Medium', color: 'amber', order: 2, level: 2 },
  { id: 'priority-low', name: 'Low', color: 'slate', order: 3, level: 3 },
];

export const DEFAULT_CADENCES: CadenceConfig[] = [
  { id: 'cadence-weekly', name: 'Weekly', color: 'blue', order: 1, days: 7 },
  { id: 'cadence-biweekly', name: 'Bi-weekly', color: 'indigo', order: 2, days: 14 },
  { id: 'cadence-monthly', name: 'Monthly', color: 'purple', order: 3, days: 30 },
  { id: 'cadence-quarterly', name: 'Quarterly', color: 'violet', order: 4, days: 90 },
];

export const DEFAULT_CONFIDENCES: ConfidenceConfig[] = [
  { id: 'confidence-high', name: 'High', color: 'emerald', order: 1, level: 3 },
  { id: 'confidence-medium', name: 'Medium', color: 'amber', order: 2, level: 2 },
  { id: 'confidence-low', name: 'Low', color: 'red', order: 3, level: 1 },
];

export const DEFAULT_TASK_STATUSES: TaskStatusConfig[] = [
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
];

export const DEFAULT_TAGS: TagConfig[] = [
  { id: 'tag-urgent', name: 'Urgent', color: 'red', order: 1 },
  { id: 'tag-blocked', name: 'Blocked', color: 'orange', order: 2 },
  { id: 'tag-research', name: 'Research', color: 'blue', order: 3 },
  { id: 'tag-quick-win', name: 'Quick Win', color: 'green', order: 4 },
];

export const DEFAULT_WORKSPACE_CONFIG: Omit<
  WorkspaceConfig,
  'id' | 'workspaceId' | 'createdAt' | 'updatedAt'
> = {
  statuses: DEFAULT_STATUSES,
  areas: DEFAULT_AREAS,
  priorities: DEFAULT_PRIORITIES,
  cadences: DEFAULT_CADENCES,
  confidences: DEFAULT_CONFIDENCES,
  taskStatuses: DEFAULT_TASK_STATUSES,
  tags: DEFAULT_TAGS,
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

// ============================================================
// COLOR PRESETS
// ============================================================

export const COLOR_PRESETS = [
  {
    name: 'Slate',
    value: 'slate',
    bg: 'bg-slate-100',
    text: 'text-slate-700',
    border: 'border-slate-200',
  },
  {
    name: 'Gray',
    value: 'gray',
    bg: 'bg-gray-100',
    text: 'text-gray-700',
    border: 'border-gray-200',
  },
  { name: 'Red', value: 'red', bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-200' },
  {
    name: 'Orange',
    value: 'orange',
    bg: 'bg-orange-100',
    text: 'text-orange-700',
    border: 'border-orange-200',
  },
  {
    name: 'Amber',
    value: 'amber',
    bg: 'bg-amber-100',
    text: 'text-amber-700',
    border: 'border-amber-200',
  },
  {
    name: 'Yellow',
    value: 'yellow',
    bg: 'bg-yellow-100',
    text: 'text-yellow-700',
    border: 'border-yellow-200',
  },
  {
    name: 'Lime',
    value: 'lime',
    bg: 'bg-lime-100',
    text: 'text-lime-700',
    border: 'border-lime-200',
  },
  {
    name: 'Green',
    value: 'green',
    bg: 'bg-green-100',
    text: 'text-green-700',
    border: 'border-green-200',
  },
  {
    name: 'Emerald',
    value: 'emerald',
    bg: 'bg-emerald-100',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
  },
  {
    name: 'Teal',
    value: 'teal',
    bg: 'bg-teal-100',
    text: 'text-teal-700',
    border: 'border-teal-200',
  },
  {
    name: 'Cyan',
    value: 'cyan',
    bg: 'bg-cyan-100',
    text: 'text-cyan-700',
    border: 'border-cyan-200',
  },
  { name: 'Sky', value: 'sky', bg: 'bg-sky-100', text: 'text-sky-700', border: 'border-sky-200' },
  {
    name: 'Blue',
    value: 'blue',
    bg: 'bg-blue-100',
    text: 'text-blue-700',
    border: 'border-blue-200',
  },
  {
    name: 'Indigo',
    value: 'indigo',
    bg: 'bg-indigo-100',
    text: 'text-indigo-700',
    border: 'border-indigo-200',
  },
  {
    name: 'Violet',
    value: 'violet',
    bg: 'bg-violet-100',
    text: 'text-violet-700',
    border: 'border-violet-200',
  },
  {
    name: 'Purple',
    value: 'purple',
    bg: 'bg-purple-100',
    text: 'text-purple-700',
    border: 'border-purple-200',
  },
  {
    name: 'Fuchsia',
    value: 'fuchsia',
    bg: 'bg-fuchsia-100',
    text: 'text-fuchsia-700',
    border: 'border-fuchsia-200',
  },
  {
    name: 'Pink',
    value: 'pink',
    bg: 'bg-pink-100',
    text: 'text-pink-700',
    border: 'border-pink-200',
  },
  {
    name: 'Rose',
    value: 'rose',
    bg: 'bg-rose-100',
    text: 'text-rose-700',
    border: 'border-rose-200',
  },
];

export function getColorClasses(colorValue: string): { bg: string; text: string; border: string } {
  const preset = COLOR_PRESETS.find((c) => c.value === colorValue);
  if (preset) {
    return { bg: preset.bg, text: preset.text, border: preset.border };
  }
  return {
    bg: `bg-${colorValue}-100`,
    text: `text-${colorValue}-700`,
    border: `border-${colorValue}-200`,
  };
}
