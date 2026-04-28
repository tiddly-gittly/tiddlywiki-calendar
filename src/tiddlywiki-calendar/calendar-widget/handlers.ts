import { Modal } from '$:/core/modules/utils/dom/modal.js';
import { autoPlacement, computePosition, shift, size } from '@floating-ui/dom';
import type { CalendarOptions, EventApi } from '@fullcalendar/core';
import type { EventImpl } from '@fullcalendar/core/internal';
import debounce from 'lodash/debounce';
import { ITiddlerFields } from 'tiddlywiki';
import { draftTiddlerCaptionTitle, draftTiddlerTitle, getIsSearchMode, isMobile } from './constants';
import type { IContext } from './initCalendar';

type ReceivedEventInfo = {
  draggedEl: HTMLElement;
  event: EventApi;
};

export function getHandlers(context: IContext): CalendarOptions {
  const focusCreateNewTiddlerPopupTitleInput = () => {
    const titleInputElement = document.querySelector<HTMLInputElement>('.tw-calendar-layout-create-new-tiddler-popup .tw-calendar-caption-input');
    titleInputElement?.focus();
  };

  function putEvent(event: EventImpl | EventApi, newTiddler?: ITiddlerFields) {
    // when an existed event is dragged to full-day, the `end` is null, but it should have a title
    if (event.start === null || (event.end === null && !event.title)) return;
    const originalEventTiddler = newTiddler ?? $tw.wiki.getTiddler(event.title)?.fields;
    if (originalEventTiddler === undefined) return;
    const startDate = $tw.utils.stringifyDate(event.start);
    // when drag to full-date event, the `end` will be `null`, make it full-day event by add a day to it.
    const endDate = $tw.utils.stringifyDate(event.end ?? new Date(event.start.getTime() + 86_400_000));
    const startDateKey = context.startDateFields?.[0] ?? 'startDate';
    const endDateKey = context.endDateFields?.[0] ?? 'endDate';
    $tw.wiki.addTiddler({
      ...originalEventTiddler,
      [startDateKey]: startDate,
      [endDateKey]: endDate,
      modified: new Date(),
    });
  }
  const debouncedCreateEvent = debounce((info: ReceivedEventInfo) => {
    const randomTitle = $tw.utils.formatDateString(new Date(), '[UTC]YYYY0MM0DD0hh0mm0ss0XXX');
    const tags = $tw.utils.parseStringArray(info.draggedEl.dataset.tags ?? '');
    putEvent(info.event, {
      title: randomTitle,
      tags,
      text: '',
      type: 'text/vnd.tiddlywiki',
      calendarEntry: 'yes',
      _is_titleless: 'yes',
    });
  }, 300);

  const handlers: CalendarOptions = {
    eventDidMount: (info) => {
      // In searchResultList, we want to reverse the DOM order so newest days appear first
      // We do this reliably by deferring it to a microtask after events finish rendering
      if (getIsSearchMode() && info.view.type === 'searchResultList') {
        const tbody = info.el.closest('tbody');
        if (tbody && !tbody.dataset.reverseScheduled) {
          tbody.dataset.reverseScheduled = 'true';
          queueMicrotask(() => {
            delete tbody.dataset.reverseScheduled;
            if (tbody.dataset.reversed === 'true') return;

            const children = Array.from(tbody.children);
            if (children.length === 0) return;

            const reversedGroups = [];
            let currentGroup: Element[] = [];

            for (const element of children) {
              if (element.classList.contains('fc-list-day')) {
                if (currentGroup.length > 0) {
                  reversedGroups.unshift(currentGroup);
                }
                currentGroup = [element];
              } else {
                currentGroup.splice(1, 0, element);
              }
            }
            if (currentGroup.length > 0) {
              reversedGroups.unshift(currentGroup);
            }

            tbody.innerHTML = '';
            reversedGroups.forEach((group) => {
              group.forEach((element) => tbody.appendChild(element));
            });
            tbody.dataset.reversed = 'true';
          });
        }
      }
    },
    datesSet: (info) => {
      // Add native date picker to the toolbar title for quick jumping
      const rootElement = context.containerElement;
      if (!rootElement) return;
      const titleElement = rootElement.querySelector<HTMLElement>('.fc-toolbar-title');
      if (titleElement) {
        let input = titleElement.querySelector<HTMLInputElement>('.tw-calendar-date-picker-hidden');
        if (!input) {
          titleElement.style.cursor = 'pointer';
          queueMicrotask(() => {
            input = document.createElement('input');
            input.type = 'date';
            input.className = 'tw-calendar-date-picker-hidden';
            Object.assign(input.style, {
              position: 'absolute',
              bottom: '0',
              left: '0',
              width: '1px',
              height: '1px',
              opacity: '0',
              pointerEvents: 'none',
              border: 'none',
              padding: '0',
            });
            input.addEventListener('change', (event) => {
              const target = event.target as HTMLInputElement;
              if (target.value) {
                // The value is YYYY-MM-DD. gotoDate expects a valid date or date string.
                info.view.calendar.gotoDate(target.value);
              }
            });
            titleElement.append(input);
            titleElement.addEventListener('click', (event) => {
              const pickerInput = input;
              if (pickerInput === null || event.target === pickerInput) {
                return;
              }
              if (event.target !== pickerInput) {
                try {
                  pickerInput.showPicker();
                } catch {
                  // Fallback for older browsers
                  pickerInput.focus();
                  pickerInput.click();
                }
              }
            });

            // Sync value: Approximate the viewed center date
            const midDate = new Date((info.start.getTime() + info.end.getTime()) / 2);
            // Format as local YYYY-MM-DD
            const tzOffset = midDate.getTimezoneOffset() * 60000;
            const localISOTime = new Date(midDate.getTime() - tzOffset).toISOString().slice(0, 10);
            input.value = localISOTime;
          });
        } else {
          // If already exists, just update the value
          const midDate = new Date((info.start.getTime() + info.end.getTime()) / 2);
          const tzOffset = midDate.getTimezoneOffset() * 60000;
          const localISOTime = new Date(midDate.getTime() - tzOffset).toISOString().slice(0, 10);
          input.value = localISOTime;
        }
      }
    },
    eventClick: async (info) => {
      if (!context.widget) return;
      const previewWidgetDataName = 'tiddlywiki-calendar-widget-event-preview';
      const recurrenceEditorStateTitle = `$:/temp/tw-calendar/recurrence-editor/${info.event.title}`;
      $tw.wiki.deleteTiddler(recurrenceEditorStateTitle);
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
      if (tiddler?.hasField('_is_skinny')) {
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

      const newWidgetNode = context.widget.makeChildWidget({
        type: 'tiddler',
        children: $tw.wiki.parseText(
          'text/vnd.tiddlywiki',
          `<$vars twCalendarOccurrenceStartDate="${$tw.utils.stringifyDate(info.event.start ?? new Date())}" twCalendarOccurrenceEndDate="${
            info.event.end ? $tw.utils.stringifyDate(info.event.end) : ''
          }" twCalendarRecurrenceEditorStateTitle="${recurrenceEditorStateTitle}">{{${info.event.title}||$:/plugins/linonetwo/tw-calendar/calendar-widget/tiddlywiki-ui/popup/EventPreview}}</$vars>`,
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
          size({
            apply({ availableWidth, availableHeight, elements }) {
              Object.assign(elements.floating.style, {
                maxWidth: `${Math.max(0, availableWidth)}px`,
                maxHeight: `${Math.max(0, availableHeight)}px`,
              });
            },
          }),
        ],
      });
      Object.assign(eventPreviewElement.style, {
        left: `${x}px`,
        top: `${y}px`,
      });
      // add event listener to close button
      const closeButtons = eventPreviewElement.querySelectorAll<HTMLButtonElement>('button.tw-calendar-layout-event-preview-close-button');
      closeButtons.forEach((closeButton) => {
        closeButton.addEventListener('click', () => {
          removePopup(eventPreviewElement);
        });
      });
    },
    /**
     * Triggered when a date/time selection is made.
     * Trigger when user select by mouse or long-press and drag on the grid, no matter it is empty or has event. If already has event, a new event with same title will be created, then tiddlywiki will handle the deduplicate of title (by adding a " 1" as suffix).
     * @url https://fullcalendar.io/docs/select-callback
     */
    select(info) {
      if (context.readonly === true) return;
      const recurrenceEditorStateTitle = '$:/temp/tw-calendar/recurrence-editor/$:/state/Calendar/PageLayout/create-tiddler';
      $tw.wiki.deleteTiddler(recurrenceEditorStateTitle);
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
        _is_titleless: 'yes',
        'draft.title': info.startStr,
        text,
        tags,
      });
      new Modal($tw.wiki).display('$:/plugins/linonetwo/tw-calendar/calendar-widget/tiddlywiki-ui/popup/CreateNewTiddlerPopup');
      focusCreateNewTiddlerPopupTitleInput();
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
      // remove the shadow event immediately to avoid UI issues
      info.event.remove();
      // debounce the actual event creation
      debouncedCreateEvent(info);
    },
    eventMouseEnter(info) {
      // use this until https://github.com/Jermolene/TiddlyWiki5/discussions/7989 fixed
      const tiddler = $tw.wiki.getTiddler(info.event.title);
      if (tiddler?.hasField('_is_skinny')) {
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
