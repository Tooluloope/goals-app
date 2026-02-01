'use client';

import { renderHook, act } from '@testing-library/react';
import { useKeyboardShortcuts } from './use-keyboard-shortcuts';
import { useUIStore } from '@/store/ui-store';
import { useAuthStore } from '@/store/auth-store';

const mockRouter = {
  push: jest.fn(),
  replace: jest.fn(),
  prefetch: jest.fn(),
  back: jest.fn(),
  forward: jest.fn(),
};

jest.mock('next/navigation', () => ({
  useRouter: () => mockRouter,
}));

jest.mock('@/store/ui-store', () => ({
  useUIStore: jest.fn(),
}));

jest.mock('@/store/auth-store', () => ({
  useAuthStore: jest.fn(),
}));

const mockUseUIStore = useUIStore as jest.MockedFunction<typeof useUIStore>;
const mockUseAuthStore = useAuthStore as jest.MockedFunction<typeof useAuthStore>;

describe('useKeyboardShortcuts', () => {
  const uiState = {
    commandPaletteOpen: false,
    shortcutsHelpOpen: false,
    setCommandPaletteOpen: jest.fn(),
    setShortcutsHelpOpen: jest.fn(),
    setAddProjectModalOpen: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuthStore.mockReturnValue({ isAuthenticated: true } as any);
    mockUseUIStore.mockReturnValue(uiState as any);
  });

  it('does not navigate on single key presses', () => {
    const { unmount } = renderHook(() => useKeyboardShortcuts());

    act(() => {
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'd' }));
    });

    expect(mockRouter.push).not.toHaveBeenCalled();
    unmount();
  });

  it('navigates only after the prefix key is pressed', () => {
    const { unmount } = renderHook(() => useKeyboardShortcuts());

    act(() => {
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'g' }));
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'd' }));
    });

    expect(mockRouter.push).toHaveBeenCalledWith('/dashboard');
    unmount();
  });

  it('ignores navigation after the prefix times out', () => {
    jest.useFakeTimers();
    const { unmount } = renderHook(() => useKeyboardShortcuts());

    act(() => {
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'g' }));
    });

    act(() => {
      jest.advanceTimersByTime(1100);
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'd' }));
    });

    expect(mockRouter.push).not.toHaveBeenCalled();
    unmount();
    jest.useRealTimers();
  });
});
