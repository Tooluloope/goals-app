import {
  cn,
  toDate,
  toISOString,
  generateId,
  calculateProjectProgress,
  isReviewDue,
  isProjectStale,
  isDeadlineApproaching,
  isTaskDueSoon,
  isTaskOverdue,
  getDaysUntilDeadline,
  getDeadlineUrgency,
  formatDate,
  formatRelativeTime,
  getNextReviewDate,
  getDaysSinceLastReview,
  sortProjectsByUrgency,
  getDailyFocusTasks,
  truncate,
} from './utils';
import { addDays, subDays, format } from 'date-fns';

describe('utils', () => {
  describe('cn', () => {
    it('should merge class names', () => {
      expect(cn('foo', 'bar')).toBe('foo bar');
    });

    it('should handle conditional classes', () => {
      expect(cn('foo', false && 'bar', 'baz')).toBe('foo baz');
    });

    it('should merge Tailwind classes correctly', () => {
      expect(cn('px-2 py-1', 'px-4')).toBe('py-1 px-4');
    });

    it('should handle arrays', () => {
      expect(cn(['foo', 'bar'])).toBe('foo bar');
    });

    it('should handle objects', () => {
      expect(cn({ foo: true, bar: false, baz: true })).toBe('foo baz');
    });
  });

  describe('toDate', () => {
    it('should return current date for null/undefined', () => {
      const before = new Date();
      const result = toDate(null);
      const after = new Date();
      expect(result.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(result.getTime()).toBeLessThanOrEqual(after.getTime());
    });

    it('should return same date for Date input', () => {
      const date = new Date('2024-06-15T12:00:00Z');
      expect(toDate(date)).toBe(date);
    });

    it('should parse ISO string to Date', () => {
      const result = toDate('2024-06-15T12:00:00Z');
      expect(result).toBeInstanceOf(Date);
      expect(result.toISOString()).toBe('2024-06-15T12:00:00.000Z');
    });
  });

  describe('toISOString', () => {
    it('should return current ISO string for null/undefined', () => {
      const result = toISOString(null);
      expect(new Date(result)).toBeInstanceOf(Date);
    });

    it('should convert Date to ISO string', () => {
      const date = new Date('2024-06-15T12:00:00Z');
      expect(toISOString(date)).toBe('2024-06-15T12:00:00.000Z');
    });

    it('should return string as-is', () => {
      expect(toISOString('2024-06-15')).toBe('2024-06-15');
    });
  });

  describe('generateId', () => {
    it('should generate unique IDs', () => {
      const ids = new Set(Array.from({ length: 100 }, generateId));
      expect(ids.size).toBe(100);
    });

    it('should generate string IDs', () => {
      const id = generateId();
      expect(typeof id).toBe('string');
      expect(id.length).toBeGreaterThan(0);
    });
  });

  describe('calculateProjectProgress', () => {
    it('should return 0 for empty project', () => {
      const project = {
        id: '1',
        requirements: [],
        definitionOfDone: [],
        tasks: [],
      } as any;

      const result = calculateProjectProgress(project);
      expect(result).toEqual({ completed: 0, total: 0, percentage: 0 });
    });

    it('should calculate progress correctly', () => {
      const project = {
        id: '1',
        requirements: [
          { id: '1', completed: true },
          { id: '2', completed: false },
        ],
        definitionOfDone: [{ id: '1', completed: true }],
        tasks: [
          { id: '1', statusId: 'task-done' },
          { id: '2', statusId: 'task-todo' },
        ],
      } as any;

      const result = calculateProjectProgress(project);
      expect(result).toEqual({ completed: 3, total: 5, percentage: 60 });
    });

    it('should use custom completed status IDs', () => {
      const project = {
        id: '1',
        requirements: [],
        definitionOfDone: [],
        tasks: [
          { id: '1', statusId: 'custom-done' },
          { id: '2', statusId: 'task-todo' },
        ],
      } as any;

      const result = calculateProjectProgress(project, ['custom-done']);
      expect(result.completed).toBe(1);
    });
  });

  describe('isReviewDue', () => {
    it('should return true for project without last review', () => {
      const project = { id: '1', lastReviewDate: null } as any;
      expect(isReviewDue(project)).toBe(true);
    });

    it('should return false for recently reviewed project', () => {
      const project = {
        id: '1',
        lastReviewDate: new Date(),
        cadenceId: 'cadence-30',
      } as any;
      expect(isReviewDue(project)).toBe(false);
    });

    it('should return true when review is overdue', () => {
      const project = {
        id: '1',
        lastReviewDate: subDays(new Date(), 35),
        cadenceId: 'cadence-30',
      } as any;

      const cadences = [{ id: 'cadence-30', days: 30, name: '30 Days', color: 'blue', order: 1 }];
      expect(isReviewDue(project, cadences)).toBe(true);
    });
  });

  describe('isProjectStale', () => {
    it('should return false for non-active projects', () => {
      const project = {
        id: '1',
        statusId: 'status-todo',
        updatedAt: subDays(new Date(), 60),
      } as any;

      expect(isProjectStale(project)).toBe(false);
    });

    it('should return false for recently updated active project', () => {
      const project = {
        id: '1',
        statusId: 'status-doing',
        updatedAt: new Date(),
      } as any;

      expect(isProjectStale(project)).toBe(false);
    });

    it('should return true for stale active project', () => {
      const project = {
        id: '1',
        statusId: 'status-doing',
        updatedAt: subDays(new Date(), 35),
      } as any;

      expect(isProjectStale(project)).toBe(true);
    });

    it('should use custom stale days threshold', () => {
      const project = {
        id: '1',
        statusId: 'status-doing',
        updatedAt: subDays(new Date(), 10),
      } as any;

      expect(isProjectStale(project, ['status-doing'], 7)).toBe(true);
    });
  });

  describe('isDeadlineApproaching', () => {
    it('should return true when deadline is within threshold', () => {
      const deadline = addDays(new Date(), 10);
      expect(isDeadlineApproaching(deadline, 30)).toBe(true);
    });

    it('should return false when deadline is past threshold', () => {
      const deadline = addDays(new Date(), 45);
      expect(isDeadlineApproaching(deadline, 30)).toBe(false);
    });

    it('should return false for past deadlines', () => {
      const deadline = subDays(new Date(), 5);
      expect(isDeadlineApproaching(deadline, 30)).toBe(false);
    });
  });

  describe('isTaskDueSoon', () => {
    it('should return false for null due date', () => {
      expect(isTaskDueSoon(null, 7)).toBe(false);
    });

    it('should return true when task is due soon', () => {
      const dueDate = addDays(new Date(), 3);
      expect(isTaskDueSoon(dueDate, 7)).toBe(true);
    });

    it('should return false when task is not due soon', () => {
      const dueDate = addDays(new Date(), 10);
      expect(isTaskDueSoon(dueDate, 7)).toBe(false);
    });
  });

  describe('isTaskOverdue', () => {
    it('should return false for null due date', () => {
      expect(isTaskOverdue(null)).toBe(false);
    });

    it('should return true for past due date', () => {
      const dueDate = subDays(new Date(), 2);
      expect(isTaskOverdue(dueDate)).toBe(true);
    });

    it('should return false for future due date', () => {
      const dueDate = addDays(new Date(), 2);
      expect(isTaskOverdue(dueDate)).toBe(false);
    });
  });

  describe('getDaysUntilDeadline', () => {
    it('should return positive days for future deadline', () => {
      const deadline = addDays(new Date(), 10);
      expect(getDaysUntilDeadline(deadline)).toBe(10);
    });

    it('should return negative days for past deadline', () => {
      const deadline = subDays(new Date(), 5);
      expect(getDaysUntilDeadline(deadline)).toBe(-5);
    });
  });

  describe('getDeadlineUrgency', () => {
    it('should return past for overdue', () => {
      const deadline = subDays(new Date(), 1);
      expect(getDeadlineUrgency(deadline)).toBe('past');
    });

    it('should return critical for 7 days or less', () => {
      const deadline = addDays(new Date(), 5);
      expect(getDeadlineUrgency(deadline)).toBe('critical');
    });

    it('should return warning for 8-14 days', () => {
      const deadline = addDays(new Date(), 10);
      expect(getDeadlineUrgency(deadline)).toBe('warning');
    });

    it('should return normal for more than 14 days', () => {
      const deadline = addDays(new Date(), 20);
      expect(getDeadlineUrgency(deadline)).toBe('normal');
    });
  });

  describe('formatDate', () => {
    it('should format date with default format', () => {
      const date = new Date('2024-06-15T12:00:00');
      expect(formatDate(date)).toMatch(/Jun 15, 2024/);
    });

    it('should format date with custom format', () => {
      const date = new Date('2024-06-15T12:00:00');
      expect(formatDate(date, 'yyyy-MM-dd')).toBe('2024-06-15');
    });
  });

  describe('formatRelativeTime', () => {
    it('should return Today for today', () => {
      expect(formatRelativeTime(new Date())).toBe('Today');
    });

    it('should return Yesterday for yesterday', () => {
      expect(formatRelativeTime(subDays(new Date(), 1))).toBe('Yesterday');
    });

    it('should return days ago for recent dates', () => {
      expect(formatRelativeTime(subDays(new Date(), 3))).toBe('3 days ago');
    });

    it('should return weeks ago', () => {
      expect(formatRelativeTime(subDays(new Date(), 14))).toBe('2 weeks ago');
    });

    it('should return months ago', () => {
      expect(formatRelativeTime(subDays(new Date(), 60))).toBe('2 months ago');
    });

    it('should return years ago', () => {
      expect(formatRelativeTime(subDays(new Date(), 400))).toBe('1 years ago');
    });
  });

  describe('getNextReviewDate', () => {
    it('should return date based on cadence', () => {
      const lastReview = new Date('2024-06-01');
      const cadences = [{ id: 'cadence-30', days: 30, name: '30 Days', color: 'blue', order: 1 }];
      const result = getNextReviewDate(lastReview, 'cadence-30', cadences);
      expect(result.toISOString().substring(0, 10)).toBe('2024-07-01');
    });

    it('should use current date when no last review', () => {
      const before = new Date();
      const result = getNextReviewDate(null, 'cadence-30', [
        { id: 'cadence-30', days: 30, name: '30 Days', color: 'blue', order: 1 },
      ]);
      expect(result.getTime()).toBeGreaterThanOrEqual(before.getTime());
    });
  });

  describe('getDaysSinceLastReview', () => {
    it('should return null for no last review', () => {
      expect(getDaysSinceLastReview(null)).toBe(null);
    });

    it('should return days since last review', () => {
      const lastReview = subDays(new Date(), 10);
      expect(getDaysSinceLastReview(lastReview)).toBe(10);
    });
  });

  describe('sortProjectsByUrgency', () => {
    it('should sort by priority first', () => {
      const projects = [
        { id: '1', priorityId: 'priority-low', targetDate: new Date() },
        { id: '2', priorityId: 'priority-high', targetDate: new Date() },
      ] as any[];

      const sorted = sortProjectsByUrgency(projects);
      expect(sorted[0].id).toBe('2');
    });

    it('should sort by deadline when priority is same', () => {
      const projects = [
        { id: '1', priorityId: 'priority-high', targetDate: addDays(new Date(), 10) },
        { id: '2', priorityId: 'priority-high', targetDate: addDays(new Date(), 5) },
      ] as any[];

      const sorted = sortProjectsByUrgency(projects);
      expect(sorted[0].id).toBe('2');
    });
  });

  describe('getDailyFocusTasks', () => {
    it('should return empty array for no active projects', () => {
      const projects = [{ id: '1', statusId: 'status-todo', tasks: [] }] as any[];
      expect(getDailyFocusTasks(projects)).toEqual([]);
    });

    it('should return active tasks from active projects', () => {
      const projects = [
        {
          id: '1',
          statusId: 'status-doing',
          priorityId: 'priority-high',
          targetDate: new Date(),
          tasks: [
            { id: 't1', statusId: 'task-next' },
            { id: 't2', statusId: 'task-done' },
          ],
        },
      ] as any[];

      const result = getDailyFocusTasks(projects);
      expect(result).toHaveLength(1);
      expect(result[0].task.id).toBe('t1');
    });

    it('should limit results to maxItems', () => {
      const projects = [
        {
          id: '1',
          statusId: 'status-doing',
          priorityId: 'priority-high',
          targetDate: new Date(),
          tasks: Array.from({ length: 10 }, (_, i) => ({
            id: `t${i}`,
            statusId: 'task-next',
          })),
        },
      ] as any[];

      const result = getDailyFocusTasks(projects, ['status-doing'], ['task-next'], 3);
      expect(result).toHaveLength(3);
    });
  });

  describe('truncate', () => {
    it('should return original text if shorter than max length', () => {
      expect(truncate('Hello', 10)).toBe('Hello');
    });

    it('should truncate text with ellipsis', () => {
      expect(truncate('Hello World', 8)).toBe('Hello...');
    });

    it('should handle exact max length', () => {
      expect(truncate('Hello', 5)).toBe('Hello');
    });
  });
});
