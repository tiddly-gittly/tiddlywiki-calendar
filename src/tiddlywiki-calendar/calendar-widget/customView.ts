import type { CalendarOptions } from '@fullcalendar/core';
import { getIsSmallScreen } from './constants';
import { lingo } from './lingo';

export function getCustomViews(): CalendarOptions['views'] {
  return {
    timeGridThreeDay: {
      type: 'timeGrid',
      buttonText: lingo(getIsSmallScreen() ? 'CalendarView/ThreeDay/Short' : 'CalendarView/ThreeDay/Long'),
      duration: { days: 3 },
      // comment out this after https://github.com/fullcalendar/fullcalendar/issues/7129 solved. the duration option will override the visibleRange option
      // visibleRange: threeDayWith1Previous1NextVisibleRange,
    },
    timeGridDay: {
      type: 'timeGrid',
      duration: { days: 1 },
      buttonText: lingo(getIsSmallScreen() ? 'CalendarView/Day/Short' : 'CalendarView/Day/Long'),
    },
    searchResultList: {
      type: 'listYear',
      duration: { years: 1000 },
    },
  };
}
