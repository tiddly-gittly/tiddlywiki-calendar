import type { ModalWidget } from 'tiddlywiki';
import type { CalendarOptions } from '@fullcalendar/core';
import { toTWUTCString } from '../utils';

const TWModal = (require('$:/core/modules/utils/dom/modal.js') as { Modal: ModalWidget }).Modal;

export function getHandlers(): CalendarOptions {
  const handlers: CalendarOptions = {
    viewDidMount(mountArgument) {
      // DEBUG: console
      console.log(`mountArg`, mountArgument);
    },
    eventClick: (info) => {
      if (info.jsEvent.getModifierState('Control') || info.jsEvent.getModifierState('Meta')) {
        // DEBUG: console
        console.log(`info.event.id`, info.event.id);
      } else {
        // DEBUG: console
        console.log(`info.event`, info.event);
      }
    },
    dateClick(info) {
      console.log('dateClick', info);
    },
    /**
     * Trigger when user select by mouse or long-press and drag on the grid, no matter it is empty or has event
     * @url https://fullcalendar.io/docs/select-callback
     */
    select(info) {
      // @ts-expect-error Property 'type' does not exist on type 'ViewApi'.ts(2339)
      if (info.view.type === 'dayGridMonth') {
        info.start = new Date(info.startStr);
        info.end = new Date(info.endStr);
        // info.end.setDate(info.start.getDate() - 1);
      }
      const startDate = toTWUTCString(info.start);
      const endDate = toTWUTCString(info.end);
      $tw.wiki.addTiddler({
        title: '$:/state/Calendar/PageLayout/create-tiddler',
        startDate,
        endDate,
        'draft.title': info.startStr,
      });
      new TWModal($tw.wiki).display('$:/plugins/linonetwo/tw-calendar/calendar-widget/tiddlywiki-ui/CreateNewTiddlerPopup', {
        variables: { maskClosable: 'true' },
      });
      const titleInputElement = document.querySelector<HTMLInputElement>('.tw-calendar-layout-create-new-tiddler-popup > .tc-titlebar.tc-edit-texteditor');
      if (titleInputElement !== null) {
        // fix title not auto focus in modal
        titleInputElement.focus();
      }
    },
  };
  return handlers;
}
