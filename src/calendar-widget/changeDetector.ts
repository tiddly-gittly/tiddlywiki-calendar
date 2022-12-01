import type { Calendar } from '@fullcalendar/core';

export function changedTiddlerInViewRange(changedTiddlerTitle: string, calendar: Calendar | undefined): boolean {
  const tiddler = $tw.wiki.getTiddler(changedTiddlerTitle);
  const modified = tiddler?.fields?.modified;
  const { activeStart, activeEnd } = calendar?.view ?? {};
  if (activeStart === undefined || activeEnd === undefined) return false;
  if (modified === undefined) return false;
  if (modified < activeStart) return false;
  if (modified > activeEnd) return false;
  return true;
}
