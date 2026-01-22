'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, useEffect, Suspense } from 'react';
import { useAuthStore } from '@/store/auth-store';
import { useUIStore } from '@/store/ui-store';
import { apiClient } from '@/lib/api-client';
import { AppLoading } from '@/components/ui/app-loading';
import { NavigationProgress } from '@/components/ui/navigation-progress';
import { AuthGuard } from '@/components/auth/auth-guard';
import { CommandPalette, ShortcutsHelp } from '@/components/command-palette';
import { useKeyboardShortcuts } from '@/hooks/use-keyboard-shortcuts';

function GlobalComponents() {
  const { commandPaletteOpen, setCommandPaletteOpen, shortcutsHelpOpen, setShortcutsHelpOpen } =
    useUIStore();

  // Initialize keyboard shortcuts
  useKeyboardShortcuts();

  return (
    <>
      <CommandPalette open={commandPaletteOpen} onOpenChange={setCommandPaletteOpen} />
      <ShortcutsHelp open={shortcutsHelpOpen} onOpenChange={setShortcutsHelpOpen} />
    </>
  );
}

function AuthInitializer({ children }: { children: React.ReactNode }) {
  const { initializeAuth } = useAuthStore();
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // Load tokens from localStorage first
    apiClient.loadTokens();
    // Then initialize auth state
    initializeAuth().finally(() => setIsInitialized(true));
  }, [initializeAuth]);

  // Show loading screen while initializing
  if (!isInitialized) {
    return <AppLoading message="Starting app..." />;
  }

  return <AuthGuard>{children}</AuthGuard>;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minute
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <Suspense fallback={null}>
        <NavigationProgress />
      </Suspense>
      <AuthInitializer>
        {children}
        <GlobalComponents />
      </AuthInitializer>
    </QueryClientProvider>
  );
}
