import { expect, test } from '@playwright/test';

test('event preview does not crash when text field is missing', async ({ page }) => {
  const substringErrors: string[] = [];
  page.on('pageerror', (error) => {
    if (error.message.includes('substring')) {
      substringErrors.push(error.message);
    }
  });

  const title = 'Preview Without Text Field';

  await page.goto('/#Index');
  await page.evaluate((eventTitle) => {
    const tw = (window as unknown as Window & {
      $tw: {
        utils: {
          stringifyDate: (date: Date) => string;
        };
        wiki: {
          addTiddler: (fields: Record<string, unknown>) => void;
        };
      };
    }).$tw;

    const start = new Date();
    start.setMinutes(0, 0, 0);
    start.setHours(start.getHours() + 1);
    const end = new Date(start.getTime() + 60 * 60 * 1000);

    tw.wiki.addTiddler({
      title: eventTitle,
      caption: eventTitle,
      startDate: tw.utils.stringifyDate(start),
      endDate: tw.utils.stringifyDate(end),
      calendarEntry: 'yes',
      tags: [],
    });
  }, title);

  await page.evaluate(() => {
    const tw = (window as unknown as Window & {
      $tw: {
        wiki: {
          addTiddler: (fields: Record<string, unknown>) => void;
        };
      };
    }).$tw;

    tw.wiki.addTiddler({
      title: '$:/layout',
      text: '$:/plugins/linonetwo/tw-calendar/tiddlywiki-ui/PageLayout/EventsCalendarLayout',
    });
  });
  await expect(page.locator('.fc-timegrid-col').first()).toBeVisible();
  await expect(page.getByText(title).first()).toBeVisible();
  await expect.poll(() => substringErrors, { timeout: 5_000 }).toEqual([]);
});
