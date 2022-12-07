import type { Widget } from 'tiddlywiki';
import { Calendar, CalendarOptions } from '@fullcalendar/core';
import momentTimezonePlugin from '@fullcalendar/moment-timezone';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import adaptivePlugin from '@fullcalendar/adaptive';
import interactionPlugin from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list';
import moment from 'moment-timezone';
import type { h } from 'preact';
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
    eventContent(argument, createElement: typeof h) {
      const titleElement = createElement('div', {}, argument.event.title);
      const timeElement = createElement('div', {}, argument.timeText);
      const tiddler = $tw.wiki.getTiddler(argument.event.title);
      if (tiddler === undefined) {
        return [titleElement, timeElement];
      }
      const tagsElement = createElement(
        'div',
        { class: 'fc-event-main-tags' },
        tiddler.fields.tags.map((tag) => createElement('span', {}, tag)),
      );
      // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
      const captionElement = typeof tiddler.fields.caption === 'string' ? createElement('div', {}, tiddler.fields.caption) : undefined;
      return [captionElement, tagsElement, timeElement];
    },
    timeZone: context.timeZone ?? moment.tz.guess(),
    navLinks: true,
    editable: true,
    selectable: true,
    droppable: true,
    rerenderDelay: 100,
    longPressDelay: 250,
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
