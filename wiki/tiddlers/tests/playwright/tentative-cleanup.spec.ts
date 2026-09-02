import { expect, test } from '@playwright/test';

const stateTitle = '$:/temp/tw-calendar/tentative-cleanup';
const modalTitle = '$:/plugins/linonetwo/tw-calendar/tiddlywiki-ui/popup/TentativeCleanup/Modal';

test.beforeEach(async ({ page }) => {
  await page.goto('/#Index');
  await page.evaluate(
    ({ modal, state }) => {
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

      const commonFields = {
        calendarEntry: 'yes',
        status: 'tentative',
        startDate: '20260901090000000',
        endDate: '20260901100000000',
        text: '',
      };
      tw.wiki.addTiddler({ title: 'Tentative Alpha', caption: 'Alpha plan', tags: ['Work'], ...commonFields });
      tw.wiki.addTiddler({ title: 'Tentative Beta', caption: 'Beta plan', ...commonFields });
      tw.wiki.addTiddler({ title: 'Confirmed Event', calendarEntry: 'yes', startDate: commonFields.startDate, text: '' });
      tw.wiki.addTiddler({ title: 'Draft Tentative', 'draft.of': 'Tentative Alpha', ...commonFields });
      tw.wiki.addTiddler({ title: '$:/System Tentative', ...commonFields });
      tw.wiki.addTiddler({ title: state, selection: '', preview: 'Tentative Alpha' });

      const { Modal } = tw.modules.execute('$:/core/modules/utils/dom/modal.js');
      new Modal(tw.wiki).display(modal);
    },
    { modal: modalTitle, state: stateTitle },
  );
  await expect(page.locator('.tw-calendar-tentative-cleanup-modal .tc-modal')).toBeVisible();
});

const readTiddlerFields = async (page: import('@playwright/test').Page, title: string) =>
  page.evaluate((tiddlerTitle) => {
    const tw = (window as unknown as Window & {
      $tw: {
        wiki: {
          getTiddler: (title: string) => { fields?: Record<string, unknown> } | undefined;
        };
      };
    }).$tw;
    return tw.wiki.getTiddler(tiddlerTitle)?.fields ?? null;
  }, title);

test('filters candidates and keeps preview independent from checkbox selection', async ({ page }) => {
  const rows = page.locator('.tw-calendar-tentative-cleanup-row');
  await expect(rows).toHaveCount(2);
  await expect(rows.getByText('Alpha plan', { exact: true })).toBeVisible();
  await expect(rows.getByText('Beta plan', { exact: true })).toBeVisible();
  await expect(rows.getByText('Confirmed Event', { exact: true })).toHaveCount(0);
  await expect(rows.getByText('Draft Tentative', { exact: true })).toHaveCount(0);
  await expect(rows.getByText('$:/System Tentative', { exact: true })).toHaveCount(0);

  await expect(page.locator('.tw-calendar-tentative-cleanup-preview-title')).toContainText('Alpha plan');
  await rows.filter({ hasText: 'Beta plan' }).locator('.tw-calendar-tentative-cleanup-row-button').click();
  await expect(page.locator('.tw-calendar-tentative-cleanup-preview-title')).toContainText('Beta plan');
  expect((await readTiddlerFields(page, stateTitle))?.selection).toBe('');

  await rows.filter({ hasText: 'Alpha plan' }).locator('input[type="checkbox"]').check();
  await expect(page.locator('.tw-calendar-tentative-cleanup-preview-title')).toContainText('Beta plan');
  expect((await readTiddlerFields(page, stateTitle))?.selection).toBe('[[Tentative Alpha]]');
});

test('supports select all, clear selection, batch delete, and state cleanup', async ({ page }) => {
  const toolbarButtons = page.locator('.tw-calendar-tentative-cleanup-toolbar button');
  const deleteButton = page.locator('.tw-calendar-tentative-cleanup-delete');

  await expect(deleteButton).toBeDisabled();
  await toolbarButtons.nth(0).click();
  expect((await readTiddlerFields(page, stateTitle))?.selection).toBe('[[Tentative Alpha]] [[Tentative Beta]]');
  await expect(page.locator('.tw-calendar-tentative-cleanup-row input[type="checkbox"]:checked')).toHaveCount(2);
  await expect(deleteButton).toBeEnabled();

  await toolbarButtons.nth(1).click();
  await expect(page.locator('.tw-calendar-tentative-cleanup-row input[type="checkbox"]:checked')).toHaveCount(0);
  await expect(deleteButton).toBeDisabled();

  const alphaRow = page.locator('.tw-calendar-tentative-cleanup-row').filter({ hasText: 'Alpha plan' });
  await alphaRow.locator('input[type="checkbox"]').check();
  // A stale or externally modified temp selection must never widen the deletion scope.
  await page.evaluate((state) => {
    const tw = (window as unknown as Window & { $tw: { wiki: { setText: (title: string, field: string, index: undefined, value: string) => void } } }).$tw;
    tw.wiki.setText(state, 'selection', undefined, '[[Tentative Alpha]] [[Confirmed Event]]');
  }, stateTitle);
  await expect(deleteButton).toContainText('1');
  await deleteButton.click();

  await expect(page.locator('.tw-calendar-tentative-cleanup-row')).toHaveCount(1);
  await expect(page.locator('.tw-calendar-tentative-cleanup-preview-title')).toContainText('Beta plan');
  expect(await readTiddlerFields(page, 'Tentative Alpha')).toBeNull();
  expect(await readTiddlerFields(page, 'Tentative Beta')).not.toBeNull();
  expect(await readTiddlerFields(page, 'Confirmed Event')).not.toBeNull();
  expect((await readTiddlerFields(page, stateTitle))?.selection).toBe('');
  expect((await readTiddlerFields(page, stateTitle))?.preview).toBe('Tentative Beta');

  await page.locator('.tc-modal-footer button').last().click();
  await expect(page.locator('.tw-calendar-tentative-cleanup-modal .tc-modal')).toHaveCount(0);
  expect(await readTiddlerFields(page, stateTitle)).toBeNull();
});
