import {
  DEFAULT_STATUSES,
  DEFAULT_AREAS,
  DEFAULT_PRIORITIES,
  DEFAULT_CADENCES,
  DEFAULT_CONFIDENCES,
  DEFAULT_TASK_STATUSES,
  DEFAULT_TAGS,
  DEFAULT_WORKSPACE_CONFIG,
  COLOR_PRESETS,
  getColorClasses,
} from '../types/config';

describe('Configuration Defaults', () => {
  describe('DEFAULT_STATUSES', () => {
    it('should have required statuses', () => {
      expect(DEFAULT_STATUSES).toHaveLength(4);

      const statusIds = DEFAULT_STATUSES.map((s) => s.id);
      expect(statusIds).toContain('status-todo');
      expect(statusIds).toContain('status-doing');
      expect(statusIds).toContain('status-done');
      expect(statusIds).toContain('status-failed');
    });

    it('should have correct status types', () => {
      const todoStatus = DEFAULT_STATUSES.find((s) => s.id === 'status-todo');
      const doneStatus = DEFAULT_STATUSES.find((s) => s.id === 'status-done');
      const failedStatus = DEFAULT_STATUSES.find((s) => s.id === 'status-failed');

      expect(todoStatus?.type).toBe('active');
      expect(doneStatus?.type).toBe('completed');
      expect(failedStatus?.type).toBe('cancelled');
    });

    it('should have countAsProgress only for completed status', () => {
      const completed = DEFAULT_STATUSES.filter((s) => s.countAsProgress);
      expect(completed).toHaveLength(1);
      expect(completed[0].id).toBe('status-done');
    });

    it('should all show in board', () => {
      expect(DEFAULT_STATUSES.every((s) => s.showInBoard)).toBe(true);
    });
  });

  describe('DEFAULT_AREAS', () => {
    it('should have 8 areas', () => {
      expect(DEFAULT_AREAS).toHaveLength(8);
    });

    it('should have required areas', () => {
      const areaIds = DEFAULT_AREAS.map((a) => a.id);
      expect(areaIds).toContain('area-faith');
      expect(areaIds).toContain('area-family');
      expect(areaIds).toContain('area-career');
      expect(areaIds).toContain('area-health');
    });

    it('should have descriptions for all areas', () => {
      expect(DEFAULT_AREAS.every((a) => a.description)).toBe(true);
    });

    it('should have sequential order numbers', () => {
      const orders = DEFAULT_AREAS.map((a) => a.order).sort((a, b) => a - b);
      expect(orders).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
    });
  });

  describe('DEFAULT_PRIORITIES', () => {
    it('should have 3 priorities', () => {
      expect(DEFAULT_PRIORITIES).toHaveLength(3);
    });

    it('should have correct levels', () => {
      const high = DEFAULT_PRIORITIES.find((p) => p.id === 'priority-high');
      const medium = DEFAULT_PRIORITIES.find((p) => p.id === 'priority-medium');
      const low = DEFAULT_PRIORITIES.find((p) => p.id === 'priority-low');

      expect(high?.level).toBe(1);
      expect(medium?.level).toBe(2);
      expect(low?.level).toBe(3);
    });

    it('should have appropriate colors', () => {
      const high = DEFAULT_PRIORITIES.find((p) => p.id === 'priority-high');
      const low = DEFAULT_PRIORITIES.find((p) => p.id === 'priority-low');

      expect(high?.color).toBe('red');
      expect(low?.color).toBe('slate');
    });
  });

  describe('DEFAULT_CADENCES', () => {
    it('should have 4 cadences', () => {
      expect(DEFAULT_CADENCES).toHaveLength(4);
    });

    it('should have correct day values', () => {
      const cadences = DEFAULT_CADENCES.reduce(
        (acc, c) => {
          acc[c.id] = c.days;
          return acc;
        },
        {} as Record<string, number>
      );

      expect(cadences['cadence-weekly']).toBe(7);
      expect(cadences['cadence-biweekly']).toBe(14);
      expect(cadences['cadence-monthly']).toBe(30);
      expect(cadences['cadence-quarterly']).toBe(90);
    });
  });

  describe('DEFAULT_CONFIDENCES', () => {
    it('should have 3 confidence levels', () => {
      expect(DEFAULT_CONFIDENCES).toHaveLength(3);
    });

    it('should have correct levels (reverse of priority)', () => {
      const high = DEFAULT_CONFIDENCES.find((c) => c.id === 'confidence-high');
      const low = DEFAULT_CONFIDENCES.find((c) => c.id === 'confidence-low');

      expect(high?.level).toBe(3);
      expect(low?.level).toBe(1);
    });
  });

  describe('DEFAULT_TASK_STATUSES', () => {
    it('should have 3 task statuses', () => {
      expect(DEFAULT_TASK_STATUSES).toHaveLength(3);
    });

    it('should have required statuses', () => {
      const statusIds = DEFAULT_TASK_STATUSES.map((s) => s.id);
      expect(statusIds).toContain('task-backlog');
      expect(statusIds).toContain('task-next');
      expect(statusIds).toContain('task-done');
    });

    it('should have correct types', () => {
      const backlog = DEFAULT_TASK_STATUSES.find((s) => s.id === 'task-backlog');
      const next = DEFAULT_TASK_STATUSES.find((s) => s.id === 'task-next');
      const done = DEFAULT_TASK_STATUSES.find((s) => s.id === 'task-done');

      expect(backlog?.type).toBe('pending');
      expect(next?.type).toBe('active');
      expect(done?.type).toBe('completed');
    });

    it('should have countAsProgress only for done', () => {
      const withProgress = DEFAULT_TASK_STATUSES.filter((s) => s.countAsProgress);
      expect(withProgress).toHaveLength(1);
      expect(withProgress[0].id).toBe('task-done');
    });
  });

  describe('DEFAULT_TAGS', () => {
    it('should have 4 default tags', () => {
      expect(DEFAULT_TAGS).toHaveLength(4);
    });

    it('should have required tags', () => {
      const tagIds = DEFAULT_TAGS.map((t) => t.id);
      expect(tagIds).toContain('tag-urgent');
      expect(tagIds).toContain('tag-blocked');
      expect(tagIds).toContain('tag-research');
      expect(tagIds).toContain('tag-quick-win');
    });
  });

  describe('DEFAULT_WORKSPACE_CONFIG', () => {
    it('should have all configuration sections', () => {
      expect(DEFAULT_WORKSPACE_CONFIG).toHaveProperty('statuses');
      expect(DEFAULT_WORKSPACE_CONFIG).toHaveProperty('areas');
      expect(DEFAULT_WORKSPACE_CONFIG).toHaveProperty('priorities');
      expect(DEFAULT_WORKSPACE_CONFIG).toHaveProperty('cadences');
      expect(DEFAULT_WORKSPACE_CONFIG).toHaveProperty('confidences');
      expect(DEFAULT_WORKSPACE_CONFIG).toHaveProperty('taskStatuses');
      expect(DEFAULT_WORKSPACE_CONFIG).toHaveProperty('tags');
      expect(DEFAULT_WORKSPACE_CONFIG).toHaveProperty('defaults');
      expect(DEFAULT_WORKSPACE_CONFIG).toHaveProperty('board');
      expect(DEFAULT_WORKSPACE_CONFIG).toHaveProperty('dashboard');
      expect(DEFAULT_WORKSPACE_CONFIG).toHaveProperty('notifications');
    });

    it('should have valid default values', () => {
      expect(DEFAULT_WORKSPACE_CONFIG.defaults.status).toBe('status-todo');
      expect(DEFAULT_WORKSPACE_CONFIG.defaults.priority).toBe('priority-medium');
      expect(DEFAULT_WORKSPACE_CONFIG.defaults.cadence).toBe('cadence-monthly');
      expect(DEFAULT_WORKSPACE_CONFIG.defaults.confidence).toBe('confidence-medium');
      expect(DEFAULT_WORKSPACE_CONFIG.defaults.taskStatus).toBe('task-next');
    });

    it('should have valid board config', () => {
      expect(DEFAULT_WORKSPACE_CONFIG.board.showArchivedStatuses).toBe(false);
      expect(DEFAULT_WORKSPACE_CONFIG.board.defaultGroupBy).toBe('status');
      expect(DEFAULT_WORKSPACE_CONFIG.board.cardDisplayFields).toContain('area');
      expect(DEFAULT_WORKSPACE_CONFIG.board.cardDisplayFields).toContain('priority');
    });

    it('should have valid dashboard config', () => {
      expect(DEFAULT_WORKSPACE_CONFIG.dashboard.dueSoonDays).toBe(14);
      expect(DEFAULT_WORKSPACE_CONFIG.dashboard.staleDays).toBe(30);
      expect(DEFAULT_WORKSPACE_CONFIG.dashboard.maxDailyFocusItems).toBe(5);
      expect(DEFAULT_WORKSPACE_CONFIG.dashboard.showCompletedInFocus).toBe(false);
    });

    it('should have valid notification defaults', () => {
      expect(DEFAULT_WORKSPACE_CONFIG.notifications.reviewReminders).toBe(true);
      expect(DEFAULT_WORKSPACE_CONFIG.notifications.dueSoonReminders).toBe(true);
      expect(DEFAULT_WORKSPACE_CONFIG.notifications.staleProjectReminders).toBe(true);
      expect(DEFAULT_WORKSPACE_CONFIG.notifications.dailyDigest).toBe(false);
    });
  });

  describe('COLOR_PRESETS', () => {
    it('should have many color options', () => {
      expect(COLOR_PRESETS.length).toBeGreaterThan(10);
    });

    it('should have consistent structure', () => {
      COLOR_PRESETS.forEach((preset) => {
        expect(preset).toHaveProperty('name');
        expect(preset).toHaveProperty('value');
        expect(preset).toHaveProperty('bg');
        expect(preset).toHaveProperty('text');
        expect(preset).toHaveProperty('border');
      });
    });

    it('should have common colors', () => {
      const colorValues = COLOR_PRESETS.map((c) => c.value);
      expect(colorValues).toContain('red');
      expect(colorValues).toContain('blue');
      expect(colorValues).toContain('green');
      expect(colorValues).toContain('amber');
      expect(colorValues).toContain('purple');
    });

    it('should have valid Tailwind classes', () => {
      COLOR_PRESETS.forEach((preset) => {
        expect(preset.bg).toMatch(/^bg-\w+-\d+$/);
        expect(preset.text).toMatch(/^text-\w+-\d+$/);
        expect(preset.border).toMatch(/^border-\w+-\d+$/);
      });
    });
  });

  describe('getColorClasses', () => {
    it('should return preset colors for known values', () => {
      const result = getColorClasses('blue');
      expect(result).toEqual({
        bg: 'bg-blue-100',
        text: 'text-blue-700',
        border: 'border-blue-200',
      });
    });

    it('should return red preset', () => {
      const result = getColorClasses('red');
      expect(result).toEqual({
        bg: 'bg-red-100',
        text: 'text-red-700',
        border: 'border-red-200',
      });
    });

    it('should generate classes for unknown colors', () => {
      const result = getColorClasses('custom');
      expect(result).toEqual({
        bg: 'bg-custom-100',
        text: 'text-custom-700',
        border: 'border-custom-200',
      });
    });

    it('should handle all preset colors', () => {
      COLOR_PRESETS.forEach((preset) => {
        const result = getColorClasses(preset.value);
        expect(result.bg).toBe(preset.bg);
        expect(result.text).toBe(preset.text);
        expect(result.border).toBe(preset.border);
      });
    });
  });
});
