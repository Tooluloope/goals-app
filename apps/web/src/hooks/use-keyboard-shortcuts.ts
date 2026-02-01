'use client';

import { useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useUIStore } from '@/store/ui-store';
import { useAuthStore } from '@/store/auth-store';

interface ShortcutConfig {
  key: string;
  ctrl?: boolean;
  meta?: boolean;
  shift?: boolean;
  action: () => void;
  description: string;
  category: 'navigation' | 'actions' | 'general';
}

// Check if the target is an input element
function isInputElement(target: EventTarget | null): boolean {
  if (!target) return false;
  const element = target as HTMLElement;
  const tagName = element.tagName?.toLowerCase();
  return (
    tagName === 'input' ||
    tagName === 'textarea' ||
    tagName === 'select' ||
    element.isContentEditable
  );
}

export function useKeyboardShortcuts() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const {
    commandPaletteOpen,
    setCommandPaletteOpen,
    setAddProjectModalOpen,
    shortcutsHelpOpen,
    setShortcutsHelpOpen,
  } = useUIStore();
  const navPrefixRef = useRef(false);
  const navPrefixTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const navPrefixKey = 'g';
  const navPrefixTimeoutMs = 1000;

  const resetNavPrefix = useCallback(() => {
    navPrefixRef.current = false;
    if (navPrefixTimeoutRef.current) {
      clearTimeout(navPrefixTimeoutRef.current);
      navPrefixTimeoutRef.current = null;
    }
  }, []);

  // Define all shortcuts
  const shortcuts: ShortcutConfig[] = [
    // General
    {
      key: 'k',
      meta: true,
      action: () => setCommandPaletteOpen(!commandPaletteOpen),
      description: 'Open command palette',
      category: 'general',
    },
    {
      key: 'k',
      ctrl: true,
      action: () => setCommandPaletteOpen(!commandPaletteOpen),
      description: 'Open command palette (Windows)',
      category: 'general',
    },
    {
      key: '?',
      shift: true,
      action: () => setShortcutsHelpOpen(!shortcutsHelpOpen),
      description: 'Show keyboard shortcuts',
      category: 'general',
    },
    {
      key: 'Escape',
      action: () => {
        setCommandPaletteOpen(false);
        setShortcutsHelpOpen(false);
      },
      description: 'Close dialogs',
      category: 'general',
    },

    // Navigation (g then key for "go to")
    {
      key: 'd',
      action: () => router.push('/dashboard'),
      description: 'Go to Dashboard',
      category: 'navigation',
    },
    {
      key: 'b',
      action: () => router.push('/board'),
      description: 'Go to Board',
      category: 'navigation',
    },
    {
      key: 'p',
      action: () => router.push('/projects'),
      description: 'Go to Projects',
      category: 'navigation',
    },
    {
      key: 'c',
      action: () => router.push('/calendar'),
      description: 'Go to Calendar',
      category: 'navigation',
    },
    {
      key: 'n',
      action: () => router.push('/notifications'),
      description: 'Go to Notifications',
      category: 'navigation',
    },
    {
      key: 's',
      action: () => router.push('/settings'),
      description: 'Go to Settings',
      category: 'navigation',
    },
    {
      key: 'r',
      action: () => router.push('/rhythm'),
      description: 'Go to Daily Rhythm',
      category: 'navigation',
    },
    {
      key: 'w',
      action: () => router.push('/reviews/weekly'),
      description: 'Go to Weekly Review',
      category: 'navigation',
    },
    {
      key: 'm',
      action: () => router.push('/reviews/monthly'),
      description: 'Go to Monthly Review',
      category: 'navigation',
    },
    {
      key: 'a',
      action: () => router.push('/ai'),
      description: 'Go to AI Assistant',
      category: 'navigation',
    },
    {
      key: 'e',
      action: () => router.push('/dependencies'),
      description: 'Go to Dependencies',
      category: 'navigation',
    },
    {
      key: 'h',
      action: () => router.push('/habits'),
      description: 'Go to Habit Manager',
      category: 'navigation',
    },
    {
      key: 'o',
      action: () => router.push('/roadmap'),
      description: 'Go to Roadmap',
      category: 'navigation',
    },

    // Actions
    {
      key: 'n',
      shift: true,
      action: () => setAddProjectModalOpen(true),
      description: 'New project',
      category: 'actions',
    },
  ];

  // Track "g" key for navigation prefix
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in inputs
      if (isInputElement(event.target)) {
        // Allow Escape in inputs
        if (event.key === 'Escape') {
          setCommandPaletteOpen(false);
          setShortcutsHelpOpen(false);
        }
        return;
      }

      // Don't trigger if not authenticated
      if (!isAuthenticated) return;

      const isNavPrefixKey =
        event.key.toLowerCase() === navPrefixKey &&
        !event.metaKey &&
        !event.ctrlKey &&
        !event.shiftKey;

      if (isNavPrefixKey) {
        navPrefixRef.current = true;
        if (navPrefixTimeoutRef.current) {
          clearTimeout(navPrefixTimeoutRef.current);
        }
        navPrefixTimeoutRef.current = setTimeout(() => {
          navPrefixRef.current = false;
          navPrefixTimeoutRef.current = null;
        }, navPrefixTimeoutMs);
        return;
      }

      // Check each shortcut
      for (const shortcut of shortcuts) {
        const metaMatch = shortcut.meta ? event.metaKey : !event.metaKey;
        const ctrlMatch = shortcut.ctrl ? event.ctrlKey : !event.ctrlKey;
        const shiftMatch = shortcut.shift ? event.shiftKey : !event.shiftKey;
        const keyMatch = event.key.toLowerCase() === shortcut.key.toLowerCase();
        const isNavigationShortcut =
          shortcut.category === 'navigation' && !shortcut.meta && !shortcut.ctrl && !shortcut.shift;

        // Special handling for Cmd/Ctrl+K
        if ((shortcut.meta || shortcut.ctrl) && keyMatch) {
          if ((shortcut.meta && event.metaKey) || (shortcut.ctrl && event.ctrlKey)) {
            event.preventDefault();
            shortcut.action();
            return;
          }
        }

        // For shift shortcuts (like Shift+N for new project, or ? for shortcuts help)
        if (shortcut.shift && !shortcut.meta && !shortcut.ctrl) {
          // For ? key, match the actual character since it's a shifted character
          const isQuestionMark = shortcut.key === '?' && event.key === '?';
          const isShiftedLetter = shiftMatch && keyMatch;

          if ((isQuestionMark || isShiftedLetter) && !event.metaKey && !event.ctrlKey) {
            // Don't trigger if command palette is open (except for ?)
            if (commandPaletteOpen && shortcut.key !== '?') {
              return;
            }
            event.preventDefault();
            shortcut.action();
            return;
          }
        }

        // For simple key shortcuts
        if (!shortcut.meta && !shortcut.ctrl && !shortcut.shift) {
          if (isNavigationShortcut) {
            if (!navPrefixRef.current) {
              continue;
            }
            if (keyMatch && !event.metaKey && !event.ctrlKey && !event.shiftKey) {
              if (commandPaletteOpen || shortcutsHelpOpen) {
                resetNavPrefix();
                return;
              }
              event.preventDefault();
              resetNavPrefix();
              shortcut.action();
              return;
            }
            continue;
          }
          if (keyMatch && !event.metaKey && !event.ctrlKey && !event.shiftKey) {
            // Don't trigger navigation if command palette is open
            if (commandPaletteOpen || shortcutsHelpOpen) {
              if (event.key === 'Escape') {
                shortcut.action();
              }
              return;
            }
            event.preventDefault();
            shortcut.action();
            return;
          }
        }
      }

      if (navPrefixRef.current) {
        resetNavPrefix();
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps -- shortcuts contains inline functions that would cause infinite re-renders
    [
      isAuthenticated,
      commandPaletteOpen,
      shortcutsHelpOpen,
      setCommandPaletteOpen,
      setShortcutsHelpOpen,
      setAddProjectModalOpen,
      router,
      resetNavPrefix,
    ]
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return { shortcuts };
}

