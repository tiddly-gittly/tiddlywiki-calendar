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
  const languageTitle = $tw.wiki.getTiddlerText('$:/language') ?? '$:/languages/en-GB';
  const languageCode = languageTitle.split('/').pop() ?? 'en-GB';
  const isChinese = languageCode.startsWith('zh');
  const labels = isChinese
    ? {
      none: '不循环',
      daily: '每日',
      weekly: '每周',
      monthly: '每月',
      yearly: '每年',
      dayUnit: '天',
      weekUnit: '周',
      monthUnit: '月',
      yearUnit: '年',
      until: '直到',
      times: '次',
    }
    : {
      none: 'No Repeat',
      daily: 'Daily',
      weekly: 'Weekly',
      monthly: 'Monthly',
      yearly: 'Yearly',
      dayUnit: 'day',
      weekUnit: 'week',
      monthUnit: 'month',
      yearUnit: 'year',
      until: 'Until',
      times: 'times',
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
    DAILY: labels.dayUnit,
    WEEKLY: labels.weekUnit,
    MONTHLY: labels.monthUnit,
    YEARLY: labels.yearUnit,
  };
  const interval = ruleMap.get('INTERVAL');
  const count = ruleMap.get('COUNT');
  const until = ruleMap.get('UNTIL');

  const segments: string[] = [];
  const intervalUnit = intervalUnitMap[freq];
  if (interval !== undefined && interval !== '1' && intervalUnit !== undefined) {
    segments.push(isChinese ? `每 ${interval} ${intervalUnit}` : `Every ${interval} ${intervalUnit}s`);
  } else {
    segments.push(frequencyMap[freq] ?? freq);
  }

  if (count !== undefined) {
    segments.push(isChinese ? `共 ${count} ${labels.times}` : `${count} ${labels.times}`);
  }

  if (until !== undefined) {
    segments.push(`${labels.until} ${formatUntil(until)}`);
  }

  const knownKeys = new Set(['FREQ', 'INTERVAL', 'COUNT', 'UNTIL']);
  const unknownKeys = [...ruleMap.keys()].filter((key) => !knownKeys.has(key));
  if (unknownKeys.length > 0) {
    segments.push(body);
  }

  return segments.join(isChinese ? '，' : ', ');
};
