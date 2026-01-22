import type {
  User,
  UserSettings,
  Workspace,
  Project,
  Task,
  Notification,
  WorkspaceConfig,
  AuthResponse,
  CreateProjectDto,
  UpdateProjectDto,
  CreateTaskDto,
  UpdateTaskDto,
  AddReviewDto,
  UpdateWorkspaceConfigDto,
} from '@goals/shared';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface FetchOptions extends RequestInit {
  requiresAuth?: boolean;
}

class ApiClient {
  private accessToken: string | null = null;
  private refreshToken: string | null = null;

  setTokens(accessToken: string, refreshToken: string) {
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
    if (typeof window !== 'undefined') {
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
    }
  }

  clearTokens() {
    this.accessToken = null;
    this.refreshToken = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
    }
  }

  loadTokens() {
    if (typeof window !== 'undefined') {
      this.accessToken = localStorage.getItem('accessToken');
      this.refreshToken = localStorage.getItem('refreshToken');
    }
  }

  hasTokens(): boolean {
    this.loadTokens();
    return !!this.accessToken;
  }

  private async refreshAccessToken(): Promise<boolean> {
    if (!this.refreshToken) return false;

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: this.refreshToken }),
      });

      if (!response.ok) {
        this.clearTokens();
        return false;
      }

      const data = await response.json();
      this.setTokens(data.accessToken, data.refreshToken);
      return true;
    } catch {
      this.clearTokens();
      return false;
    }
  }

  async fetch<T>(endpoint: string, options: FetchOptions = {}): Promise<T> {
    const { requiresAuth = true, ...fetchOptions } = options;

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...fetchOptions.headers,
    };

    if (requiresAuth && this.accessToken) {
      (headers as Record<string, string>)['Authorization'] = `Bearer ${this.accessToken}`;
    }

    let response = await fetch(`${API_BASE_URL}/api${endpoint}`, {
      ...fetchOptions,
      headers,
    });

    // Handle token refresh
    if (response.status === 401 && requiresAuth && this.refreshToken) {
      const refreshed = await this.refreshAccessToken();
      if (refreshed) {
        (headers as Record<string, string>)['Authorization'] = `Bearer ${this.accessToken}`;
        response = await fetch(`${API_BASE_URL}/api${endpoint}`, {
          ...fetchOptions,
          headers,
        });
      }
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Request failed' }));
      throw new Error(error.message || 'Request failed');
    }

    // Handle empty responses
    const text = await response.text();
    return text ? JSON.parse(text) : (undefined as T);
  }

  // ============================================================
  // AUTH
  // ============================================================

  async login(email: string, password: string): Promise<AuthResponse['user']> {
    const data = await this.fetch<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
      requiresAuth: false,
    });
    this.setTokens(data.accessToken, data.refreshToken);
    return data.user;
  }

  async signup(name: string, email: string, password: string): Promise<AuthResponse['user']> {
    const data = await this.fetch<AuthResponse>('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
      requiresAuth: false,
    });
    this.setTokens(data.accessToken, data.refreshToken);
    return data.user;
  }

  async logout() {
    try {
      await this.fetch('/auth/logout', {
        method: 'POST',
        body: JSON.stringify({ refreshToken: this.refreshToken }),
      });
    } finally {
      this.clearTokens();
    }
  }

  // ============================================================
  // USERS
  // ============================================================

  getCurrentUser(): Promise<User> {
    return this.fetch<User>('/users/me');
  }

  updateUserSettings(settings: Partial<UserSettings>): Promise<User> {
    return this.fetch<User>('/users/me/settings', {
      method: 'PATCH',
      body: JSON.stringify(settings),
    });
  }

  updateProfile(data: { name?: string; avatar?: string }): Promise<User> {
    return this.fetch<User>('/users/me', {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  // ============================================================
  // WORKSPACES
  // ============================================================

  getWorkspaces(): Promise<Workspace[]> {
    return this.fetch<Workspace[]>('/workspaces');
  }

  getWorkspace(id: string): Promise<Workspace> {
    return this.fetch<Workspace>(`/workspaces/${id}`);
  }

  createWorkspace(data: { name: string; type: 'personal' | 'family' }): Promise<Workspace> {
    return this.fetch<Workspace>('/workspaces', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  inviteToWorkspace(workspaceId: string, email: string) {
    return this.fetch<void>(`/workspaces/${workspaceId}/invite`, {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  // ============================================================
  // PROJECTS
  // ============================================================

  getProjectsForWorkspace(workspaceId: string): Promise<Project[]> {
    return this.fetch<Project[]>(`/projects/workspace/${workspaceId}`);
  }

  getAllProjects(): Promise<Project[]> {
    return this.fetch<Project[]>('/projects/user');
  }

  getProject(id: string): Promise<Project> {
    return this.fetch<Project>(`/projects/${id}`);
  }

  createProject(data: CreateProjectDto): Promise<Project> {
    return this.fetch<Project>('/projects', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  updateProject(id: string, data: UpdateProjectDto): Promise<Project> {
    return this.fetch<Project>(`/projects/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  updateProjectStatus(id: string, statusId: string): Promise<Project> {
    return this.fetch<Project>(`/projects/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ statusId }),
    });
  }

  deleteProject(id: string): Promise<void> {
    return this.fetch<void>(`/projects/${id}`, { method: 'DELETE' });
  }

  addRequirement(projectId: string, text: string): Promise<Project> {
    return this.fetch<Project>(`/projects/${projectId}/requirements`, {
      method: 'POST',
      body: JSON.stringify({ text }),
    });
  }

  toggleRequirement(projectId: string, itemId: string): Promise<Project> {
    return this.fetch<Project>(`/projects/${projectId}/requirements/${itemId}/toggle`, {
      method: 'PATCH',
    });
  }

  addDefinitionOfDone(projectId: string, text: string): Promise<Project> {
    return this.fetch<Project>(`/projects/${projectId}/definition-of-done`, {
      method: 'POST',
      body: JSON.stringify({ text }),
    });
  }

  toggleDefinitionOfDone(projectId: string, itemId: string): Promise<Project> {
    return this.fetch<Project>(`/projects/${projectId}/definition-of-done/${itemId}/toggle`, {
      method: 'PATCH',
    });
  }

  addReview(data: AddReviewDto): Promise<Project> {
    return this.fetch<Project>(`/projects/${data.projectId}/reviews`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // ============================================================
  // TASKS
  // ============================================================

  getTasks(): Promise<Task[]> {
    return this.fetch<Task[]>('/tasks');
  }

  createTask(data: CreateTaskDto): Promise<Task> {
    return this.fetch<Task>('/tasks', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  updateTask(id: string, data: UpdateTaskDto): Promise<Task> {
    return this.fetch<Task>(`/tasks/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  updateTaskStatus(id: string, statusId: string): Promise<Task> {
    return this.fetch<Task>(`/tasks/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ statusId }),
    });
  }

  deleteTask(id: string): Promise<void> {
    return this.fetch<void>(`/tasks/${id}`, { method: 'DELETE' });
  }

  // ============================================================
  // NOTIFICATIONS
  // ============================================================

  getNotifications(): Promise<Notification[]> {
    return this.fetch<Notification[]>('/notifications');
  }

  getUnreadNotificationsCount(): Promise<number> {
    return this.fetch<number>('/notifications/unread-count');
  }

  markNotificationRead(id: string): Promise<Notification> {
    return this.fetch<Notification>(`/notifications/${id}/read`, { method: 'PATCH' });
  }

  markAllNotificationsRead(): Promise<void> {
    return this.fetch<void>('/notifications/read-all', { method: 'PATCH' });
  }

  // ============================================================
  // CONFIG
  // ============================================================

  getWorkspaceConfig(workspaceId: string): Promise<WorkspaceConfig> {
    return this.fetch<WorkspaceConfig>(`/config/workspace/${workspaceId}`);
  }

  updateWorkspaceConfig(
    workspaceId: string,
    updates: UpdateWorkspaceConfigDto
  ): Promise<WorkspaceConfig> {
    return this.fetch<WorkspaceConfig>(`/config/workspace/${workspaceId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  resetWorkspaceConfig(workspaceId: string): Promise<WorkspaceConfig> {
    return this.fetch<WorkspaceConfig>(`/config/workspace/${workspaceId}/reset`, {
      method: 'POST',
    });
  }
}

export const apiClient = new ApiClient();
