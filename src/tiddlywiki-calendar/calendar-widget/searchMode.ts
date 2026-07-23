import { CalendarOptions } from '@fullcalendar/core';
import { getIsSmallScreen } from './constants';
import { IContext } from './initCalendar';

export function getSearchModeSettings(): CalendarOptions {
  return {
    initialView: 'searchResultList',
    nowIndicator: false,
    scrollTimeReset: true,
    droppable: false,
    editable: false,
    selectable: false,
    selectMirror: false,
    eventResizableFromStart: false,
    eventDurationEditable: false,
    eventStartEditable: false,
    /**
     * Work with `duration: { years: 1000 }` of `searchResultList` in `customView.ts` so matching
     * tiddlers from any year can appear in one list (FullCalendar otherwise truncates list views).
     * Recurring events must NOT pass unbounded RRULE in search mode — see `getEvents.ts`.
     * @url https://github.com/fullcalendar/fullcalendar/issues/7432
     */
    initialDate: '1500-01-01',
  };
}

export function getSearchModeToolbarSettings(context: IContext): CalendarOptions {
  return {
    headerToolbar: getIsSmallScreen() || context.hideToolbar === true
      ? false
      : {
        // Use prev next for changing limit of search result
        left: `prev,next`,
        center: 'title',
      },
    footerToolbar: getIsSmallScreen() && context.hideToolbar !== true
      ? {
        right: `prev,next`,
        center: 'title',
      }
      : false,
  };
}
