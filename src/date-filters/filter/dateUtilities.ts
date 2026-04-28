import type { Tiddler } from 'tiddlywiki';

export function getDateToCompareFromTiddler(tiddler: Tiddler, isTodayMinusInput: boolean): Date | undefined {
  if (isTodayMinusInput) {
    let dateEarlier: Date | null = null;
    if (tiddler.fields.endDate) {
      const endDate = $tw.utils.parseDate(tiddler.fields.endDate as string);
      if (endDate) {
        dateEarlier = endDate;
      }
    }
    if (dateEarlier === null && tiddler.fields.startDate) {
      const startDate = $tw.utils.parseDate(tiddler.fields.startDate as string);
      if (startDate) {
        dateEarlier = startDate;
      }
    }
    if (dateEarlier === null) {
      return;
    }
    return dateEarlier;
  }

  let dateLater: Date | null = null;
  if (tiddler.fields.startDate) {
    const startDate = $tw.utils.parseDate(tiddler.fields.startDate as string);
    if (startDate) {
      dateLater = startDate;
    }
  }
  if (dateLater === null && tiddler.fields.endDate) {
    const endDate = $tw.utils.parseDate(tiddler.fields.endDate as string);
    if (endDate) {
      dateLater = endDate;
    }
  }
  if (dateLater === null) {
    return;
  }
  return dateLater;
}

export function getDiffInDays(dateLater: Date, dateEarlier: Date): number {
  const differenceInTime = dateLater.getTime() - dateEarlier.getTime();
  return Math.round(differenceInTime / (1000 * 3600 * 24));
}

export function getDiffInHours(dateLater: Date, dateEarlier: Date): number {
  const differenceInTime = dateLater.getTime() - dateEarlier.getTime();
  return differenceInTime / (1000 * 3600);
}

export function getStartDateOfWeek(offset = 0): Date {
  const now = new Date();
  const currentDay = now.getDay() || 7;
  const difference = currentDay - 1 + (offset * 7);
  now.setDate(now.getDate() - difference);
  now.setHours(0, 0, 0, 0);
  return now;
}

export function getEndDateOfWeek(offset = 0): Date {
  const startDate = getStartDateOfWeek(offset);
  const endDate = new Date(startDate);
  endDate.setDate(startDate.getDate() + 6);
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
  const midpointTimestamp = (date1.getTime() + date2.getTime()) / 2;
  return new Date(midpointTimestamp);
}

export function countUniqueDays(dates: Date[]): number {
  const uniqueDays = new Set<string>();
  dates.forEach((date) => {
    uniqueDays.add(date.toISOString().split('T')[0]);
  });
  return uniqueDays.size;
}
