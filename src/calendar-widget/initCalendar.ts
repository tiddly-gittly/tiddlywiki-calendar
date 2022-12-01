import { Calendar, EventInput } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import scrollGridPlugin from '@fullcalendar/scrollgrid';
import adaptivePlugin from '@fullcalendar/adaptive';
import interactionPlugin from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list';
import { getHandlers } from './handlers';

const isSmallScreen = window.innerWidth <= 600;

export function initCalendar(containerElement: HTMLDivElement, events: EventInput[]) {
  const calendar = new Calendar(containerElement, {
    events,
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
    ...getHandlers(),
  });
  return calendar;
}
