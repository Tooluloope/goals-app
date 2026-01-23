import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const credsPath = path.resolve(__dirname, '../storageStates/creds.json');
const hasCreds = fs.existsSync(credsPath);

test.describe('projects page', () => {
  test.skip(!hasCreds, 'Generated creds missing (global-setup should create them)');

  test('loads projects page successfully', async ({ page }) => {
    await page.goto('/projects');
    await page.waitForLoadState('networkidle');
    // Check page loaded with main content
    await expect(page.locator('main')).toBeVisible({ timeout: 15_000 });
    // Verify URL
    await expect(page).toHaveURL(/projects/);
  });

  test('projects page shows heading', async ({ page }) => {
    await page.goto('/projects');
    await page.waitForLoadState('networkidle');
    // Check for heading
    await expect(page.getByRole('heading', { name: /projects/i }).first()).toBeVisible({
      timeout: 15_000,
    });
  });

  test('projects page content renders', async ({ page }) => {
    await page.goto('/projects');
    await page.waitForLoadState('networkidle');
    // Page should have main content area
    await expect(page.locator('main')).toBeVisible({ timeout: 15_000 });
    // Get text content to verify page loaded
    const content = await page.locator('main').textContent();
    expect(content).toBeTruthy();
  });
});
