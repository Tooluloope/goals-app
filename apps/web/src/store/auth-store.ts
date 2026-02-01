import { create } from 'zustand';
import { signOut } from 'next-auth/react';
import { User, UserSettings, Workspace } from '@/types';
import { apiClient } from '@/lib/api-client';

// Helper to transform API response to local types
const transformUser = (apiUser: any): User => ({
  id: apiUser.id,
  name: apiUser.name,
  email: apiUser.email,
  avatar: apiUser.avatar ?? undefined,
  defaultWorkspaceId: apiUser.defaultWorkspaceId,
  timezone: apiUser.timezone ?? 'UTC',
  hasSetPassword: apiUser.hasSetPassword ?? true,
  role: apiUser.role ?? 'USER',
  emailVerifiedAt: apiUser.emailVerifiedAt ? new Date(apiUser.emailVerifiedAt) : null,
  lastLoginAt: apiUser.lastLoginAt ? new Date(apiUser.lastLoginAt) : null,
  loginCount: typeof apiUser.loginCount === 'number' ? apiUser.loginCount : 0,
  settings: apiUser.settings,
  createdAt: apiUser.createdAt ? new Date(apiUser.createdAt) : new Date(),
  updatedAt: apiUser.updatedAt ? new Date(apiUser.updatedAt) : new Date(),
});

const transformWorkspace = (apiWorkspace: any): Workspace => ({
  id: apiWorkspace.id,
  name: apiWorkspace.name,
  type: apiWorkspace.type,
  ownerId: apiWorkspace.ownerId ?? apiWorkspace.id,
  createdAt: apiWorkspace.createdAt ? new Date(apiWorkspace.createdAt) : new Date(),
  updatedAt: apiWorkspace.updatedAt ? new Date(apiWorkspace.updatedAt) : new Date(),
});

interface AuthState {
  user: User | null;
  currentWorkspace: Workspace | null;
  workspaces: Workspace[];
  isAuthenticated: boolean;
  isLoading: boolean;

  login: (email: string, password: string) => Promise<boolean>;
  signup: (name: string, email: string, password: string, timezone?: string) => Promise<boolean>;
  setUser: (apiUser: any) => Promise<void>;
  fetchUser: () => Promise<User | null>;
  loadWorkspaces: () => Promise<void>;
  setCurrentWorkspace: (workspace: Workspace) => void;
  updateSettings: (settings: Partial<UserSettings> & { timezone?: string }) => Promise<void>;
  updateProfile: (data: { name?: string; avatar?: string }) => Promise<void>;
  changeEmail: (email: string, password: string) => Promise<boolean>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<boolean>;
  setPassword: (newPassword: string) => Promise<boolean>;
  deleteAccount: (password: string) => Promise<boolean>;
  refreshUser: () => Promise<void>;
  initializeAuth: () => Promise<void>;
  logout: () => Promise<void>;
  clearUser: () => void;
}

