import { test, expect } from '@playwright/test';

// Covers flow: owner invites a fresh email to family workspace, invitee signs up, and sees family workspace.
test('invitee auto-joins family workspace after signup', async ({ page, browser }, testInfo) => {
  const inviteEmail = `family+${Date.now()}@example.test`;
  const inviteePassword = 'Test1234!';
  const baseURL = testInfo.config.use?.baseURL || 'http://localhost:3008';

  // Owner session (storageState already authenticated via global-setup)
  await page.goto('/settings');
  await page.waitForLoadState('networkidle');

  // Ensure a family workspace exists (create if missing)
  const createFamilyButton = page.getByRole('button', { name: /create family workspace/i });
  if (await createFamilyButton.count()) {
    await createFamilyButton.click();
    await expect(page.getByText(/family workspace created/i)).toBeVisible({ timeout: 15_000 });
  }

  // Capture family workspace name from list
  const familyCard = page.locator('div', { hasText: /family workspace/i }).first();
  const familyName = (
    (await familyCard.locator('p.font-medium').first().textContent()) || ''
  ).trim();

  // Send invite to fresh email
  await page.getByRole('button', { name: /invite to family workspace/i }).click();
  await page.getByLabel(/email address/i).fill(inviteEmail);
  await page.getByRole('button', { name: /send invitation/i }).click();
  await expect(page.getByText(/invitation sent/i)).toBeVisible({ timeout: 15_000 });

  // Invitee signs up in a clean context
  const inviteeContext = await browser.newContext({
    baseURL,
    storageState: { cookies: [], origins: [] },
  });
  const inviteePage = await inviteeContext.newPage();

  await inviteePage.goto('/auth/signup');
  await inviteePage.getByLabel('Name').fill('Family Member');
  await inviteePage.getByLabel('Email').fill(inviteEmail);
  await inviteePage.getByPlaceholder(/create a password/i).fill(inviteePassword);
  const confirmField = inviteePage.getByPlaceholder(/confirm your password/i);
  if (await confirmField.count()) {
    await confirmField.fill(inviteePassword);
  }
  await inviteePage.getByRole('button', { name: /create account|sign up/i }).click();

  await inviteePage.waitForURL('**/dashboard', { timeout: 20_000 });

  // Validate family workspace visible in selector/list
  await inviteePage.goto('/settings');
  await expect(inviteePage.getByText(/family workspace/i)).toBeVisible({ timeout: 10_000 });
  if (familyName) {
    await expect(inviteePage.getByText(familyName)).toBeVisible({ timeout: 10_000 });
  }

  await inviteeContext.close();
});
