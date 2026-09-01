import type { Calendar } from '@fullcalendar/core';

export function changedTiddlerInViewRange(
  changedTiddlerTitle: string,
  calendar: Calendar | undefined,
  endDateKey = 'endDate',
  startDateKey = 'startDate',
): boolean {
  const tiddler = $tw.wiki.getTiddler(changedTiddlerTitle);
  const isCalendarEntry = tiddler?.fields.calendarEntry === 'yes';
  if (!isCalendarEntry) return false;
  // A recurring event can have an occurrence in the active view even when its stored
  // start/end dates are outside it. Always refetch these events after a field change,
  // including when `status: tentative` is removed to confirm an event.
  if (typeof tiddler.fields.rrule === 'string' && tiddler.fields.rrule.trim() !== '') return true;
  let modified = tiddler.fields.modified as string | Date | undefined | null;
  let startDate = tiddler.fields[startDateKey] as string | Date | undefined | null;
  let endDate = tiddler.fields[endDateKey] as string | Date | undefined | null;
  if (typeof modified === 'string') modified = $tw.utils.parseDate(modified);
  if (typeof startDate === 'string') startDate = $tw.utils.parseDate(startDate);
  if (typeof endDate === 'string') endDate = $tw.utils.parseDate(endDate);
  const { activeStart, activeEnd } = calendar?.view ?? {};
  if (activeStart === undefined || activeEnd === undefined) return false;
  // FullCalendar treats all-day end dates as exclusive. Checking interval overlap
  // also covers events that span the entire active view or end on its boundary.
  if (startDate instanceof Date && endDate instanceof Date && startDate < activeEnd && endDate > activeStart) return true;
  if (startDate instanceof Date && startDate >= activeStart && startDate < activeEnd) return true;
  if (modified instanceof Date && modified > activeStart && modified < activeEnd) return true;
  if (endDate instanceof Date && endDate > activeStart && endDate <= activeEnd) return true;
  return false;
}
