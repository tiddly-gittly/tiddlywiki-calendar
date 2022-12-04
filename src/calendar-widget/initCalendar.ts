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
  /** a custom filter to replace the default `[all[tiddlers]!is[system]]` filter */
  filter?: string;
  /** hide toolbar buttons and title, only show the pure calendar content. So it can be used as a small calendar widget, for example. */
  hideToolbar?: boolean;
  /** when calendar open, the initial start date it shows */
  initialDate?: string;
  /** when calendar open, the initial view it uses */
  initialView?: string;
  parentWidget?: Widget;
  /** when calendar open, it will filter tiddlers with these fields (add to the filter expression on the fly), and one of these field is within the range of current calendar view */
  startDateFields?: string[];
}
export function initCalendar(containerElement: HTMLDivElement, context: IContext) {
  const now = context.initialDate === undefined ? Date.now() : $tw.utils.parseDate(context.initialDate);
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
    initialView: context.initialView ?? (isSmallScreen ? 'timeGridThreeDay' : 'timeGridWeek'),
    now,
    navLinks: true,
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

function getToolbarSettings(context: IContext): CalendarOptions {
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
    headerToolbar:
      isSmallScreen || context.hideToolbar === true
        ? false
        : {
            left: `prev,next today`,
            center: 'title',
            right: `${inCalendarLayout ? 'backToDefaultLayout ' : ''}dayGridMonth,timeGridWeek,timeGridThreeDay,timeGridDay,listWeek`,
          },
    footerToolbar:
      isSmallScreen && context.hideToolbar !== true
        ? {
            right: `today,prev,next`,
            left: `timeGridThreeDay,timeGridDay,listWeek${inCalendarLayout ? ' backToDefaultLayout' : ''}`,
          }
        : false,
  };
}
