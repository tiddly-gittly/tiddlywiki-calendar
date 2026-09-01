import { lingo } from '../calendar-widget/lingo';
import { formatUntil, parseRule, stripNormalizedRule } from './rrule-utilities';

type MacroDefinition = {
  name: string;
  params: Array<{ name: string; default: string }>;
  run: (rrule: string) => string;
};

const macro = exports as MacroDefinition;

macro.name = 'rrule-summary-macro';

macro.params = [
  { name: 'rrule', default: '' },
];

macro.run = (rrule: string): string => {
  const body = stripNormalizedRule(rrule);
  const labels = {
    none: lingo('Modal/CreateEvent/Recurrence/None'),
    daily: lingo('Modal/CreateEvent/Recurrence/Daily'),
    weekly: lingo('Modal/CreateEvent/Recurrence/Weekly'),
    monthly: lingo('Modal/CreateEvent/Recurrence/Monthly'),
    yearly: lingo('Modal/CreateEvent/Recurrence/Yearly'),
    dayUnit: lingo('Modal/CreateEvent/RecurrenceUnit/Day'),
    weekUnit: lingo('Modal/CreateEvent/RecurrenceUnit/Week'),
    monthUnit: lingo('Modal/CreateEvent/RecurrenceUnit/Month'),
    yearUnit: lingo('Modal/CreateEvent/RecurrenceUnit/Year'),
    daysUnit: lingo('Modal/CreateEvent/RecurrenceUnit/Days'),
    weeksUnit: lingo('Modal/CreateEvent/RecurrenceUnit/Weeks'),
    monthsUnit: lingo('Modal/CreateEvent/RecurrenceUnit/Months'),
    yearsUnit: lingo('Modal/CreateEvent/RecurrenceUnit/Years'),
    until: lingo('Modal/CreateEvent/Label/Until'),
    times: lingo('Modal/CreateEvent/Label/Times'),
    every: lingo('Modal/CreateEvent/RecurrenceSummary/Every'),
    countPrefix: lingo('Modal/CreateEvent/RecurrenceSummary/CountPrefix'),
    separator: lingo('Modal/CreateEvent/RecurrenceSummary/Separator'),
  };
  if (body === '') return labels.none;

  const ruleMap = parseRule(body);
  const freq = ruleMap.get('FREQ');
  if (freq === undefined) return body;

  const frequencyMap: Partial<Record<string, string>> = {
    DAILY: labels.daily,
    WEEKLY: labels.weekly,
    MONTHLY: labels.monthly,
    YEARLY: labels.yearly,
  };
  const intervalUnitMap: Partial<Record<string, string>> = {
    DAILY: labels.daysUnit,
    WEEKLY: labels.weeksUnit,
    MONTHLY: labels.monthsUnit,
    YEARLY: labels.yearsUnit,
  };
  const interval = ruleMap.get('INTERVAL');
  const count = ruleMap.get('COUNT');
  const until = ruleMap.get('UNTIL');

  const segments: string[] = [];
  const intervalUnit = intervalUnitMap[freq];
  if (interval !== undefined && interval !== '1' && intervalUnit !== undefined) {
    segments.push(`${labels.every} ${interval} ${intervalUnit}`);
  } else {
    segments.push(frequencyMap[freq] ?? freq);
  }

  if (count !== undefined) {
    segments.push(`${labels.countPrefix} ${count} ${labels.times}`);
  }

  if (until !== undefined) {
    segments.push(`${labels.until} ${formatUntil(until)}`);
  }

  const knownKeys = new Set(['FREQ', 'INTERVAL', 'COUNT', 'UNTIL']);
  const unknownKeys = [...ruleMap.keys()].filter((key) => !knownKeys.has(key));
  if (unknownKeys.length > 0) {
    segments.push(body);
  }

  return segments.join(labels.separator);
};
