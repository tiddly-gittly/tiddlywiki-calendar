import { expect, test } from '@playwright/test';

const DRAFT_TITLE = '$:/state/Calendar/PageLayout/create-tiddler';
const CAPTION_TITLE = '$:/state/Calendar/PageLayout/create-tiddler-caption';
const FAVORITE_TAGS_TITLE = '$:/plugins/linonetwo/tw-calendar/settings/frequently-used-tags';
const CREATE_EVENT_MODAL = '$:/plugins/linonetwo/tw-calendar/calendar-widget/tiddlywiki-ui/popup/CreateNewTiddlerPopup';

const openCreateEventPopupWithTags = async (page: import('@playwright/test').Page) => {
  await page.goto('/#Index');
  await page.evaluate(
    ({ draftTitle, captionTitle, favoriteTagsTitle, createEventModal }) => {
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

      tw.wiki.addTiddler({ title: 'Calendar tag source A', tags: ['A-Normal'], text: '' });
      tw.wiki.addTiddler({ title: 'Calendar tag source Z', tags: ['Z-Normal'], text: '' });
      // Intentionally store favorites in reverse alphabetical order. One favorite is
      // also an existing tag, which verifies that the combined filter removes duplicates.
      tw.wiki.addTiddler({ title: 'Calendar favorite source', tags: ['Beta-Favorite'], text: '' });
      tw.wiki.addTiddler({ title: favoriteTagsTitle, text: 'Zulu-Favorite Beta-Favorite' });
      tw.wiki.addTiddler({ title: captionTitle, text: '' });
      tw.wiki.addTiddler({
        title: draftTitle,
        startDate: '20260428090000000',
        endDate: '20260428100000000',
        calendarEntry: 'yes',
        _is_titleless: 'yes',
        'draft.title': '',
        text: '',
        tags: [],
        rrule: '',
      });

      const { Modal } = tw.modules.execute('$:/core/modules/utils/dom/modal.js');
      new Modal(tw.wiki).display(createEventModal);
      document.querySelector<HTMLInputElement>('.tw-calendar-caption-input')?.focus();
    },
    {
      draftTitle: DRAFT_TITLE,
      captionTitle: CAPTION_TITLE,
      favoriteTagsTitle: FAVORITE_TAGS_TITLE,
      createEventModal: CREATE_EVENT_MODAL,
    },
  );

  await expect(page.locator('.tw-calendar-layout-create-new-tiddler-popup')).toBeVisible();
  await expect(page.locator('.tw-calendar-caption-input')).toBeFocused();
};

test('event tag picker puts favorites first and supports keyboard selection', async ({ page }) => {
  await openCreateEventPopupWithTags(page);

  const popup = page.locator('.tw-calendar-layout-create-new-tiddler-popup');
  const tagInput = popup.locator('.tw-calendar-tags-input-new-tag .tc-add-tag-name input');

  await page.keyboard.press('Tab');
  await expect(tagInput).toBeFocused();
  await expect(popup.locator('.tw-calendar-tags-input-new-tag .tc-block-tags-dropdown')).toBeVisible();

  const shownTags = await popup
    .locator('.tw-calendar-tags-input-new-tag .tc-block-tags-dropdown span[data-tag-title]')
    .evaluateAll((elements) => elements.map((element) => element.getAttribute('data-tag-title')));

  expect(shownTags.slice(0, 2)).toEqual(['Beta-Favorite', 'Zulu-Favorite']);
  expect(shownTags.filter((title) => title === 'Beta-Favorite')).toHaveLength(1);
  expect(shownTags.indexOf('A-Normal')).toBeLessThan(shownTags.indexOf('Z-Normal'));

  await tagInput.press('ArrowDown');
  await expect(tagInput).toHaveValue('Beta-Favorite');
  await tagInput.press('Enter');

  const draftTags = await page.evaluate((draftTitle) => {
    const tw = (window as unknown as Window & {
      $tw: {
        wiki: {
          getTiddler: (title: string) => { fields?: { tags?: string[] } } | undefined;
        };
      };
    }).$tw;
    return tw.wiki.getTiddler(draftTitle)?.fields?.tags ?? [];
  }, DRAFT_TITLE);
  expect(draftTags).toContain('Beta-Favorite');
});
