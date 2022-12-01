import type { Widget } from 'tiddlywiki';
import { Calendar, CalendarOptions } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import adaptivePlugin from '@fullcalendar/adaptive';
import interactionPlugin from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list';
import { getHandlers } from './handlers';
import { getEventOnFullCalendarViewChange } from './getEvents';

const isSmallScreen = window.innerWidth <= 600;
export const tiddlerEventSourceID = 'tiddlers';

export interface IContext {
  parentWidget?: Widget | undefined;
}
export function initCalendar(containerElement: HTMLDivElement, context: IContext) {
  const calendar = new Calendar(containerElement, {
    eventSources: [{ events: getEventOnFullCalendarViewChange, id: tiddlerEventSourceID }],
    plugins: [dayGridPlugin, timeGridPlugin, listPlugin, adaptivePlugin, interactionPlugin],
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
    schedulerLicenseKey: 'GPL-My-Project-Is-Open-Source',
    ...getToolbarSettings(context),
    // event handlers
    ...getHandlers(context),
  });
  return calendar;
}

function getToolbarSettings(_context: IContext): CalendarOptions {
  const inCalendarLayout = $tw.wiki.getTiddlerText('$:/layout') === '$:/plugins/linonetwo/tw-calendar/tiddlywiki-ui/PageLayout/CalendarLayout';
  return {
    customButtons: {
      backToDefaultLayout: {
        text: 'Home',
        click: () => {
          $tw.wiki.setText('$:/layout', 'text', '$:/core/ui/PageTemplate');
        },
      },
    },
    headerToolbar: isSmallScreen
      ? false
      : {
          left: `prev,next today`,
          center: 'title',
          right: `${inCalendarLayout ? 'backToDefaultLayout ' : ''}dayGridMonth,timeGridWeek,timeGridThreeDay,timeGridDay,listWeek`,
        },
    footerToolbar: isSmallScreen
      ? {
          right: `today,prev,next`,
          left: `timeGridThreeDay,timeGridDay,listWeek${inCalendarLayout ? ' backToDefaultLayout' : ''}`,
        }
      : false,
  };
}
