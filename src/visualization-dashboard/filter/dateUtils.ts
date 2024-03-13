/* eslint-disable unicorn/no-null */
/* eslint-disable @typescript-eslint/strict-boolean-expressions */
import type { Tiddler } from 'tiddlywiki';

export function getDateToCompare(tiddler: Tiddler, isTodayMinusInput: boolean): Date | undefined {
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
      return;
    }
    return dateEarlier;
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
      return;
    }
    return dateLater;
  }
}

export function getDiffInDays(dateLater: Date, dateEarlier: Date): number {
  // Calculating the time difference
  // of two dates
  const differenceInTime = dateLater.getTime() - dateEarlier.getTime();

  // Calculating the no. of days between
  // two dates
  const differenceInDays = Math.round(differenceInTime / (1000 * 3600 * 24));
  return differenceInDays;
}

export function getDiffInHours(dateLater: Date, dateEarlier: Date): number {
  // Calculating the time difference
  // of two dates
  const differenceInTime = dateLater.getTime() - dateEarlier.getTime();

  // Calculating the no. of days between
  // two dates
  const differenceInDays = Math.round(differenceInTime / (1000 * 3600));
  return differenceInDays;
}
