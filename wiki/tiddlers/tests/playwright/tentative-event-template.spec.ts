import { expect, test } from '@playwright/test';

const draftTitle = '$:/state/Calendar/PageLayout/create-tiddler';

const readDraftStatus = (page: import('@playwright/test').Page) =>
  page.evaluate((title) => {
    const tw = (window as unknown as Window & {
      $tw: {
        wiki: {
          getTiddler: (tiddlerTitle: string) => { fields?: Record<string, string> } | undefined;
        };
      };
    }).$tw;
    return tw.wiki.getTiddler(title)?.fields?.status ?? '';
  }, draftTitle);

const openCreateEventPopup = async (page: import('@playwright/test').Page, calendarEntry = 'yes') => {
  await page.goto('/#Index');
  await page.evaluate(({ draftTiddlerTitle, isCalendarEntry }) => {
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

    tw.wiki.addTiddler({
      title: '$:/state/Calendar/PageLayout/create-tiddler-caption',
      text: '',
    });
    tw.wiki.addTiddler({
      title: draftTiddlerTitle,
      startDate: '20260901090000000',
      endDate: '20260901100000000',
      calendarEntry: isCalendarEntry,
      'draft.title': 'Tentative event test',
      text: '',
      tags: [],
    });

    const { Modal } = tw.modules.execute('$:/core/modules/utils/dom/modal.js');
    new Modal(tw.wiki).display('$:/plugins/linonetwo/tw-calendar/calendar-widget/tiddlywiki-ui/popup/CreateNewTiddlerPopup');
  }, { draftTiddlerTitle: draftTitle, isCalendarEntry: calendarEntry });

  await expect(page.locator('.tw-calendar-layout-create-new-tiddler-popup')).toBeVisible();
  await page.locator('.tw-calendar-layout-form-more-settings .tw-calendar-details-summary').first().click();
};

test('tentative status can be set and removed from a new calendar event', async ({ page }) => {
  await openCreateEventPopup(page);

  const control = page.locator('.tw-calendar-more-settings-wrapper .tw-calendar-tentative-control');
  await expect(control).toBeVisible();
  await expect.poll(() => readDraftStatus(page)).toBe('');

  await control.locator('.tw-calendar-tentative-control-mark').click();
  await expect.poll(() => readDraftStatus(page)).toBe('tentative');
  await expect(control.locator('.tw-calendar-tentative-control-state--tentative')).toBeVisible();

  await control.locator('.tw-calendar-tentative-control-confirm').click();
  await expect.poll(() => readDraftStatus(page)).toBe('');
  await expect(control.locator('.tw-calendar-tentative-control-state--confirmed')).toBeVisible();
});

test('tentative status control is scoped to calendar entries', async ({ page }) => {
  await openCreateEventPopup(page, 'no');

  await expect(page.locator('.tw-calendar-more-settings-wrapper .tw-calendar-tentative-control')).toHaveCount(0);
});

test('creating a tentative event preserves its status but clears the reusable draft', async ({ page }) => {
  await openCreateEventPopup(page);
  await page.locator('.tw-calendar-tentative-control-mark').click();
  await page.locator('.tw-calendar-footer-button-create').click();

  await expect.poll(() => readDraftStatus(page)).toBe('');
  await expect.poll(() =>
    page.evaluate(() => {
      const tw = (window as unknown as Window & { $tw: { wiki: { getTiddler: (title: string) => { fields?: Record<string, string> } | undefined } } }).$tw;
      return tw.wiki.getTiddler('Tentative event test')?.fields?.status ?? '';
    })
  ).toBe('tentative');
});
