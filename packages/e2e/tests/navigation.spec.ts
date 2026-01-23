import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const credsPath = path.resolve(__dirname, '../storageStates/creds.json');
const hasCreds = fs.existsSync(credsPath);

test.describe('navigation', () => {
  test.skip(!hasCreds, 'Generated creds missing (global-setup should create them)');

  test('dashboard page loads', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('main')).toBeVisible({ timeout: 15_000 });
    await expect(page).toHaveURL(/dashboard/);
  });

  test('projects page loads', async ({ page }) => {
    await page.goto('/projects');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('main')).toBeVisible({ timeout: 15_000 });
    await expect(page).toHaveURL(/projects/);
  });

  test('rhythm page loads', async ({ page }) => {
    await page.goto('/rhythm');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('main')).toBeVisible({ timeout: 15_000 });
    await expect(page).toHaveURL(/rhythm/);
  });

  test('ai page loads', async ({ page }) => {
    await page.goto('/ai');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('main')).toBeVisible({ timeout: 15_000 });
    await expect(page).toHaveURL(/ai/);
  });

  test('settings page loads', async ({ page }) => {
    await page.goto('/settings');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('main')).toBeVisible({ timeout: 15_000 });
    await expect(page).toHaveURL(/settings/);
  });

  test('habits page loads', async ({ page }) => {
    await page.goto('/habits');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('main')).toBeVisible({ timeout: 15_000 });
    await expect(page).toHaveURL(/habits/);
  });

  test('calendar page loads', async ({ page }) => {
    await page.goto('/calendar');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('main')).toBeVisible({ timeout: 15_000 });
    await expect(page).toHaveURL(/calendar/);
  });
});
