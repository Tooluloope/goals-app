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
  openAddTaskModal: (projectId?: string) => void;
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

  // Onboarding modal (shown for new users)
  showOnboardingModal: boolean;
  setShowOnboardingModal: (show: boolean) => void;

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

export const useUIStore = create<UIState>((set) => {
  const store: UIState = {
    // Sidebar
    sidebarOpen: false,
    toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
    setSidebarOpen: (open: boolean) => set({ sidebarOpen: open }),

    // Command palette
    commandPaletteOpen: false,
    setCommandPaletteOpen: (open: boolean) => set({ commandPaletteOpen: open }),

    // Shortcuts help
    shortcutsHelpOpen: false,
    setShortcutsHelpOpen: (open: boolean) => set({ shortcutsHelpOpen: open }),

    // Board filters
    boardFilters: defaultFilters,
    setBoardFilters: (filters: Partial<FilterState>) =>
      set((state) => ({
        boardFilters: { ...state.boardFilters, ...filters },
      })),
    resetBoardFilters: () => set({ boardFilters: defaultFilters }),

    // Add project modal
    addProjectModalOpen: false,
    setAddProjectModalOpen: (open: boolean) => set({ addProjectModalOpen: open }),

    // Add task modal
    addTaskModalOpen: false,
    addTaskProjectId: null,
    openAddTaskModal: (projectId?: string) =>
      set({ addTaskModalOpen: true, addTaskProjectId: projectId || null }),
    closeAddTaskModal: () => set({ addTaskModalOpen: false, addTaskProjectId: null }),

    // Add review modal
    addReviewModalOpen: false,
    addReviewProjectId: null,
    openAddReviewModal: (projectId: string) =>
      set({ addReviewModalOpen: true, addReviewProjectId: projectId }),
    closeAddReviewModal: () => set({ addReviewModalOpen: false, addReviewProjectId: null }),

    // Quick move
    quickMoveProjectId: null,
    setQuickMoveProjectId: (projectId: string | null) => set({ quickMoveProjectId: projectId }),

    // Notification summary
    showNotificationSummary: false,
    setShowNotificationSummary: (show: boolean) => set({ showNotificationSummary: show }),

    // Onboarding modal
    showOnboardingModal: false,
    setShowOnboardingModal: (show: boolean) => set({ showOnboardingModal: show }),

    // Calendar
    selectedCalendarDate: new Date(),
    setSelectedCalendarDate: (date: Date) => set({ selectedCalendarDate: date }),
  };

  // Expose store on window for dev testing
  if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
    (window as unknown as { __UI_STORE__: UIState }).__UI_STORE__ = store;
  }

  return store;
});
