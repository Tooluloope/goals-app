/**
 * Tests for Focus Mode route protection
 *
 * These tests verify that the mode guard correctly identifies Power Mode routes
 * and redirects Focus Mode users appropriately.
 */

import { requiresPowerMode, getFocusModeRedirect, POWER_MODE_ROUTES } from './mode-guard';

describe('mode-guard', () => {
  describe('POWER_MODE_ROUTES', () => {
    it('should contain all Power Mode-only routes', () => {
      const expectedRoutes = [
        '/ai',
        '/calendar',
        '/reviews/weekly',
        '/reviews/monthly',
        '/rhythm',
        '/dependencies',
        '/settings/configure',
        '/roadmap',
        '/tasks',
      ];

      expect(POWER_MODE_ROUTES).toEqual(expectedRoutes);
    });
  });

  describe('requiresPowerMode', () => {
    describe('Power Mode-only routes', () => {
      it('should return true for /ai route', () => {
        expect(requiresPowerMode('/ai')).toBe(true);
      });

      it('should return true for /ai with subpaths', () => {
        expect(requiresPowerMode('/ai/conversation/123')).toBe(true);
      });

      it('should return true for /calendar route', () => {
        expect(requiresPowerMode('/calendar')).toBe(true);
      });

      it('should return true for /reviews/weekly route', () => {
        expect(requiresPowerMode('/reviews/weekly')).toBe(true);
      });

      it('should return true for /reviews/monthly route', () => {
        expect(requiresPowerMode('/reviews/monthly')).toBe(true);
      });

      it('should return true for /rhythm route', () => {
        expect(requiresPowerMode('/rhythm')).toBe(true);
      });

      it('should return true for /dependencies route', () => {
        expect(requiresPowerMode('/dependencies')).toBe(true);
      });

      it('should return true for /settings/configure route', () => {
        expect(requiresPowerMode('/settings/configure')).toBe(true);
      });

      it('should return true for /roadmap route', () => {
        expect(requiresPowerMode('/roadmap')).toBe(true);
      });

      it('should return true for /tasks route', () => {
        expect(requiresPowerMode('/tasks')).toBe(true);
      });
    });

    describe('Focus Mode accessible routes', () => {
      it('should return false for /dashboard', () => {
        expect(requiresPowerMode('/dashboard')).toBe(false);
      });

      it('should return false for /projects', () => {
        expect(requiresPowerMode('/projects')).toBe(false);
      });

      it('should return false for /projects/:id', () => {
        expect(requiresPowerMode('/projects/abc-123')).toBe(false);
      });

      it('should return false for /board', () => {
        expect(requiresPowerMode('/board')).toBe(false);
      });

      it('should return false for /habits', () => {
        expect(requiresPowerMode('/habits')).toBe(false);
      });

      it('should return false for /notifications', () => {
        expect(requiresPowerMode('/notifications')).toBe(false);
      });

      it('should return false for /settings', () => {
        expect(requiresPowerMode('/settings')).toBe(false);
      });

      it('should return false for /settings with hash', () => {
        expect(requiresPowerMode('/settings#viewMode')).toBe(false);
      });

      it('should return false for /family', () => {
        expect(requiresPowerMode('/family')).toBe(false);
      });
    });

    describe('Edge cases', () => {
      it('should return false for root path', () => {
        expect(requiresPowerMode('/')).toBe(false);
      });

      it('should return false for empty string', () => {
        expect(requiresPowerMode('')).toBe(false);
      });

      it('should handle paths with query parameters', () => {
        expect(requiresPowerMode('/ai?tab=insights')).toBe(true);
        expect(requiresPowerMode('/dashboard?date=2024-01-01')).toBe(false);
      });
    });
  });

  describe('getFocusModeRedirect', () => {
    describe('Focus Mode users', () => {
      it('should redirect from /ai to /dashboard', () => {
        expect(getFocusModeRedirect('/ai', 'focus')).toBe('/dashboard');
      });

      it('should redirect from /calendar to /dashboard', () => {
        expect(getFocusModeRedirect('/calendar', 'focus')).toBe('/dashboard');
      });

      it('should redirect from /reviews/weekly to /dashboard', () => {
        expect(getFocusModeRedirect('/reviews/weekly', 'focus')).toBe('/dashboard');
      });

      it('should redirect from /rhythm to /dashboard', () => {
        expect(getFocusModeRedirect('/rhythm', 'focus')).toBe('/dashboard');
      });

      it('should redirect from /dependencies to /dashboard', () => {
        expect(getFocusModeRedirect('/dependencies', 'focus')).toBe('/dashboard');
      });

      it('should redirect from /tasks to /dashboard', () => {
        expect(getFocusModeRedirect('/tasks', 'focus')).toBe('/dashboard');
      });

      it('should redirect from /roadmap to /dashboard', () => {
        expect(getFocusModeRedirect('/roadmap', 'focus')).toBe('/dashboard');
      });

      it('should not redirect from /dashboard', () => {
        expect(getFocusModeRedirect('/dashboard', 'focus')).toBeNull();
      });

      it('should not redirect from /projects', () => {
        expect(getFocusModeRedirect('/projects', 'focus')).toBeNull();
      });

      it('should not redirect from /board', () => {
        expect(getFocusModeRedirect('/board', 'focus')).toBeNull();
      });

      it('should not redirect from /habits', () => {
        expect(getFocusModeRedirect('/habits', 'focus')).toBeNull();
      });

      it('should not redirect from /settings', () => {
        expect(getFocusModeRedirect('/settings', 'focus')).toBeNull();
      });
    });

    describe('Power Mode users', () => {
      it('should not redirect from any route', () => {
        expect(getFocusModeRedirect('/ai', 'power')).toBeNull();
        expect(getFocusModeRedirect('/calendar', 'power')).toBeNull();
        expect(getFocusModeRedirect('/reviews/weekly', 'power')).toBeNull();
        expect(getFocusModeRedirect('/rhythm', 'power')).toBeNull();
        expect(getFocusModeRedirect('/dependencies', 'power')).toBeNull();
        expect(getFocusModeRedirect('/tasks', 'power')).toBeNull();
        expect(getFocusModeRedirect('/roadmap', 'power')).toBeNull();
        expect(getFocusModeRedirect('/dashboard', 'power')).toBeNull();
        expect(getFocusModeRedirect('/projects', 'power')).toBeNull();
      });
    });

    describe('Edge cases', () => {
      it('should handle root path', () => {
        expect(getFocusModeRedirect('/', 'focus')).toBeNull();
      });

      it('should handle empty string', () => {
        expect(getFocusModeRedirect('', 'focus')).toBeNull();
      });

      it('should redirect from Power Mode routes with subpaths', () => {
        expect(getFocusModeRedirect('/ai/conversation/123', 'focus')).toBe('/dashboard');
      });

      it('should redirect from Power Mode routes with query params', () => {
        expect(getFocusModeRedirect('/ai?tab=insights', 'focus')).toBe('/dashboard');
      });
    });
  });

  describe('Integration scenarios', () => {
    it('should correctly handle user switching from Power to Focus mode', () => {
      // User is on /ai page in Power Mode
      expect(getFocusModeRedirect('/ai', 'power')).toBeNull();

      // User switches to Focus Mode
      expect(getFocusModeRedirect('/ai', 'focus')).toBe('/dashboard');
    });

    it('should allow access to shared routes in both modes', () => {
      const sharedRoutes = ['/dashboard', '/projects', '/board', '/habits', '/settings'];

      sharedRoutes.forEach((route) => {
        expect(getFocusModeRedirect(route, 'focus')).toBeNull();
        expect(getFocusModeRedirect(route, 'power')).toBeNull();
      });
    });

    it('should protect all Power Mode routes consistently', () => {
      POWER_MODE_ROUTES.forEach((route) => {
        expect(requiresPowerMode(route)).toBe(true);
        expect(getFocusModeRedirect(route, 'focus')).toBe('/dashboard');
        expect(getFocusModeRedirect(route, 'power')).toBeNull();
      });
    });
  });
});