// Detect if user is on Mac
export function isMac(): boolean {
  if (typeof window === 'undefined') return false;
  return navigator.platform.toUpperCase().indexOf('MAC') >= 0;
}

// Get the modifier key symbol based on OS
export function getModifierKey(): string {
  return isMac() ? '⌘' : 'Ctrl';
}

// Export shortcut definitions for help modal (OS-aware)
export function getShortcutDefinitions() {
  const mod = getModifierKey();
  const navPrefix = 'G';
  return {
    general: [
      { keys: [mod, 'K'], description: 'Open command palette' },
      { keys: ['⇧', '?'], description: 'Show keyboard shortcuts' },
      { keys: ['Esc'], description: 'Close dialogs' },
    ],
    navigation: [
      { keys: [navPrefix, 'D'], description: 'Go to Dashboard' },
      { keys: [navPrefix, 'A'], description: 'Go to AI Assistant' },
      { keys: [navPrefix, 'R'], description: 'Go to Daily Rhythm' },
      { keys: [navPrefix, 'H'], description: 'Go to Habit Manager' },
      { keys: [navPrefix, 'B'], description: 'Go to Board' },
      { keys: [navPrefix, 'P'], description: 'Go to Projects' },
      { keys: [navPrefix, 'O'], description: 'Go to Roadmap' },
      { keys: [navPrefix, 'E'], description: 'Go to Dependencies' },
      { keys: [navPrefix, 'C'], description: 'Go to Calendar' },
      { keys: [navPrefix, 'W'], description: 'Go to Weekly Review' },
      { keys: [navPrefix, 'M'], description: 'Go to Monthly Review' },
      { keys: [navPrefix, 'N'], description: 'Go to Notifications' },
      { keys: [navPrefix, 'S'], description: 'Go to Settings' },
    ],
    actions: [{ keys: ['⇧', 'N'], description: 'New project' }],
  };
}

// Legacy export for backwards compatibility
export const SHORTCUT_DEFINITIONS = {
  general: [
    { keys: ['⌘/Ctrl', 'K'], description: 'Open command palette' },
    { keys: ['⇧', '?'], description: 'Show keyboard shortcuts' },
    { keys: ['Esc'], description: 'Close dialogs' },
  ],
  navigation: [
    { keys: ['G', 'D'], description: 'Go to Dashboard' },
    { keys: ['G', 'A'], description: 'Go to AI Assistant' },
    { keys: ['G', 'R'], description: 'Go to Daily Rhythm' },
    { keys: ['G', 'H'], description: 'Go to Habit Manager' },
    { keys: ['G', 'B'], description: 'Go to Board' },
    { keys: ['G', 'P'], description: 'Go to Projects' },
    { keys: ['G', 'O'], description: 'Go to Roadmap' },
    { keys: ['G', 'E'], description: 'Go to Dependencies' },
    { keys: ['G', 'C'], description: 'Go to Calendar' },
    { keys: ['G', 'W'], description: 'Go to Weekly Review' },
    { keys: ['G', 'M'], description: 'Go to Monthly Review' },
    { keys: ['G', 'N'], description: 'Go to Notifications' },
    { keys: ['G', 'S'], description: 'Go to Settings' },
  ],
  actions: [{ keys: ['⇧', 'N'], description: 'New project' }],
};
