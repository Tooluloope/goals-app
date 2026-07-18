import type {
  User,
  UserSettings,
  Workspace,
  WorkspaceInvite,
  WorkspaceWithMembers,
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
  // AI Types
  AiConversation,
  AiMessage,
  AiSummary,
  AiInsight,
  AiSummaryResponse,
  SummaryType,
  SuggestedHabit,
  ProjectHabitProgress,
} from '@goals/shared';

// Dynamically determine API URL based on current hostname
// This works at RUNTIME, not build time, so it handles Docker deployments correctly
export function getApiBaseUrl(): string {
  // Server-side: use environment variable (set at runtime in Docker)
  if (typeof window === 'undefined') {
    return process.env.NEXT_PUBLIC_API_URL || process.env.NESTJS_API_URL || 'http://localhost:3001';
  }

  // Client-side: ALWAYS use relative URLs (empty string) to go through Next.js proxy
  // This ensures the middleware can attach session tokens and cookies work properly
  // The Next.js rewrites in next.config.js will proxy to the actual API server
  return '';
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

  getAuthHeaders(): Record<string, string> {
    if (!this.accessToken) {
      return {};
    }
    return { Authorization: `Bearer ${this.accessToken}` };
  }

  private async refreshAccessToken(): Promise<boolean> {
    if (!this.refreshToken) return false;

    try {
      const response = await fetch(`${getApiBaseUrl()}/api/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: this.refreshToken }),
        credentials: 'include',
      });

      if (!response.ok) {
        this.clearTokens();
        return false;
      }

      const data = await response.json();
      if (data?.accessToken && data?.refreshToken) {
        this.setTokens(data.accessToken, data.refreshToken);
        return true;
      }

      this.clearTokens();
      return false;
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
      (headers as Record<string, string>).Authorization = `Bearer ${this.accessToken}`;
    }

    // Use credentials: 'include' to send cookies automatically
    let response = await fetch(`${getApiBaseUrl()}/api${endpoint}`, {
      ...fetchOptions,
      headers,
      credentials: 'include',
    });

    if (response.status === 401 && requiresAuth && this.refreshToken) {
      const refreshed = await this.refreshAccessToken();
      if (refreshed) {
        (headers as Record<string, string>).Authorization = `Bearer ${this.accessToken}`;
        response = await fetch(`${getApiBaseUrl()}/api${endpoint}`, {
          ...fetchOptions,
          headers,
          credentials: 'include',
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
  // AUTH (These are used internally by NextAuth, not directly by components)
  // ============================================================

  async login(email: string, password: string): Promise<AuthResponse['user']> {
    const data = await this.fetch<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
      requiresAuth: false,
    });
    if (data.accessToken && data.refreshToken) {
      this.setTokens(data.accessToken, data.refreshToken);
    }
    return data.user;
  }

  async signup(
    name: string,
    email: string,
    password: string,
    timezone?: string
  ): Promise<AuthResponse['user']> {
    const data = await this.fetch<AuthResponse>('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ name, email, password, timezone }),
      requiresAuth: false,
    });
    if (data.accessToken && data.refreshToken) {
      this.setTokens(data.accessToken, data.refreshToken);
    }
    return data.user;
  }

  async logout() {
    try {
      await this.fetch('/auth/logout', {
        method: 'POST',
      });
    } catch {
      // Ignore logout errors
    } finally {
      this.clearTokens();
    }
  }

  async forgotPassword(email: string): Promise<{ message: string }> {
    return this.fetch<{ message: string }>('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
      requiresAuth: false,
    });
  }

  async resetPassword(token: string, password: string): Promise<{ message: string }> {
    return this.fetch<{ message: string }>('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, password }),
      requiresAuth: false,
    });
  }

  async requestMagicLink(email: string, name?: string): Promise<{ message: string }> {
    return this.fetch<{ message: string }>('/auth/magic-link/request', {
      method: 'POST',
      body: JSON.stringify({ email, name }),
      requiresAuth: false,
    });
  }

  async verifyMagicLink(
    token: string
  ): Promise<{ user: AuthResponse['user']; isNewUser: boolean }> {
    const data = await this.fetch<AuthResponse & { isNewUser: boolean }>(
      '/auth/magic-link/verify',
      {
        method: 'POST',
        body: JSON.stringify({ token }),
        requiresAuth: false,
      }
    );
    if (data.accessToken && data.refreshToken) {
      this.setTokens(data.accessToken, data.refreshToken);
    }
    return { user: data.user, isNewUser: data.isNewUser };
  }

  async verifyEmail(token: string): Promise<{ message: string }> {
    return this.fetch<{ message: string }>('/auth/verify-email', {
      method: 'POST',
      body: JSON.stringify({ token }),
      requiresAuth: false,
    });
  }

  async resendVerificationEmail(): Promise<{ message: string }> {
    return this.fetch<{ message: string }>('/auth/verify-email/resend', {
      method: 'POST',
    });
  }

  // ============================================================
  // USERS
  // ============================================================

  getCurrentUser(): Promise<User> {
    return this.fetch<User>('/users/me');
  }

  updateUserSettings(settings: Partial<UserSettings> & { timezone?: string }): Promise<User> {
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

  changeEmail(payload: {
    email: string;
    password: string;
  }): Promise<{ message: string; email: string }> {
    return this.fetch('/auth/change-email', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  changePassword(payload: {
    currentPassword: string;
    newPassword: string;
  }): Promise<{ message: string }> {
    return this.fetch('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  setPassword(password: string): Promise<{ message: string }> {
    return this.fetch('/auth/set-password', {
      method: 'POST',
      body: JSON.stringify({ password }),
    });
  }

  deleteAccount(password: string): Promise<{ message: string }> {
    return this.fetch('/auth/account', {
      method: 'DELETE',
      body: JSON.stringify({ password }),
    });
  }

  // ============================================================
  // SUBSCRIPTIONS
  // ============================================================

  getSubscriptionStatus(): Promise<{
    plan: 'FREE' | 'PRO' | 'FAMILY';
    status: string;
    trialEndsAt: string | null;
    currentPeriodEnd: string | null;
    cancelAtPeriodEnd: boolean;
  }> {
    return this.fetch('/subscriptions/status');
  }

  // ============================================================
  // STRIPE / BILLING
  // ============================================================

  createCheckoutSession(
    plan: 'PRO' | 'FAMILY',
    successUrl?: string,
    cancelUrl?: string
  ): Promise<{ sessionId: string; url: string }> {
    return this.fetch('/stripe/create-checkout-session', {
      method: 'POST',
      body: JSON.stringify({ plan, successUrl, cancelUrl }),
    });
  }

  createBillingPortalSession(): Promise<{ url: string }> {
    return this.fetch('/stripe/create-portal-session', {
      method: 'POST',
    });
  }

  // ============================================================
  // ADMIN
  // ============================================================

  getAdminOverview(params?: { limit?: number; offset?: number; includeEmail?: boolean }): Promise<{
    totals: {
      users: number;
      plans: Record<'FREE' | 'PRO' | 'FAMILY', number>;
      statuses: Record<string, number>;
    };
    users: Array<{
      id: string;
      name: string;
      email: string;
      role: string;
      createdAt: string;
      lastLoginAt: string | null;
      loginCount: number;
      plan: 'FREE' | 'PRO' | 'FAMILY';
      subscriptionStatus: string;
      trialEndsAt: string | null;
      currentPeriodEnd: string | null;
    }>;
  }> {
    const query = new URLSearchParams();
    if (params?.limit) query.set('limit', String(params.limit));
    if (params?.offset) query.set('offset', String(params.offset));
    if (params?.includeEmail) query.set('includeEmail', 'true');
    const qs = query.toString();
    return this.fetch(`/admin/overview${qs ? `?${qs}` : ''}`);
  }

  adminActivatePlan(plan: 'PRO' | 'FAMILY'): Promise<{ plan: string; status: string }> {
    return this.fetch('/admin/activate-plan', {
      method: 'POST',
      body: JSON.stringify({ plan }),
    });
  }

  updateUserRole(payload: { userId: string; role: 'USER' | 'ADMIN' }): Promise<{
    id: string;
    role: string;
  }> {
    return this.fetch('/admin/users/role', {
      method: 'PATCH',
      body: JSON.stringify(payload),
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

  updateWorkspace(workspaceId: string, data: { name?: string }): Promise<Workspace> {
    return this.fetch<Workspace>(`/workspaces/${workspaceId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  inviteToWorkspace(workspaceId: string, email: string) {
    return this.fetch<{ message: string; inviteId: string }>(`/workspaces/${workspaceId}/invite`, {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  getPendingInvites(workspaceId: string) {
    return this.fetch<WorkspaceInvite[]>(`/workspaces/${workspaceId}/invites`);
  }

  cancelInvite(inviteId: string) {
    return this.fetch<{ message: string }>(`/workspaces/invites/${inviteId}`, {
      method: 'DELETE',
    });
  }

  resendInvite(inviteId: string) {
    return this.fetch<{ message: string }>(`/workspaces/invites/${inviteId}/resend`, {
      method: 'POST',
    });
  }

  previewInvite(token: string) {
    return this.fetch<{ workspace: { name: string }; email: string; expiresAt: string }>(
      `/workspaces/invites/preview?token=${encodeURIComponent(token)}`,
      { requiresAuth: false }
    );
  }

  acceptInvite(token: string) {
    return this.fetch<{ workspaceId: string }>('/workspaces/invites/accept', {
      method: 'POST',
      body: JSON.stringify({ token }),
    });
  }

  getWorkspaceWithMembers(id: string) {
    return this.fetch<WorkspaceWithMembers>(`/workspaces/${id}`);
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

  getTasks(workspaceId?: string): Promise<import('@/types').TaskWithProject[]> {
    const params = new URLSearchParams();
    if (workspaceId) params.append('workspaceId', workspaceId);
    const query = params.toString();
    return this.fetch<import('@/types').TaskWithProject[]>(`/tasks${query ? `?${query}` : ''}`);
  }

  getTask(
    id: string
  ): Promise<Task & { project?: { id: string; name: string; workspaceId: string } }> {
    return this.fetch<Task & { project?: { id: string; name: string; workspaceId: string } }>(
      `/tasks/${id}`
    );
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

  async getTodayJournalEntry(): Promise<JournalEntry | null> {
    const response = await this.fetch<{
      entry: JournalEntry | null;
      prompt: string;
      currentStreak: number;
      longestStreak: number;
    }>('/journal/today');
    return response.entry;
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
      method: 'PUT',
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
    // Pass the client's local date to ensure completedToday matches user's timezone
    const now = new Date();
    const localDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    return this.fetch<HabitWithStats[]>(
      `/habits?includeArchived=${includeArchived}&date=${localDate}`
    );
  }

  getHabitsForDate(date: string, includeArchived = false): Promise<HabitWithStats[]> {
    return this.fetch<HabitWithStats[]>(`/habits?includeArchived=${includeArchived}&date=${date}`);
  }

  getHabit(id: string): Promise<HabitWithStats> {
    return this.fetch<HabitWithStats>(`/habits/${id}`);
  }

  async getTodayHabits(): Promise<HabitWithStats[]> {
    // Pass the client's local date to ensure completedToday matches user's timezone
    const now = new Date();
    const localDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

    const response = await this.fetch<{
      habits: HabitWithStats[];
      completedCount: number;
      totalCount: number;
    }>(`/habits/today?date=${localDate}`);
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
      method: 'PUT',
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
      method: 'PUT',
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

  // ============================================================
  // AI - CONVERSATIONS
  // ============================================================

  getAiConversations(
    workspaceId: string,
    limit?: number
  ): Promise<(AiConversation & { messages: AiMessage[] })[]> {
    const params = new URLSearchParams();
    params.append('workspaceId', workspaceId);
    if (limit) params.append('limit', limit.toString());
    return this.fetch<(AiConversation & { messages: AiMessage[] })[]>(
      `/ai/conversations?${params.toString()}`
    );
  }

  getAiConversation(id: string): Promise<AiConversation & { messages: AiMessage[] }> {
    return this.fetch<AiConversation & { messages: AiMessage[] }>(`/ai/conversations/${id}`);
  }

  createAiConversation(workspaceId: string, title?: string): Promise<AiConversation> {
    return this.fetch<AiConversation>('/ai/conversations', {
      method: 'POST',
      body: JSON.stringify({ workspaceId, title }),
    });
  }

  deleteAiConversation(id: string): Promise<void> {
    return this.fetch<void>(`/ai/conversations/${id}`, { method: 'DELETE' });
  }

  /**
   * Get the SSE endpoint URL for streaming chat messages.
   * Use with EventSource or a streaming fetch.
   */
  getAiChatStreamUrl(conversationId: string): string {
    return `${getApiBaseUrl()}/api/ai/conversations/${conversationId}/messages`;
  }

  // ============================================================
  // AI - SUMMARIES
  // ============================================================

  getAiSummaries(workspaceId: string, type?: SummaryType, limit?: number): Promise<AiSummary[]> {
    const params = new URLSearchParams();
    params.append('workspaceId', workspaceId);
    if (type) params.append('type', type);
    if (limit) params.append('limit', limit.toString());
    return this.fetch<AiSummary[]>(`/ai/summaries?${params.toString()}`);
  }

  getWeeklyAiSummary(
    workspaceId: string,
    weekStart: string,
    forceRegenerate = false
  ): Promise<AiSummaryResponse> {
    const params = new URLSearchParams();
    params.append('workspaceId', workspaceId);
    if (forceRegenerate) params.append('forceRegenerate', 'true');
    return this.fetch<AiSummaryResponse>(`/ai/summaries/weekly/${weekStart}?${params.toString()}`);
  }

  getMonthlyAiSummary(
    workspaceId: string,
    month: string,
    forceRegenerate = false
  ): Promise<AiSummaryResponse> {
    const params = new URLSearchParams();
    params.append('workspaceId', workspaceId);
    if (forceRegenerate) params.append('forceRegenerate', 'true');
    return this.fetch<AiSummaryResponse>(`/ai/summaries/monthly/${month}?${params.toString()}`);
  }

  getYearlyAiSummary(
    workspaceId: string,
    year: string,
    forceRegenerate = false
  ): Promise<AiSummaryResponse> {
    const params = new URLSearchParams();
    params.append('workspaceId', workspaceId);
    if (forceRegenerate) params.append('forceRegenerate', 'true');
    return this.fetch<AiSummaryResponse>(`/ai/summaries/yearly/${year}?${params.toString()}`);
  }

  generateAiSummary(
    workspaceId: string,
    type: SummaryType,
    periodStart: string,
    forceRegenerate = false
  ): Promise<AiSummaryResponse> {
    return this.fetch<AiSummaryResponse>('/ai/summaries/generate', {
      method: 'POST',
      body: JSON.stringify({ workspaceId, type, periodStart, forceRegenerate }),
    });
  }

  // ============================================================
  // AI - INSIGHTS
  // ============================================================

  getAiInsights(
    workspaceId: string,
    type?: string,
    includeDismissed = false
  ): Promise<AiInsight[]> {
    const params = new URLSearchParams();
    params.append('workspaceId', workspaceId);
    if (type) params.append('type', type);
    if (includeDismissed) params.append('includeDismissed', 'true');
    return this.fetch<AiInsight[]>(`/ai/insights?${params.toString()}`);
  }

  generateAiInsights(workspaceId: string, types?: string[]): Promise<AiInsight[]> {
    const params = new URLSearchParams();
    params.append('workspaceId', workspaceId);
    if (types) params.append('types', types.join(','));
    return this.fetch<AiInsight[]>(`/ai/insights/generate?${params.toString()}`, {
      method: 'POST',
    });
  }

  dismissAiInsight(id: string): Promise<AiInsight> {
    return this.fetch<AiInsight>(`/ai/insights/${id}/dismiss`, {
      method: 'PATCH',
    });
  }

  // ============================================================
  // AI - HABIT SUGGESTIONS
  // ============================================================

  generateHabitSuggestions(workspaceId: string, projectId: string): Promise<SuggestedHabit[]> {
    return this.fetch<SuggestedHabit[]>('/ai/habits/generate', {
      method: 'POST',
      body: JSON.stringify({ workspaceId, projectId }),
    });
  }

  // ============================================================
  // PROJECT HABIT PROGRESS
  // ============================================================

  getProjectHabitProgress(projectId: string): Promise<ProjectHabitProgress> {
    return this.fetch<ProjectHabitProgress>(`/projects/${projectId}/habit-progress`);
  }

  // ============================================================
  // AI - DAILY TEXT
  // ============================================================

  getDailyText(
    workspaceId: string
  ): Promise<{ text: string; generatedAt: string; cached: boolean }> {
    return this.fetch<{ text: string; generatedAt: string; cached: boolean }>(
      `/ai/daily-text?workspaceId=${workspaceId}`
    );
  }
}

export const apiClient = new ApiClient();
