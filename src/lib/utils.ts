import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { Project, ProjectProgress, Task } from "@/types";
import { getColorClasses, DEFAULT_CADENCES, CadenceConfig } from "@/types/config";
import {
  differenceInDays,
  parseISO,
  isBefore,
  addDays,
  format
} from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function generateId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

// Calculate project progress based on checklist items and tasks
// Now accepts completed task status IDs for flexibility
export function calculateProjectProgress(
  project: Project,
  completedTaskStatusIds: string[] = ['task-done']
): ProjectProgress {
  const requirementsDone = project.requirements.filter(r => r.completed).length;
  const definitionDone = project.definitionOfDone.filter(d => d.completed).length;
  const tasksDone = project.tasks.filter(t => completedTaskStatusIds.includes(t.statusId)).length;

  const completed = requirementsDone + definitionDone + tasksDone;
  const total = project.requirements.length + project.definitionOfDone.length + project.tasks.length;

  return {
    completed,
    total,
    percentage: total > 0 ? Math.round((completed / total) * 100) : 0
  };
}

// Check if review is due based on cadence days
export function isReviewDue(
  project: Project,
  cadences: CadenceConfig[] = DEFAULT_CADENCES
): boolean {
  if (!project.lastReviewDate) return true;

  const lastReview = parseISO(project.lastReviewDate);
  const today = new Date();
  const daysSinceReview = differenceInDays(today, lastReview);

  const cadence = cadences.find(c => c.id === project.cadenceId);
  const cadenceDays = cadence?.days ?? 30;

  return daysSinceReview >= cadenceDays;
}

// Check if project is stale (Active status but not updated in threshold days)
export function isProjectStale(
  project: Project,
  activeStatusIds: string[] = ['status-doing'],
  staleDays: number = 30
): boolean {
  if (!activeStatusIds.includes(project.statusId)) return false;

  const lastUpdate = parseISO(project.updatedAt);
  const today = new Date();
  return differenceInDays(today, lastUpdate) >= staleDays;
}

// Check if deadline is approaching (within threshold days)
export function isDeadlineApproaching(targetDate: string, daysThreshold: number = 30): boolean {
  const target = parseISO(targetDate);
  const today = new Date();
  const daysUntil = differenceInDays(target, today);
  return daysUntil >= 0 && daysUntil <= daysThreshold;
}

// Check if task is due soon
export function isTaskDueSoon(dueDate: string | undefined, dueSoonDays: number): boolean {
  if (!dueDate) return false;
  const due = parseISO(dueDate);
  const today = new Date();
  const daysUntil = differenceInDays(due, today);
  return daysUntil >= 0 && daysUntil <= dueSoonDays;
}

// Check if task is overdue
export function isTaskOverdue(dueDate: string | undefined): boolean {
  if (!dueDate) return false;
  const due = parseISO(dueDate);
  const today = new Date();
  return isBefore(due, today) && differenceInDays(today, due) > 0;
}

// Get days until deadline
export function getDaysUntilDeadline(targetDate: string): number {
  const target = parseISO(targetDate);
  const today = new Date();
  return differenceInDays(target, today);
}

// Get urgency level for deadline
export function getDeadlineUrgency(targetDate: string): 'critical' | 'warning' | 'normal' | 'past' {
  const daysUntil = getDaysUntilDeadline(targetDate);

  if (daysUntil < 0) return 'past';
  if (daysUntil <= 7) return 'critical';
  if (daysUntil <= 14) return 'warning';
  return 'normal';
}

// Format date for display
export function formatDate(date: string, formatStr: string = 'MMM d, yyyy'): string {
  return format(parseISO(date), formatStr);
}

// Format relative time
export function formatRelativeTime(date: string): string {
  const days = differenceInDays(new Date(), parseISO(date));

  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
  if (days < 365) return `${Math.floor(days / 30)} months ago`;
  return `${Math.floor(days / 365)} years ago`;
}

// Re-export getColorClasses for convenience
export { getColorClasses };

