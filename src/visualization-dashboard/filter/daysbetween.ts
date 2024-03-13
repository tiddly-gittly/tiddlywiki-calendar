/* eslint-disable unicorn/no-null */
/* eslint-disable @typescript-eslint/strict-boolean-expressions */
import { IFilterOperator } from 'tiddlywiki';
import { getDateToCompareFromTiddler, getDateToCompareOrTodayFromOperand, getDiffInDays } from './dateUtils';

/**
 * Count days between input and today.
 * If input is earlier than today (or the operand), you will get positive result.
 * If input is later than today (or the operand), to get positive result, use `!` prefix.
 *
 * ```
 * [[CountUpDayExampleTiddler]daysbetween[]]
 * ```
 */
export const daysbetween = ((source, operator): string[] => {
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
      const diffInDays = isTodayMinusInput ? getDiffInDays(dayToTest, dateToCompare) : getDiffInDays(dateToCompare, dayToTest);
      results.push(String(diffInDays));
    }
  });
  return results;
}) satisfies IFilterOperator;
