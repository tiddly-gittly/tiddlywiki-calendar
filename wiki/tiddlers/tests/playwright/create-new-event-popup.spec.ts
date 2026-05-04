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
};

const openEventCalendarLayout = async (page: import('@playwright/test').Page) => {
  await page.goto('/#Index');
  await showEventCalendarLayout(page);
};

const getDisplayedCalendarDate = async (page: import('@playwright/test').Page) =>
  page.locator('.fc-timegrid-col[data-date]').first().getAttribute('data-date');

const openCreateEventPopup = async (page: import('@playwright/test').Page) => {
  const popupCreated = await page.evaluate(async () => {
    const tw = (window as unknown as Window & {
      $tw: {
        modules: {
          execute: (title: string) => { Modal: new(wiki: unknown) => { display: (title: string) => void } };
        };
        wiki: {
          addTiddler: (fields: Record<string, unknown>) => void;
        };
      };
    }).$tw;
    const modalModule = tw.modules.execute('$:/core/modules/utils/dom/modal.js');
    const { Modal } = modalModule;

    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }

    tw.wiki.addTiddler({
      title: '$:/state/Calendar/PageLayout/create-tiddler-caption',
      text: '',
    });
    tw.wiki.addTiddler({
      title: '$:/state/Calendar/PageLayout/create-tiddler',
      startDate: '20260428090000000',
      endDate: '20260428100000000',
      calendarEntry: 'yes',
      _is_titleless: 'yes',
      'draft.title': 'Test Event',
      text: '',
      tags: [],
      rrule: '',
    });

    new Modal(tw.wiki).display('$:/plugins/linonetwo/tw-calendar/calendar-widget/tiddlywiki-ui/popup/CreateNewTiddlerPopup');
    document.querySelector<HTMLInputElement>('.tw-calendar-layout-create-new-tiddler-popup .tw-calendar-caption-input')?.focus();
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
    return Boolean(document.querySelector('.tw-calendar-caption-input'));
  });
  expect(popupCreated).toBe(true);
  await expect(page.locator('.tw-calendar-caption-input')).toBeVisible();
};

const readDraftField = async (page: import('@playwright/test').Page, field: string) =>
  page.evaluate((name) => {
    const tw = (window as unknown as Window & {
      $tw: {
        wiki: {
          getTiddler: (title: string) => { fields?: Record<string, string> } | undefined;
        };
      };
    }).$tw;
    return tw.wiki.getTiddler('$:/state/Calendar/PageLayout/create-tiddler')?.fields?.[name] ?? '';
  }, field);

const readTiddlerField = async (page: import('@playwright/test').Page, title: string, field: string) =>
  page.evaluate(({ tiddlerTitle, fieldName }) => {
    const tw = (window as unknown as Window & {
      $tw: {
        wiki: {
          getTiddler: (title: string) => { fields?: Record<string, string> } | undefined;
        };
      };
    }).$tw;
    return tw.wiki.getTiddler(tiddlerTitle)?.fields?.[fieldName] ?? '';
  }, { tiddlerTitle: title, fieldName: field });

test('new event popup autofocuses caption after drag create', async ({ page }) => {
  await openEventCalendarLayout(page);
  await openCreateEventPopup(page);

  const captionInput = page.locator('.tw-calendar-caption-input');
  await expect(captionInput).toBeVisible();
  await expect(captionInput).toBeFocused();
});