// Legacy color mappings for backward compatibility
// These can be used when config isn't available
export const areaColors: Record<string, { bg: string; text: string; border: string }> = {
  'area-faith': { bg: 'bg-violet-100', text: 'text-violet-700', border: 'border-violet-200' },
  'area-family': { bg: 'bg-pink-100', text: 'text-pink-700', border: 'border-pink-200' },
  'area-learning': { bg: 'bg-sky-100', text: 'text-sky-700', border: 'border-sky-200' },
  'area-career': { bg: 'bg-emerald-100', text: 'text-emerald-700', border: 'border-emerald-200' },
  'area-finance': { bg: 'bg-amber-100', text: 'text-amber-700', border: 'border-amber-200' },
  'area-health': { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-200' },
  'area-personal': { bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-200' },
  'area-business': { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-200' },
  // Legacy name-based fallbacks
  Faith: { bg: 'bg-violet-100', text: 'text-violet-700', border: 'border-violet-200' },
  Family: { bg: 'bg-pink-100', text: 'text-pink-700', border: 'border-pink-200' },
  Learning: { bg: 'bg-sky-100', text: 'text-sky-700', border: 'border-sky-200' },
  Career: { bg: 'bg-emerald-100', text: 'text-emerald-700', border: 'border-emerald-200' },
  Finance: { bg: 'bg-amber-100', text: 'text-amber-700', border: 'border-amber-200' },
  Health: { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-200' },
  Personal: { bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-200' },
  Business: { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-200' },
};

// Legacy priority colors for backward compatibility
export const priorityColors: Record<string, { bg: string; text: string }> = {
  'priority-high': { bg: 'bg-red-50', text: 'text-red-600' },
  'priority-medium': { bg: 'bg-amber-50', text: 'text-amber-600' },
  'priority-low': { bg: 'bg-slate-50', text: 'text-slate-600' },
  // Legacy name-based fallbacks
  High: { bg: 'bg-red-50', text: 'text-red-600' },
  Medium: { bg: 'bg-amber-50', text: 'text-amber-600' },
  Low: { bg: 'bg-slate-50', text: 'text-slate-600' },
};

// Legacy status colors for backward compatibility
export const statusColors: Record<string, { bg: string; text: string; border: string }> = {
  'status-todo': { bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-200' },
  'status-doing': { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-200' },
  'status-done': { bg: 'bg-emerald-100', text: 'text-emerald-700', border: 'border-emerald-200' },
  'status-failed': { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-200' },
  // Legacy name-based fallbacks
  Todo: { bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-200' },
  Doing: { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-200' },
  Done: { bg: 'bg-emerald-100', text: 'text-emerald-700', border: 'border-emerald-200' },
  Failed: { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-200' },
};

// Get next review date based on cadence
export function getNextReviewDate(
  lastReviewDate: string | undefined,
  cadenceId: string,
  cadences: CadenceConfig[] = DEFAULT_CADENCES
): Date {
  const base = lastReviewDate ? parseISO(lastReviewDate) : new Date();
  const cadence = cadences.find(c => c.id === cadenceId);
  const days = cadence?.days ?? 30;
  return addDays(base, days);
}

// Get days since last review
export function getDaysSinceLastReview(lastReviewDate: string | undefined): number | null {
  if (!lastReviewDate) return null;
  return differenceInDays(new Date(), parseISO(lastReviewDate));
}

// Sort projects by priority and deadline
// Accepts priority config to determine sort order
export function sortProjectsByUrgency(
  projects: Project[],
  priorityOrder: Record<string, number> = {
    'priority-high': 0,
    'priority-medium': 1,
    'priority-low': 2,
  }
): Project[] {
  return [...projects].sort((a, b) => {
    // First by priority
    const aPriority = priorityOrder[a.priorityId] ?? 999;
    const bPriority = priorityOrder[b.priorityId] ?? 999;
    const priorityDiff = aPriority - bPriority;
    if (priorityDiff !== 0) return priorityDiff;

    // Then by target date
    return differenceInDays(parseISO(a.targetDate), parseISO(b.targetDate));
  });
}

// Get daily focus tasks (Active tasks from active projects)
export function getDailyFocusTasks(
  projects: Project[],
  activeProjectStatusIds: string[] = ['status-doing'],
  activeTaskStatusIds: string[] = ['task-next'],
  maxItems: number = 5
): { task: Task; project: Project }[] {
  const activeProjects = projects.filter(p => activeProjectStatusIds.includes(p.statusId));
  const focusTasks: { task: Task; project: Project }[] = [];

  for (const project of sortProjectsByUrgency(activeProjects)) {
    const projectActiveTasks = project.tasks
      .filter(t => activeTaskStatusIds.includes(t.statusId))
      .map(task => ({ task, project }));
    focusTasks.push(...projectActiveTasks);
  }

  return focusTasks.slice(0, maxItems);
}

// Truncate text with ellipsis
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + '...';
}
