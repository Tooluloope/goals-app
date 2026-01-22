'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, useEffect, Suspense } from 'react';
import { useAuthStore } from '@/store/auth-store';
import { apiClient } from '@/lib/api-client';
import { AppLoading } from '@/components/ui/app-loading';
import { NavigationProgress } from '@/components/ui/navigation-progress';

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

  return <>{children}</>;
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
      <AuthInitializer>{children}</AuthInitializer>
    </QueryClientProvider>
  );
}
