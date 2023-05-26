import type { Calendar } from '@fullcalendar/core';

export function changedTiddlerInViewRange(changedTiddlerTitle: string, calendar: Calendar | undefined, endDateKey = 'endDate'): boolean {
  const tiddler = $tw.wiki.getTiddler(changedTiddlerTitle);
  const isCalendarEntry = (tiddler?.fields?.calendarEntry as string | undefined) === 'yes';
  if (!isCalendarEntry) return false;
  let modified = tiddler?.fields?.modified as string | Date | undefined | null;
  let endDate = tiddler?.fields?.[endDateKey] as string | Date | undefined | null;
  if (typeof modified === 'string') modified = $tw.utils.parseDate(modified);
  if (typeof endDate === 'string') endDate = $tw.utils.parseDate(endDate);
  if (modified === null || endDate === null) return false;
  const { activeStart, activeEnd } = calendar?.view ?? {};
  if (activeStart === undefined || activeEnd === undefined) return false;
  if (modified !== undefined && modified > activeStart && modified < activeEnd) return true;
  if (endDate !== undefined && endDate > activeStart && endDate < activeEnd) return true;
  return false;
}
