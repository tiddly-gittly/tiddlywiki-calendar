import type { ModalWidget } from 'tiddlywiki';
import { Calendar } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import scrollGridPlugin from '@fullcalendar/scrollgrid';
import adaptivePlugin from '@fullcalendar/adaptive';
import interactionPlugin from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list';

const TWModal = (require('$:/core/modules/utils/dom/modal.js') as { Modal: ModalWidget }).Modal;

const isSmallScreen = window.innerWidth <= 600;

export function initCalendar(containerElement: HTMLDivElement) {
  const calendar = new Calendar(containerElement, {
    plugins: [dayGridPlugin, timeGridPlugin, listPlugin, scrollGridPlugin, adaptivePlugin, interactionPlugin],
    views: {
      timeGridThreeDay: {
        type: 'timeGrid',
        duration: { days: 3 },
        buttonText: isSmallScreen ? '3d' : '3 day',
      },
      timeGridDay: {
        type: 'timeGrid',
        duration: { days: 1 },
        buttonText: isSmallScreen ? '1d' : 'day',
      },
    },
    initialView: isSmallScreen ? 'timeGridThreeDay' : 'timeGridWeek',
    now: Date.now(),
    editable: true,
    selectable: true,
    droppable: true,
    rerenderDelay: 100,
    longPressDelay: 250,
    nowIndicator: true,
    scrollTimeReset: false,
    headerToolbar: isSmallScreen
      ? false
      : {
          left: 'prev,next today',
          center: 'title',
          right: 'dayGridMonth,timeGridWeek,timeGridThreeDay,timeGridDay,listWeek',
        },
    footerToolbar: isSmallScreen
      ? {
          right: 'today,prev,next',
          left: 'timeGridThreeDay,timeGridDay,listWeek',
        }
      : false,
    schedulerLicenseKey: 'GPL-My-Project-Is-Open-Source',
    // event handlers
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
      // DEBUG: console
      console.log(`info`, info);
      new TWModal($tw.wiki).display('$:/plugins/linonetwo/tw-calendar/calendar-widget/tiddlywiki-ui/CreateNewTiddlerPopup', { maskClosable: true });
      // @ts-expect-error Property 'type' does not exist on type 'ViewApi'.ts(2339)
      if (info.view.type === 'dayGridMonth') {
        // @ts-expect-error Property 'date' does not exist on type 'DateSelectArg'.ts(2339)
        const start = info.date as Date;
        const end = new Date(start);
        end.setDate(start.getDate() - 1);
      }
    },
  });
  return calendar;
}
