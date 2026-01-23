import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const credsPath = path.resolve(__dirname, '../storageStates/creds.json');

const hasCreds = fs.existsSync(credsPath);
const creds = hasCreds ? JSON.parse(fs.readFileSync(credsPath, 'utf-8')) : null;

// Basic public checks - run without authentication

test.describe('unauthenticated flows', () => {
  // Clear storage state to run without authentication
  test.use({ storageState: { cookies: [], origins: [] } });

  test('login page renders with form elements', async ({ page }) => {
    await page.goto('/auth/login');
    await page.waitForLoadState('networkidle');
    // Check page rendered with key elements
    await expect(page.getByText(/welcome back/i)).toBeVisible({ timeout: 10_000 });
    await expect(page.getByLabel('Email')).toBeVisible();
    await expect(page.getByLabel('Password')).toBeVisible();
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();
    // Check navigation link to signup exists
    await expect(page.getByRole('link', { name: /sign up/i })).toBeVisible();
  });

  test('signup page renders with form elements', async ({ page }) => {
    await page.goto('/auth/signup');
    await page.waitForLoadState('networkidle');
    // Check page rendered with key elements
    await expect(page.getByLabel('Name')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByLabel('Email')).toBeVisible();
    await expect(page.getByPlaceholder(/create a password/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /create account|sign up/i })).toBeVisible();
    // Check navigation link to login exists
    await expect(page.getByRole('link', { name: /log in|sign in/i })).toBeVisible();
  });

  test('can navigate between login and signup', async ({ page }) => {
    await page.goto('/auth/login');
    await page.waitForLoadState('networkidle');
    await expect(page.getByText(/welcome back/i)).toBeVisible({ timeout: 10_000 });
    // Navigate to signup
    await page.getByRole('link', { name: /sign up/i }).click();
    await page.waitForURL('**/auth/signup');
    await expect(page.getByLabel('Name')).toBeVisible({ timeout: 10_000 });
    // Navigate back to login
    await page.getByRole('link', { name: /log in|sign in/i }).click();
    await page.waitForURL('**/auth/login');
    await expect(page.getByText(/welcome back/i)).toBeVisible({ timeout: 10_000 });
  });

  test('unauthenticated user is redirected to login', async ({ page }) => {
    await page.goto('/dashboard');
    // Should be redirected to login page
    await page.waitForURL('**/auth/login', { timeout: 10_000 });
    await expect(page.getByText(/welcome back/i)).toBeVisible();
  });
});

// Authenticated smoke tests

test.describe('authenticated flows', () => {
  test.skip(!hasCreds, 'No generated creds; global-setup should have created them.');

  test('dashboard loads after login', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    // Look for main content area
    await expect(page.locator('main')).toBeVisible({ timeout: 10_000 });
  });

  test('can navigate to projects page', async ({ page }) => {
    await page.goto('/projects');
    await page.waitForLoadState('networkidle');
    await expect(page.getByRole('heading', { name: /projects/i }).first()).toBeVisible({
      timeout: 10_000,
    });
  });

  test('can navigate to settings page', async ({ page }) => {
    await page.goto('/settings');
    await page.waitForLoadState('networkidle');
    await expect(page.getByRole('heading', { name: /settings/i }).first()).toBeVisible({
      timeout: 10_000,
    });
  });
});
