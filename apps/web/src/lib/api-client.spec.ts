import { apiClient, getApiBaseUrl } from './api-client';

// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('ApiClient', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    apiClient.clearTokens();
    localStorage.clear();
  });

  describe('getApiBaseUrl', () => {
    const originalWindow = global.window;
    const originalEnv = process.env;

    beforeEach(() => {
      process.env = { ...originalEnv };
    });

    afterEach(() => {
      process.env = originalEnv;
    });

    it('should return empty string when proxy mode is enabled', () => {
      process.env.NEXT_PUBLIC_USE_PROXY = 'true';
      expect(getApiBaseUrl()).toBe('');
    });

    it('should return environment variable when set', () => {
      process.env.NEXT_PUBLIC_USE_PROXY = 'false';
      process.env.NEXT_PUBLIC_API_URL = 'https://api.example.com';
      expect(getApiBaseUrl()).toBe('https://api.example.com');
    });

    it('should return localhost with port for local development', () => {
      process.env.NEXT_PUBLIC_USE_PROXY = 'false';
      delete process.env.NEXT_PUBLIC_API_URL;
      // This tests the window.location.hostname === 'localhost' case
      const result = getApiBaseUrl();
      expect(result).toContain('localhost');
    });
  });

  describe('token management', () => {
    it('should set tokens in localStorage', () => {
      apiClient.setTokens('access123', 'refresh456');

      expect(localStorage.getItem('accessToken')).toBe('access123');
      expect(localStorage.getItem('refreshToken')).toBe('refresh456');
    });

    it('should clear tokens from localStorage', () => {
      localStorage.setItem('accessToken', 'access123');
      localStorage.setItem('refreshToken', 'refresh456');

      apiClient.clearTokens();

      expect(localStorage.getItem('accessToken')).toBeNull();
      expect(localStorage.getItem('refreshToken')).toBeNull();
    });

    it('should load tokens from localStorage', () => {
      localStorage.setItem('accessToken', 'access123');
      localStorage.setItem('refreshToken', 'refresh456');

      apiClient.loadTokens();

      expect(apiClient.hasTokens()).toBe(true);
    });

    it('should return false when no tokens', () => {
      expect(apiClient.hasTokens()).toBe(false);
    });
  });

  describe('fetch', () => {
    it('should make authenticated request', async () => {
      apiClient.setTokens('access123', 'refresh456');
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(JSON.stringify({ data: 'test' })),
      });

      const result = await apiClient.fetch('/test');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/test'),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer access123',
          }),
        })
      );
      expect(result).toEqual({ data: 'test' });
    });

    it('should make unauthenticated request when requiresAuth is false', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(JSON.stringify({ data: 'test' })),
      });

      await apiClient.fetch('/test', { requiresAuth: false });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/test'),
        expect.objectContaining({
          headers: expect.not.objectContaining({
            Authorization: expect.any(String),
          }),
        })
      );
    });

    it('should throw error on failed request', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ message: 'Unauthorized' }),
      });

      await expect(apiClient.fetch('/test', { requiresAuth: false })).rejects.toThrow(
        'Unauthorized'
      );
    });

    it('should handle empty response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(''),
      });

      const result = await apiClient.fetch('/test', { requiresAuth: false });
      expect(result).toBeUndefined();
    });

    it('should refresh token on 401', async () => {
      apiClient.setTokens('expired', 'refresh456');

      // First call returns 401
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: () => Promise.resolve({ message: 'Unauthorized' }),
      });

      // Refresh token call
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            accessToken: 'newAccess',
            refreshToken: 'newRefresh',
          }),
      });

      // Retry with new token
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(JSON.stringify({ data: 'success' })),
      });

      const result = await apiClient.fetch('/test');

      expect(mockFetch).toHaveBeenCalledTimes(3);
      expect(result).toEqual({ data: 'success' });
    });
  });

  describe('auth methods', () => {
    it('should login and set tokens', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () =>
          Promise.resolve(
            JSON.stringify({
              user: { id: '1', email: 'test@example.com' },
              accessToken: 'access123',
              refreshToken: 'refresh456',
            })
          ),
      });

      const user = await apiClient.login('test@example.com', 'password');

      expect(user).toEqual({ id: '1', email: 'test@example.com' });
      expect(localStorage.getItem('accessToken')).toBe('access123');
    });

    it('should signup and set tokens', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () =>
          Promise.resolve(
            JSON.stringify({
              user: { id: '1', name: 'Test', email: 'test@example.com' },
              accessToken: 'access123',
              refreshToken: 'refresh456',
            })
          ),
      });

      const user = await apiClient.signup('Test', 'test@example.com', 'password');

      expect(user.email).toBe('test@example.com');
      expect(localStorage.getItem('accessToken')).toBe('access123');
    });

    it('should logout and clear tokens', async () => {
      apiClient.setTokens('access123', 'refresh456');
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(''),
      });

      await apiClient.logout();

      expect(localStorage.getItem('accessToken')).toBeNull();
    });

    it('should clear tokens even if logout request fails', async () => {
      apiClient.setTokens('access123', 'refresh456');
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      // Logout throws on network error but still clears tokens in finally block
      try {
        await apiClient.logout();
      } catch {
        // Expected to throw
      }

      expect(localStorage.getItem('accessToken')).toBeNull();
    });
  });

  describe('user methods', () => {
    beforeEach(() => {
      apiClient.setTokens('access123', 'refresh456');
    });

    it('should get current user', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(JSON.stringify({ id: '1', email: 'test@example.com' })),
      });

      const user = await apiClient.getCurrentUser();
      expect(user.email).toBe('test@example.com');
    });

    it('should update user settings', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(JSON.stringify({ id: '1', timezone: 'America/New_York' })),
      });

      const user = await apiClient.updateUserSettings({ timezone: 'America/New_York' });
      expect(user.timezone).toBe('America/New_York');
    });

    it('should update profile', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(JSON.stringify({ id: '1', name: 'New Name' })),
      });

      const user = await apiClient.updateProfile({ name: 'New Name' });
      expect(user.name).toBe('New Name');
    });
  });

  describe('workspace methods', () => {
    beforeEach(() => {
      apiClient.setTokens('access123', 'refresh456');
    });

    it('should get workspaces', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(JSON.stringify([{ id: '1', name: 'Workspace 1' }])),
      });

      const workspaces = await apiClient.getWorkspaces();
      expect(workspaces).toHaveLength(1);
    });

    it('should create workspace', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(JSON.stringify({ id: '1', name: 'New Workspace' })),
      });

      const workspace = await apiClient.createWorkspace({
        name: 'New Workspace',
        type: 'personal',
      });
      expect(workspace.name).toBe('New Workspace');
    });
  });

  describe('project methods', () => {
    beforeEach(() => {
      apiClient.setTokens('access123', 'refresh456');
    });

    it('should get all projects', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(JSON.stringify([{ id: '1', name: 'Project 1' }])),
      });

      const projects = await apiClient.getAllProjects();
      expect(projects).toHaveLength(1);
    });

    it('should create project', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(JSON.stringify({ id: '1', name: 'New Project' })),
      });

      const project = await apiClient.createProject({
        name: 'New Project',
        workspaceId: 'ws-1',
        areaId: 'area-1',
        statusId: 'status-todo',
        priorityId: 'priority-medium',
        cadenceId: 'cadence-30',
        startDate: new Date().toISOString(),
        targetDate: new Date().toISOString(),
        objective: 'Test objective',
        successMetric: 'Test metric',
        confidenceId: 'confidence-medium',
        tagIds: [],
      });
      expect(project.name).toBe('New Project');
    });

    it('should delete project', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(''),
      });

      await expect(apiClient.deleteProject('project-1')).resolves.not.toThrow();
    });
  });

  describe('task methods', () => {
    beforeEach(() => {
      apiClient.setTokens('access123', 'refresh456');
    });

    it('should get tasks', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(JSON.stringify([{ id: '1', title: 'Task 1' }])),
      });

      const tasks = await apiClient.getTasks();
      expect(tasks).toHaveLength(1);
    });

    it('should update task status', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(JSON.stringify({ id: '1', statusId: 'task-done' })),
      });

      const task = await apiClient.updateTaskStatus('task-1', 'task-done');
      expect(task.statusId).toBe('task-done');
    });

    it('should complete recurring task', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () =>
          Promise.resolve(
            JSON.stringify({
              completedTask: { id: '1', completedAt: new Date() },
              nextTask: { id: '2' },
            })
          ),
      });

      const result = await apiClient.completeRecurringTask('task-1');
      expect(result.completedTask).toBeDefined();
      expect(result.nextTask).toBeDefined();
    });
  });

  describe('notification methods', () => {
    beforeEach(() => {
      apiClient.setTokens('access123', 'refresh456');
    });

    it('should get notifications', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(JSON.stringify([{ id: '1', title: 'Notification' }])),
      });

      const notifications = await apiClient.getNotifications();
      expect(notifications).toHaveLength(1);
    });

    it('should mark notification as read', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(JSON.stringify({ id: '1', readAt: new Date() })),
      });

      const notification = await apiClient.markNotificationRead('notification-1');
      expect(notification.readAt).toBeDefined();
    });

    it('should mark all notifications as read', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(''),
      });

      await expect(apiClient.markAllNotificationsRead()).resolves.not.toThrow();
    });
  });

  describe('habit methods', () => {
    beforeEach(() => {
      apiClient.setTokens('access123', 'refresh456');
    });

    it('should get habits', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(JSON.stringify([{ id: '1', name: 'Exercise' }])),
      });

      const habits = await apiClient.getHabits();
      expect(habits).toHaveLength(1);
    });

    it('should toggle habit log', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(JSON.stringify({ id: '1', completed: true })),
      });

      const log = await apiClient.toggleHabitLog('habit-1', '2024-06-15');
      expect(log?.completed).toBe(true);
    });

    it('should reorder habits', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(JSON.stringify([{ id: '1' }, { id: '2' }])),
      });

      const habits = await apiClient.reorderHabits(['habit-2', 'habit-1']);
      expect(habits).toHaveLength(2);
    });
  });

  describe('AI methods', () => {
    beforeEach(() => {
      apiClient.setTokens('access123', 'refresh456');
    });

    it('should get AI conversations', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(JSON.stringify([{ id: '1', messages: [] }])),
      });

      const conversations = await apiClient.getAiConversations('workspace-1');
      expect(conversations).toHaveLength(1);
    });

    it('should create AI conversation', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(JSON.stringify({ id: '1', title: 'New Chat' })),
      });

      const conversation = await apiClient.createAiConversation('workspace-1', 'New Chat');
      expect(conversation.title).toBe('New Chat');
    });

    it('should get auth headers', () => {
      apiClient.setTokens('access123', 'refresh456');
      const headers = apiClient.getAuthHeaders();
      expect(headers.Authorization).toBe('Bearer access123');
    });

    it('should return empty headers when no token', () => {
      apiClient.clearTokens();
      const headers = apiClient.getAuthHeaders();
      expect(headers).toEqual({});
    });

    it('should get chat stream URL', () => {
      const url = apiClient.getAiChatStreamUrl('conv-1');
      expect(url).toContain('/api/ai/conversations/conv-1/messages');
    });

    it('should get AI summaries', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(JSON.stringify([{ id: '1', type: 'weekly' }])),
      });

      const summaries = await apiClient.getAiSummaries('workspace-1', 'weekly');
      expect(summaries).toHaveLength(1);
    });

    it('should get AI insights', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(JSON.stringify([{ id: '1', type: 'pattern' }])),
      });

      const insights = await apiClient.getAiInsights('workspace-1');
      expect(insights).toHaveLength(1);
    });

    it('should dismiss AI insight', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(JSON.stringify({ id: '1', dismissed: true })),
      });

      const insight = await apiClient.dismissAiInsight('insight-1');
      expect(insight.dismissed).toBe(true);
    });
  });

  describe('journal methods', () => {
    beforeEach(() => {
      apiClient.setTokens('access123', 'refresh456');
    });

    it('should get journal entries', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(JSON.stringify([{ id: '1', content: 'Entry' }])),
      });

      const entries = await apiClient.getJournalEntries('2024-06-01', '2024-06-30');
      expect(entries).toHaveLength(1);
    });

    it('should upsert journal entry', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(JSON.stringify({ id: '1', content: 'Updated' })),
      });

      const entry = await apiClient.upsertJournalEntry({
        date: '2024-06-15',
        content: 'Updated',
      });
      expect(entry.content).toBe('Updated');
    });
  });

  describe('review methods', () => {
    beforeEach(() => {
      apiClient.setTokens('access123', 'refresh456');
    });

    it('should get weekly reviews', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(JSON.stringify([{ id: '1' }])),
      });

      const reviews = await apiClient.getWeeklyReviews(5);
      expect(reviews).toHaveLength(1);
    });

    it('should upsert weekly review', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(JSON.stringify({ id: '1', weekStart: '2024-06-10' })),
      });

      const review = await apiClient.upsertWeeklyReview({ weekStart: '2024-06-10' });
      expect(review.weekStart).toBe('2024-06-10');
    });

    it('should get monthly review stats', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(JSON.stringify({ totalReviews: 5, averageRating: 4.5 })),
      });

      const stats = await apiClient.getMonthlyReviewStats();
      expect(stats.totalReviews).toBe(5);
    });
  });
});