test('recurrence quick actions apply COUNT and UNTIL rules', async ({ page }) => {
  await openEventCalendarLayout(page);
  await openCreateEventPopup(page);

  await page.getByRole('button', { name: '不重复' }).click();
  await page.getByRole('button', { name: '每日' }).click();

  await expect.poll(async () => readDraftField(page, 'rrule')).toBe('FREQ=DAILY');

  const intervalSection = page.locator('.tw-calendar-recurrence-interval');
  const intervalInput = intervalSection.locator('input.tc-edit-texteditor');
  await intervalInput.fill('4');
  await intervalSection.getByRole('button', { name: '应用', exact: true }).click();
  await expect.poll(async () => readDraftField(page, 'rrule')).toMatch(/INTERVAL=4/);

  const countInput = page.locator('.tw-calendar-recurrence-count input.tc-edit-texteditor');
  await expect(countInput).toBeVisible();
  await countInput.fill('3');
  await page.getByRole('button', { name: '应用次数' }).click();
  await expect.poll(async () => readDraftField(page, 'rrule')).toMatch(/COUNT=3/);

  await page.getByRole('button', { name: '循环到本次为止' }).click();
  await expect.poll(async () => readDraftField(page, 'rrule')).toMatch(/UNTIL=/);
  await expect.poll(async () => readDraftField(page, 'rrule')).not.toMatch(/COUNT=3/);

  await expect(page.locator('.tw-calendar-recurrence-human-summary')).toContainText('每 4 天');
  await expect(page.locator('.tw-calendar-recurrence-human-summary')).toContainText('直到');

  await expect(page.locator('.tw-calendar-recurrence-raw-input')).toHaveCount(0);
  await page.getByRole('button', { name: '高级' }).click();
  await expect(page.locator('.tw-calendar-recurrence-raw-input')).toBeVisible();
  await expect(page.locator('.tw-calendar-recurrence-raw-input')).toHaveValue(/UNTIL=/);
});

test('until current occurrence uses clicked recurring instance time', async ({ page }) => {
  const recurringTitle = 'Recurring Preview Test Event';

  await page.goto('/#Index');
  await page.evaluate((title) => {
    const tw = (window as unknown as Window & {
      $tw: {
        wiki: {
          addTiddler: (fields: Record<string, unknown>) => void;
        };
      };
    }).$tw;

    tw.wiki.addTiddler({
      title,
      caption: title,
      startDate: '20260401120000000',
      endDate: '20260401130000000',
      calendarEntry: 'yes',
      rrule: 'FREQ=DAILY',
      text: '',
      tags: [],
    });
  }, recurringTitle);

  await showEventCalendarLayout(page);
  await page.locator('.fc-timeGridDay-button').click();
  const occurrenceDate = (await getDisplayedCalendarDate(page))?.replaceAll('-', '');
  expect(occurrenceDate).toBeTruthy();
  await expect(page.getByText(recurringTitle).first()).toBeVisible();
  await page.getByText(recurringTitle).first().click();

  await page.getByRole('button', { name: '循环到本次为止' }).click();
  await expect.poll(async () => readTiddlerField(page, recurringTitle, 'rrule')).toMatch(/UNTIL=/);
  await expect.poll(async () => readTiddlerField(page, recurringTitle, 'rrule')).toContain(occurrenceDate ?? '');
});

test('existing recurring event pre-fills interval and count from rrule', async ({ page }) => {
  const recurringTitle = 'Recurring Existing Rule Event';

  await page.goto('/#Index');
  await page.evaluate((title) => {
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

    tw.wiki.addTiddler({
      title,
      caption: title,
      startDate: tw.utils.stringifyDate(start),
      endDate: tw.utils.stringifyDate(end),
      calendarEntry: 'yes',
      rrule: 'FREQ=DAILY;INTERVAL=4;COUNT=7',
      text: '',
      tags: [],
    });
  }, recurringTitle);

  await showEventCalendarLayout(page);
  await page.locator('.fc-timeGridDay-button').click();
  await expect(page.getByText(recurringTitle).first()).toBeVisible();
  await page.getByText(recurringTitle).first().click();

  await expect(page.locator('.tw-calendar-recurrence-interval input.tc-edit-texteditor')).toHaveValue('4');
  await expect(page.locator('.tw-calendar-recurrence-count input.tc-edit-texteditor')).toHaveValue('7');
  await expect.poll(async () => readTiddlerField(page, recurringTitle, 'rrule-interval')).toBe('');
  await expect.poll(async () => readTiddlerField(page, recurringTitle, 'rrule-count')).toBe('');
});
