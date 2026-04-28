import type { CalendarOptions, LocaleSingularArg } from '@fullcalendar/core';
import { getIsSmallScreen } from './constants';

export function getCustomViews(locale: LocaleSingularArg): CalendarOptions['views'] {
  return {
    timeGridThreeDay: {
      type: 'timeGrid',
      buttonText: locale === 'zh-cn' ? '3日' : (getIsSmallScreen() ? '3d' : '3 day'),
      duration: { days: 3 },
      // comment out this after https://github.com/fullcalendar/fullcalendar/issues/7129 solved. the duration option will override the visibleRange option
      // visibleRange: threeDayWith1Previous1NextVisibleRange,
    },
    timeGridDay: {
      type: 'timeGrid',
      duration: { days: 1 },
      buttonText: locale === 'zh-cn' ? '1日' : (getIsSmallScreen() ? '1d' : 'day'),
    },
    searchResultList: {
      type: 'listYear',
      duration: { years: 1000 },
    },
  };
}
