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

    it('should return direct API URL for auth endpoints in proxy mode', () => {
      process.env.NEXT_PUBLIC_USE_PROXY = 'true';
      process.env.NEXT_PUBLIC_API_URL = 'http://localhost:3001';
      expect(getApiBaseUrl('/auth/magic-link/request')).toBe('http://localhost:3001');
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

    it('should request forgot password', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(JSON.stringify({ message: 'Email sent' })),
      });

      const result = await apiClient.forgotPassword('test@example.com');
      expect(result.message).toBe('Email sent');
    });

    it('should reset password', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(JSON.stringify({ message: 'Password reset' })),
      });

      const result = await apiClient.resetPassword('token123', 'newpassword');
      expect(result.message).toBe('Password reset');
    });

    it('should request magic link', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(JSON.stringify({ message: 'Magic link sent' })),
      });

      const result = await apiClient.requestMagicLink('test@example.com', 'Test User');
      expect(result.message).toBe('Magic link sent');
    });

    it('should verify magic link and set tokens', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () =>
          Promise.resolve(
            JSON.stringify({
              user: { id: '1', email: 'test@example.com' },
              accessToken: 'access123',
              refreshToken: 'refresh456',
              isNewUser: true,
            })
          ),
      });

      const result = await apiClient.verifyMagicLink('token123');
      expect(result.user.email).toBe('test@example.com');
      expect(result.isNewUser).toBe(true);
      expect(localStorage.getItem('accessToken')).toBe('access123');
    });
  });

  describe('user account methods', () => {
    beforeEach(() => {
      apiClient.setTokens('access123', 'refresh456');
    });

    it('should change email', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () =>
          Promise.resolve(JSON.stringify({ message: 'Email changed', email: 'new@example.com' })),
      });

      const result = await apiClient.changeEmail({
        email: 'new@example.com',
        password: 'password',
      });
      expect(result.email).toBe('new@example.com');
    });

    it('should change password', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(JSON.stringify({ message: 'Password changed' })),
      });

      const result = await apiClient.changePassword({ currentPassword: 'old', newPassword: 'new' });
      expect(result.message).toBe('Password changed');
    });

    it('should set password', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(JSON.stringify({ message: 'Password set' })),
      });

      const result = await apiClient.setPassword('newpassword');
      expect(result.message).toBe('Password set');
    });

    it('should delete account', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(JSON.stringify({ message: 'Account deleted' })),
      });

      const result = await apiClient.deleteAccount('password');
      expect(result.message).toBe('Account deleted');
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

    it('should get single workspace', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(JSON.stringify({ id: 'ws-1', name: 'My Workspace' })),
      });

      const workspace = await apiClient.getWorkspace('ws-1');
      expect(workspace.name).toBe('My Workspace');
    });

    it('should update workspace', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(JSON.stringify({ id: 'ws-1', name: 'Updated Name' })),
      });

      const workspace = await apiClient.updateWorkspace('ws-1', { name: 'Updated Name' });
      expect(workspace.name).toBe('Updated Name');
    });

    it('should invite to workspace', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(JSON.stringify({ message: 'Invited', inviteId: 'inv-1' })),
      });

      const result = await apiClient.inviteToWorkspace('ws-1', 'user@example.com');
      expect(result.inviteId).toBe('inv-1');
    });

    it('should get pending invites', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(JSON.stringify([{ id: 'inv-1', email: 'user@example.com' }])),
      });

      const invites = await apiClient.getPendingInvites('ws-1');
      expect(invites).toHaveLength(1);
    });

    it('should cancel invite', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(JSON.stringify({ message: 'Cancelled' })),
      });

      const result = await apiClient.cancelInvite('inv-1');
      expect(result.message).toBe('Cancelled');
    });

    it('should resend invite', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(JSON.stringify({ message: 'Resent' })),
      });

      const result = await apiClient.resendInvite('inv-1');
      expect(result.message).toBe('Resent');
    });

    it('should preview invite', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () =>
          Promise.resolve(
            JSON.stringify({
              workspace: { name: 'Test' },
              email: 'user@example.com',
              expiresAt: '2024-12-31',
            })
          ),
      });

      const result = await apiClient.previewInvite('token123');
      expect(result.workspace.name).toBe('Test');
    });

    it('should accept invite', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(JSON.stringify({ workspaceId: 'ws-1' })),
      });

      const result = await apiClient.acceptInvite('token123');
      expect(result.workspaceId).toBe('ws-1');
    });

    it('should get workspace with members', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(JSON.stringify({ id: 'ws-1', members: [{ id: 'user-1' }] })),
      });

      const workspace = await apiClient.getWorkspaceWithMembers('ws-1');
      expect(workspace.members).toHaveLength(1);
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
        areaIds: ['area-1'],
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

    it('should get single project', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(JSON.stringify({ id: 'p-1', name: 'Project' })),
      });

      const project = await apiClient.getProject('p-1');
      expect(project.name).toBe('Project');
    });

    it('should update project', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(JSON.stringify({ id: 'p-1', name: 'Updated' })),
      });

      const project = await apiClient.updateProject('p-1', { name: 'Updated' });
      expect(project.name).toBe('Updated');
    });

    it('should update project status', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(JSON.stringify({ id: 'p-1', statusId: 'done' })),
      });

      const project = await apiClient.updateProjectStatus('p-1', 'done');
      expect(project.statusId).toBe('done');
    });

    it('should add requirement', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () =>
          Promise.resolve(JSON.stringify({ id: 'p-1', requirements: [{ text: 'Req 1' }] })),
      });

      const project = await apiClient.addRequirement('p-1', 'Req 1');
      expect(project.requirements).toHaveLength(1);
    });

    it('should toggle requirement', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(JSON.stringify({ id: 'p-1' })),
      });

      await expect(apiClient.toggleRequirement('p-1', 'req-1')).resolves.toBeDefined();
    });

    it('should add definition of done', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () =>
          Promise.resolve(JSON.stringify({ id: 'p-1', definitionOfDone: [{ text: 'DoD 1' }] })),
      });

      const project = await apiClient.addDefinitionOfDone('p-1', 'DoD 1');
      expect(project.definitionOfDone).toHaveLength(1);
    });

    it('should toggle definition of done', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(JSON.stringify({ id: 'p-1' })),
      });

      await expect(apiClient.toggleDefinitionOfDone('p-1', 'dod-1')).resolves.toBeDefined();
    });

    it('should add review', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(JSON.stringify({ id: 'p-1' })),
      });

      const project = await apiClient.addReview({
        projectId: 'p-1',
        progress: 'Good progress',
        notes: 'Notes',
        blockers: 'None',
        changes: 'No changes',
        nextStep: 'Keep going',
      });
      expect(project).toBeDefined();
    });

    it('should get projects for workspace', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(JSON.stringify([{ id: 'p-1' }])),
      });

      const projects = await apiClient.getProjectsForWorkspace('ws-1');
      expect(projects).toHaveLength(1);
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

    it('should get single task', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(JSON.stringify({ id: 't-1', title: 'Task' })),
      });

      const task = await apiClient.getTask('t-1');
      expect(task.title).toBe('Task');
    });

    it('should create task', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(JSON.stringify({ id: 't-1', title: 'New Task' })),
      });

      const task = await apiClient.createTask({
        projectId: 'p-1',
        title: 'New Task',
        statusId: 's-1',
        isRecurring: false,
        recurrenceType: 'none',
        recurrenceInterval: 1,
        recurrenceDays: [],
      });
      expect(task.title).toBe('New Task');
    });

    it('should update task', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(JSON.stringify({ id: 't-1', title: 'Updated' })),
      });

      const task = await apiClient.updateTask('t-1', { title: 'Updated' });
      expect(task.title).toBe('Updated');
    });

    it('should delete task', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(''),
      });

      await expect(apiClient.deleteTask('t-1')).resolves.not.toThrow();
    });

    it('should get tasks with workspaceId', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(JSON.stringify([{ id: 't-1' }])),
      });

      const tasks = await apiClient.getTasks('ws-1');
      expect(tasks).toHaveLength(1);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('workspaceId=ws-1'),
        expect.any(Object)
      );
    });
  });

  describe('dependency methods', () => {
    beforeEach(() => {
      apiClient.setTokens('access123', 'refresh456');
    });

    it('should get project blockers', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(JSON.stringify({ blockedBy: [], blocking: [] })),
      });

      const result = await apiClient.getProjectBlockers('p-1');
      expect(result.blockedBy).toEqual([]);
    });

    it('should add project blocker', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(JSON.stringify({ id: 'dep-1', blockerId: 'p-2' })),
      });

      const dep = await apiClient.addProjectBlocker('p-1', 'p-2', 'Note');
      expect(dep.blockerId).toBe('p-2');
    });

    it('should remove project blocker', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(''),
      });

      await expect(apiClient.removeProjectBlocker('p-1', 'p-2')).resolves.not.toThrow();
    });

    it('should get task blockers', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(JSON.stringify({ blockedBy: [], blocking: [] })),
      });

      const result = await apiClient.getTaskBlockers('t-1');
      expect(result.blockedBy).toEqual([]);
    });

    it('should add task blocker', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(JSON.stringify({ id: 'dep-1', blockerId: 't-2' })),
      });

      const dep = await apiClient.addTaskBlocker('t-1', 't-2', 'Note');
      expect(dep.blockerId).toBe('t-2');
    });

    it('should remove task blocker', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(''),
      });

      await expect(apiClient.removeTaskBlocker('t-1', 't-2')).resolves.not.toThrow();
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

    it('should get unread notifications count', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(JSON.stringify(5)),
      });

      const count = await apiClient.getUnreadNotificationsCount();
      expect(count).toBe(5);
    });
  });

  describe('config methods', () => {
    beforeEach(() => {
      apiClient.setTokens('access123', 'refresh456');
    });

    it('should get workspace config', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(JSON.stringify({ workspaceId: 'ws-1', areas: [] })),
      });

      const config = await apiClient.getWorkspaceConfig('ws-1');
      expect(config.workspaceId).toBe('ws-1');
    });

    it('should update workspace config', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(JSON.stringify({ workspaceId: 'ws-1' })),
      });

      const config = await apiClient.updateWorkspaceConfig('ws-1', { areas: [] });
      expect(config.workspaceId).toBe('ws-1');
    });

    it('should reset workspace config', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(JSON.stringify({ workspaceId: 'ws-1' })),
      });

      const config = await apiClient.resetWorkspaceConfig('ws-1');
      expect(config.workspaceId).toBe('ws-1');
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

    it('should get single habit', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(JSON.stringify({ id: 'h-1', name: 'Habit' })),
      });

      const habit = await apiClient.getHabit('h-1');
      expect(habit.name).toBe('Habit');
    });

    it('should get today habits', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () =>
          Promise.resolve(
            JSON.stringify({ habits: [{ id: 'h-1' }], completedCount: 0, totalCount: 1 })
          ),
      });

      const habits = await apiClient.getTodayHabits();
      expect(habits).toHaveLength(1);
    });

    it('should create habit', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(JSON.stringify({ id: 'h-1', name: 'New Habit' })),
      });

      const habit = await apiClient.createHabit({
        name: 'New Habit',
        icon: 'target',
        color: 'primary',
        frequency: 'daily',
        frequencyDays: [],
        reminderEnabled: false,
      });
      expect(habit.name).toBe('New Habit');
    });

    it('should update habit', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(JSON.stringify({ id: 'h-1', name: 'Updated' })),
      });

      const habit = await apiClient.updateHabit('h-1', { name: 'Updated' });
      expect(habit.name).toBe('Updated');
    });

    it('should delete habit', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(''),
      });

      await expect(apiClient.deleteHabit('h-1')).resolves.not.toThrow();
    });

    it('should get habit logs', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(JSON.stringify([{ id: 'log-1' }])),
      });

      const logs = await apiClient.getHabitLogs('h-1', '2024-01-01', '2024-01-31');
      expect(logs).toHaveLength(1);
    });

    it('should get habits for date', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(JSON.stringify([{ id: 'h-1' }])),
      });

      const habits = await apiClient.getHabitsForDate('2024-06-15');
      expect(habits).toHaveLength(1);
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

    it('should get single journal entry', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(JSON.stringify({ id: 'j-1', content: 'Entry' })),
      });

      const entry = await apiClient.getJournalEntry('j-1');
      expect(entry.content).toBe('Entry');
    });

    it('should get journal entry by date', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(JSON.stringify({ id: 'j-1', date: '2024-06-15' })),
      });

      const entry = await apiClient.getJournalEntryByDate('2024-06-15');
      expect(entry?.date).toBe('2024-06-15');
    });

    it('should get today journal entry', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () =>
          Promise.resolve(
            JSON.stringify({
              entry: { id: 'j-1' },
              prompt: 'Test',
              currentStreak: 1,
              longestStreak: 5,
            })
          ),
      });

      const entry = await apiClient.getTodayJournalEntry();
      expect(entry?.id).toBe('j-1');
    });

    it('should get journal streak', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(JSON.stringify({ currentStreak: 5, longestStreak: 10 })),
      });

      const streak = await apiClient.getJournalStreak();
      expect(streak.currentStreak).toBe(5);
    });

    it('should get journal prompt', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(JSON.stringify({ prompt: 'What are you grateful for?' })),
      });

      const result = await apiClient.getJournalPrompt();
      expect(result.prompt).toContain('grateful');
    });

    it('should create journal entry', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(JSON.stringify({ id: 'j-1', content: 'New' })),
      });

      const entry = await apiClient.createJournalEntry({ date: '2024-06-15', content: 'New' });
      expect(entry.content).toBe('New');
    });

    it('should update journal entry', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(JSON.stringify({ id: 'j-1', content: 'Updated' })),
      });

      const entry = await apiClient.updateJournalEntry('j-1', { content: 'Updated' });
      expect(entry.content).toBe('Updated');
    });

    it('should delete journal entry', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(''),
      });

      await expect(apiClient.deleteJournalEntry('j-1')).resolves.not.toThrow();
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

    it('should get single weekly review', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(JSON.stringify({ id: 'wr-1' })),
      });

      const review = await apiClient.getWeeklyReview('wr-1');
      expect(review.id).toBe('wr-1');
    });

    it('should get current week review', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(JSON.stringify({ id: 'wr-1' })),
      });

      const review = await apiClient.getCurrentWeekReview();
      expect(review?.id).toBe('wr-1');
    });

    it('should get weekly review by date', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(JSON.stringify({ id: 'wr-1', weekStart: '2024-06-10' })),
      });

      const review = await apiClient.getWeeklyReviewByDate('2024-06-10');
      expect(review?.weekStart).toBe('2024-06-10');
    });

    it('should create weekly review', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(JSON.stringify({ id: 'wr-1' })),
      });

      const review = await apiClient.createWeeklyReview({ weekStart: '2024-06-10' });
      expect(review.id).toBe('wr-1');
    });

    it('should update weekly review', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(JSON.stringify({ id: 'wr-1', rating: 5 })),
      });

      const review = await apiClient.updateWeeklyReview('wr-1', { rating: 5 });
      expect(review.rating).toBe(5);
    });

    it('should delete weekly review', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(''),
      });

      await expect(apiClient.deleteWeeklyReview('wr-1')).resolves.not.toThrow();
    });

    it('should get weekly review stats', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () =>
          Promise.resolve(JSON.stringify({ totalReviews: 10, averageRating: 4, currentStreak: 3 })),
      });

      const stats = await apiClient.getWeeklyReviewStats();
      expect(stats.currentStreak).toBe(3);
    });

    it('should get weekly review prompts', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(JSON.stringify({ prompts: { wins: 'What went well?' } })),
      });

      const result = await apiClient.getWeeklyReviewPrompts();
      expect(result.prompts.wins).toBeDefined();
    });

    it('should get monthly reviews', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(JSON.stringify([{ id: 'mr-1' }])),
      });

      const reviews = await apiClient.getMonthlyReviews(5);
      expect(reviews).toHaveLength(1);
    });

    it('should get single monthly review', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(JSON.stringify({ id: 'mr-1' })),
      });

      const review = await apiClient.getMonthlyReview('mr-1');
      expect(review.id).toBe('mr-1');
    });

    it('should get current month review', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(JSON.stringify({ id: 'mr-1' })),
      });

      const review = await apiClient.getCurrentMonthReview();
      expect(review?.id).toBe('mr-1');
    });

    it('should get monthly review by date', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(JSON.stringify({ id: 'mr-1', month: '2024-06' })),
      });

      const review = await apiClient.getMonthlyReviewByDate('2024-06');
      expect(review?.month).toBe('2024-06');
    });

    it('should create monthly review', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(JSON.stringify({ id: 'mr-1' })),
      });

      const review = await apiClient.createMonthlyReview({ month: '2024-06' });
      expect(review.id).toBe('mr-1');
    });

    it('should update monthly review', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(JSON.stringify({ id: 'mr-1', rating: 4 })),
      });

      const review = await apiClient.updateMonthlyReview('mr-1', { rating: 4 });
      expect(review.rating).toBe(4);
    });

    it('should upsert monthly review', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(JSON.stringify({ id: 'mr-1' })),
      });

      const review = await apiClient.upsertMonthlyReview({ month: '2024-06' });
      expect(review.id).toBe('mr-1');
    });

    it('should delete monthly review', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(''),
      });

      await expect(apiClient.deleteMonthlyReview('mr-1')).resolves.not.toThrow();
    });

    it('should get monthly review prompts', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () =>
          Promise.resolve(JSON.stringify({ prompts: { achievements: 'What did you achieve?' } })),
      });

      const result = await apiClient.getMonthlyReviewPrompts();
      expect(result.prompts.achievements).toBeDefined();
    });
  });

  describe('AI summary methods', () => {
    beforeEach(() => {
      apiClient.setTokens('access123', 'refresh456');
    });

    it('should get AI conversation', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(JSON.stringify({ id: 'conv-1', messages: [] })),
      });

      const conversation = await apiClient.getAiConversation('conv-1');
      expect(conversation.id).toBe('conv-1');
    });

    it('should delete AI conversation', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(''),
      });

      await expect(apiClient.deleteAiConversation('conv-1')).resolves.not.toThrow();
    });

    it('should get weekly AI summary', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(JSON.stringify({ summary: { content: 'Weekly summary' } })),
      });

      const result = await apiClient.getWeeklyAiSummary('ws-1', '2024-06-10');
      expect(result.summary.content).toBe('Weekly summary');
    });

    it('should get monthly AI summary', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(JSON.stringify({ summary: { content: 'Monthly summary' } })),
      });

      const result = await apiClient.getMonthlyAiSummary('ws-1', '2024-06');
      expect(result.summary.content).toBe('Monthly summary');
    });

    it('should get yearly AI summary', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(JSON.stringify({ summary: { content: 'Yearly summary' } })),
      });

      const result = await apiClient.getYearlyAiSummary('ws-1', '2024');
      expect(result.summary.content).toBe('Yearly summary');
    });

    it('should generate AI summary', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(JSON.stringify({ summary: { content: 'Generated' } })),
      });

      const result = await apiClient.generateAiSummary('ws-1', 'weekly', '2024-06-10');
      expect(result.summary.content).toBe('Generated');
    });

    it('should generate AI insights', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(JSON.stringify([{ id: 'ins-1' }])),
      });

      const insights = await apiClient.generateAiInsights('ws-1', ['pattern']);
      expect(insights).toHaveLength(1);
    });

    it('should get daily text', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () =>
          Promise.resolve(
            JSON.stringify({ text: 'Daily text', generatedAt: '2024-06-15', cached: false })
          ),
      });

      const result = await apiClient.getDailyText('ws-1');
      expect(result.text).toBe('Daily text');
    });
  });

  describe('token refresh edge cases', () => {
    it('should clear tokens when refresh fails', async () => {
      apiClient.setTokens('expired', 'bad-refresh');

      // First call returns 401
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: () => Promise.resolve({ message: 'Unauthorized' }),
      });

      // Refresh token call fails
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ message: 'Invalid refresh token' }),
      });

      await expect(apiClient.fetch('/test')).rejects.toThrow();
      expect(localStorage.getItem('accessToken')).toBeNull();
    });

    it('should not try to refresh without refresh token', async () => {
      apiClient.setTokens('expired', '');
      apiClient.clearTokens();
      apiClient.setTokens('expired', '');
      // Clear refresh token specifically
      localStorage.removeItem('refreshToken');
      apiClient.loadTokens();

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: () => Promise.resolve({ message: 'Unauthorized' }),
      });

      await expect(apiClient.fetch('/test')).rejects.toThrow('Unauthorized');
      // Should only have made 1 call (no refresh attempt)
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });
  });
});
