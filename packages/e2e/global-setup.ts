import { chromium } from '@playwright/test';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const statePath = path.resolve(__dirname, 'storageStates/auth.json');
const credsPath = path.resolve(__dirname, 'storageStates/creds.json');

function ensureDirs() {
  fs.mkdirSync(path.dirname(statePath), { recursive: true });
}

// Create a throwaway user via the signup flow using random creds, store auth + creds to disk for tests.
export default async function globalSetup() {
  ensureDirs();

  // Align with local dev port; can override with E2E_BASE_URL
  const baseURL = process.env.E2E_BASE_URL || 'http://localhost:3008';
  const email = process.env.E2E_USER_EMAIL || `e2e+${Date.now()}@example.test`;
  const password = process.env.E2E_USER_PASSWORD || 'Test1234!';
  const name = 'E2E User';

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ baseURL });

  // If env creds provided, attempt login; otherwise sign up a fresh account.
  const useExisting = !!process.env.E2E_USER_EMAIL && !!process.env.E2E_USER_PASSWORD;

  if (useExisting) {
    await page.goto('/auth/login');
    await page.getByLabel('Email').fill(email);
    await page.getByLabel('Password').fill(password);
    await page.getByRole('button', { name: /log in/i }).click();
  } else {
    await page.goto('/auth/signup');
    await page.getByLabel('Name').fill(name);
    await page.getByLabel('Email').fill(email);
    // Avoid strict-mode clashes by targeting placeholders
    await page.getByPlaceholder('Create a password').fill(password);
    const confirm = page.getByPlaceholder('Confirm your password');
    if (await confirm.count()) {
      await confirm.fill(password);
    }
    // Timezone may be optional; ignore if not present
    const timezoneInput = page.getByLabel(/timezone/i);
    if (await timezoneInput.count().then(Boolean)) {
      await timezoneInput.fill('UTC');
    }
    await page.getByRole('button', { name: /create account|sign up/i }).click();
  }

  await page.waitForURL('**/dashboard', { timeout: 20_000 }).catch(() => {});

  await page.context().storageState({ path: statePath });
  fs.writeFileSync(
    credsPath,
    JSON.stringify(
      {
        email,
        password,
        baseURL,
        generated: !useExisting,
        createdAt: new Date().toISOString(),
      },
      null,
      2
    )
  );

  await browser.close();
}
