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
  /**
   * corresponding end date field to startDateFields. When using multiple pairs of fields, their index in the array should be the same.
   * Use empty string if some of start field don't have a corresponding end field
   */
  endDateFields?: string[];
  /** a fine grained filter to replace the current `[all[tiddlers]!is[system]]` filter */
  filter?: string;
  parentWidget?: Widget;
  /** when calendar open, it will filter tiddlers with these fields, and one of these field is within the range of current calendar view */
  startDateFields?: string[];
}
export function initCalendar(containerElement: HTMLDivElement, context: IContext) {
  const calendar = new Calendar(containerElement, {
    eventSources: [{ events: getEventOnFullCalendarViewChange(context), id: tiddlerEventSourceID }],
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
