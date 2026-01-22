import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, Workspace } from '@/types';
import { apiClient } from '@/lib/api-client';

// Helper to transform API response to local types
const transformUser = (apiUser: any): User => ({
  id: apiUser.id,
  name: apiUser.name,
  email: apiUser.email,
  avatar: apiUser.avatar ?? undefined,
  defaultWorkspaceId: apiUser.defaultWorkspaceId,
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
  isLoading: boolean;
  isAuthenticated: boolean;

  // Actions
  login: (email: string, password: string) => Promise<boolean>;
  signup: (name: string, email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  setCurrentWorkspace: (workspace: Workspace) => void;
  loadWorkspaces: () => Promise<void>;
  updateSettings: (settings: Partial<User['settings']>) => Promise<void>;
  refreshUser: () => Promise<void>;
  initializeAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      currentWorkspace: null,
      workspaces: [],
      isLoading: false,
      isAuthenticated: false,

      login: async (email: string, password: string) => {
        set({ isLoading: true });
        try {
          const apiUser = await apiClient.login(email, password);
          if (apiUser) {
            const user = transformUser(apiUser);
            const apiWorkspaces = await apiClient.getWorkspaces();
            const workspaces = apiWorkspaces.map(transformWorkspace);
            const defaultWorkspace =
              workspaces.find((ws) => ws.id === user.defaultWorkspaceId) || workspaces[0];

            set({
              user,
              workspaces,
              currentWorkspace: defaultWorkspace,
              isAuthenticated: true,
              isLoading: false,
            });
            return true;
          }
          set({ isLoading: false });
          return false;
        } catch (error) {
          set({ isLoading: false });
          return false;
        }
      },

      signup: async (name: string, email: string, password: string) => {
        set({ isLoading: true });
        console.log('Signing up user:', { name, email });
        try {
          const apiUser = await apiClient.signup(name, email, password);
          const user = transformUser(apiUser);
          const apiWorkspaces = await apiClient.getWorkspaces();
          const workspaces = apiWorkspaces.map(transformWorkspace);
          const defaultWorkspace =
            workspaces.find((ws) => ws.id === user.defaultWorkspaceId) || workspaces[0];

          set({
            user,
            workspaces,
            currentWorkspace: defaultWorkspace,
            isAuthenticated: true,
            isLoading: false,
          });
          return true;
        } catch (error) {
          console.error('Signup error:', error);
          set({ isLoading: false });
          return false;
        }
      },

      logout: async () => {
        try {
          await apiClient.logout();
        } catch {
          // Ignore logout errors
        }
        set({
          user: null,
          currentWorkspace: null,
          workspaces: [],
          isAuthenticated: false,
        });
      },

      setCurrentWorkspace: (workspace: Workspace) => {
        set({ currentWorkspace: workspace });
      },

      loadWorkspaces: async () => {
        const { user } = get();
        if (!user) return;

        const apiWorkspaces = await apiClient.getWorkspaces();
        const workspaces = apiWorkspaces.map(transformWorkspace);
        set({ workspaces });
      },

      updateSettings: async (settings: Partial<User['settings']>) => {
        const { user } = get();
        if (!user) return;

        const apiUser = await apiClient.updateUserSettings(settings);
        set({ user: transformUser(apiUser) });
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
        // Load tokens from localStorage and validate session
        if (apiClient.hasTokens()) {
          try {
            const apiUser = await apiClient.getCurrentUser();
            if (apiUser) {
              const user = transformUser(apiUser);
              const apiWorkspaces = await apiClient.getWorkspaces();
              const workspaces = apiWorkspaces.map(transformWorkspace);
              const defaultWorkspace =
                workspaces.find((ws) => ws.id === user.defaultWorkspaceId) || workspaces[0];

              set({
                user,
                workspaces,
                currentWorkspace: defaultWorkspace,
                isAuthenticated: true,
              });
            } else {
              // No user returned, clear state
              apiClient.clearTokens();
              set({
                user: null,
                currentWorkspace: null,
                workspaces: [],
                isAuthenticated: false,
              });
            }
          } catch {
            // Token invalid, clear state
            apiClient.clearTokens();
            set({
              user: null,
              currentWorkspace: null,
              workspaces: [],
              isAuthenticated: false,
            });
          }
        } else {
          // No tokens exist, clear any persisted auth state
          set({
            user: null,
            currentWorkspace: null,
            workspaces: [],
            isAuthenticated: false,
          });
        }
      },
    }),
    {
      name: 'goals-auth-storage',
      partialize: (state) => ({
        user: state.user,
        currentWorkspace: state.currentWorkspace,
        workspaces: state.workspaces,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
