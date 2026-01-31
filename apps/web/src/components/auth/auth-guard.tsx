'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { AppLoading } from '@/components/ui/app-loading';

interface AuthGuardProps {
  children: React.ReactNode;
}

// Routes that don't require authentication
const publicRoutes = ['/auth/login', '/auth/signup', '/auth/forgot-password', '/'];

export function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { status } = useSession();

  const isPublicRoute = publicRoutes.some(
    (route) => pathname === route || pathname?.startsWith('/auth/')
  );

  useEffect(() => {
    // Don't redirect while loading
    if (status === 'loading') return;

    // Redirect to login if not authenticated and trying to access protected route
    if (status === 'unauthenticated' && !isPublicRoute) {
      // Save the current URL (including hash) to redirect back after login
      if (typeof window !== 'undefined') {
        const currentUrl = window.location.pathname + window.location.search + window.location.hash;
        sessionStorage.setItem('redirectAfterLogin', currentUrl);
      }
      router.replace('/auth/login');
    }
  }, [status, isPublicRoute, pathname, router]);

  // Show loading while checking auth for protected routes
  if (status === 'loading' && !isPublicRoute) {
    return <AppLoading message="Checking authentication..." />;
  }

  if (status === 'unauthenticated' && !isPublicRoute) {
    return <AppLoading message="Redirecting to login..." />;
  }

  return <>{children}</>;
}
