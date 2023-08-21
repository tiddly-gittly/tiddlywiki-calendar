import { CalendarOptions } from '@fullcalendar/core';
import { getIsSmallScreen } from './constants';
import { IContext } from './initCalendar';

export function getSearchModeSettings(): CalendarOptions {
  return {
    initialView: 'filterList',
    nowIndicator: false,
    scrollTimeReset: true,
    droppable: false,
    editable: false,
    selectable: false,
    selectMirror: false,
    eventResizableFromStart: false,
    eventDurationEditable: false,
    eventStartEditable: false,
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
