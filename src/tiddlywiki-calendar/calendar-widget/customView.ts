import type { CalendarOptions } from '@fullcalendar/core';
import moment from 'moment-timezone';
import { getIsSmallScreen, timeZoneOffset } from './constants';

function threeDayWith1Previous1NextVisibleRange(currentDate: Date) {
  // Generate a new date for manipulating in the next step
  let startDate: moment.Moment | Date | string = moment(currentDate);
  let endDate: moment.Moment | Date | string = moment(currentDate);

  // Adjust the start & end dates, respectively
  startDate = startDate
    .subtract(moment.duration({ day: 1 }))
    .add(timeZoneOffset)
    .format('YYYY-MM-DD'); // One day in the past
  endDate = endDate
    .add(moment.duration({ day: 2 }))
    .add(timeZoneOffset)
    .format('YYYY-MM-DD'); // One day into the future
  return { start: startDate, end: endDate };
}

export function getCustomViews(): CalendarOptions['views'] {
  return {
    timeGridThreeDay: {
      type: 'timeGrid',
      buttonText: getIsSmallScreen() ? '3d' : '3 day',
      duration: { days: 3 }, // comment out this after https://github.com/fullcalendar/fullcalendar/issues/7129 solved. the duration option will override the visibleRange option
      visibleRange: threeDayWith1Previous1NextVisibleRange,
    },
    timeGridDay: {
      type: 'timeGrid',
      duration: { days: 1 },
      buttonText: getIsSmallScreen() ? '1d' : 'day',
    },
  };
}
