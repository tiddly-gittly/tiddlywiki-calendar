/* eslint-disable @typescript-eslint/strict-boolean-expressions */
import { rrulestr } from 'rrule';
import { isAllDaySpan, normalizeRRule, safeParseTwDate } from '../../tiddlywiki-calendar/calendar-widget/rrule';

const allDayDateLength = 60 * 60 * 24 * 1000;

type TrackerItem = {
  color?: string;
  nextDue: string;
  nextDueTimestamp?: number;
  progress: number;
  remainingDays?: number;
  title: string;
  label: string;
};

const clamp = (value: number, min: number, max: number): number => Math.min(Math.max(value, min), max);

const formatDueDate = (date?: Date): string => {
  if (date === undefined) return '';
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
};

const resolveCalendarEntryColor = (fields: Record<string, unknown>): string | undefined => {
  if (typeof fields.color === 'string' && fields.color.trim() !== '') return fields.color;
  if (!Array.isArray(fields.tags)) return undefined;
  return fields.tags
    .map((tagName) => typeof tagName === 'string' ? $tw.wiki.getTiddler(tagName)?.fields?.color : undefined)
    .find((color): color is string => typeof color === 'string' && color.trim() !== '');
};

const buildTrackerItem = (title: string, now: Date): TrackerItem | undefined => {
  const tiddler = $tw.wiki.getTiddler(title);
  const fields = tiddler?.fields;
  if (!fields || typeof fields.rrule !== 'string' || fields.rrule.trim() === '') return undefined;
  const start = safeParseTwDate(fields.startDate);
  const end = safeParseTwDate(fields.endDate);
  const allDay = isAllDaySpan(start, end);
  const recurringRule = rrulestr(normalizeRRule(fields.rrule, start, allDay));
  const previousOccurrence = recurringRule.before(now, true);
  const nextOccurrence = recurringRule.after(now, false) ?? recurringRule.after(now, true);
  let progress = 0;
  if (previousOccurrence !== null && nextOccurrence !== null) {
    const totalDuration = nextOccurrence.getTime() - previousOccurrence.getTime();
    const elapsedDuration = now.getTime() - previousOccurrence.getTime();
    progress = totalDuration > 0 ? clamp(Math.round((elapsedDuration / totalDuration) * 100), 0, 100) : 0;
  } else if (nextOccurrence === null) {
    progress = 100;
  }
  return {
    color: resolveCalendarEntryColor(fields),
    nextDue: formatDueDate(nextOccurrence ?? undefined),
    nextDueTimestamp: nextOccurrence?.getTime(),
    progress,
    remainingDays: nextOccurrence === null ? undefined : Math.max(0, Math.ceil((nextOccurrence.getTime() - now.getTime()) / allDayDateLength)),
    title,
    label: typeof fields.caption === 'string' && fields.caption.trim() !== '' ? fields.caption : title,
  };
};

exports.name = 'subscriptiontrackerdata';

exports.params = [];

exports.run = function run(): string {
  const gaugeTitle = this.getVariable('currentTiddler');
  const gaugeFields = gaugeTitle ? $tw.wiki.getTiddler(gaugeTitle)?.fields : undefined;
  const selectedTitlesText = gaugeFields?.targetTiddler;
  const selectedTitles = typeof selectedTitlesText === 'string'
    ? ($tw.wiki.tiddlerExists(selectedTitlesText) ? [selectedTitlesText] : $tw.utils.parseStringArray(selectedTitlesText))
    : [];
  const fallbackFilter = typeof gaugeFields?.targetTiddlerFilter === 'string' && gaugeFields.targetTiddlerFilter.trim() !== ''
    ? gaugeFields.targetTiddlerFilter
    : '[all[tiddlers]field:calendarEntry[yes]has[rrule]]';
  const titles = selectedTitles.length > 0 ? selectedTitles : $tw.wiki.filterTiddlers(fallbackFilter);
  const now = new Date();
  const items = titles
    .map((title) => buildTrackerItem(title, now))
    .filter((item): item is TrackerItem => item !== undefined)
    .sort((left, right) => {
      if (left.nextDueTimestamp === undefined && right.nextDueTimestamp === undefined) return left.label.localeCompare(right.label);
      if (left.nextDueTimestamp === undefined) return 1;
      if (right.nextDueTimestamp === undefined) return -1;
      return left.nextDueTimestamp - right.nextDueTimestamp;
    });
  return JSON.stringify({ items });
};