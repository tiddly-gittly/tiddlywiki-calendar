/* eslint-disable unicorn/no-null */
/* eslint-disable @typescript-eslint/strict-boolean-expressions */
import type { Tiddler } from 'tiddlywiki';

export function getDateToCompareFromTiddler(tiddler: Tiddler, isTodayMinusInput: boolean): Date | undefined {
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

  // Calculating the no. of hours between
  // two dates
  // to 3 precision
  const differenceInHours = differenceInTime / (1000 * 3600);
  return differenceInHours;
}

/**
 * Get start date of this week, accept a param, if is 0 means get start of this week, if is 1 means get start of last week, if is 2 means get start of last last week. If is -1 means get start of next week (end of this week), and so on.
 * @param offset how many weeks to last week, default is 0 means this week. 1 means last week.
 * @returns
 */
export function getStartDateOfWeek(offset: number = 0): Date {
  const now = new Date();
  // Adjusting so that Monday is considered the first day of the week
  const currentDay = now.getDay() || 7;
  // If it's Monday, currentDay is 1, and we want to subtract 0 days.
  // If it's Tuesday, currentDay is 2, and we want to subtract 1 day, etc.
  const difference = currentDay - 1 + (offset * 7);
  now.setDate(now.getDate() - difference);

  // Resetting the hours, minutes, seconds, and milliseconds to get the start of the day
  now.setHours(0, 0, 0, 0);

  return now;
}

/**
 * Get end date of this week, accept a param, if is 0 means get end of this week, if is 1 means get end of last week, if is 2 means get end of last last week. If is -1 means get end of next week (start of next next week), and so on.
 * @param offset how many weeks to last week, default is 0 means this week. 1 means last week.
 * @returns
 */
export function getEndDateOfWeek(offset: number = 0): Date {
  // Get the start date of the week based on the offset
  const startDate = getStartDateOfWeek(offset);

  // Add 6 days to get the end date of the week (Sunday)
  const endDate = new Date(startDate);
  endDate.setDate(startDate.getDate() + 6);

  // Resetting the hours, minutes, seconds, and milliseconds to get the end of the day
  endDate.setHours(23, 59, 59, 999);

  return endDate;
}

export function getDateToCompareOrTodayFromOperand(operand: string | undefined): Date {
  let dayToCompare: Date | null = null;
  if (operand) {
    dayToCompare = $tw.utils.parseDate(operand);
  }
  if (dayToCompare === null) {
    dayToCompare = new Date();
  }
  return dayToCompare;
}

export function getMidpointDate(date1: Date | null, date2: Date | null): Date | null {
  if (date1 === null || date2 === null) {
    return null;
  }
  // Get the timestamps of the two dates
  const timestamp1 = date1.getTime();
  const timestamp2 = date2.getTime();

  // Calculate the midpoint timestamp
  const midpointTimestamp = (timestamp1 + timestamp2) / 2;

  // Convert the midpoint timestamp back to a date and return it
  return new Date(midpointTimestamp);
}

export function countUniqueDays(dates: Date[]): number {
  const uniqueDays = new Set<string>();

  dates.forEach(date => {
    // Convert the date to a YYYY-MM-DD string
    const dateString = date.toISOString().split('T')[0];
    uniqueDays.add(dateString);
  });

  return uniqueDays.size;
}
