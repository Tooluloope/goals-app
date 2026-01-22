import { create } from 'zustand';
import { FilterState } from '@/types';

interface UIState {
  // Sidebar state
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;

  // Command palette
  commandPaletteOpen: boolean;
  setCommandPaletteOpen: (open: boolean) => void;

  // Shortcuts help
  shortcutsHelpOpen: boolean;
  setShortcutsHelpOpen: (open: boolean) => void;

  // Board filters
  boardFilters: FilterState;
  setBoardFilters: (filters: Partial<FilterState>) => void;
  resetBoardFilters: () => void;

  // Modals
  addProjectModalOpen: boolean;
  setAddProjectModalOpen: (open: boolean) => void;

  addTaskModalOpen: boolean;
  addTaskProjectId: string | null;
  openAddTaskModal: (projectId: string) => void;
  closeAddTaskModal: () => void;

  addReviewModalOpen: boolean;
  addReviewProjectId: string | null;
  openAddReviewModal: (projectId: string) => void;
  closeAddReviewModal: () => void;

  // Quick actions
  quickMoveProjectId: string | null;
  setQuickMoveProjectId: (projectId: string | null) => void;

  // Notification summary modal (shown on login)
  showNotificationSummary: boolean;
  setShowNotificationSummary: (show: boolean) => void;

  // Calendar date
  selectedCalendarDate: Date;
  setSelectedCalendarDate: (date: Date) => void;
}

const defaultFilters: FilterState = {
  areaIds: [],
  priorityIds: [],
  tagIds: [],
  assignedTo: [],
  dueSoon: false,
  reviewDue: false,
};

export const useUIStore = create<UIState>((set) => ({
  // Sidebar
  sidebarOpen: false,
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),

  // Command palette
  commandPaletteOpen: false,
  setCommandPaletteOpen: (open) => set({ commandPaletteOpen: open }),

  // Shortcuts help
  shortcutsHelpOpen: false,
  setShortcutsHelpOpen: (open) => set({ shortcutsHelpOpen: open }),

  // Board filters
  boardFilters: defaultFilters,
  setBoardFilters: (filters) =>
    set((state) => ({
      boardFilters: { ...state.boardFilters, ...filters },
    })),
  resetBoardFilters: () => set({ boardFilters: defaultFilters }),

  // Add project modal
  addProjectModalOpen: false,
  setAddProjectModalOpen: (open) => set({ addProjectModalOpen: open }),

  // Add task modal
  addTaskModalOpen: false,
  addTaskProjectId: null,
  openAddTaskModal: (projectId) => set({ addTaskModalOpen: true, addTaskProjectId: projectId }),
  closeAddTaskModal: () => set({ addTaskModalOpen: false, addTaskProjectId: null }),

  // Add review modal
  addReviewModalOpen: false,
  addReviewProjectId: null,
  openAddReviewModal: (projectId) =>
    set({ addReviewModalOpen: true, addReviewProjectId: projectId }),
  closeAddReviewModal: () => set({ addReviewModalOpen: false, addReviewProjectId: null }),

  // Quick move
  quickMoveProjectId: null,
  setQuickMoveProjectId: (projectId) => set({ quickMoveProjectId: projectId }),

  // Notification summary
  showNotificationSummary: false,
  setShowNotificationSummary: (show) => set({ showNotificationSummary: show }),

  // Calendar
  selectedCalendarDate: new Date(),
  setSelectedCalendarDate: (date) => set({ selectedCalendarDate: date }),
}));
