/**
 * Route protection for Focus Mode
 * Redirects users away from Power Mode-only routes when in Focus Mode
 */

// Routes that are only available in Power Mode
export const POWER_MODE_ROUTES = [
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

/**
 * Check if a route requires Power Mode access
 * @param pathname - The current route pathname
 * @returns true if the route requires Power Mode
 */
export function requiresPowerMode(pathname: string): boolean {
  return POWER_MODE_ROUTES.some((route) => pathname.startsWith(route));
}

/**
 * Get redirect path for Focus Mode users trying to access Power Mode routes
 * @param pathname - The current route pathname
 * @returns redirect path or null if no redirect needed
 */
export function getFocusModeRedirect(pathname: string, viewMode: 'focus' | 'power'): string | null {
  if (viewMode === 'focus' && requiresPowerMode(pathname)) {
    return '/dashboard';
  }
  return null;
}
