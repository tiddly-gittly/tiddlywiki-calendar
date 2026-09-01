import { expect, test } from '@playwright/test';

const showEventCalendarLayout = async (page: import('@playwright/test').Page) => {
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
  await page.locator('.fc-timeGridDay-button').click();
};

test('only tentative calendar entries are outlined in grid and list views', async ({ page }) => {
  const titles = {
    tentative: 'Tentative Rendering Test',
    confirmed: 'Confirmed Rendering Test',
    unrelated: 'Unrelated Tentative Status Test',
  };

  await page.goto('/#Index');
  await page.evaluate((eventTitles) => {
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
    start.setHours(12, 0, 0, 0);
    const end = new Date(start.getTime() + 60 * 60 * 1000);
    const dateFields = {
      startDate: tw.utils.stringifyDate(start),
      endDate: tw.utils.stringifyDate(end),
      text: '',
      tags: [],
    };

    tw.wiki.addTiddler({ ...dateFields, title: eventTitles.tentative, calendarEntry: 'yes', status: 'tentative' });
    // Status values are deliberately case-sensitive so unrelated conventions do not leak in.
    tw.wiki.addTiddler({ ...dateFields, title: eventTitles.confirmed, calendarEntry: 'yes', status: 'Tentative' });
    // A generic tiddler can independently use `status: tentative`; it must not inherit calendar semantics.
    tw.wiki.addTiddler({ ...dateFields, title: eventTitles.unrelated, status: 'tentative' });
  }, titles);

  await showEventCalendarLayout(page);

  const tentativeGridEvent = page.locator('.fc-event').filter({ hasText: titles.tentative }).first();
  await expect(tentativeGridEvent).toBeVisible();
  await expect(tentativeGridEvent).toHaveClass(/\btw-calendar-event-tentative\b/);
  await expect(page.locator('.fc-event').filter({ hasText: titles.confirmed }).first()).not.toHaveClass(/\btw-calendar-event-tentative\b/);
  await expect(page.locator('.fc-event').filter({ hasText: titles.unrelated })).toHaveCount(0);
  await expect.poll(() => tentativeGridEvent.evaluate((element) => getComputedStyle(element).borderTopStyle)).toBe('dashed');

  await page.locator('.fc-listWeek-button').click();
  const tentativeListEvent = page.locator('.fc-list-event').filter({ hasText: titles.tentative }).first();
  await expect(tentativeListEvent).toBeVisible();
  await expect(tentativeListEvent).toHaveClass(/\btw-calendar-event-tentative\b/);
  await expect.poll(() => tentativeListEvent.locator('td').first().evaluate((element) => getComputedStyle(element).borderTopStyle)).toBe('dashed');
});

test('confirming a recurring tentative event refreshes an occurrence in the active view', async ({ page }) => {
  const title = 'Recurring Tentative Refresh Test';

  await page.goto('/#Index');
  await page.evaluate((eventTitle) => {
    const tw = (window as unknown as Window & {
      $tw: {
        wiki: {
          addTiddler: (fields: Record<string, unknown>) => void;
        };
      };
    }).$tw;

    tw.wiki.addTiddler({
      title: eventTitle,
      startDate: '20260401120000000',
      endDate: '20260401130000000',
      calendarEntry: 'yes',
      status: 'tentative',
      rrule: 'FREQ=DAILY',
      text: '',
      tags: [],
    });
  }, title);

  await showEventCalendarLayout(page);
  const occurrence = page.locator('.fc-event').filter({ hasText: title }).first();
  await expect(occurrence).toBeVisible();
  await expect(occurrence).toHaveClass(/\btw-calendar-event-tentative\b/);

  await page.evaluate((eventTitle) => {
    const tw = (window as unknown as Window & {
      $tw: {
        wiki: {
          addTiddler: (fields: Record<string, unknown>) => void;
          getTiddler: (title: string) => { fields: Record<string, unknown> } | undefined;
        };
      };
    }).$tw;
    const existing = tw.wiki.getTiddler(eventTitle);
    if (existing === undefined) throw new Error('Recurring test event not found');
    const { status: _status, ...confirmedFields } = existing.fields;
    tw.wiki.addTiddler({ ...confirmedFields, modified: new Date() });
  }, title);

  await expect(occurrence).not.toHaveClass(/\btw-calendar-event-tentative\b/);
});

test('confirming a future all-day event refreshes at the active view boundary', async ({ page }) => {
  const title = 'Future All Day Tentative Refresh Test';

  await page.goto('/#Index');
  await page.evaluate((eventTitle) => {
    const tw = (window as unknown as Window & {
      $tw: { utils: { stringifyDate: (date: Date) => string }; wiki: { addTiddler: (fields: Record<string, unknown>) => void } };
    }).$tw;
    const start = new Date();
    start.setDate(start.getDate() + 1);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);
    tw.wiki.addTiddler({
      title: eventTitle,
      startDate: tw.utils.stringifyDate(start),
      endDate: tw.utils.stringifyDate(end),
      calendarEntry: 'yes',
      status: 'tentative',
      text: '',
      tags: [],
    });
  }, title);

  await showEventCalendarLayout(page);
  await page.locator('.fc-next-button').click();
  const event = page.locator('.fc-event').filter({ hasText: title }).first();
  await expect(event).toHaveClass(/\btw-calendar-event-tentative\b/);

  await page.evaluate((eventTitle) => {
    const tw = (window as unknown as Window & {
      $tw: { wiki: { addTiddler: (fields: Record<string, unknown>) => void; getTiddler: (title: string) => { fields: Record<string, unknown> } | undefined } };
    }).$tw;
    const existing = tw.wiki.getTiddler(eventTitle);
    if (existing === undefined) throw new Error('All-day test event not found');
    const { status: _status, ...confirmedFields } = existing.fields;
    tw.wiki.addTiddler({ ...confirmedFields, modified: new Date() });
  }, title);

  await expect(event).not.toHaveClass(/\btw-calendar-event-tentative\b/);
});
