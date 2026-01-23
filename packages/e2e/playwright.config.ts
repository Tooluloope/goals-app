import { defineConfig, devices } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Prefer local env for e2e; fall back to root .env
dotenv.config({ path: path.resolve(__dirname, '..', '..', '.env.local') });
dotenv.config({ path: path.resolve(__dirname, '..', '..', '.env') });

// Default to the Next dev port for this repo (3008); override with E2E_BASE_URL when needed.
const baseURL = process.env.E2E_BASE_URL || 'http://localhost:3008';

export default defineConfig({
  testDir: './tests',
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  reporter: [['list'], ['html', { outputFolder: 'playwright-report' }]],
  use: {
    baseURL,
    trace: 'retain-on-failure',
    video: 'retain-on-failure',
    screenshot: 'only-on-failure',
    storageState: path.resolve(__dirname, 'storageStates/auth.json'),
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 5'] },
    },
  ],
  globalSetup: './global-setup.ts',
});
