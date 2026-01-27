import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const credsPath = path.resolve(__dirname, '../storageStates/creds.json');
const hasCreds = fs.existsSync(credsPath);

test.describe('view mode (Focus/Power)', () => {
  test.skip(!hasCreds, 'Generated creds missing (global-setup should create them)');

  test.describe('Focus Mode', () => {
    test.beforeEach(async ({ page }) => {
      // Navigate to settings and switch to Focus Mode
      await page.goto('/settings');
      await page.waitForLoadState('networkidle');

      // Click on the Experience Mode section if not expanded
      const viewModeSection = page.locator('#section-viewMode');
      if (!(await viewModeSection.isVisible())) {
        await page.locator('button:has-text("Experience Mode")').click();
      }

      // Select Focus Mode
      await page.locator('label[for="focus"]').click();
      await page.waitForTimeout(1000); // Wait for setting to save
    });

    test('should show simplified navigation in Focus Mode', async ({ page }) => {
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');

      // Desktop sidebar should show Focus Mode navigation
      const sidebar = page.locator('nav').first();
      await expect(sidebar.locator('text=Dashboard')).toBeVisible();
      await expect(sidebar.locator('text=Projects')).toBeVisible();
      await expect(sidebar.locator('text=Board')).toBeVisible();
      await expect(sidebar.locator('text=Habits')).toBeVisible();

      // Power Mode items should not be visible
      await expect(sidebar.locator('text=AI Assistant')).not.toBeVisible();
      await expect(sidebar.locator('text=Daily Rhythm')).not.toBeVisible();
      await expect(sidebar.locator('text=Calendar')).not.toBeVisible();
      await expect(sidebar.locator('text=Weekly Review')).not.toBeVisible();
    });

    test('should show upgrade prompt in Focus Mode', async ({ page }) => {
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');

      // Check for upgrade prompt
      await expect(page.locator('text=Unlock Power Mode')).toBeVisible();
      await expect(
        page.locator(
          'text=Get AI insights, reviews, calendar, dependencies, and advanced analytics'
        )
      ).toBeVisible();
    });

    test('should redirect from Power Mode routes to dashboard', async ({ page }) => {
      // Try to access AI page
      await page.goto('/ai');
      await page.waitForLoadState('networkidle');
      await expect(page).toHaveURL(/dashboard/);

      // Try to access Calendar page
      await page.goto('/calendar');
      await page.waitForLoadState('networkidle');
      await expect(page).toHaveURL(/dashboard/);

      // Try to access Weekly Review page
      await page.goto('/reviews/weekly');
      await page.waitForLoadState('networkidle');
      await expect(page).toHaveURL(/dashboard/);

      // Try to access Rhythm page
      await page.goto('/rhythm');
      await page.waitForLoadState('networkidle');
      await expect(page).toHaveURL(/dashboard/);
    });

    test('should allow access to shared routes', async ({ page }) => {
      // Dashboard
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');
      await expect(page).toHaveURL(/dashboard/);

      // Projects
      await page.goto('/projects');
      await page.waitForLoadState('networkidle');
      await expect(page).toHaveURL(/projects/);

      // Board
      await page.goto('/board');
      await page.waitForLoadState('networkidle');
      await expect(page).toHaveURL(/board/);

      // Habits
      await page.goto('/habits');
      await page.waitForLoadState('networkidle');
      await expect(page).toHaveURL(/habits/);

      // Settings
      await page.goto('/settings');
      await page.waitForLoadState('networkidle');
      await expect(page).toHaveURL(/settings/);
    });

    test('should hide board filters in Focus Mode', async ({ page }) => {
      await page.goto('/board');
      await page.waitForLoadState('networkidle');

      // Board filters should not be visible
      // (These would be filter dropdowns for Area, Priority, Tags, etc.)
      const filterSection = page.locator('[data-testid="board-filters"]');
      if ((await filterSection.count()) > 0) {
        await expect(filterSection).not.toBeVisible();
      }
    });

    test('upgrade button should navigate to settings with hash', async ({ page }) => {
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');

      // Click upgrade button
      await page.locator('button:has-text("Upgrade Now")').click();
      await page.waitForLoadState('networkidle');

      // Should navigate to settings with viewMode hash
      await expect(page).toHaveURL(/settings#viewMode/);
    });
  });

  test.describe('Power Mode', () => {
    test.beforeEach(async ({ page }) => {
      // Navigate to settings and switch to Power Mode
      await page.goto('/settings');
      await page.waitForLoadState('networkidle');

      // Click on the Experience Mode section if not expanded
      const viewModeSection = page.locator('#section-viewMode');
      if (!(await viewModeSection.isVisible())) {
        await page.locator('button:has-text("Experience Mode")').click();
      }

      // Select Power Mode
      await page.locator('label[for="power"]').click();
      await page.waitForTimeout(1000); // Wait for setting to save
    });

    test('should show full navigation in Power Mode', async ({ page }) => {
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');

      // Desktop sidebar should show Power Mode navigation
      const sidebar = page.locator('nav').first();
      await expect(sidebar.locator('text=Dashboard')).toBeVisible();
      await expect(sidebar.locator('text=AI Assistant')).toBeVisible();
      await expect(sidebar.locator('text=Daily Rhythm')).toBeVisible();
      await expect(sidebar.locator('text=Projects')).toBeVisible();
      await expect(sidebar.locator('text=Board')).toBeVisible();
      await expect(sidebar.locator('text=Calendar')).toBeVisible();
      await expect(sidebar.locator('text=Weekly Review')).toBeVisible();
    });

    test('should not show upgrade prompt in Power Mode', async ({ page }) => {
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');

      // Upgrade prompt should not be visible
      await expect(page.locator('text=Unlock Power Mode')).not.toBeVisible();
    });

    test('should allow access to all routes', async ({ page }) => {
      // Power Mode routes
      await page.goto('/ai');
      await page.waitForLoadState('networkidle');
      await expect(page).toHaveURL(/ai/);

      await page.goto('/calendar');
      await page.waitForLoadState('networkidle');
      await expect(page).toHaveURL(/calendar/);

      await page.goto('/reviews/weekly');
      await page.waitForLoadState('networkidle');
      await expect(page).toHaveURL(/reviews\/weekly/);

      await page.goto('/rhythm');
      await page.waitForLoadState('networkidle');
      await expect(page).toHaveURL(/rhythm/);

      // Shared routes
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');
      await expect(page).toHaveURL(/dashboard/);

      await page.goto('/projects');
      await page.waitForLoadState('networkidle');
      await expect(page).toHaveURL(/projects/);
    });
  });

  test.describe('Mode Toggle', () => {
    test('should toggle between Focus and Power modes', async ({ page }) => {
      await page.goto('/settings#viewMode');
      await page.waitForLoadState('networkidle');

      // Wait for section to be visible and expanded
      await expect(page.locator('#section-viewMode')).toBeVisible({ timeout: 5000 });

      // Switch to Focus Mode
      await page.locator('label[for="focus"]').click();
      await page.waitForTimeout(1000);

      // Verify Focus Mode is selected
      const focusRadio = page.locator('input[value="focus"]');
      await expect(focusRadio).toBeChecked();

      // Navigate to dashboard and verify redirect from /ai
      await page.goto('/ai');
      await page.waitForLoadState('networkidle');
      await expect(page).toHaveURL(/dashboard/);

      // Switch back to Power Mode
      await page.goto('/settings#viewMode');
      await page.waitForLoadState('networkidle');
      await page.locator('label[for="power"]').click();
      await page.waitForTimeout(1000);

      // Verify Power Mode is selected
      const powerRadio = page.locator('input[value="power"]');
      await expect(powerRadio).toBeChecked();

      // Navigate to AI and verify no redirect
      await page.goto('/ai');
      await page.waitForLoadState('networkidle');
      await expect(page).toHaveURL(/ai/);
    });

    test('should persist mode selection across page refreshes', async ({ page }) => {
      // Set to Focus Mode
      await page.goto('/settings#viewMode');
      await page.waitForLoadState('networkidle');
      await expect(page.locator('#section-viewMode')).toBeVisible({ timeout: 5000 });
      await page.locator('label[for="focus"]').click();
      await page.waitForTimeout(1000);

      // Refresh page
      await page.reload();
      await page.waitForLoadState('networkidle');

      // Verify Focus Mode is still selected
      const focusRadio = page.locator('input[value="focus"]');
      await expect(focusRadio).toBeChecked();

      // Switch to Power Mode
      await page.locator('label[for="power"]').click();
      await page.waitForTimeout(1000);

      // Refresh page
      await page.reload();
      await page.waitForLoadState('networkidle');

      // Verify Power Mode is still selected
      const powerRadio = page.locator('input[value="power"]');
      await expect(powerRadio).toBeChecked();
    });
  });

  test.describe('Settings Hash Navigation', () => {
    test('should navigate to viewMode section with #viewMode hash', async ({ page }) => {
      await page.goto('/settings#viewMode');
      await page.waitForLoadState('networkidle');

      // Section should be visible and expanded
      await expect(page.locator('#section-viewMode')).toBeVisible({ timeout: 5000 });
      await expect(page.locator('text=Experience Mode')).toBeVisible();
      await expect(page.locator('label[for="focus"]')).toBeVisible();
      await expect(page.locator('label[for="power"]')).toBeVisible();
    });

    test('should navigate to viewMode section with #mode alias', async ({ page }) => {
      await page.goto('/settings#mode');
      await page.waitForLoadState('networkidle');

      // Section should be visible and expanded
      await expect(page.locator('#section-viewMode')).toBeVisible({ timeout: 5000 });
      await expect(page.locator('text=Experience Mode')).toBeVisible();
    });
  });
});
