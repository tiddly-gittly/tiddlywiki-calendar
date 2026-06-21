import { expect, test } from '@playwright/test';

const openCreateGaugeModal = async (page: import('@playwright/test').Page) => {
  const modalOpened = await page.evaluate(async () => {
    const tw = (window as unknown as Window & {
      $tw: {
        modules: {
          execute: (title: string) => { Modal: new(wiki: unknown) => { display: (title: string) => void } };
        };
        wiki: {
          addTiddler: (fields: Record<string, unknown>) => void;
          getTiddler: (title: string) => { fields?: Record<string, unknown> } | undefined;
        };
      };
    }).$tw;

    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }

    // Prepare the draft tiddler with a template that has targetTiddler field
    tw.wiki.addTiddler({
      title: '$:/temp/visualization-dashboard/new-gauge',
      enabled: 'yes',
      tags: '',
      caption: '',
      description: '',
      template: '$:/plugins/linonetwo/visualization-dashboard/tiddlywiki-ui/Template/BarTagDaysWeek',
      targetTiddler: '',
      targetTiddlerFilter: '',
    });

    const modalModule = tw.modules.execute('$:/core/modules/utils/dom/modal.js');
    const { Modal } = modalModule;
    new Modal(tw.wiki).display('$:/plugins/linonetwo/visualization-dashboard/tiddlywiki-ui/Modal/CreateGaugeModal');

    await new Promise<void>((resolve) =>
      requestAnimationFrame(() => {
        resolve();
      })
    );

    return Boolean(document.querySelector('.tc-modal'));
  });

  expect(modalOpened).toBe(true);
  await expect(page.locator('.tc-modal')).toBeVisible();
};

test.describe('CreateGaugeModal tag picker', () => {
  test('tags field accepts custom non-existent tag via add button', async ({ page }) => {
    await page.goto('/#Index');
    await openCreateGaugeModal(page);

    // Find the "tags" field's tag picker input and add a custom tag
    const tagsField = page.locator('.visualization-dashboard-new-gauge-field').filter({ hasText: '标签' }).first();
    await expect(tagsField).toBeVisible();

    const input = tagsField.locator('input.tc-edit-texteditor.tc-popup-handle');
    const addButton = tagsField.getByRole('button', { name: '添加' });

    await input.fill('CustomAutoTag');
    await addButton.click();

    // Verify the tag label appears in the field
    await expect(tagsField.locator('.tc-tag-label').filter({ hasText: 'CustomAutoTag' })).toBeVisible();

    // Verify the temporary tiddler's tags field contains our value
    const stored = await page.evaluate(() => {
      const tw = (window as unknown as Window & {
        $tw: { wiki: { getTiddler: (title: string) => { fields?: Record<string, unknown> } | undefined } };
      }).$tw;
      return tw.wiki.getTiddler('$:/temp/visualization-dashboard/new-gauge')?.fields?.tags;
    });

    expect(stored).toEqual(['CustomAutoTag']);
  });

  test('targetTiddler field accepts custom non-existent tag via add button', async ({ page }) => {
    await page.goto('/#Index');
    await openCreateGaugeModal(page);

    // Find the "目标条目 / Target tiddler" field
    const targetField = page.locator('.visualization-dashboard-new-gauge-field').filter({ hasText: '目标条目' }).first();
    await expect(targetField).toBeVisible();

    const input = targetField.locator('input.tc-edit-texteditor.tc-popup-handle');
    const addButton = targetField.getByRole('button', { name: '添加' });

    await input.fill('CustomTargetTag');
    await addButton.click();

    // Verify the tag label appears in the field
    await expect(targetField.locator('.tc-tag-label').filter({ hasText: 'CustomTargetTag' })).toBeVisible();

    // Verify the temporary tiddler's targetTiddler field contains our value
    const stored = await page.evaluate(() => {
      const tw = (window as unknown as Window & {
        $tw: { wiki: { getTiddler: (title: string) => { fields?: Record<string, unknown> } | undefined } };
      }).$tw;
      return tw.wiki.getTiddler('$:/temp/visualization-dashboard/new-gauge')?.fields?.targetTiddler;
    });

    expect(stored).toBe('CustomTargetTag');
  });

  test('targetTiddler field persists custom value after second add', async ({ page }) => {
    await page.goto('/#Index');
    await openCreateGaugeModal(page);

    const targetField = page.locator('.visualization-dashboard-new-gauge-field').filter({ hasText: '目标条目' }).first();
    await expect(targetField).toBeVisible();

    const input = targetField.locator('input.tc-edit-texteditor.tc-popup-handle');
    const addButton = targetField.getByRole('button', { name: '添加' });

    // Add first tag
    await input.fill('TagOne');
    await addButton.click();
    await expect(targetField.locator('.tc-tag-label').filter({ hasText: 'TagOne' })).toBeVisible();

    // Add second tag
    await input.fill('TagTwo');
    await addButton.click();
    await expect(targetField.locator('.tc-tag-label').filter({ hasText: 'TagTwo' })).toBeVisible();

    // Both should persist
    const stored = await page.evaluate(() => {
      const tw = (window as unknown as Window & {
        $tw: { wiki: { getTiddler: (title: string) => { fields?: Record<string, unknown> } | undefined } };
      }).$tw;
      return tw.wiki.getTiddler('$:/temp/visualization-dashboard/new-gauge')?.fields?.targetTiddler;
    });

    // targetTiddler stores a space-separated list
    expect(stored).toMatch(/TagOne.*TagTwo/);
  });

  test('template switch renders targetTiddler field and it stays editable', async ({ page }) => {
    await page.goto('/#Index');
    await openCreateGaugeModal(page);

    // Switch to "本周每日标签数" template within the modal
    await page.locator('select.new-gauge-select').selectOption('$:/plugins/linonetwo/visualization-dashboard/tiddlywiki-ui/Template/BarTagDaysWeek');

    // Wait for the modal to re-render after template change
    await page.waitForTimeout(300);

    // Target tiddler field should now be visible (BarTagDaysWeek has targetTiddler)
    const targetField = page.locator('.visualization-dashboard-new-gauge-field').filter({ hasText: '目标条目' });
    await expect(targetField.first()).toBeVisible();

    const input = targetField.first().locator('input.tc-edit-texteditor.tc-popup-handle');

    await input.fill('Sleeping');
    const addButton = targetField.first().getByRole('button', { name: '添加' });
    await addButton.click();

    await expect(targetField.first().locator('.tc-tag-label').filter({ hasText: 'Sleeping' })).toBeVisible();

    // Switch to another template that also has targetTiddler
    await page.locator('select.new-gauge-select').selectOption('$:/plugins/linonetwo/visualization-dashboard/tiddlywiki-ui/Template/LineTagHoursWeek');
    await page.waitForTimeout(300);

    // The value should persist in the temp tiddler
    const stored = await page.evaluate(() => {
      const tw = (window as unknown as Window & {
        $tw: { wiki: { getTiddler: (title: string) => { fields?: Record<string, unknown> } | undefined } };
      }).$tw;
      return tw.wiki.getTiddler('$:/temp/visualization-dashboard/new-gauge')?.fields?.targetTiddler;
    });
    expect(stored).toBe('Sleeping');
  });
});