export const useAuthStore = create<AuthState>()((set, get) => ({
  user: null,
  currentWorkspace: null,
  workspaces: [],
  isAuthenticated: false,
  isLoading: false,

  login: async (email: string, password: string) => {
    set({ isLoading: true });
    try {
      const apiUser = await apiClient.login(email, password);
      if (!apiUser) {
        set({ isLoading: false, isAuthenticated: false });
        return false;
      }
      await get().setUser(apiUser);
      set({ isLoading: false });
      return true;
    } catch {
      set({ isLoading: false, isAuthenticated: false });
      return false;
    }
  },

  signup: async (name: string, email: string, password: string, timezone?: string) => {
    set({ isLoading: true });
    try {
      const apiUser = await apiClient.signup(name, email, password, timezone);
      if (!apiUser) {
        set({ isLoading: false, isAuthenticated: false });
        return false;
      }
      await get().setUser(apiUser);
      set({ isLoading: false });
      return true;
    } catch {
      set({ isLoading: false, isAuthenticated: false });
      return false;
    }
  },

  setUser: async (apiUser: any) => {
    const user = transformUser(apiUser);
    const apiWorkspaces = await apiClient.getWorkspaces();
    const workspaces = apiWorkspaces.map(transformWorkspace);
    const persistedCurrent = get().currentWorkspace;
    const defaultWorkspace =
      workspaces.find((ws) => ws.id === persistedCurrent?.id) ||
      workspaces.find((ws) => ws.id === user.defaultWorkspaceId) ||
      workspaces[0] ||
      null;

    set({
      user,
      workspaces,
      currentWorkspace: defaultWorkspace,
      isAuthenticated: true,
    });
  },

  fetchUser: async () => {
    set({ isLoading: true });
    try {
      const apiUser = await apiClient.getCurrentUser();
      await get().setUser(apiUser);
      set({ isLoading: false });
      return transformUser(apiUser);
    } catch {
      set({
        user: null,
        currentWorkspace: null,
        workspaces: [],
        isAuthenticated: false,
        isLoading: false,
      });
      return null;
    }
  },

  loadWorkspaces: async () => {
    const { user } = get();
    if (!user) return;
    try {
      const apiWorkspaces = await apiClient.getWorkspaces();
      const workspaces = apiWorkspaces.map(transformWorkspace);
      const { currentWorkspace } = get();

      const preferred =
        workspaces.find((ws) => ws.id === currentWorkspace?.id) || workspaces[0] || null;

      set({ workspaces, currentWorkspace: preferred });
    } catch (error) {
      console.error('Failed to load workspaces:', error);
    }
  },

  setCurrentWorkspace: (workspace: Workspace) => {
    set({ currentWorkspace: workspace });
  },

  updateSettings: async (settings: Partial<UserSettings> & { timezone?: string }) => {
    const { user } = get();
    if (!user) return;

    const apiUser = await apiClient.updateUserSettings(settings);
    set({ user: transformUser(apiUser) });
  },

  updateProfile: async (data: { name?: string; avatar?: string }) => {
    const { user } = get();
    if (!user) return;

    const apiUser = await apiClient.updateProfile(data);
    set({ user: transformUser(apiUser) });
  },

  changeEmail: async (email: string, password: string) => {
    const { user } = get();
    if (!user) return false;

    await apiClient.changeEmail({ email, password });
    apiClient.clearTokens();
    set({
      user: { ...user, email },
      currentWorkspace: null,
      workspaces: [],
      isAuthenticated: false,
    });
    return true;
  },

  changePassword: async (currentPassword: string, newPassword: string) => {
    const { user } = get();
    if (!user) return false;

    await apiClient.changePassword({ currentPassword, newPassword });
    apiClient.clearTokens();
    set({ user: null, currentWorkspace: null, workspaces: [], isAuthenticated: false });
    return true;
  },

  setPassword: async (newPassword: string) => {
    const { user } = get();
    if (!user) return false;

    await apiClient.setPassword(newPassword);
    apiClient.clearTokens();
    set({ user: null, currentWorkspace: null, workspaces: [], isAuthenticated: false });
    return true;
  },

  deleteAccount: async (password: string) => {
    const { user } = get();
    if (!user) return false;

    await apiClient.deleteAccount(password);
    apiClient.clearTokens();
    set({ user: null, currentWorkspace: null, workspaces: [], isAuthenticated: false });
    return true;
  },

  refreshUser: async () => {
    const { user } = get();
    if (!user) return;

    const apiUser = await apiClient.getCurrentUser();
    if (apiUser) {
      set({ user: transformUser(apiUser) });
    }
  },

  initializeAuth: async () => {
    if (apiClient.hasTokens()) {
      try {
        const apiUser = await apiClient.getCurrentUser();
        if (apiUser) {
          await get().setUser(apiUser);
        } else {
          apiClient.clearTokens();
          set({ user: null, currentWorkspace: null, workspaces: [], isAuthenticated: false });
        }
      } catch {
        apiClient.clearTokens();
        set({ user: null, currentWorkspace: null, workspaces: [], isAuthenticated: false });
      }
    } else {
      set({ user: null, currentWorkspace: null, workspaces: [], isAuthenticated: false });
    }
  },

  logout: async () => {
    try {
      await apiClient.logout();
      if (process.env.NODE_ENV !== 'test') {
        await signOut({ redirect: false });
      }
    } catch {
      // Ignore logout errors
    }
    set({ user: null, currentWorkspace: null, workspaces: [], isAuthenticated: false });
  },

  clearUser: () => {
    set({ user: null, currentWorkspace: null, workspaces: [], isAuthenticated: false });
  },
}));

// Helper hooks for view mode
export const useViewMode = () => {
  const user = useAuthStore((state) => state.user);
  return user?.settings?.viewMode || 'focus'; // Default to focus mode
};

export const isPowerMode = () => {
  const user = useAuthStore.getState().user;
  return user?.settings?.viewMode === 'power';
};
