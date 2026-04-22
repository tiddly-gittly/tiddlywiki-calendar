import type { DurationInput } from '@fullcalendar/core';

/** Length of a single all-day event, in milliseconds. */
export const allDayDateLength = 60 * 60 * 24 * 1000;

/** Parse a TiddlyWiki UTC date string. Throws if the value is not a valid date. */
export const parseTwDate = (twDate: string): Date => {
  const result = $tw.utils.parseDate(twDate);
  if (result === null) throw new Error('null result from parseDate');
  return result;
};

/** Like {@link parseTwDate} but returns `undefined` instead of throwing on missing/invalid input. */
export const safeParseTwDate = (twDate: unknown): Date | undefined => {
  if (typeof twDate !== 'string' || twDate.trim() === '') return undefined;
  return $tw.utils.parseDate(twDate) ?? undefined;
};

const toRRuleDateString = (date: Date, allDay: boolean): string => {
  if (allDay) {
    return date.toISOString().slice(0, 10).replaceAll('-', '');
  }
  return date.toISOString().replaceAll('-', '').replaceAll(':', '').replace(/\.\d{3}Z$/, 'Z');
};

/** Build a FullCalendar duration input from start/end timestamps. */
export const toDurationInput = (start: Date, end: Date): DurationInput => ({ milliseconds: end.getTime() - start.getTime() });

/**
 * Normalize a user-supplied RRULE string for `rrule`/FullCalendar consumption.
 *
 * Users typically only fill the `RRULE:` body (e.g. `FREQ=WEEKLY`); this helper
 * adds the `RRULE:` prefix and a `DTSTART:` line derived from `start` when missing.
 */
export const normalizeRRule = (rrule: string, start?: Date, allDay = false): string => {
  const trimmedRule = rrule.trim();
  if (trimmedRule === '') return trimmedRule;
  if (/^DTSTART:/m.test(trimmedRule)) return trimmedRule;
  const normalizedRule = /^RRULE:/m.test(trimmedRule) ? trimmedRule : `RRULE:${trimmedRule}`;
  if (start === undefined) return normalizedRule;
  return `DTSTART:${toRRuleDateString(start, allDay)}\n${normalizedRule}`;
};

/** True when `start` and `end` describe a 24-hour all-day span. */
export const isAllDaySpan = (start: Date | undefined, end: Date | undefined): boolean =>
  start !== undefined && end !== undefined && end.getTime() - start.getTime() === allDayDateLength;
