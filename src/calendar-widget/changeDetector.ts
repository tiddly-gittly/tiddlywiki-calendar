import type { Calendar } from '@fullcalendar/core';

export function changedTiddlerInViewRange(changedTiddlerTitle: string, calendar: Calendar | undefined, endDateKey = 'endDate'): boolean {
  const tiddler = $tw.wiki.getTiddler(changedTiddlerTitle);
  let modified = tiddler?.fields?.modified as string | Date | undefined;
  let endDate = tiddler?.fields?.[endDateKey] as string | Date | undefined;
  if (typeof modified === 'string') modified = $tw.utils.parseDate(modified);
  if (typeof endDate === 'string') endDate = $tw.utils.parseDate(endDate);
  const { activeStart, activeEnd } = calendar?.view ?? {};
  if (activeStart === undefined || activeEnd === undefined) return false;
  if (modified !== undefined && modified > activeStart && modified < activeEnd) return true;
  if (endDate !== undefined && endDate > activeStart && endDate < activeEnd) return true;
  return false;
}
