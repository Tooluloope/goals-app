import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Workspace } from '@/types';
import { apiClient } from '@/lib/api-client';

// Helper to transform API response to local types
const transformWorkspace = (apiWorkspace: any): Workspace => ({
  id: apiWorkspace.id,
  name: apiWorkspace.name,
  type: apiWorkspace.type,
  ownerId: apiWorkspace.ownerId ?? apiWorkspace.id,
  createdAt: apiWorkspace.createdAt ? new Date(apiWorkspace.createdAt) : new Date(),
  updatedAt: apiWorkspace.updatedAt ? new Date(apiWorkspace.updatedAt) : new Date(),
});

interface WorkspaceState {
  currentWorkspace: Workspace | null;
  workspaces: Workspace[];
  isInitialized: boolean;

  // Actions
  setCurrentWorkspace: (workspace: Workspace) => void;
  loadWorkspaces: () => Promise<void>;
  initializeWorkspaces: (defaultWorkspaceId?: string) => Promise<void>;
  reset: () => void;
}

export const useWorkspaceStore = create<WorkspaceState>()(
  persist(
    (set, get) => ({
      currentWorkspace: null,
      workspaces: [],
      isInitialized: false,

      setCurrentWorkspace: (workspace: Workspace) => {
        set({ currentWorkspace: workspace });
      },

      loadWorkspaces: async () => {
        try {
          const apiWorkspaces = await apiClient.getWorkspaces();
          const workspaces = apiWorkspaces.map(transformWorkspace);
          const { currentWorkspace } = get();

          // Keep current workspace if it still exists, otherwise pick a default
          const preferred =
            workspaces.find((ws) => ws.id === currentWorkspace?.id) || workspaces[0] || null;

          set({ workspaces, currentWorkspace: preferred });
        } catch (error) {
          console.error('Failed to load workspaces:', error);
        }
      },

      initializeWorkspaces: async (defaultWorkspaceId?: string) => {
        const { isInitialized, currentWorkspace } = get();

        // Don't re-initialize if already done
        if (isInitialized) return;

        try {
          const apiWorkspaces = await apiClient.getWorkspaces();
          const workspaces = apiWorkspaces.map(transformWorkspace);

          // Select workspace: persisted > default > first
          const preferred =
            workspaces.find((ws) => ws.id === currentWorkspace?.id) ||
            workspaces.find((ws) => ws.id === defaultWorkspaceId) ||
            workspaces[0] ||
            null;

          set({
            workspaces,
            currentWorkspace: preferred,
            isInitialized: true,
          });
        } catch (error) {
          console.error('Failed to initialize workspaces:', error);
          set({ isInitialized: true }); // Mark as initialized even on error
        }
      },

      reset: () => {
        set({
          currentWorkspace: null,
          workspaces: [],
          isInitialized: false,
        });
      },
    }),
    {
      name: 'goals-workspace-storage',
      partialize: (state) => ({
        currentWorkspace: state.currentWorkspace,
        workspaces: state.workspaces,
      }),
    }
  )
);
