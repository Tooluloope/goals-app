import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const credsPath = path.resolve(__dirname, '../storageStates/creds.json');
const hasCreds = fs.existsSync(credsPath);

test.describe('AI studio', () => {
  test.skip(!hasCreds, 'Generated creds missing (global-setup should create them)');

  test('AI page loads and shows insight prompts', async ({ page }) => {
    await page.goto('/ai');
    await page.waitForLoadState('networkidle');
    // Look for heading in main content area (works on desktop and mobile)
    await expect(page.getByRole('heading', { name: /AI Assistant/i }).first()).toBeVisible({
      timeout: 15_000,
    });
    await expect(
      page.getByRole('button', { name: /start|new chat|new insight|create/i }).first()
    ).toBeVisible({ timeout: 15_000 });
  });
});
