import { CalendarOptions } from '@fullcalendar/core';

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
