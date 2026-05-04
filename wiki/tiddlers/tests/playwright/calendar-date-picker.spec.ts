import { test, expect } from '@playwright/test';

test('Toolbar title contains date picker and allows changing date', async ({ page }) => {
  await page.goto('/#CalendarUserManual');

  const titleButton = page.locator('.fc-toolbar-title').first();
  await expect(titleButton).toBeVisible();

  await expect.poll(async () => page.evaluate(() => document.querySelectorAll('.fc-toolbar-title .tw-calendar-date-picker-hidden').length)).toBe(1);

  await page.evaluate(() => {
    const input = document.querySelector<HTMLInputElement>('.fc-toolbar-title .tw-calendar-date-picker-hidden');
    if (!input) {
      throw new Error('Date picker input not found');
    }
    input.value = '2023-08-15';
    input.dispatchEvent(new Event('change', { bubbles: true }));
  });

  await expect(titleButton).toContainText(/2023/);
  await expect(titleButton).toContainText(/8|08|Aug/);
});