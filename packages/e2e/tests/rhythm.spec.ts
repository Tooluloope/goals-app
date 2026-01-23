import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const credsPath = path.resolve(__dirname, '../storageStates/creds.json');
const hasCreds = fs.existsSync(credsPath);

test.describe('rhythm page', () => {
  test.skip(!hasCreds, 'Generated creds missing (global-setup should create them)');

  test('loads rhythm page and shows habit tracker shell', async ({ page }) => {
    await page.goto('/rhythm');
    await page.waitForLoadState('networkidle');
    // Look for heading in main content area (works on desktop and mobile)
    await expect(page.getByRole('heading', { name: /today's flow/i }).first()).toBeVisible({
      timeout: 15_000,
    });
    await expect(
      page.getByText(/habits complete|daily goals|habit pulse|add your first habit/i).first()
    ).toBeVisible({ timeout: 15_000 });
  });
});
