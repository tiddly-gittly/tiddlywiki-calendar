import type { ModalWidget } from 'tiddlywiki';
import type { CalendarOptions } from '@fullcalendar/core';
import { toTWUTCString } from '../utils';
import type { IContext } from './initCalendar';

const TWModal = (require('$:/core/modules/utils/dom/modal.js') as { Modal: ModalWidget }).Modal;

export function getHandlers(context: IContext): CalendarOptions {
  const handlers: CalendarOptions = {
    eventClick: (info) => {
      // if (info.jsEvent.getModifierState('Control') || info.jsEvent.getModifierState('Meta')) {
      context?.parentWidget?.dispatchEvent({
        type: 'tm-navigate',
        navigateTo: info.event.title,
        metaKey: info.jsEvent.getModifierState('Meta'),
        ctrlKey: info.jsEvent.getModifierState('Control'),
        altKey: info.jsEvent.getModifierState('Alt'),
        shiftKey: info.jsEvent.getModifierState('Shift'),
      });
    },
    /**
     * Trigger when user select by mouse or long-press and drag on the grid, no matter it is empty or has event
     * @url https://fullcalendar.io/docs/select-callback
     */
    select(info) {
      let text = '';
      // handle full-date event, make them tw standard journal
      // @ts-expect-error Property 'type' does not exist on type 'ViewApi'.ts(2339)
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
      const startDate = toTWUTCString(info.start);
      const endDate = toTWUTCString(info.end);
      $tw.wiki.addTiddler({
        title: '$:/state/Calendar/PageLayout/create-tiddler',
        startDate,
        endDate,
        'draft.title': info.startStr,
        text,
      });
      new TWModal($tw.wiki).display('$:/plugins/linonetwo/tw-calendar/calendar-widget/tiddlywiki-ui/popup/CreateNewTiddlerPopup');
      const titleInputElement = document.querySelector<HTMLInputElement>('.tw-calendar-layout-create-new-tiddler-popup > .tc-titlebar.tc-edit-texteditor');
      if (titleInputElement !== null) {
        // fix title not auto focus in modal
        titleInputElement.focus();
      }
    },
  };
  return handlers;
}
