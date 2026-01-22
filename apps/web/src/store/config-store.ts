import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  WorkspaceConfig,
  StatusConfig,
  AreaConfig,
  PriorityConfig,
  CadenceConfig,
  ConfidenceConfig,
  TaskStatusConfig,
  DEFAULT_WORKSPACE_CONFIG,
  DEFAULT_STATUSES,
  DEFAULT_AREAS,
  DEFAULT_PRIORITIES,
  DEFAULT_CADENCES,
  DEFAULT_CONFIDENCES,
  DEFAULT_TASK_STATUSES,
} from '@/types/config';
import { generateId } from '@/lib/utils';

interface ConfigState {
  // Workspace configs (keyed by workspace ID)
  configs: Record<string, WorkspaceConfig>;

  // Current workspace config (for convenience)
  currentConfig: WorkspaceConfig | null;

  // Actions
  initializeConfig: (workspaceId: string) => WorkspaceConfig;
  setCurrentConfig: (workspaceId: string) => void;
  getConfig: (workspaceId: string) => WorkspaceConfig;

  // Status CRUD
  addStatus: (workspaceId: string, status: Omit<StatusConfig, 'id' | 'order'>) => void;
  updateStatus: (workspaceId: string, statusId: string, updates: Partial<StatusConfig>) => void;
  deleteStatus: (workspaceId: string, statusId: string) => void;
  reorderStatuses: (workspaceId: string, statusIds: string[]) => void;

  // Area CRUD
  addArea: (workspaceId: string, area: Omit<AreaConfig, 'id' | 'order'>) => void;
  updateArea: (workspaceId: string, areaId: string, updates: Partial<AreaConfig>) => void;
  deleteArea: (workspaceId: string, areaId: string) => void;
  reorderAreas: (workspaceId: string, areaIds: string[]) => void;

  // Priority CRUD
  addPriority: (workspaceId: string, priority: Omit<PriorityConfig, 'id' | 'order'>) => void;
  updatePriority: (
    workspaceId: string,
    priorityId: string,
    updates: Partial<PriorityConfig>
  ) => void;
  deletePriority: (workspaceId: string, priorityId: string) => void;

  // Cadence CRUD
  addCadence: (workspaceId: string, cadence: Omit<CadenceConfig, 'id' | 'order'>) => void;
  updateCadence: (workspaceId: string, cadenceId: string, updates: Partial<CadenceConfig>) => void;
  deleteCadence: (workspaceId: string, cadenceId: string) => void;

  // Task Status CRUD
  addTaskStatus: (workspaceId: string, status: Omit<TaskStatusConfig, 'id' | 'order'>) => void;
  updateTaskStatus: (
    workspaceId: string,
    statusId: string,
    updates: Partial<TaskStatusConfig>
  ) => void;
  deleteTaskStatus: (workspaceId: string, statusId: string) => void;

  // Settings updates
  updateDefaults: (workspaceId: string, defaults: Partial<WorkspaceConfig['defaults']>) => void;
  updateBoardSettings: (workspaceId: string, board: Partial<WorkspaceConfig['board']>) => void;
  updateDashboardSettings: (
    workspaceId: string,
    dashboard: Partial<WorkspaceConfig['dashboard']>
  ) => void;
  updateNotificationSettings: (
    workspaceId: string,
    notifications: Partial<WorkspaceConfig['notifications']>
  ) => void;

  // Helpers
  getStatusById: (workspaceId: string, statusId: string) => StatusConfig | undefined;
  getAreaById: (workspaceId: string, areaId: string) => AreaConfig | undefined;
  getPriorityById: (workspaceId: string, priorityId: string) => PriorityConfig | undefined;
  getCadenceById: (workspaceId: string, cadenceId: string) => CadenceConfig | undefined;
  getConfidenceById: (workspaceId: string, confidenceId: string) => ConfidenceConfig | undefined;
  getTaskStatusById: (workspaceId: string, statusId: string) => TaskStatusConfig | undefined;

  // Get all items for workspace
  getStatusesForWorkspace: (workspaceId: string) => StatusConfig[];
  getAreasForWorkspace: (workspaceId: string) => AreaConfig[];
  getPrioritiesForWorkspace: (workspaceId: string) => PriorityConfig[];
  getCadencesForWorkspace: (workspaceId: string) => CadenceConfig[];
  getConfidencesForWorkspace: (workspaceId: string) => ConfidenceConfig[];
  getTaskStatusesForWorkspace: (workspaceId: string) => TaskStatusConfig[];

