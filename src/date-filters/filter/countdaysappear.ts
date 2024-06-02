/* eslint-disable unicorn/no-null */
/* eslint-disable @typescript-eslint/strict-boolean-expressions */
import { IFilterOperator } from 'tiddlywiki';
import { countUniqueDays, getMidpointDate } from './dateUtils';

/**
 * Count how many days of input tiddlers appear, more than one times in a day count as 1 time.
 * We count tiddler's time point based on center of its `startDate` and `endDate` fields.
 *
 * ```
 * [all[tiddlers]!is[system]field:calendarEntry[yes]tag[Sleeping]] :filter[get[startDate]compare:date:gteq<weekstart>compare:date:lteq<now [UTC]YYYY0MM0DD0hh0mm0ssXXX>] +[countdaysappear[]]
 * ```
 */
export const countdaysappear = ((source, operator): string[] => {
  const datePoints: Date[] = [];
  source(function(tiddler, title) {
    let datePoint: Date | null = null;
    if (tiddler?.fields.startDate && tiddler.fields.endDate) {
      const startDate = $tw.utils.parseDate(tiddler.fields.startDate as string);
      const endDate = $tw.utils.parseDate(tiddler.fields.endDate as string);
      datePoint = getMidpointDate(endDate, startDate);
    }
    // if we only have startDate, use startDate as datePoint
    if (datePoint === null && tiddler?.fields.startDate) {
      const startDate = $tw.utils.parseDate(tiddler.fields.startDate as string);
      datePoint = startDate;
    }
    // if we only have endDate, use endDate as datePoint
    if (datePoint === null && tiddler?.fields.endDate) {
      const endDate = $tw.utils.parseDate(tiddler.fields.endDate as string);
      datePoint = endDate;
    }
    if (datePoint === null) return;
    datePoints.push(datePoint);
  });
  return [countUniqueDays(datePoints).toString()];
}) satisfies IFilterOperator;
