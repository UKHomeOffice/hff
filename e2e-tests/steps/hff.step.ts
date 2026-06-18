import { expect } from '@playwright/test';
import { createBdd } from 'playwright-bdd';
import { test } from '../fixture/fixtures';

export const { Given, When, Then } = createBdd(test);

Given('I visit the feedback page', async ({ page }) => {
  await page.goto('/');
});

When('I choose to select {string} on the feedback page', async ({ page }, option: string) => {
  if (!option?.trim()) {
    return;
  }

  await page.getByLabel(option.trim(), { exact: true }).check();
});

When('I enter {string} in the How could we improve this form field', async ({ page }, text: string) => {
  const improvementsField = page.getByLabel('How could we improve this form? (Optional)', { exact: true });
  await improvementsField.fill(text || '');
});

When('I choose to send feedback', async ({ page }) => {
  await page.getByRole('button', { name: 'Send feedback', exact: true }).click();
});

Then('I should see the {string} page', async ({ page }, expectedPageName: string) => {
  await expect(page).toHaveURL(/\/feedback-sent$/);
  await expect(page).toHaveTitle(new RegExp(expectedPageName, 'i'));
});

Then('{string} link is displayed', async ({ page }, linkText: string) => {
  await expect(page.getByRole('link', { name: linkText, exact: true })).toBeVisible();
});