  // Get active (non-archived) items
  getActiveStatuses: (workspaceId: string) => StatusConfig[];
  getActiveAreas: (workspaceId: string) => AreaConfig[];
  getBoardStatuses: (workspaceId: string) => StatusConfig[];
}

export const useConfigStore = create<ConfigState>()(
  persist(
    (set, get) => ({
      configs: {},
      currentConfig: null,

      initializeConfig: (workspaceId: string) => {
        const existing = get().configs[workspaceId];
        if (existing) return existing;

        const now = new Date().toISOString();
        const newConfig: WorkspaceConfig = {
          id: generateId(),
          workspaceId,
          ...DEFAULT_WORKSPACE_CONFIG,
          createdAt: now,
          updatedAt: now,
        };

        set((state) => ({
          configs: { ...state.configs, [workspaceId]: newConfig },
        }));

        return newConfig;
      },

      setCurrentConfig: (workspaceId: string) => {
        const config = get().getConfig(workspaceId);
        set({ currentConfig: config });
      },

      getConfig: (workspaceId: string) => {
        const existing = get().configs[workspaceId];
        if (existing) return existing;
        return get().initializeConfig(workspaceId);
      },

      // Status CRUD
      addStatus: (workspaceId, status) => {
        const config = get().getConfig(workspaceId);
        const newStatus: StatusConfig = {
          ...status,
          id: generateId(),
          order: config.statuses.length + 1,
        };
        set((state) => ({
          configs: {
            ...state.configs,
            [workspaceId]: {
              ...config,
              statuses: [...config.statuses, newStatus],
              updatedAt: new Date().toISOString(),
            },
          },
        }));
      },

      updateStatus: (workspaceId, statusId, updates) => {
        const config = get().getConfig(workspaceId);
        set((state) => ({
          configs: {
            ...state.configs,
            [workspaceId]: {
              ...config,
              statuses: config.statuses.map((s) => (s.id === statusId ? { ...s, ...updates } : s)),
              updatedAt: new Date().toISOString(),
            },
          },
        }));
      },

      deleteStatus: (workspaceId, statusId) => {
        const config = get().getConfig(workspaceId);
        const status = config.statuses.find((s) => s.id === statusId);
        if (status?.isDefault) return; // Can't delete default statuses

        set((state) => ({
          configs: {
            ...state.configs,
            [workspaceId]: {
              ...config,
              statuses: config.statuses.filter((s) => s.id !== statusId),
              updatedAt: new Date().toISOString(),
            },
          },
        }));
      },

      reorderStatuses: (workspaceId, statusIds) => {
        const config = get().getConfig(workspaceId);
        const reordered = statusIds
          .map((id, index) => {
            const status = config.statuses.find((s) => s.id === id);
            return status ? { ...status, order: index + 1 } : null;
          })
          .filter(Boolean) as StatusConfig[];

        set((state) => ({
          configs: {
            ...state.configs,
            [workspaceId]: {
              ...config,
              statuses: reordered,
              updatedAt: new Date().toISOString(),
            },
          },
        }));
      },

      // Area CRUD
      addArea: (workspaceId, area) => {
        const config = get().getConfig(workspaceId);
        const newArea: AreaConfig = {
          ...area,
          id: generateId(),
          order: config.areas.length + 1,
        };
        set((state) => ({
          configs: {
            ...state.configs,
            [workspaceId]: {
              ...config,
              areas: [...config.areas, newArea],
              updatedAt: new Date().toISOString(),
            },
          },
        }));
      },

      updateArea: (workspaceId, areaId, updates) => {
        const config = get().getConfig(workspaceId);
        set((state) => ({
          configs: {
            ...state.configs,
            [workspaceId]: {
              ...config,
              areas: config.areas.map((a) => (a.id === areaId ? { ...a, ...updates } : a)),
              updatedAt: new Date().toISOString(),
            },
          },
        }));
      },

      deleteArea: (workspaceId, areaId) => {
        const config = get().getConfig(workspaceId);
        set((state) => ({
          configs: {
            ...state.configs,
            [workspaceId]: {
              ...config,
              areas: config.areas.filter((a) => a.id !== areaId),
              updatedAt: new Date().toISOString(),
            },
          },
        }));
      },

      reorderAreas: (workspaceId, areaIds) => {
        const config = get().getConfig(workspaceId);
        const reordered = areaIds
          .map((id, index) => {
            const area = config.areas.find((a) => a.id === id);
            return area ? { ...area, order: index + 1 } : null;
          })
          .filter(Boolean) as AreaConfig[];

        set((state) => ({
          configs: {
            ...state.configs,
            [workspaceId]: {
              ...config,
              areas: reordered,
              updatedAt: new Date().toISOString(),
            },
          },
        }));
      },

      // Priority CRUD
      addPriority: (workspaceId, priority) => {
        const config = get().getConfig(workspaceId);
        const newPriority: PriorityConfig = {
          ...priority,
          id: generateId(),
          order: config.priorities.length + 1,
        };
        set((state) => ({
          configs: {
            ...state.configs,
            [workspaceId]: {
              ...config,
              priorities: [...config.priorities, newPriority],
              updatedAt: new Date().toISOString(),
            },
          },
        }));
      },

      updatePriority: (workspaceId, priorityId, updates) => {
        const config = get().getConfig(workspaceId);
        set((state) => ({
          configs: {
            ...state.configs,
            [workspaceId]: {
              ...config,
              priorities: config.priorities.map((p) =>
                p.id === priorityId ? { ...p, ...updates } : p
              ),
              updatedAt: new Date().toISOString(),
            },
          },
        }));
      },

      deletePriority: (workspaceId, priorityId) => {
        const config = get().getConfig(workspaceId);
        set((state) => ({
          configs: {
            ...state.configs,
            [workspaceId]: {
              ...config,
              priorities: config.priorities.filter((p) => p.id !== priorityId),
              updatedAt: new Date().toISOString(),
            },
          },
        }));
      },

      // Cadence CRUD
      addCadence: (workspaceId, cadence) => {
        const config = get().getConfig(workspaceId);
        const newCadence: CadenceConfig = {
          ...cadence,
          id: generateId(),
          order: config.cadences.length + 1,
        };
        set((state) => ({
          configs: {
            ...state.configs,
            [workspaceId]: {
              ...config,
              cadences: [...config.cadences, newCadence],
              updatedAt: new Date().toISOString(),
            },
          },
        }));
      },

      updateCadence: (workspaceId, cadenceId, updates) => {
        const config = get().getConfig(workspaceId);
        set((state) => ({
          configs: {
            ...state.configs,
            [workspaceId]: {
              ...config,
              cadences: config.cadences.map((c) => (c.id === cadenceId ? { ...c, ...updates } : c)),
              updatedAt: new Date().toISOString(),
            },
          },
        }));
      },

      deleteCadence: (workspaceId, cadenceId) => {
        const config = get().getConfig(workspaceId);
        set((state) => ({
          configs: {
            ...state.configs,
            [workspaceId]: {
              ...config,
              cadences: config.cadences.filter((c) => c.id !== cadenceId),
              updatedAt: new Date().toISOString(),
            },
          },
        }));
      },

      // Task Status CRUD
      addTaskStatus: (workspaceId, status) => {
        const config = get().getConfig(workspaceId);
        const newStatus: TaskStatusConfig = {
          ...status,
          id: generateId(),
          order: config.taskStatuses.length + 1,
        };
        set((state) => ({
          configs: {
            ...state.configs,
            [workspaceId]: {
              ...config,
              taskStatuses: [...config.taskStatuses, newStatus],
              updatedAt: new Date().toISOString(),
            },
          },
        }));
      },

      updateTaskStatus: (workspaceId, statusId, updates) => {
        const config = get().getConfig(workspaceId);
        set((state) => ({
          configs: {
            ...state.configs,
            [workspaceId]: {
              ...config,
              taskStatuses: config.taskStatuses.map((s) =>
                s.id === statusId ? { ...s, ...updates } : s
              ),
              updatedAt: new Date().toISOString(),
            },
          },
        }));
      },

      deleteTaskStatus: (workspaceId, statusId) => {
        const config = get().getConfig(workspaceId);
        set((state) => ({
          configs: {
            ...state.configs,
            [workspaceId]: {
              ...config,
              taskStatuses: config.taskStatuses.filter((s) => s.id !== statusId),
              updatedAt: new Date().toISOString(),
            },
          },
        }));
      },

      // Settings updates
      updateDefaults: (workspaceId, defaults) => {
        const config = get().getConfig(workspaceId);
        set((state) => ({
          configs: {
            ...state.configs,
            [workspaceId]: {
              ...config,
              defaults: { ...config.defaults, ...defaults },
              updatedAt: new Date().toISOString(),
            },
          },
        }));
      },

      updateBoardSettings: (workspaceId, board) => {
        const config = get().getConfig(workspaceId);
        set((state) => ({
          configs: {
            ...state.configs,
            [workspaceId]: {
              ...config,
              board: { ...config.board, ...board },
              updatedAt: new Date().toISOString(),
            },
          },
        }));
      },

      updateDashboardSettings: (workspaceId, dashboard) => {
        const config = get().getConfig(workspaceId);
        set((state) => ({
          configs: {
            ...state.configs,
            [workspaceId]: {
              ...config,
              dashboard: { ...config.dashboard, ...dashboard },
              updatedAt: new Date().toISOString(),
            },
          },
        }));
      },

      updateNotificationSettings: (workspaceId, notifications) => {
        const config = get().getConfig(workspaceId);
        set((state) => ({
          configs: {
            ...state.configs,
            [workspaceId]: {
              ...config,
              notifications: { ...config.notifications, ...notifications },
              updatedAt: new Date().toISOString(),
            },
          },
        }));
      },

      // Helpers
      getStatusById: (workspaceId, statusId) => {
        const config = get().getConfig(workspaceId);
        return config.statuses.find((s) => s.id === statusId);
      },

      getAreaById: (workspaceId, areaId) => {
        const config = get().getConfig(workspaceId);
        return config.areas.find((a) => a.id === areaId);
      },

      getPriorityById: (workspaceId, priorityId) => {
        const config = get().getConfig(workspaceId);
        return config.priorities.find((p) => p.id === priorityId);
      },

      getCadenceById: (workspaceId, cadenceId) => {
        const config = get().getConfig(workspaceId);
        return config.cadences.find((c) => c.id === cadenceId);
      },

      getConfidenceById: (workspaceId, confidenceId) => {
        const config = get().getConfig(workspaceId);
        return config.confidences.find((c) => c.id === confidenceId);
      },

      getTaskStatusById: (workspaceId, statusId) => {
        const config = get().getConfig(workspaceId);
        return config.taskStatuses.find((s) => s.id === statusId);
      },

      // Get all items for workspace
      getStatusesForWorkspace: (workspaceId) => {
        const config = get().getConfig(workspaceId);
        return config.statuses.sort((a, b) => a.order - b.order);
      },

      getAreasForWorkspace: (workspaceId) => {
        const config = get().getConfig(workspaceId);
        return config.areas.sort((a, b) => a.order - b.order);
      },

      getPrioritiesForWorkspace: (workspaceId) => {
        const config = get().getConfig(workspaceId);
        return config.priorities.sort((a, b) => a.order - b.order);
      },

      getCadencesForWorkspace: (workspaceId) => {
        const config = get().getConfig(workspaceId);
        return config.cadences.sort((a, b) => a.order - b.order);
      },

      getConfidencesForWorkspace: (workspaceId) => {
        const config = get().getConfig(workspaceId);
        return config.confidences.sort((a, b) => a.order - b.order);
      },

      getTaskStatusesForWorkspace: (workspaceId) => {
        const config = get().getConfig(workspaceId);
        return config.taskStatuses.sort((a, b) => a.order - b.order);
      },

      getActiveStatuses: (workspaceId) => {
        const config = get().getConfig(workspaceId);
        return config.statuses.filter((s) => !s.isArchived).sort((a, b) => a.order - b.order);
      },

      getActiveAreas: (workspaceId) => {
        const config = get().getConfig(workspaceId);
        return config.areas.filter((a) => !a.isArchived).sort((a, b) => a.order - b.order);
      },

      getBoardStatuses: (workspaceId) => {
        const config = get().getConfig(workspaceId);
        return config.statuses
          .filter((s) => s.showInBoard && !s.isArchived)
          .sort((a, b) => a.order - b.order);
      },
    }),
    {
      name: 'goals-config-storage',
    }
  )
);

// Hook for easy access to current workspace config
export function useCurrentConfig() {
  const { currentConfig, getConfig, setCurrentConfig } = useConfigStore();
  return { currentConfig, getConfig, setCurrentConfig };
}
