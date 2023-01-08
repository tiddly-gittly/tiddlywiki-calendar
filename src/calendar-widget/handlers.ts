/* eslint-disable @typescript-eslint/strict-boolean-expressions */
/* eslint-disable unicorn/no-null */
import type { ModalWidget } from 'tiddlywiki';
import type { CalendarOptions, EventClickArg } from '@fullcalendar/core';
import { computePosition, autoPlacement, shift } from '@floating-ui/dom';
import type { IContext } from './initCalendar';
import { getInCalendarLayout } from './constants';
import type { EventImpl } from '@fullcalendar/core/internal';

const TWModal = (require('$:/core/modules/utils/dom/modal.js') as { Modal: ModalWidget }).Modal;

function notifyNavigatorSaveTiddler(parameters: { event: MouseEvent; title: string }, context: IContext) {
  window.requestIdleCallback(
    () => {
      context.parentWidget?.dispatchEvent({
        type: 'tm-save-tiddler',
        // param: param,
        paramObject: { suppressNavigation: 'yes' },
        event: parameters.event,
        tiddlerTitle: parameters.title,
      });
      context.parentWidget?.dispatchEvent({ type: 'tm-auto-save-wiki' });
    },
    { timeout: 2000 },
  );
}

function navigateToTiddlerInDefaultLayout(info: EventClickArg, context: IContext) {
  // if (info.jsEvent.getModifierState('Control') || info.jsEvent.getModifierState('Meta')) {
  getInCalendarLayout() && $tw.wiki.setText('$:/layout', 'text', '');
  context?.parentWidget?.dispatchEvent({
    type: 'tm-navigate',
    navigateTo: info.event.title,
    metaKey: info.jsEvent.getModifierState('Meta'),
    ctrlKey: info.jsEvent.getModifierState('Control'),
    altKey: info.jsEvent.getModifierState('Alt'),
    shiftKey: info.jsEvent.getModifierState('Shift'),
  });
}

export function getHandlers(context: IContext): CalendarOptions {
  function putEvent(event: EventImpl, jsEvent: MouseEvent) {
    // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
    if (event.start === null || event.end === null || !event.title) return;
    const originalEventTiddler = $tw.wiki.getTiddler(event.title);
    if (originalEventTiddler === undefined) return;
    const startDate = $tw.utils.stringifyDate(event.start);
    const endDate = $tw.utils.stringifyDate(event.end);
    const startDateKey = context.startDateFields?.[0] ?? 'startDate';
    const endDateKey = context.endDateFields?.[0] ?? 'endDate';
    $tw.wiki.addTiddler({
      ...originalEventTiddler.fields,
      [startDateKey]: startDate,
      [endDateKey]: endDate,
      modified: new Date(),
    });
    notifyNavigatorSaveTiddler({ title: event.title, event: jsEvent }, context);
  }
  const handlers: CalendarOptions = {
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    eventClick: async (info) => {
      if (!context.parentWidget) return;
      const previewWidgetDataName = 'tiddlywiki-calendar-widget-event-preview';
      // delete previous element if exist
      const previousEventPreviewElement = context.containerElement?.querySelector<HTMLDivElement>('.tiddlywiki-calendar-widget-event-preview');
      if (previousEventPreviewElement) {
        const previousTitle = previousEventPreviewElement.dataset.tiddler;
        context.parentWidget.children = context.parentWidget.children.filter(
          (child) => !('data-name' in child && (child['data-name'] as string | undefined) === previewWidgetDataName),
        );
        context.containerElement?.removeChild(previousEventPreviewElement);
        // if click same event twice, means close.
        if (previousTitle === info.event.title) return;
      }
      // add new element
      const eventPreviewElement = document.createElement('div');
      context.containerElement?.appendChild(eventPreviewElement);
      eventPreviewElement.classList.add('tiddlywiki-calendar-widget-event-preview');
      eventPreviewElement.dataset.tiddler = info.event.title;

      if (!eventPreviewElement) return;
      const newWidgetNode = context.parentWidget.makeChildWidget({
        type: 'tiddler',
        children: $tw.wiki.parseText(
          'text/vnd.tiddlywiki',
          `{{${info.event.title}||$:/plugins/linonetwo/tw-calendar/calendar-widget/tiddlywiki-ui/popup/EventPreview}}`,
        ).tree,
      });
      // @ts-expect-error Property 'data-name' does not exist on type 'Widget'.ts(7053)
      newWidgetNode['data-name'] = previewWidgetDataName;
      newWidgetNode.render(eventPreviewElement, null);
      context.parentWidget.children.push(newWidgetNode);
      const eventElement = info.el;
      const { x, y } = await computePosition(eventElement, eventPreviewElement, { middleware: [autoPlacement(), shift()] });
      Object.assign(eventPreviewElement.style, {
        left: `${x}px`,
        top: `${y}px`,
      });
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
      $tw.wiki.addTiddler({
        title: '$:/state/Calendar/PageLayout/create-tiddler-caption',
        text: '',
      });
      $tw.wiki.addTiddler({
        title: '$:/state/Calendar/PageLayout/create-tiddler',
        [startDateKey]: startDate,
        [endDateKey]: endDate,
        'draft.title': info.startStr,
        /**
         * this `calendarEntry` is used for cascade that ask tiddler only show caption
         * See $:/plugins/linonetwo/tw-calendar/calendar-widget/tiddlywiki-ui/ViewTemplate/captionCascade
         */
        calendarEntry: 'yes',
        text,
      });
      new TWModal($tw.wiki).display('$:/plugins/linonetwo/tw-calendar/calendar-widget/tiddlywiki-ui/popup/CreateNewTiddlerPopup');
      const titleInputElement = document.querySelector<HTMLInputElement>('.tw-calendar-layout-create-new-tiddler-popup > .tc-titlebar.tc-edit-texteditor');
      if (titleInputElement !== null) {
        // fix title not auto focus in modal
        titleInputElement.focus();
      }
    },
    eventResize(info) {
      putEvent(info.event, info.jsEvent);
      // eslint-disable-next-line @typescript-eslint/no-confusing-void-expression
      info.relatedEvents.forEach((event) => putEvent(event, info.jsEvent));
    },
    eventDrop(info) {
      putEvent(info.event, info.jsEvent);
      // eslint-disable-next-line @typescript-eslint/no-confusing-void-expression
      info.relatedEvents.forEach((event) => putEvent(event, info.jsEvent));
    },
  };
  return handlers;
}
