'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';
import { AppLoading } from '@/components/ui/app-loading';

interface AuthGuardProps {
  children: React.ReactNode;
}

// Routes that don't require authentication
const publicRoutes = ['/auth/login', '/auth/signup', '/auth/forgot-password', '/'];

export function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, isLoading } = useAuthStore();

  const isPublicRoute = publicRoutes.some(
    (route) => pathname === route || pathname.startsWith('/auth/')
  );

  useEffect(() => {
    // Don't redirect while loading
    if (isLoading) return;

    // Redirect to login if not authenticated and trying to access protected route
    if (!isAuthenticated && !isPublicRoute) {
      // Save the current URL (including hash) to redirect back after login
      if (typeof window !== 'undefined') {
        const currentUrl = window.location.pathname + window.location.search + window.location.hash;
        sessionStorage.setItem('redirectAfterLogin', currentUrl);
      }
      router.replace('/auth/login');
    }

    // Note: We don't redirect authenticated users away from auth routes here
    // because the login/signup forms handle their own redirects after success.
    // Redirecting here would cause a race condition with the form's redirect.
  }, [isAuthenticated, isLoading, isPublicRoute, pathname, router]);

  // Show loading while checking auth for protected routes
  if (!isPublicRoute && !isAuthenticated) {
    return <AppLoading message="Checking authentication..." />;
  }

  return <>{children}</>;
}
