import {
  loginSchema,
  signupSchema,
  updateProfileSchema,
  updateUserSettingsSchema,
  createWorkspaceSchema,
  inviteToWorkspaceSchema,
  createProjectSchema,
  updateProjectSchema,
  updateProjectStatusSchema,
  addChecklistItemSchema,
  addKeyDecisionSchema,
  addReviewSchema,
  createTaskSchema,
  updateTaskSchema,
  completeRecurringTaskSchema,
  createJournalEntrySchema,
  updateJournalEntrySchema,
  moodSchema,
  createHabitSchema,
  updateHabitSchema,
  toggleHabitLogSchema,
  createWeeklyReviewSchema,
  updateWeeklyReviewSchema,
  createMonthlyReviewSchema,
  updateMonthlyReviewSchema,
  updateWorkspaceConfigSchema,
  createAiConversationSchema,
  sendAiMessageSchema,
  generateSummarySchema,
  summaryTypeSchema,
  insightTypeSchema,
  recurrenceTypeSchema,
} from '../validation/schemas';

describe('Validation Schemas', () => {
  describe('loginSchema', () => {
    it('should validate valid login data', () => {
      const data = { email: 'test@example.com', password: 'password123' };
      expect(loginSchema.safeParse(data).success).toBe(true);
    });

    it('should reject invalid email', () => {
      const data = { email: 'invalid', password: 'password123' };
      const result = loginSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should reject short password', () => {
      const data = { email: 'test@example.com', password: '12345' };
      const result = loginSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });

  describe('signupSchema', () => {
    it('should validate valid signup data', () => {
      const data = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
      };
      expect(signupSchema.safeParse(data).success).toBe(true);
    });

    it('should validate with optional timezone', () => {
      const data = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        timezone: 'America/New_York',
      };
      expect(signupSchema.safeParse(data).success).toBe(true);
    });

    it('should reject short name', () => {
      const data = {
        name: 'T',
        email: 'test@example.com',
        password: 'password123',
      };
      const result = signupSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });

  describe('updateProfileSchema', () => {
    const pngDataUrl = 'data:image/png;base64,AAA=';

    it('should accept https avatar URL', () => {
      const data = { avatar: 'https://example.com/avatar.png' };
      expect(updateProfileSchema.safeParse(data).success).toBe(true);
    });

    it('should accept data URL avatar', () => {
      const data = { avatar: pngDataUrl };
      expect(updateProfileSchema.safeParse(data).success).toBe(true);
    });

    it('should reject http avatar URL', () => {
      const data = { avatar: 'http://example.com/avatar.png' };
      expect(updateProfileSchema.safeParse(data).success).toBe(false);
    });

    it('should reject unsupported data URL avatar', () => {
      const data = { avatar: 'data:image/gif;base64,AAA=' };
      expect(updateProfileSchema.safeParse(data).success).toBe(false);
    });
  });

  describe('updateUserSettingsSchema', () => {
    it('should validate valid settings', () => {
      const data = {
        theme: 'dark',
        compactMode: true,
        showWelcomeOnLogin: false,
        timezone: 'UTC',
      };
      expect(updateUserSettingsSchema.safeParse(data).success).toBe(true);
    });

    it('should accept partial settings', () => {
      const data = { theme: 'light' };
      expect(updateUserSettingsSchema.safeParse(data).success).toBe(true);
    });

    it('should reject invalid theme', () => {
      const data = { theme: 'invalid' };
      const result = updateUserSettingsSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });

  describe('createWorkspaceSchema', () => {
    it('should validate valid workspace', () => {
      const data = { name: 'My Workspace', type: 'personal' };
      expect(createWorkspaceSchema.safeParse(data).success).toBe(true);
    });

    it('should accept family type', () => {
      const data = { name: 'Family Workspace', type: 'family' };
      expect(createWorkspaceSchema.safeParse(data).success).toBe(true);
    });

    it('should reject empty name', () => {
      const data = { name: '', type: 'personal' };
      const result = createWorkspaceSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should reject invalid type', () => {
      const data = { name: 'Test', type: 'invalid' };
      const result = createWorkspaceSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });

  describe('inviteToWorkspaceSchema', () => {
    it('should validate valid email', () => {
      const data = { email: 'test@example.com' };
      expect(inviteToWorkspaceSchema.safeParse(data).success).toBe(true);
    });

    it('should reject invalid email', () => {
      const data = { email: 'not-an-email' };
      const result = inviteToWorkspaceSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });

  describe('createProjectSchema', () => {
    const validProject = {
      name: 'Test Project',
      workspaceId: '123e4567-e89b-12d3-a456-426614174000',
      areaIds: ['area-1'],
      statusId: 'status-1',
      startDate: '2024-06-01T00:00:00.000Z',
      targetDate: '2024-12-01T00:00:00.000Z',
      cadenceId: 'cadence-1',
      priorityId: 'priority-1',
      objective: 'Test objective',
      successMetric: 'Test metric',
      confidenceId: 'confidence-1',
    };

    it('should validate valid project', () => {
      expect(createProjectSchema.safeParse(validProject).success).toBe(true);
    });

    it('should validate with optional fields', () => {
      const data = {
        ...validProject,
        failureCriteria: 'Test failure',
        tagIds: ['tag-1', 'tag-2'],
      };
      expect(createProjectSchema.safeParse(data).success).toBe(true);
    });

    it('should reject invalid workspace ID', () => {
      const data = { ...validProject, workspaceId: 'invalid' };
      const result = createProjectSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should reject empty name', () => {
      const data = { ...validProject, name: '' };
      const result = createProjectSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });

  describe('updateProjectSchema', () => {
    it('should validate partial update', () => {
      const data = { name: 'Updated Name' };
      expect(updateProjectSchema.safeParse(data).success).toBe(true);
    });

    it('should validate empty update', () => {
      expect(updateProjectSchema.safeParse({}).success).toBe(true);
    });
  });

  describe('updateProjectStatusSchema', () => {
    it('should validate valid status', () => {
      const data = { statusId: 'status-done' };
      expect(updateProjectStatusSchema.safeParse(data).success).toBe(true);
    });

    it('should reject empty status', () => {
      const data = { statusId: '' };
      const result = updateProjectStatusSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });

  describe('addChecklistItemSchema', () => {
    it('should validate valid item', () => {
      const data = { text: 'Test item' };
      expect(addChecklistItemSchema.safeParse(data).success).toBe(true);
    });

    it('should reject empty text', () => {
      const data = { text: '' };
      const result = addChecklistItemSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });

  describe('addKeyDecisionSchema', () => {
    it('should validate valid decision', () => {
      const data = {
        context: 'Test context',
        options: ['Option A', 'Option B'],
        chosen: 'Option A',
        rationale: 'Test rationale',
      };
      expect(addKeyDecisionSchema.safeParse(data).success).toBe(true);
    });

    it('should reject less than 2 options', () => {
      const data = {
        context: 'Test',
        options: ['Only one'],
        chosen: 'Only one',
        rationale: 'Test',
      };
      const result = addKeyDecisionSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });

  describe('addReviewSchema', () => {
    it('should validate valid review', () => {
      const data = {
        projectId: '123e4567-e89b-12d3-a456-426614174000',
        notes: 'Test notes',
        progress: 'On track',
        blockers: '',
        changes: '',
        nextStep: '',
      };
      expect(addReviewSchema.safeParse(data).success).toBe(true);
    });

    it('should reject invalid project ID', () => {
      const data = {
        projectId: 'invalid',
        notes: 'Test',
        progress: 'On track',
        blockers: '',
        changes: '',
        nextStep: '',
      };
      const result = addReviewSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });

  describe('recurrenceTypeSchema', () => {
    it('should validate all recurrence types', () => {
      const types = ['none', 'daily', 'weekly', 'monthly', 'yearly', 'custom'];
      types.forEach((type) => {
        expect(recurrenceTypeSchema.safeParse(type).success).toBe(true);
      });
    });

    it('should reject invalid type', () => {
      const result = recurrenceTypeSchema.safeParse('biweekly');
      expect(result.success).toBe(false);
    });
  });

  describe('createTaskSchema', () => {
    const validTask = {
      projectId: '123e4567-e89b-12d3-a456-426614174000',
      title: 'Test Task',
      statusId: 'status-1',
    };
    const imageDataUrl = 'data:image/png;base64,AAA=';

    it('should validate valid task', () => {
      expect(createTaskSchema.safeParse(validTask).success).toBe(true);
    });

    it('should validate recurring task', () => {
      const data = {
        ...validTask,
        isRecurring: true,
        recurrenceType: 'weekly',
        recurrenceInterval: 2,
        recurrenceDays: [1, 3, 5],
      };
      expect(createTaskSchema.safeParse(data).success).toBe(true);
    });

    it('should validate task with due date', () => {
      const data = {
        ...validTask,
        dueDate: '2024-06-15T00:00:00.000Z',
      };
      expect(createTaskSchema.safeParse(data).success).toBe(true);
    });

    it('should validate task with image attachments', () => {
      const data = {
        ...validTask,
        images: [
          {
            id: 'img-1',
            name: 'proof',
            data: imageDataUrl,
            type: 'image/png',
            size: 1024,
          },
        ],
      };
      expect(createTaskSchema.safeParse(data).success).toBe(true);
    });

    it('should reject task with invalid image data URL', () => {
      const data = {
        ...validTask,
        images: [
          {
            id: 'img-1',
            name: 'proof',
            data: 'not-a-data-url',
            type: 'image/png',
            size: 1024,
          },
        ],
      };
      expect(createTaskSchema.safeParse(data).success).toBe(false);
    });

    it('should reject task with unsupported image type', () => {
      const data = {
        ...validTask,
        images: [
          {
            id: 'img-1',
            name: 'proof',
            data: imageDataUrl,
            type: 'image/gif',
            size: 1024,
          },
        ],
      };
      expect(createTaskSchema.safeParse(data).success).toBe(false);
    });

    it('should reject task with oversized image', () => {
      const data = {
        ...validTask,
        images: [
          {
            id: 'img-1',
            name: 'proof',
            data: imageDataUrl,
            type: 'image/png',
            size: 5 * 1024 * 1024 + 1,
          },
        ],
      };
      expect(createTaskSchema.safeParse(data).success).toBe(false);
    });

    it('should reject invalid project ID', () => {
      const data = { ...validTask, projectId: 'invalid' };
      const result = createTaskSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should reject invalid recurrence days', () => {
      const data = {
        ...validTask,
        recurrenceDays: [7], // 7 is invalid (0-6 only)
      };
      const result = createTaskSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });

  describe('updateTaskSchema', () => {
    it('should validate partial update', () => {
      const data = { title: 'Updated Title' };
      expect(updateTaskSchema.safeParse(data).success).toBe(true);
    });

    it('should validate recurrence update', () => {
      const data = {
        isRecurring: true,
        recurrenceType: 'daily',
        recurrenceInterval: 1,
      };
      expect(updateTaskSchema.safeParse(data).success).toBe(true);
    });
  });

  describe('completeRecurringTaskSchema', () => {
    it('should validate with default', () => {
      expect(completeRecurringTaskSchema.safeParse({}).success).toBe(true);
    });

    it('should validate explicit false', () => {
      const data = { createNextOccurrence: false };
      expect(completeRecurringTaskSchema.safeParse(data).success).toBe(true);
    });
  });

  describe('moodSchema', () => {
    it('should validate all moods', () => {
      const moods = ['terrible', 'bad', 'neutral', 'good', 'great'];
      moods.forEach((mood) => {
        expect(moodSchema.safeParse(mood).success).toBe(true);
      });
    });

    it('should reject invalid mood', () => {
      const result = moodSchema.safeParse('amazing');
      expect(result.success).toBe(false);
    });
  });

  describe('createJournalEntrySchema', () => {
    it('should validate valid entry', () => {
      const data = {
        date: '2024-06-15',
        content: 'Test content',
        mood: 'good',
      };
      expect(createJournalEntrySchema.safeParse(data).success).toBe(true);
    });

    it('should validate with all optional fields', () => {
      const data = {
        date: '2024-06-15',
        content: 'Test content',
        mood: 'great',
        emoji: '😊',
        prompt: 'How was your day?',
        wins: 'Got things done',
        challenges: 'Some issues',
        gratitude: 'Family',
        photoUrl: 'https://example.com/photo.jpg',
      };
      expect(createJournalEntrySchema.safeParse(data).success).toBe(true);
    });

    it('should reject invalid date format', () => {
      const data = {
        date: '06/15/2024',
        content: 'Test',
      };
      const result = createJournalEntrySchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should reject empty content', () => {
      const data = {
        date: '2024-06-15',
        content: '',
      };
      const result = createJournalEntrySchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });

  describe('updateJournalEntrySchema', () => {
    it('should validate partial update', () => {
      const data = { content: 'Updated content' };
      expect(updateJournalEntrySchema.safeParse(data).success).toBe(true);
    });
  });

  describe('createHabitSchema', () => {
    it('should validate valid habit', () => {
      const data = {
        workspaceId: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Exercise',
        icon: '💪',
      };
      expect(createHabitSchema.safeParse(data).success).toBe(true);
    });

    it('should validate with all options', () => {
      const data = {
        workspaceId: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Morning Routine',
        icon: '🌅',
        color: 'blue',
        order: 1,
        frequency: 'specific_days',
        frequencyDays: [1, 2, 3, 4, 5],
        reminderEnabled: true,
        reminderTime: '08:00',
        goalArea: 'Health',
        projectId: '123e4567-e89b-12d3-a456-426614174001',
        weight: 50,
      };
      expect(createHabitSchema.safeParse(data).success).toBe(true);
    });

    it('should reject name over 50 characters', () => {
      const data = {
        workspaceId: '123e4567-e89b-12d3-a456-426614174000',
        name: 'A'.repeat(51),
        icon: '💪',
      };
      const result = createHabitSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should reject invalid reminder time format', () => {
      const data = {
        workspaceId: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Test',
        icon: '💪',
        reminderTime: '8:00 AM',
      };
      const result = createHabitSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should accept valid 24-hour time', () => {
      const data = {
        workspaceId: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Test',
        icon: '💪',
        reminderTime: '23:59',
      };
      expect(createHabitSchema.safeParse(data).success).toBe(true);
    });

    it('should reject missing workspaceId', () => {
      const data = {
        name: 'Test',
        icon: '💪',
      };
      const result = createHabitSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should reject invalid weight values', () => {
      const data = {
        workspaceId: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Test',
        icon: '💪',
        weight: 150, // Over max of 100
      };
      const result = createHabitSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });

  describe('updateHabitSchema', () => {
    it('should validate partial update', () => {
      const data = { name: 'Updated Name' };
      expect(updateHabitSchema.safeParse(data).success).toBe(true);
    });

    it('should validate archive', () => {
      const data = { isArchived: true };
      expect(updateHabitSchema.safeParse(data).success).toBe(true);
    });
  });

  describe('toggleHabitLogSchema', () => {
    it('should validate valid date', () => {
      const data = { date: '2024-06-15' };
      expect(toggleHabitLogSchema.safeParse(data).success).toBe(true);
    });

    it('should reject invalid date format', () => {
      const data = { date: '2024/06/15' };
      const result = toggleHabitLogSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });

  describe('createWeeklyReviewSchema', () => {
    it('should validate valid review', () => {
      const data = {
        weekStart: '2024-06-10',
        wentWell: 'Completed tasks',
        rating: 4,
      };
      expect(createWeeklyReviewSchema.safeParse(data).success).toBe(true);
    });

    it('should reject rating outside 1-5', () => {
      const data = {
        weekStart: '2024-06-10',
        rating: 6,
      };
      const result = createWeeklyReviewSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });

  describe('createMonthlyReviewSchema', () => {
    it('should validate valid review', () => {
      const data = {
        month: '2024-06-01',
        highlights: 'Great progress',
        rating: 5,
      };
      expect(createMonthlyReviewSchema.safeParse(data).success).toBe(true);
    });

    it('should reject invalid month format', () => {
      const data = {
        month: 'June 2024',
      };
      const result = createMonthlyReviewSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });

  describe('updateWorkspaceConfigSchema', () => {
    it('should validate partial config update', () => {
      const data = {
        statuses: [
          {
            id: 'status-1',
            name: 'Custom Status',
            color: 'blue',
            order: 1,
            type: 'active',
            showInBoard: true,
            countAsProgress: false,
          },
        ],
      };
      expect(updateWorkspaceConfigSchema.safeParse(data).success).toBe(true);
    });

    it('should validate dashboard config', () => {
      const data = {
        dashboard: {
          dueSoonDays: 7,
          staleDays: 14,
          maxDailyFocusItems: 3,
          showCompletedInFocus: true,
        },
      };
      expect(updateWorkspaceConfigSchema.safeParse(data).success).toBe(true);
    });

    it('should validate board config', () => {
      const data = {
        board: {
          showArchivedStatuses: true,
          defaultGroupBy: 'area',
          cardDisplayFields: ['area', 'priority'],
        },
      };
      expect(updateWorkspaceConfigSchema.safeParse(data).success).toBe(true);
    });

    it('should reject invalid board groupBy', () => {
      const data = {
        board: {
          showArchivedStatuses: false,
          defaultGroupBy: 'invalid',
          cardDisplayFields: [],
        },
      };
      const result = updateWorkspaceConfigSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });

  describe('summaryTypeSchema', () => {
    it('should validate all summary types', () => {
      const types = ['weekly', 'monthly', 'yearly'];
      types.forEach((type) => {
        expect(summaryTypeSchema.safeParse(type).success).toBe(true);
      });
    });

    it('should reject invalid type', () => {
      const result = summaryTypeSchema.safeParse('daily');
      expect(result.success).toBe(false);
    });
  });

  describe('insightTypeSchema', () => {
    it('should validate all insight types', () => {
      const types = ['pattern', 'recommendation', 'celebration', 'warning', 'milestone'];
      types.forEach((type) => {
        expect(insightTypeSchema.safeParse(type).success).toBe(true);
      });
    });

    it('should reject invalid type', () => {
      const result = insightTypeSchema.safeParse('tip');
      expect(result.success).toBe(false);
    });
  });

  describe('createAiConversationSchema', () => {
    it('should validate with title', () => {
      const data = { title: 'My Chat' };
      expect(createAiConversationSchema.safeParse(data).success).toBe(true);
    });

    it('should validate without title', () => {
      expect(createAiConversationSchema.safeParse({}).success).toBe(true);
    });

    it('should reject title over 100 characters', () => {
      const data = { title: 'A'.repeat(101) };
      const result = createAiConversationSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });

  describe('sendAiMessageSchema', () => {
    it('should validate valid message', () => {
      const data = { message: 'Hello AI' };
      expect(sendAiMessageSchema.safeParse(data).success).toBe(true);
    });

    it('should reject empty message', () => {
      const data = { message: '' };
      const result = sendAiMessageSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should reject message over 4000 characters', () => {
      const data = { message: 'A'.repeat(4001) };
      const result = sendAiMessageSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });

  describe('generateSummarySchema', () => {
    it('should validate valid request', () => {
      const data = {
        type: 'weekly',
        periodStart: '2024-06-10',
      };
      expect(generateSummarySchema.safeParse(data).success).toBe(true);
    });

    it('should validate with forceRegenerate', () => {
      const data = {
        type: 'monthly',
        periodStart: '2024-06-01',
        forceRegenerate: true,
      };
      expect(generateSummarySchema.safeParse(data).success).toBe(true);
    });

    it('should reject invalid date format', () => {
      const data = {
        type: 'weekly',
        periodStart: '06-10-2024',
      };
      const result = generateSummarySchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });
});
