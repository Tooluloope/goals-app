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
  JournalEntry,
  Habit,
  HabitLog,
  HabitWithStats,
  WeeklyReview,
  MonthlyReview,
  CreateJournalEntryDto,
  UpdateJournalEntryDto,
  CreateHabitDto,
  UpdateHabitDto,
  CreateWeeklyReviewDto,
  UpdateWeeklyReviewDto,
  CreateMonthlyReviewDto,
  UpdateMonthlyReviewDto,
  ProjectDependency,
  TaskDependency,
} from '@goals/shared';

// Dynamically determine API URL based on current hostname
function getApiBaseUrl(): string {
  // Server-side: use environment variable
  if (typeof window === 'undefined') {
    return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  }

  // Client-side: use the same hostname but with API port
  const hostname = window.location.hostname;
  const apiPort = process.env.NEXT_PUBLIC_API_PORT || '3001';

  return `http://${hostname}:${apiPort}`;
}

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
      const response = await fetch(`${getApiBaseUrl()}/api/auth/refresh`, {
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

    let response = await fetch(`${getApiBaseUrl()}/api${endpoint}`, {
      ...fetchOptions,
      headers,
    });

    // Handle token refresh
    if (response.status === 401 && requiresAuth && this.refreshToken) {
      const refreshed = await this.refreshAccessToken();
      if (refreshed) {
        (headers as Record<string, string>)['Authorization'] = `Bearer ${this.accessToken}`;
        response = await fetch(`${getApiBaseUrl()}/api${endpoint}`, {
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

  completeRecurringTask(
    id: string,
    createNextOccurrence: boolean = true
  ): Promise<{ completedTask: Task; nextTask?: Task }> {
    return this.fetch<{ completedTask: Task; nextTask?: Task }>(`/tasks/${id}/complete-recurring`, {
      method: 'POST',
      body: JSON.stringify({ createNextOccurrence }),
    });
  }

  // ============================================================
  // PROJECT DEPENDENCIES
  // ============================================================

  getProjectBlockers(
    projectId: string
  ): Promise<{ blockedBy: ProjectDependency[]; blocking: ProjectDependency[] }> {
    return this.fetch<{ blockedBy: ProjectDependency[]; blocking: ProjectDependency[] }>(
      `/projects/${projectId}/blockers`
    );
  }

  addProjectBlocker(
    projectId: string,
    blockerId: string,
    note?: string
  ): Promise<ProjectDependency> {
    return this.fetch<ProjectDependency>(`/projects/${projectId}/blockers`, {
      method: 'POST',
      body: JSON.stringify({ blockerId, note }),
    });
  }

  removeProjectBlocker(projectId: string, blockerId: string): Promise<void> {
    return this.fetch<void>(`/projects/${projectId}/blockers/${blockerId}`, {
      method: 'DELETE',
    });
  }

  // ============================================================
  // TASK DEPENDENCIES
  // ============================================================

  getTaskBlockers(
    taskId: string
  ): Promise<{ blockedBy: TaskDependency[]; blocking: TaskDependency[] }> {
    return this.fetch<{ blockedBy: TaskDependency[]; blocking: TaskDependency[] }>(
      `/tasks/${taskId}/blockers`
    );
  }

  addTaskBlocker(taskId: string, blockerId: string, note?: string): Promise<TaskDependency> {
    return this.fetch<TaskDependency>(`/tasks/${taskId}/blockers`, {
      method: 'POST',
      body: JSON.stringify({ blockerId, note }),
    });
  }

  removeTaskBlocker(taskId: string, blockerId: string): Promise<void> {
    return this.fetch<void>(`/tasks/${taskId}/blockers/${blockerId}`, {
      method: 'DELETE',
    });
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

  // ============================================================
  // JOURNAL
  // ============================================================

  getJournalEntries(startDate?: string, endDate?: string): Promise<JournalEntry[]> {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    const query = params.toString();
    return this.fetch<JournalEntry[]>(`/journal${query ? `?${query}` : ''}`);
  }

  getJournalEntry(id: string): Promise<JournalEntry> {
    return this.fetch<JournalEntry>(`/journal/${id}`);
  }

  getJournalEntryByDate(date: string): Promise<JournalEntry | null> {
    return this.fetch<JournalEntry | null>(`/journal/date/${date}`);
  }

  getTodayJournalEntry(): Promise<JournalEntry | null> {
    return this.fetch<JournalEntry | null>('/journal/today');
  }

  getJournalStreak(): Promise<{ currentStreak: number; longestStreak: number }> {
    return this.fetch<{ currentStreak: number; longestStreak: number }>('/journal/streak');
  }

  getJournalPrompt(): Promise<{ prompt: string }> {
    return this.fetch<{ prompt: string }>('/journal/prompt');
  }

  createJournalEntry(data: CreateJournalEntryDto): Promise<JournalEntry> {
    return this.fetch<JournalEntry>('/journal', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  updateJournalEntry(id: string, data: UpdateJournalEntryDto): Promise<JournalEntry> {
    return this.fetch<JournalEntry>(`/journal/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  upsertJournalEntry(data: CreateJournalEntryDto): Promise<JournalEntry> {
    return this.fetch<JournalEntry>('/journal/upsert', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  deleteJournalEntry(id: string): Promise<void> {
    return this.fetch<void>(`/journal/${id}`, { method: 'DELETE' });
  }

  // ============================================================
  // HABITS
  // ============================================================

  getHabits(includeArchived = false): Promise<HabitWithStats[]> {
    return this.fetch<HabitWithStats[]>(`/habits?includeArchived=${includeArchived}`);
  }

  getHabit(id: string): Promise<HabitWithStats> {
    return this.fetch<HabitWithStats>(`/habits/${id}`);
  }

  async getTodayHabits(): Promise<HabitWithStats[]> {
    const response = await this.fetch<{
      habits: HabitWithStats[];
      completedCount: number;
      totalCount: number;
    }>('/habits/today');
    return response.habits;
  }

  createHabit(data: CreateHabitDto): Promise<Habit> {
    return this.fetch<Habit>('/habits', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  updateHabit(id: string, data: UpdateHabitDto): Promise<Habit> {
    return this.fetch<Habit>(`/habits/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  deleteHabit(id: string): Promise<void> {
    return this.fetch<void>(`/habits/${id}`, { method: 'DELETE' });
  }

  toggleHabitLog(habitId: string, date: string, notes?: string): Promise<HabitLog | null> {
    return this.fetch<HabitLog | null>(`/habits/${habitId}/toggle`, {
      method: 'POST',
      body: JSON.stringify({ date, notes }),
    });
  }

  getHabitLogs(habitId: string, startDate?: string, endDate?: string): Promise<HabitLog[]> {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    const query = params.toString();
    return this.fetch<HabitLog[]>(`/habits/${habitId}/logs${query ? `?${query}` : ''}`);
  }

  reorderHabits(habitIds: string[]): Promise<Habit[]> {
    return this.fetch<Habit[]>('/habits/reorder', {
      method: 'PUT',
      body: JSON.stringify({ habitIds }),
    });
  }

  // ============================================================
  // WEEKLY REVIEWS
  // ============================================================

  getWeeklyReviews(limit?: number): Promise<WeeklyReview[]> {
    const query = limit ? `?limit=${limit}` : '';
    return this.fetch<WeeklyReview[]>(`/reviews/weekly${query}`);
  }

  getWeeklyReview(id: string): Promise<WeeklyReview> {
    return this.fetch<WeeklyReview>(`/reviews/weekly/${id}`);
  }

  getCurrentWeekReview(): Promise<WeeklyReview | null> {
    return this.fetch<WeeklyReview | null>('/reviews/weekly/current');
  }

  getWeeklyReviewByDate(weekStart: string): Promise<WeeklyReview | null> {
    return this.fetch<WeeklyReview | null>(`/reviews/weekly/date/${weekStart}`);
  }

  createWeeklyReview(data: CreateWeeklyReviewDto): Promise<WeeklyReview> {
    return this.fetch<WeeklyReview>('/reviews/weekly', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  updateWeeklyReview(id: string, data: UpdateWeeklyReviewDto): Promise<WeeklyReview> {
    return this.fetch<WeeklyReview>(`/reviews/weekly/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  upsertWeeklyReview(data: CreateWeeklyReviewDto): Promise<WeeklyReview> {
    return this.fetch<WeeklyReview>('/reviews/weekly/upsert', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  deleteWeeklyReview(id: string): Promise<void> {
    return this.fetch<void>(`/reviews/weekly/${id}`, { method: 'DELETE' });
  }

  getWeeklyReviewStats(): Promise<{
    totalReviews: number;
    averageRating: number;
    currentStreak: number;
  }> {
    return this.fetch<{ totalReviews: number; averageRating: number; currentStreak: number }>(
      '/reviews/weekly/stats'
    );
  }

  getWeeklyReviewPrompts(): Promise<{ prompts: Record<string, string> }> {
    return this.fetch<{ prompts: Record<string, string> }>('/reviews/weekly/prompts');
  }

  // ============================================================
  // MONTHLY REVIEWS
  // ============================================================

  getMonthlyReviews(limit?: number): Promise<MonthlyReview[]> {
    const query = limit ? `?limit=${limit}` : '';
    return this.fetch<MonthlyReview[]>(`/reviews/monthly${query}`);
  }

  getMonthlyReview(id: string): Promise<MonthlyReview> {
    return this.fetch<MonthlyReview>(`/reviews/monthly/${id}`);
  }

  getCurrentMonthReview(): Promise<MonthlyReview | null> {
    return this.fetch<MonthlyReview | null>('/reviews/monthly/current');
  }

  getMonthlyReviewByDate(month: string): Promise<MonthlyReview | null> {
    return this.fetch<MonthlyReview | null>(`/reviews/monthly/date/${month}`);
  }

  createMonthlyReview(data: CreateMonthlyReviewDto): Promise<MonthlyReview> {
    return this.fetch<MonthlyReview>('/reviews/monthly', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  updateMonthlyReview(id: string, data: UpdateMonthlyReviewDto): Promise<MonthlyReview> {
    return this.fetch<MonthlyReview>(`/reviews/monthly/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  upsertMonthlyReview(data: CreateMonthlyReviewDto): Promise<MonthlyReview> {
    return this.fetch<MonthlyReview>('/reviews/monthly/upsert', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  deleteMonthlyReview(id: string): Promise<void> {
    return this.fetch<void>(`/reviews/monthly/${id}`, { method: 'DELETE' });
  }

  getMonthlyReviewStats(): Promise<{ totalReviews: number; averageRating: number }> {
    return this.fetch<{ totalReviews: number; averageRating: number }>('/reviews/monthly/stats');
  }

  getMonthlyReviewPrompts(): Promise<{ prompts: Record<string, string> }> {
    return this.fetch<{ prompts: Record<string, string> }>('/reviews/monthly/prompts');
  }
}

export const apiClient = new ApiClient();
