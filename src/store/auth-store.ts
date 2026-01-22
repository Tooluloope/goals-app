import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, Workspace } from '@/types';
import * as dataService from '@/services/data-service';

interface AuthState {
  user: User | null;
  currentWorkspace: Workspace | null;
  workspaces: Workspace[];
  isLoading: boolean;
  isAuthenticated: boolean;

  // Actions
  login: (email: string, password: string) => Promise<boolean>;
  signup: (name: string, email: string, password: string) => Promise<boolean>;
  logout: () => void;
  setCurrentWorkspace: (workspace: Workspace) => void;
  loadWorkspaces: () => Promise<void>;
  updateSettings: (settings: Partial<User['settings']>) => Promise<void>;
  refreshUser: () => Promise<void>;
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
          const user = await dataService.login(email, password);
          if (user) {
            const workspaces = await dataService.getWorkspacesForUser(user.id);
            const defaultWorkspace = workspaces.find(ws => ws.id === user.defaultWorkspaceId) || workspaces[0];

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
        try {
          const user = await dataService.signup(name, email, password);
          const workspaces = await dataService.getWorkspacesForUser(user.id);
          const defaultWorkspace = workspaces.find(ws => ws.id === user.defaultWorkspaceId) || workspaces[0];

          set({
            user,
            workspaces,
            currentWorkspace: defaultWorkspace,
            isAuthenticated: true,
            isLoading: false,
          });
          return true;
        } catch (error) {
          set({ isLoading: false });
          return false;
        }
      },

      logout: () => {
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

        const workspaces = await dataService.getWorkspacesForUser(user.id);
        set({ workspaces });
      },

      updateSettings: async (settings: Partial<User['settings']>) => {
        const { user } = get();
        if (!user) return;

        const updatedUser = await dataService.updateUserSettings(user.id, settings);
        set({ user: updatedUser });
      },

      refreshUser: async () => {
        const { user } = get();
        if (!user) return;

        const refreshedUser = await dataService.getCurrentUser(user.id);
        if (refreshedUser) {
          set({ user: refreshedUser });
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
