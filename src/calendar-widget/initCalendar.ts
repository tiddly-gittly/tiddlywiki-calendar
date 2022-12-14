import 'requestidlecallback-polyfill';
import type { Widget } from 'tiddlywiki';
import { Calendar, CalendarOptions } from '@fullcalendar/core';
import momentTimezonePlugin from '@fullcalendar/moment-timezone';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import adaptivePlugin from '@fullcalendar/adaptive';
import interactionPlugin from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list';
import moment from 'moment-timezone';
import { getHandlers } from './handlers';
import { getEventOnFullCalendarViewChange } from './getEvents';
import { getEventContent } from './eventContent';
import { getInCalendarLayout, isSmallScreen, tiddlerEventSourceID } from './constants';
import { getCustomViews } from './customView';

export interface IContext {
  containerElement?: HTMLDivElement | undefined;
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
  /** make widget content non-editable */
  readonly?: boolean;
  /**
   * The frequency for displaying time slots.
   * @url https://fullcalendar.io/docs/slotDuration
   */
  slotDuration?: string;
  /** when calendar open, it will filter tiddlers with these fields (add to the filter expression on the fly), and one of these field is within the range of current calendar view */
  startDateFields?: string[];
  /** specify the time shift used by calendar when showing data. This won't change how data is stored, data is always store in UTC timeZone, so even you travel, they remains the same. */
  timeZone?: string;
}
export function initCalendar(containerElement: HTMLDivElement, context: IContext) {
  const calendar = new Calendar(containerElement, getSettings(context));
  return calendar;
}

export function getSettings(context: IContext): CalendarOptions {
  const now = context.initialDate === undefined ? undefined : $tw.utils.parseDate(context.initialDate);
  const use24HourFormat = $tw.wiki.getTiddlerText('$:/plugins/linonetwo/tw-calendar/settings/24hour') === 'yes';
  return {
    eventSources: [{ events: getEventOnFullCalendarViewChange(context), id: tiddlerEventSourceID }],
    plugins: [momentTimezonePlugin, dayGridPlugin, timeGridPlugin, listPlugin, adaptivePlugin, interactionPlugin],
    views: getCustomViews(),
    initialView: context.initialView ?? (isSmallScreen ? 'timeGridThreeDay' : 'timeGridWeek'),
    now,
    editable: context.readonly !== true,
    eventContent: getEventContent(context),
    timeZone: context.timeZone ?? moment.tz.guess(),
    navLinks: true,
    selectable: true,
    selectMirror: true,
    droppable: true,
    slotDuration: context.slotDuration,
    rerenderDelay: 100,
    longPressDelay: 350,
    eventTimeFormat: use24HourFormat
      ? {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        }
      : undefined,
    slotLabelFormat: use24HourFormat
      ? {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        }
      : undefined,
    nowIndicator: true,
    scrollTimeReset: false,
    schedulerLicenseKey: 'GPL-My-Project-Is-Open-Source',
    ...getToolbarSettings(context),
    // event handlers
    ...getHandlers(context),
  };
}

function getToolbarSettings(context: IContext): CalendarOptions {
  return {
    customButtons: {
      backToDefaultLayout: {
        text: 'Home',
        click: () => {
          $tw.wiki.setText('$:/layout', 'text', '');
        },
      },
    },
    headerToolbar:
      isSmallScreen || context.hideToolbar === true
        ? false
        : {
            left: `prev,next today`,
            center: 'title',
            right: `${getInCalendarLayout() ? 'backToDefaultLayout ' : ''}dayGridMonth,timeGridWeek,timeGridThreeDay,timeGridDay,listWeek`,
          },
    footerToolbar:
      isSmallScreen && context.hideToolbar !== true
        ? {
            right: `today,prev,next`,
            left: `timeGridThreeDay,timeGridDay,listWeek${getInCalendarLayout() ? ' backToDefaultLayout' : ''}`,
          }
        : false,
  };
}
