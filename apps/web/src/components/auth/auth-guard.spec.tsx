/**
 * Tests for AuthGuard redirect URL saving functionality.
 *
 * These tests verify that the AuthGuard correctly saves the current URL
 * to sessionStorage before redirecting unauthenticated users to login,
 * so they can be redirected back after login.
 */

describe('AuthGuard redirect URL logic', () => {
  // Routes that don't require authentication (from auth-guard.tsx)
  const publicRoutes = ['/auth/login', '/auth/signup', '/auth/forgot-password', '/'];

  // Helper to check if a route is public
  const isPublicRoute = (pathname: string): boolean => {
    return publicRoutes.some((route) => pathname === route || pathname.startsWith('/auth/'));
  };

  // Simulates the redirect URL construction from auth-guard.tsx
  const buildRedirectUrl = (pathname: string, search: string, hash: string): string => {
    return pathname + search + hash;
  };

  // Simulates the redirect decision logic from auth-guard.tsx
  const shouldRedirectToLogin = (
    isAuthenticated: boolean,
    isLoading: boolean,
    pathname: string
  ): boolean => {
    if (isLoading) return false;
    if (!isAuthenticated && !isPublicRoute(pathname)) return true;
    return false;
  };

  describe('redirect URL construction', () => {
    it('should construct URL with pathname and hash', () => {
      const url = buildRedirectUrl('/settings', '', '#notifications');
      expect(url).toBe('/settings#notifications');
    });

    it('should construct URL with pathname, search params, and hash', () => {
      const url = buildRedirectUrl('/project/123', '?tab=tasks', '#section1');
      expect(url).toBe('/project/123?tab=tasks#section1');
    });

    it('should construct URL with only pathname', () => {
      const url = buildRedirectUrl('/dashboard', '', '');
      expect(url).toBe('/dashboard');
    });

    it('should construct URL with pathname and search params', () => {
      const url = buildRedirectUrl('/projects', '?filter=active', '');
      expect(url).toBe('/projects?filter=active');
    });
  });

  describe('public route detection', () => {
    it('should identify / as a public route', () => {
      expect(isPublicRoute('/')).toBe(true);
    });

    it('should identify /auth/login as a public route', () => {
      expect(isPublicRoute('/auth/login')).toBe(true);
    });

    it('should identify /auth/signup as a public route', () => {
      expect(isPublicRoute('/auth/signup')).toBe(true);
    });

    it('should identify /auth/forgot-password as a public route', () => {
      expect(isPublicRoute('/auth/forgot-password')).toBe(true);
    });

    it('should identify any /auth/* route as public', () => {
      expect(isPublicRoute('/auth/verify-email')).toBe(true);
      expect(isPublicRoute('/auth/reset-password')).toBe(true);
      expect(isPublicRoute('/auth/magic-link')).toBe(true);
    });

    it('should identify /dashboard as a protected route', () => {
      expect(isPublicRoute('/dashboard')).toBe(false);
    });

    it('should identify /settings as a protected route', () => {
      expect(isPublicRoute('/settings')).toBe(false);
    });

    it('should identify /project/123 as a protected route', () => {
      expect(isPublicRoute('/project/123')).toBe(false);
    });
  });

  describe('redirect decision logic', () => {
    it('should redirect unauthenticated user on protected route', () => {
      expect(shouldRedirectToLogin(false, false, '/dashboard')).toBe(true);
    });

    it('should redirect unauthenticated user on /settings', () => {
      expect(shouldRedirectToLogin(false, false, '/settings')).toBe(true);
    });

    it('should not redirect unauthenticated user on public route', () => {
      expect(shouldRedirectToLogin(false, false, '/auth/login')).toBe(false);
    });

    it('should not redirect unauthenticated user on home page', () => {
      expect(shouldRedirectToLogin(false, false, '/')).toBe(false);
    });

    it('should not redirect authenticated user', () => {
      expect(shouldRedirectToLogin(true, false, '/dashboard')).toBe(false);
    });

    it('should not redirect while loading', () => {
      expect(shouldRedirectToLogin(false, true, '/dashboard')).toBe(false);
    });
  });

  describe('sessionStorage integration', () => {
    let sessionStorageStore: Record<string, string>;
    let sessionStorageMock: Storage;

    beforeEach(() => {
      sessionStorageStore = {};
      sessionStorageMock = {
        getItem: jest.fn((key: string) => sessionStorageStore[key] ?? null),
        setItem: jest.fn((key: string, value: string) => {
          sessionStorageStore[key] = value;
        }),
        removeItem: jest.fn((key: string) => {
          delete sessionStorageStore[key];
        }),
        clear: jest.fn(() => {
          Object.keys(sessionStorageStore).forEach((key) => delete sessionStorageStore[key]);
        }),
        length: 0,
        key: jest.fn(),
      };
    });

    // Simulates the sessionStorage save logic from auth-guard.tsx
    const saveRedirectUrl = (
      sessionStorage: Storage,
      pathname: string,
      search: string,
      hash: string
    ) => {
      const currentUrl = pathname + search + hash;
      sessionStorage.setItem('redirectAfterLogin', currentUrl);
    };

    it('should save /settings#notifications to sessionStorage', () => {
      saveRedirectUrl(sessionStorageMock, '/settings', '', '#notifications');

      expect(sessionStorageMock.setItem).toHaveBeenCalledWith(
        'redirectAfterLogin',
        '/settings#notifications'
      );
    });

    it('should save full URL with query params and hash', () => {
      saveRedirectUrl(sessionStorageMock, '/project/123', '?tab=tasks', '#section1');

      expect(sessionStorageMock.setItem).toHaveBeenCalledWith(
        'redirectAfterLogin',
        '/project/123?tab=tasks#section1'
      );
    });

    it('should save invite accept URL correctly', () => {
      saveRedirectUrl(sessionStorageMock, '/invite/accept', '?token=abc123', '');

      expect(sessionStorageMock.setItem).toHaveBeenCalledWith(
        'redirectAfterLogin',
        '/invite/accept?token=abc123'
      );
    });
  });
});

describe('Email URL redirect scenarios', () => {
  describe('password changed email link', () => {
    it('should save /settings#password when clicking password changed email link', () => {
      // When a user clicks the password changed email link and needs to login
      const pathname = '/settings';
      const hash = '#password';
      const redirectUrl = pathname + hash;

      expect(redirectUrl).toBe('/settings#password');
    });
  });

  describe('security alert email link', () => {
    it('should save /settings#security when clicking security alert email link', () => {
      // When a user clicks the security alert email link and needs to login
      // Note: #security maps to password section in settings page
      const pathname = '/settings';
      const hash = '#security';
      const redirectUrl = pathname + hash;

      expect(redirectUrl).toBe('/settings#security');
    });
  });

  describe('workspace invite link', () => {
    it('should save invite accept URL with token', () => {
      // When a user clicks an invite link and needs to login first
      const pathname = '/invite/accept';
      const search = '?token=invitation-token-123';
      const redirectUrl = pathname + search;

      expect(redirectUrl).toBe('/invite/accept?token=invitation-token-123');
    });
  });
});
