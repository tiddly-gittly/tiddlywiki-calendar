/* eslint-disable unicorn/no-null */
/* eslint-disable @typescript-eslint/strict-boolean-expressions */
import { IFilterOperator } from 'tiddlywiki';

/**
 * Count days between input and today.
 * If input is earlier than today (or the operand), you will get positive result.
 * If input is later than today (or the operand), to get positive result, use `!` prefix.
 *
 * ```
 * [[CountUpDayExampleTiddler]!daysbetween[]]
 * ```
 */
export const daysbetween = ((source, operator): string[] => {
  // ! means `input - today`, which is reverse of traditional `end - start`
  const isTodayMinusInput = operator.prefix !== '!';
  let dayToTest: Date | null = null;
  if (operator.operands[0]) {
    dayToTest = $tw.utils.parseDate(operator.operands[0]);
  }
  if (dayToTest === null) {
    dayToTest = new Date();
  }
  const results: string[] = [];
  source(function(tiddler, _title) {
    if (tiddler) {
      if (isTodayMinusInput) {
        // today is later than input, so minus input's endDate, which is near input (today)
        let dateEarlier: Date | null = null;
        if (tiddler.fields.endDate) {
          const endDate = $tw.utils.parseDate(tiddler.fields.endDate as string);
          if (endDate) {
            dateEarlier = endDate;
          }
        }
        // fallback to startDate if endDate is not available
        if (dateEarlier === null && tiddler.fields.startDate) {
          const startDate = $tw.utils.parseDate(tiddler.fields.startDate as string);
          if (startDate) {
            dateEarlier = startDate;
          }
        }
        if (dateEarlier === null) {
          // if input tiddler don't have date fields, skip it by return empty string
          results.push('');
          return;
        }
        const diffInDays = getDiffInDays(dayToTest, dateEarlier);
        results.push(String(diffInDays));
      } else {
        // today is earlier than input, so let input minus today's date, which is near input (today)
        let dateLater: Date | null = null;
        if (tiddler.fields.startDate) {
          const startDate = $tw.utils.parseDate(tiddler.fields.startDate as string);
          if (startDate) {
            dateLater = startDate;
          }
        }
        // fallback to endDate if startDate is not available
        if (dateLater === null && tiddler.fields.endDate) {
          const endDate = $tw.utils.parseDate(tiddler.fields.endDate as string);
          if (endDate) {
            dateLater = endDate;
          }
        }
        if (dateLater === null) {
          // if input tiddler don't have date fields, skip it by return empty string
          results.push('');
          return;
        }
        const diffInDays = getDiffInDays(dateLater, dayToTest);
        results.push(String(diffInDays));
      }
    }
  });
  return results;
}) satisfies IFilterOperator;

function getDiffInDays(dateLater: Date, dateEarlier: Date): number {
  // Calculating the time difference
  // of two dates
  const differenceInTime = dateLater.getTime() - dateEarlier.getTime();

  // Calculating the no. of days between
  // two dates
  const differenceInDays = Math.round(differenceInTime / (1000 * 3600 * 24));
  return differenceInDays;
}
