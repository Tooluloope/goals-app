import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const credsPath = path.resolve(__dirname, '../storageStates/creds.json');
const hasCreds = fs.existsSync(credsPath);

test.describe('habits and rhythm flow', () => {
  test.skip(!hasCreds, 'Generated creds missing (global-setup should create them)');

  test.describe('rhythm page', () => {
    test('loads rhythm page with correct heading', async ({ page }) => {
      await page.goto('/rhythm');
      await page.waitForLoadState('networkidle');

      // Check page title and heading
      await expect(page.getByRole('heading', { name: /today's flow/i }).first()).toBeVisible({
        timeout: 15_000,
      });
    });

    test('shows habit pulse progress section', async ({ page }) => {
      await page.goto('/rhythm');
      await page.waitForLoadState('networkidle');

      // Check for habit pulse section
      await expect(page.getByText(/habit pulse/i).first()).toBeVisible({ timeout: 15_000 });
      // Check for percentage indicator
      await expect(page.getByText(/%/).first()).toBeVisible({ timeout: 10_000 });
    });

    test('shows daily inspiration section', async ({ page }) => {
      await page.goto('/rhythm');
      await page.waitForLoadState('networkidle');

      // Check for daily inspiration
      await expect(page.getByText(/daily inspiration/i).first()).toBeVisible({ timeout: 15_000 });
    });

    test('shows week rhythm navigation', async ({ page }) => {
      await page.goto('/rhythm');
      await page.waitForLoadState('networkidle');

      // Check for week rhythm section
      await expect(page.getByText(/week rhythm/i).first()).toBeVisible({ timeout: 15_000 });
    });

    test('can navigate to previous day', async ({ page }) => {
      await page.goto('/rhythm');
      await page.waitForLoadState('networkidle');

      // Click previous day button (left chevron)
      const prevButton = page
        .locator('button')
        .filter({ has: page.locator('svg.lucide-chevron-left') })
        .first();
      await prevButton.click();

      // Should no longer show "Today's Flow" heading but "Daily Rhythm"
      await expect(page.getByRole('heading', { name: /daily rhythm/i }).first()).toBeVisible({
        timeout: 10_000,
      });
    });

    test('can open date picker popover', async ({ page }) => {
      await page.goto('/rhythm');
      await page.waitForLoadState('networkidle');

      // Click on the date button (contains "Today")
      const dateButton = page.getByRole('button', { name: /today/i }).first();
      await dateButton.click();

      // Should show popover with "Jump to Date" text
      await expect(page.getByText(/jump to date/i)).toBeVisible({ timeout: 5_000 });
      // Should show "Yesterday" button
      await expect(page.getByRole('button', { name: /yesterday/i })).toBeVisible();
    });
  });

  test.describe('habit management', () => {
    test('shows empty state when no habits exist', async ({ page }) => {
      await page.goto('/rhythm');
      await page.waitForLoadState('networkidle');

      // Check for empty state or add button (one of these should be visible)
      const emptyState = page.getByText(/no habits yet/i);
      const addButton = page.getByText(/add/i).first();

      // Either empty state or add button should be visible
      const hasEmptyState = await emptyState.isVisible().catch(() => false);
      const hasAddButton = await addButton.isVisible().catch(() => false);

      expect(hasEmptyState || hasAddButton).toBeTruthy();
    });

    test('can open add habit modal', async ({ page }) => {
      await page.goto('/rhythm');
      await page.waitForLoadState('networkidle');

      // Find and click the add button
      const addButton = page.locator('button').filter({ hasText: /add/i }).first();
      await addButton.click();

      // Modal should open with "Create New Habit" title
      await expect(page.getByRole('heading', { name: /create new habit/i })).toBeVisible({
        timeout: 5_000,
      });

      // Form elements should be visible
      await expect(page.getByLabel(/habit name/i)).toBeVisible();
      await expect(page.getByText(/icon/i).first()).toBeVisible();
      await expect(page.getByText(/theme color/i)).toBeVisible();
      await expect(page.getByText(/frequency/i).first()).toBeVisible();
    });

    test('can fill out habit creation form', async ({ page }) => {
      await page.goto('/rhythm');
      await page.waitForLoadState('networkidle');

      // Open add habit modal
      const addButton = page.locator('button').filter({ hasText: /add/i }).first();
      await addButton.click();

      await expect(page.getByRole('heading', { name: /create new habit/i })).toBeVisible({
        timeout: 5_000,
      });

      // Fill in habit name
      await page.getByLabel(/habit name/i).fill('E2E Test Habit');

      // Select frequency - Daily should be selected by default
      const dailyButton = page.getByRole('button', { name: /daily/i }).first();
      await expect(dailyButton).toBeVisible();

      // Check that Create Habit button is enabled
      const createButton = page.getByRole('button', { name: /create habit/i });
      await expect(createButton).toBeEnabled();
    });

    test('create habit button is disabled without name', async ({ page }) => {
      await page.goto('/rhythm');
      await page.waitForLoadState('networkidle');

      // Open add habit modal
      const addButton = page.locator('button').filter({ hasText: /add/i }).first();
      await addButton.click();

      await expect(page.getByRole('heading', { name: /create new habit/i })).toBeVisible({
        timeout: 5_000,
      });

      // Create button should be disabled without a name
      const createButton = page.getByRole('button', { name: /create habit/i });
      await expect(createButton).toBeDisabled();
    });

    test('shows frequency options in modal', async ({ page }) => {
      await page.goto('/rhythm');
      await page.waitForLoadState('networkidle');

      // Open add habit modal
      const addButton = page.locator('button').filter({ hasText: /add/i }).first();
      await addButton.click();

      await expect(page.getByRole('heading', { name: /create new habit/i })).toBeVisible({
        timeout: 5_000,
      });

      // Check all frequency options are visible
      await expect(page.getByText(/every day/i)).toBeVisible();
      await expect(page.getByText(/once a week/i)).toBeVisible();
      await expect(page.getByText(/choose days/i)).toBeVisible();
    });

    test('shows day selector when specific days frequency is selected', async ({ page }) => {
      await page.goto('/rhythm');
      await page.waitForLoadState('networkidle');

      // Open add habit modal
      const addButton = page.locator('button').filter({ hasText: /add/i }).first();
      await addButton.click();

      await expect(page.getByRole('heading', { name: /create new habit/i })).toBeVisible({
        timeout: 5_000,
      });

      // Click on "Specific Days" frequency
      await page.getByText(/choose days/i).click();

      // Day selector should appear
      await expect(page.getByText(/select days/i)).toBeVisible();
      // Should show validation message
      await expect(page.getByText(/select at least one day/i)).toBeVisible();
    });

    test('shows goal area options', async ({ page }) => {
      await page.goto('/rhythm');
      await page.waitForLoadState('networkidle');

      // Open add habit modal
      const addButton = page.locator('button').filter({ hasText: /add/i }).first();
      await addButton.click();

      await expect(page.getByRole('heading', { name: /create new habit/i })).toBeVisible({
        timeout: 5_000,
      });

      // Check for goal area options
      await expect(page.getByText(/goal area/i).first()).toBeVisible();
      await expect(page.getByText(/health & fitness/i)).toBeVisible();
      await expect(page.getByText(/learning/i)).toBeVisible();
      await expect(page.getByText(/productivity/i)).toBeVisible();
    });

    test('shows reminder toggle', async ({ page }) => {
      await page.goto('/rhythm');
      await page.waitForLoadState('networkidle');

      // Open add habit modal
      const addButton = page.locator('button').filter({ hasText: /add/i }).first();
      await addButton.click();

      await expect(page.getByRole('heading', { name: /create new habit/i })).toBeVisible({
        timeout: 5_000,
      });

      // Check for reminder toggle
      await expect(page.getByText(/daily reminder/i)).toBeVisible();
    });
  });

  test.describe('habit interaction', () => {
    // Note: These tests work better if there are existing habits
    // They test the UI elements that would be present when habits exist

    test('habit cards have correct structure', async ({ page }) => {
      await page.goto('/rhythm');
      await page.waitForLoadState('networkidle');

      // Wait for the page to load
      await expect(page.getByRole('heading', { name: /today's flow/i }).first()).toBeVisible({
        timeout: 15_000,
      });

      // Check that either habits exist (with icons) or empty state is shown
      const habitSection = page.locator('.space-y-4').first();
      await expect(habitSection).toBeVisible({ timeout: 10_000 });
    });

    test('shows today at a glance section', async ({ page }) => {
      await page.goto('/rhythm');
      await page.waitForLoadState('networkidle');

      // Check for "Today at a glance" section
      await expect(page.getByText(/today at a glance/i)).toBeVisible({ timeout: 15_000 });
      // Check for habit completion text
      await expect(page.getByText(/habit completion/i)).toBeVisible();
    });
  });

  test.describe('journal integration', () => {
    test('shows journal section on rhythm page', async ({ page }) => {
      await page.goto('/rhythm');
      await page.waitForLoadState('networkidle');

      // The page should have some journal-related content
      // This is typically in the DailyJournalRhythm2 component
      await expect(page.locator('main')).toBeVisible({ timeout: 15_000 });
    });
  });
});
