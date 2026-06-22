import { expect, test } from '@playwright/test';

const VISUALIZATION_DASHBOARD_LAYOUT = '$:/plugins/linonetwo/visualization-dashboard/tiddlywiki-ui/PageLayout/VisualizationDashboardLayout';
const CREATE_GAUGE_MODAL = '$:/plugins/linonetwo/visualization-dashboard/tiddlywiki-ui/Modal/CreateGaugeModal';
const DRAFT_TIDDLER = '$:/temp/visualization-dashboard/new-gauge';

/**
 * Gets the current value of a field from the draft tiddler via $tw.wiki.
 */
const getDraftField = (page: import('@playwright/test').Page, field: string) =>
  page.evaluate(
    ({ title, fieldName }) => {
      const tw = (window as unknown as { $tw: { wiki: { getTiddler: (t: string) => { fields: Record<string, unknown> } | null } } }).$tw;
      return tw.wiki.getTiddler(title)?.fields?.[fieldName] ?? null;
    },
    { title: DRAFT_TIDDLER, fieldName: field },
  );

/**
 * Clicks the "创建仪表" button on the visualization dashboard layout,
 * then selects a gauge template from the dropdown.
 */
const openCreateGaugeModal = async (page: import('@playwright/test').Page, template?: string) => {
  // Navigate to the visualization dashboard layout
  await page.goto(`/#${encodeURIComponent(VISUALIZATION_DASHBOARD_LAYOUT)}`);

  // Wait for the layout to render
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(500);

  // Click the "创建仪表" button
  await page.getByRole('button', { name: '创建仪表' }).click();
  await page.waitForTimeout(300);

  // Wait for modal
  await expect(page.locator('.tc-modal')).toBeVisible({ timeout: 5000 });

  if (template) {
    // Select the template from the dropdown
    await page.locator('select.new-gauge-select').selectOption(template);
    await page.waitForTimeout(500);
  }
};

test.describe('CreateGaugeModal tag picker', () => {
  test('目标条目 tag-picker shows suggestions (not "找不到标签")', async ({ page }) => {
    await openCreateGaugeModal(page, '$:/plugins/linonetwo/visualization-dashboard/tiddlywiki-ui/Template/BarTagDaysWeek');

    // The 目标条目 field should be visible
    const targetField = page.locator('.visualization-dashboard-new-gauge-field').filter({ hasText: '目标条目' });
    await expect(targetField.first()).toBeVisible();

    // The tag picker input should exist
    const input = targetField.first().locator('input');
    await expect(input).toBeVisible();

    // Open the dropdown by clicking the dropdown button
    const dropdownBtn = targetField.first().locator('button[aria-label="标签清单"]');
    await dropdownBtn.click();
    await page.waitForTimeout(200);

    // The dropdown should contain actual tiddler suggestions, not "找不到标签"
    const dropdown = targetField.first().locator('.tc-block-dropdown');
    await expect(dropdown).toBeVisible();
    const dropdownText = await dropdown.innerText();
    expect(dropdownText).not.toContain('找不到标签');
    // Should list actual tiddlers/tags
    expect(dropdownText.length).toBeGreaterThan(5);
  });

  test('目标条目 field accepts custom tiddler via add button', async ({ page }) => {
    await openCreateGaugeModal(page, '$:/plugins/linonetwo/visualization-dashboard/tiddlywiki-ui/Template/BarTagDaysWeek');

    const targetField = page.locator('.visualization-dashboard-new-gauge-field').filter({ hasText: '目标条目' }).first();
    await expect(targetField).toBeVisible();

    // Type a custom value in the tag picker input
    const input = targetField.locator('input');
    await input.fill('CustomTargetTiddler');

    // Click the "添加" button
    const addButton = targetField.locator('.tc-add-tag-button button');
    await addButton.click();
    await page.waitForTimeout(200);

    // Verify the draft tiddler's targetTiddler field was updated
    const stored = await getDraftField(page, 'targetTiddler');
    expect(stored).toContain('CustomTargetTiddler');
  });

  test('标签 field accepts custom tag via add button', async ({ page }) => {
    await openCreateGaugeModal(page, '$:/plugins/linonetwo/visualization-dashboard/tiddlywiki-ui/Template/BarTagDaysWeek');

    const tagsField = page.locator('.visualization-dashboard-new-gauge-field').filter({ hasText: '标签' }).first();
    await expect(tagsField).toBeVisible();

    const input = tagsField.locator('input');
    await input.fill('CustomTestTag');

    const addButton = tagsField.locator('.tc-add-tag-button button');
    await addButton.click();
    await page.waitForTimeout(200);

    // Verify the draft tiddler's tags field contains the new tag
    const stored = await getDraftField(page, 'tags');
    expect(JSON.stringify(stored)).toContain('CustomTestTag');
  });

  test('目标条目 field dropdown shows tiddler suggestions when typing', async ({ page }) => {
    await openCreateGaugeModal(page, '$:/plugins/linonetwo/visualization-dashboard/tiddlywiki-ui/Template/BarTagDaysWeek');

    const targetField = page.locator('.visualization-dashboard-new-gauge-field').filter({ hasText: '目标条目' }).first();
    const input = targetField.locator('input');

    // Type a partial name to trigger suggestions
    await input.fill('Index');
    await page.waitForTimeout(300);

    // The dropdown should appear with matching suggestions
    const dropdown = targetField.locator('.tc-block-dropdown');
    await expect(dropdown).toBeVisible();
    const dropdownText = await dropdown.innerText();
    // Should suggest "Index" since it's an existing tiddler
    expect(dropdownText).toContain('Index');
  });

  test('modal renders without "> 目标条目 >" display issue', async ({ page }) => {
    await openCreateGaugeModal(page, '$:/plugins/linonetwo/visualization-dashboard/tiddlywiki-ui/Template/BarTagDaysWeek');

    // Verify no stray ">" characters around the 目标条目 label
    const body = page.locator('.tc-modal-body');
    const bodyText = await body.innerText();

    // The label should appear as plain "目标条目" without extra ">" characters
    expect(bodyText).toContain('目标条目');

    // There should be no ">" immediately before or after "目标条目" in the raw HTML
    const bodyHTML = await body.innerHTML();
    expect(bodyHTML).not.toContain('&gt;目标条目');
    expect(bodyHTML).not.toContain('目标条目&gt;');
    expect(bodyHTML).not.toContain('>目标条目');
    expect(bodyHTML).not.toContain('目标条目>');
  });

  test('targetTiddlerFilter is respected when set on template', async ({ page }) => {
    // Template SubscriptionTracker has targetTiddlerFilter set
    await openCreateGaugeModal(page, '$:/plugins/linonetwo/visualization-dashboard/tiddlywiki-ui/Template/SubscriptionTracker');

    const targetField = page.locator('.visualization-dashboard-new-gauge-field').filter({ hasText: '目标条目' }).first();
    await expect(targetField).toBeVisible();

    // Open the dropdown to check suggestions respect the filter
    const dropdownBtn = targetField.locator('button[aria-label="标签清单"]');
    await dropdownBtn.click();
    await page.waitForTimeout(200);

    const dropdown = targetField.locator('.tc-block-dropdown');
    await expect(dropdown).toBeVisible();
    const dropdownText = await dropdown.innerText();
    // SubscriptionTracker filter is [all[tiddlers]field:calendarEntry[yes]has[rrule]]
    // If the wiki has no such tiddlers, dropdown may show "找不到标签"
    // but it should NOT crash or show filter syntax errors
    expect(dropdownText).not.toContain('Missing [');
    expect(dropdownText).not.toContain('筛选器错误');
  });
});
