import { test, expect } from '@playwright/test';

test('Toolbar title contains date picker and allows changing date', async ({ page }) => {
  // Wait for the wiki to load and Calendar widget to render
  await page.goto('/#CalendarUserManual');
  
  const titleButton = page.locator('.fc-toolbar-title').first();
  await expect(titleButton).toBeVisible();

  // Ensure title receives click without throwing
  await titleButton.click();

  // Simulate user changing date by evaluating the hidden input
  await titleButton.evaluate((titleEl: HTMLElement) => {
    const input = titleEl.querySelector<HTMLInputElement>('.tw-calendar-date-picker-hidden');
    if (input) {
      input.value = '2023-08-15';
      input.dispatchEvent(new Event('change', { bubbles: true }));
    }
  });

  // Assert the calendar navigated to that date and re-rendered the title
  await expect(titleButton).toContainText(/2023/);
  await expect(titleButton).toContainText(/0?8/); // month is August (8)
});