'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SessionProvider } from 'next-auth/react';
import { ThemeProvider } from 'next-themes';
import { useState, useEffect, Suspense } from 'react';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useAuthStore } from '@/store/auth-store';
import { apiClient } from '@/lib/api-client';
import { useUIStore } from '@/store/ui-store';
import { AppLoading } from '@/components/ui/app-loading';
import { NavigationProgress } from '@/components/ui/navigation-progress';
import { AuthGuard } from '@/components/auth/auth-guard';
import { CommandPalette, ShortcutsHelp } from '@/components/command-palette';
import { OnboardingModal } from '@/components/onboarding/onboarding-modal';
import { useKeyboardShortcuts } from '@/hooks/use-keyboard-shortcuts';
import { shouldShowOnboarding, setShouldShowOnboarding } from '@/lib/onboarding';

function GlobalComponents() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const {
    commandPaletteOpen,
    setCommandPaletteOpen,
    shortcutsHelpOpen,
    setShortcutsHelpOpen,
    showOnboardingModal,
    setShowOnboardingModal,
  } = useUIStore();

  // Initialize keyboard shortcuts
  useKeyboardShortcuts();

  // Check localStorage for onboarding flag on mount and route changes
  useEffect(() => {
    // Small delay to ensure localStorage is set before checking
    const timer = setTimeout(() => {
      const shouldOpen = shouldShowOnboarding() || session?.user?.isNewUser;
      if (shouldOpen) {
        setShowOnboardingModal(true);
        setShouldShowOnboarding(false); // Clear the flag
      }
    }, 100);
    return () => clearTimeout(timer);
  }, [pathname, setShowOnboardingModal, session?.user?.isNewUser]);

  return (
    <>
      <CommandPalette open={commandPaletteOpen} onOpenChange={setCommandPaletteOpen} />
      <ShortcutsHelp open={shortcutsHelpOpen} onOpenChange={setShortcutsHelpOpen} />
      <OnboardingModal open={showOnboardingModal} onOpenChange={setShowOnboardingModal} />
    </>
  );
}

function WorkspaceInitializer({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const { user, isAuthenticated, setUser, logout } = useAuthStore();
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    if (status === 'authenticated' && session?.user?.id) {
      if (user?.id === session.user.id && isAuthenticated) {
        return;
      }
      setIsSyncing(true);
      apiClient
        .getCurrentUser()
        .then((apiUser) => setUser(apiUser))
        .catch((error) => {
          console.error('Failed to sync user session:', error);
        })
        .finally(() => setIsSyncing(false));
    }

    if (status === 'unauthenticated' && (isAuthenticated || user)) {
      void logout();
    }
  }, [status, session?.user?.id, user?.id, isAuthenticated, setUser, logout]);

  // Show loading while checking auth
  if (status === 'loading' || (status === 'authenticated' && isSyncing)) {
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
    <SessionProvider>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
        <QueryClientProvider client={queryClient}>
          <Suspense fallback={null}>
            <NavigationProgress />
          </Suspense>
          <WorkspaceInitializer>
            {children}
            <GlobalComponents />
          </WorkspaceInitializer>
        </QueryClientProvider>
      </ThemeProvider>
    </SessionProvider>
  );
}
