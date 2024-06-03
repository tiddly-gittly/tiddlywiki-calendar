/* eslint-disable unicorn/no-null */
/* eslint-disable @typescript-eslint/strict-boolean-expressions */
import { IFilterOperator } from 'tiddlywiki';

/**
 * Add weekday to the input date (usually be a week-start date)
 *
 * ```
 * [weekstart[]addweekday[]]
 * ```
 *
 * ```
 * [weekstart[]addweekday[4]]
 * ```
 */
export const addweekday = ((source, operator): string[] => {
  const results: string[] = [];
  const providedDay = Number(operator.operand);
  const day = (operator.operand !== '' && Number.isInteger(providedDay)) ? providedDay : new Date().getDay();
  source(function(tiddler, title) {
    const oldDate = $tw.utils.parseDate(title);
    if (oldDate) {
      const newDate = oldDate.getTime() + (day - 1) * 86_400_000;
      const newDateString = $tw.utils.stringifyDate(new Date(newDate));
      results.push(newDateString);
    }
  });
  return results;
}) satisfies IFilterOperator;
