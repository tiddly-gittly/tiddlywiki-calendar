/* eslint-disable unicorn/no-null */
/* eslint-disable @typescript-eslint/strict-boolean-expressions */
import { IFilterOperator } from 'tiddlywiki';
import { getDateToCompareFromTiddler, getDateToCompareOrTodayFromOperand, getDiffInHours } from './dateUtils';

/**
 * Count hours between input and today.
 * If input is earlier than today (or the operand), you will get positive result.
 * If input is later than today (or the operand), to get positive result, use `!` prefix.
 *
 * ```
 * [[CountUpDayExampleTiddler]hoursbetween[]]
 * ```
 */
export const hoursbetween = ((source, operator): string[] => {
  // ! means `input - today`, which is reverse of traditional `end - start`
  const isTodayMinusInput = operator.prefix !== '!';
  const dayToTest = getDateToCompareOrTodayFromOperand(operator.operands[0]);
  const results: string[] = [];
  source(function(tiddler, _title) {
    if (tiddler) {
      // ! means `input - today`, which is reverse of traditional `end - start`
      const dateToCompare = getDateToCompareFromTiddler(tiddler, isTodayMinusInput);
      if (dateToCompare === undefined) {
        // if input tiddler don't have date fields, skip it by return empty string
        results.push('');
        return;
      }
      const diffInHours = isTodayMinusInput ? getDiffInHours(dayToTest, dateToCompare) : getDiffInHours(dateToCompare, dayToTest);
      results.push(diffInHours.toFixed(2));
    }
  });
  return results;
}) satisfies IFilterOperator;
