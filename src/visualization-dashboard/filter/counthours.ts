/* eslint-disable unicorn/no-null */
/* eslint-disable @typescript-eslint/strict-boolean-expressions */
import { IFilterOperator } from 'tiddlywiki';
import { getDiffInHours } from './dateUtils';

/**
 * Count hours of input tiddlers.
 * We count tiddler's hour based on its `startDate` and `endDate` fields. Hour of a tiddler is calculated by `endDate - startDate`.
 *
 * ```
 * [all[tiddlers]!is[system]field:calendarEntry[yes]tag[Sleeping]] :filter[get[startDate]compare:date:gteq<weekstart>compare:date:lteq<now [UTC]YYYY0MM0DD0hh0mm0ssXXX>] +[counthours[]]
 * ```
 */
export const counthours = ((source, operator): string[] => {
  let result = 0;
  source(function(tiddler, title) {
    if (tiddler?.fields.startDate && tiddler.fields.endDate) {
      const startDate = $tw.utils.parseDate(tiddler.fields.startDate as string);
      const endDate = $tw.utils.parseDate(tiddler.fields.endDate as string);
      if (startDate === null || endDate === null) {
        return;
      }
      const hourDuration = getDiffInHours(endDate, startDate);
      result += hourDuration;
    }
  });
  return [String(result)];
}) satisfies IFilterOperator;
