/* eslint-disable @typescript-eslint/strict-boolean-expressions */
/* eslint-disable unicorn/no-null */
import { Modal } from '$:/core/modules/utils/dom/modal.js';
import { autoPlacement, computePosition, shift } from '@floating-ui/dom';
import type { CalendarOptions, EventApi } from '@fullcalendar/core';
import type { EventImpl } from '@fullcalendar/core/internal';
import { ITiddlerFields } from 'tiddlywiki';
import { draftTiddlerCaptionTitle, draftTiddlerTitle, isMobile } from './constants';
import type { IContext } from './initCalendar';

export function getHandlers(context: IContext): CalendarOptions {
  function putEvent(event: EventImpl | EventApi, newTiddler?: ITiddlerFields) {
    // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
    if (event.start === null || event.end === null) return;
    const originalEventTiddler = newTiddler ?? $tw.wiki.getTiddler(event.title ?? '')?.fields;
    if (originalEventTiddler === undefined) return;
    const startDate = $tw.utils.stringifyDate(event.start);
    const endDate = $tw.utils.stringifyDate(event.end);
    const startDateKey = context.startDateFields?.[0] ?? 'startDate';
    const endDateKey = context.endDateFields?.[0] ?? 'endDate';
    $tw.wiki.addTiddler({
      ...originalEventTiddler,
      [startDateKey]: startDate,
      [endDateKey]: endDate,
      modified: new Date(),
    });
  }
  const handlers: CalendarOptions = {
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    eventClick: async (info) => {
      if (!context.widget) return;
      const previewWidgetDataName = 'tiddlywiki-calendar-widget-event-preview';
      // delete previous element if exist
      const previousEventPreviewElement = context.containerElement?.querySelector<HTMLDivElement>('.tiddlywiki-calendar-widget-event-preview');
      const removePopup = (popupElementToRemove: HTMLDivElement | null | undefined) => {
        if (!context.widget || !popupElementToRemove) return;
        context.widget.children = context.widget.children.filter(
          (child) => !('data-name' in child && (child['data-name'] as string | undefined) === previewWidgetDataName),
        );
        popupElementToRemove.remove();
      };
      if (previousEventPreviewElement) {
        removePopup(previousEventPreviewElement);
        const previousTitle = previousEventPreviewElement.dataset.tiddler;
        // if click same event twice, means close.
        if (previousTitle === info.event.title) return;
      }
      const tiddler = $tw.wiki.getTiddler(info.event.title);
      if (tiddler?.hasField?.('_is_skinny')) {
        // trigger lazyLoad after render, don't block UI rendering.
        setTimeout(() => {
          // Tell any listeners about the need to lazily load $tw.wiki tiddler
          $tw.wiki.dispatchEvent('lazyLoad', tiddler.fields.title);
        }, 0);
      }
      // add new element
      const eventPreviewElement = document.createElement('div');
      context.containerElement?.append(eventPreviewElement);
      eventPreviewElement.classList.add('tiddlywiki-calendar-widget-event-preview');
      eventPreviewElement.dataset.tiddler = info.event.title;

      if (!eventPreviewElement) return;
      const newWidgetNode = context.widget.makeChildWidget({
        type: 'tiddler',
        children: $tw.wiki.parseText(
          'text/vnd.tiddlywiki',
          `{{${info.event.title}||$:/plugins/linonetwo/tw-calendar/calendar-widget/tiddlywiki-ui/popup/EventPreview}}`,
          { parseAsInline: true },
        ).tree,
      }, { variables: context.widget.variables });
      // @ts-expect-error Property 'data-name' does not exist on type 'Widget'.ts(7053)
      newWidgetNode['data-name'] = previewWidgetDataName;
      context.widget.children.push(newWidgetNode);
      newWidgetNode.render(eventPreviewElement, null);
      const eventElement = info.el;
      const { x, y } = await computePosition(eventElement, eventPreviewElement, {
        middleware: [
          isMobile
            ? autoPlacement({
              crossAxis: true,
              allowedPlacements: ['top', 'bottom', 'right'],
            })
            : autoPlacement(),
          shift(),
        ],
      });
      Object.assign(eventPreviewElement.style, {
        left: `${x}px`,
        top: `${y}px`,
      });
      // add event listener to close button
      const closeButtons = eventPreviewElement.querySelectorAll<HTMLButtonElement>('button.tw-calendar-layout-event-preview-close-button');
      if (closeButtons) {
        closeButtons.forEach(closeButton => {
          closeButton.addEventListener('click', () => {
            removePopup(eventPreviewElement);
          });
        });
      }
    },
    /**
     * Triggered when a date/time selection is made.
     * Trigger when user select by mouse or long-press and drag on the grid, no matter it is empty or has event. If already has event, a new event with same title will be created, then tiddlywiki will handle the deduplicate of title (by adding a " 1" as suffix).
     * @url https://fullcalendar.io/docs/select-callback
     */
    select(info) {
      if (context.readonly === true) return;
      let text = '';
      // handle full-date event, make them tw standard journal
      if (info.view.type === 'dayGridMonth') {
        info.start = new Date(info.startStr);
        info.end = new Date(info.endStr);
      }
      // @ts-expect-error The right-hand side of an arithmetic operation must be of type 'any', 'number', 'bigint' or an enum type.ts(2363)
      // if is full day event
      if (info.end - info.start === 86_400_000) {
        // use journal format
        const journalTitleTemplate = $tw.wiki.getTiddlerText('$:/config/NewJournal/Title');
        const journalText = $tw.wiki.getTiddlerText('$:/config/NewJournal/Text');
        if (journalTitleTemplate !== undefined) {
          const journalTitle = $tw.utils.formatDateString(info.start, journalTitleTemplate);
          info.startStr = journalTitle;
          text = journalText ?? text;
        }
      }
      const startDate = $tw.utils.stringifyDate(info.start);
      const endDate = $tw.utils.stringifyDate(info.end);
      const startDateKey = context.startDateFields?.[0] ?? 'startDate';
      const endDateKey = context.endDateFields?.[0] ?? 'endDate';
      const tags = context.defaultTags ?? [];
      $tw.wiki.addTiddler({
        title: draftTiddlerCaptionTitle,
        text: '',
      });
      $tw.wiki.addTiddler({
        title: draftTiddlerTitle,
        [startDateKey]: startDate,
        [endDateKey]: endDate,
        /**
         * this `calendarEntry` is used for cascade that ask tiddler only show caption
         * See $:/plugins/linonetwo/tw-calendar/calendar-widget/tiddlywiki-ui/ViewTemplate/captionCascade
         */
        calendarEntry: 'yes',
        'draft.title': info.startStr,
        text,
        tags,
      });
      new Modal($tw.wiki).display('$:/plugins/linonetwo/tw-calendar/calendar-widget/tiddlywiki-ui/popup/CreateNewTiddlerPopup');
      const titleInputElement = document.querySelector<HTMLInputElement>('.tw-calendar-layout-create-new-tiddler-popup > .tc-titlebar.tc-edit-texteditor');
      // fix title not auto focus in modal
      titleInputElement?.focus?.();
    },
    eventResize(info) {
      putEvent(info.event);
      // eslint-disable-next-line @typescript-eslint/no-confusing-void-expression
      info.relatedEvents.forEach((event) => putEvent(event));
    },
    /** When drop after drag existing event from calendar */
    eventDrop(info) {
      putEvent(info.event);
      // eslint-disable-next-line @typescript-eslint/no-confusing-void-expression
      info.relatedEvents.forEach((event) => putEvent(event));
    },
    /** When drop new event from the sidebar */
    eventReceive(info) {
      const randomTitle = $tw.utils.formatDateString(new Date(), '[UTC]YYYY0MM0DD0hh0mm0ss0XXX');
      const tags = $tw.utils.parseStringArray(info.draggedEl.dataset.tags ?? '');
      putEvent(info.event, {
        title: randomTitle,
        caption: '',
        tags,
        text: '',
        type: 'text/vnd.tiddlywiki',
        calendarEntry: 'yes',
      });
      // remove the shadow event. Wait for real event to be created.
      info.event.remove();
    },
    eventMouseEnter(info) {
      // use this until https://github.com/Jermolene/TiddlyWiki5/discussions/7989 fixed
      const tiddler = $tw.wiki.getTiddler(info.event.title);
      if (tiddler?.hasField?.('_is_skinny')) {
        // trigger lazyLoad after render, don't block UI rendering.
        setTimeout(() => {
          // Tell any listeners about the need to lazily load $tw.wiki tiddler
          $tw.wiki.dispatchEvent('lazyLoad', tiddler.fields.title);
          // lazy load later, not blocking user interaction to add new event
        }, 1000);
      }
    },
  };
  return handlers;
}
