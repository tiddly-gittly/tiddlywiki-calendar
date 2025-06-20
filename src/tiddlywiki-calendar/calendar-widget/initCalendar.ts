/* eslint-disable @typescript-eslint/prefer-nullish-coalescing */
/* eslint-disable @typescript-eslint/strict-boolean-expressions */
import 'requestidlecallback-polyfill';
import adaptivePlugin from '@fullcalendar/adaptive';
import { Calendar, type CalendarOptions } from '@fullcalendar/core';
import zhLocale from '@fullcalendar/core/locales/zh-cn';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list';
import momentTimezonePlugin from '@fullcalendar/moment-timezone';
import timeGridPlugin from '@fullcalendar/timegrid';
import moment from 'moment-timezone';
import type { Widget } from 'tiddlywiki';
import { getInCalendarLayout, getIsSearchMode, getIsSmallScreen, isMobile, tiddlerEventSourceID } from './constants';
import { getCustomButtons, setToolbarIcons } from './customButtons';
import { getCustomViews } from './customView';
import { enableSidebarDraggable } from './enableDraggable';
import { getEventContent } from './eventContent';
import { getEventByFilter, getEventOnFullCalendarViewChange } from './getEvents';
import { getHandlers } from './handlers';
import { getSearchModeSettings } from './searchMode';

export interface IContext {
  containerElement?: HTMLDivElement | undefined;
  /**
   * When adding tiddler in the calender, add these tags by default.
   */
  defaultTags?: string[];
  draggableContainerElement?: HTMLDivElement | undefined;
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
  /** a custom filter to hide some tiddlers' details from the calendar. They will shown as "Occupied" */
  obscureFilter?: string;
  /** Parent widget of the calendar widget */
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
  /** The calendar widget */
  widget?: Widget;
}
export function initCalendar(containerElement: HTMLDivElement, context: IContext) {
  const calendar = new Calendar(containerElement, getSettings(context));
  const originalRender = calendar.render.bind(calendar);
  calendar.render = function render() {
    originalRender();
    setToolbarIcons();
  };
  enableSidebarDraggable(context);
  return calendar;
}

export function getSettings(context: IContext): CalendarOptions {
  const now = context.initialDate === undefined ? undefined : $tw.utils.parseDate(context.initialDate) ?? undefined;
  const use24HourFormat = $tw.wiki.getTiddlerText('$:/plugins/linonetwo/tw-calendar/settings/24hour') === 'yes';
  const locale = $tw.wiki.getTiddlerText('$:/language') === '$:/languages/zh-Hans' ? 'zh-cn' : 'en-gb';
  const searchMode = getIsSearchMode();
  return {
    locale,
    locales: [zhLocale],
    firstDay: Number($tw.wiki.getTiddlerText('$:/plugins/linonetwo/tw-calendar/settings/firstDay') || '1') || 1,
    eventSources: [{ events: searchMode ? getEventByFilter(context) : getEventOnFullCalendarViewChange(context), id: tiddlerEventSourceID }],
    plugins: [momentTimezonePlugin, dayGridPlugin, timeGridPlugin, listPlugin, adaptivePlugin, interactionPlugin],
    views: getCustomViews(locale),
    initialView: context.initialView ??
      (getIsSmallScreen() ? 'timeGridThreeDay' : ($tw.wiki.getTiddlerText('$:/plugins/linonetwo/tw-calendar/settings/wideScreenDefaultView') || 'timeGridWeek')),
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
    /**
     * This prevent mouse wheel, but is necessary on mobile
     * workaround for https://github.com/fullcalendar/fullcalendar/issues/7285
     */
    dragScroll: isMobile,
    schedulerLicenseKey: 'CC-Attribution-NonCommercial-NoDerivatives',
    ...getToolbarSettings(context),
    // event handlers
    ...getHandlers(context),
    ...(searchMode ? getSearchModeSettings() : {}),
  };
}

function getToolbarSettings(context: IContext): CalendarOptions {
  const searchMode = getIsSearchMode();
  const calendarLayout = getInCalendarLayout();
  // searchMode only show back button in $:/plugins/linonetwo/tw-calendar/tiddlywiki-ui/PageLayout/EventsCalendarSearchLayout, no day jump buttons
  if (searchMode) {
    return {
      headerToolbar: false,
      footerToolbar: false,
    };
  }
  return {
    customButtons: getCustomButtons(context),
    headerToolbar: getIsSmallScreen() || context.hideToolbar === true
      ? false
      : {
        // we can't add a date picker to title, so have to add prevYear,nextYear here to quick navigate between long time
        left: `prev,next prevYear,nextYear today searchLayout`,
        center: 'title',
        right: `${calendarLayout ? 'backToStandardLayout ' : ''}dayGridMonth,timeGridWeek,timeGridThreeDay,timeGridDay,listWeek toggleSidebar`,
      },
    footerToolbar: getIsSmallScreen() && context.hideToolbar !== true
      ? {
        right: `toggleSidebar today,prev,next`,
        left: `timeGridThreeDay,timeGridDay,listWeek${calendarLayout ? ' backToStandardLayout' : ''}`,
      }
      : false,
  };
}
