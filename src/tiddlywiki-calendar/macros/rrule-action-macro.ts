import { isAllDay, parsePositiveInt, parseRule, serializeRule, stripNormalizedRule, toUntilString } from './rrule-utilities';

type MacroDefinition = {
  name: string;
  params: Array<{ name: string; default: string }>;
  run: (action: string, rrule: string, value: string, startDate: string, endDate: string) => string;
};

const macro = exports as MacroDefinition;

macro.name = 'rrule-action-macro';

macro.params = [
  { name: 'action', default: '' },
  { name: 'rrule', default: '' },
  { name: 'value', default: '' },
  { name: 'startDate', default: '' },
  { name: 'endDate', default: '' },
];

macro.run = (action: string, rrule: string, value: string, startDate: string, endDate: string): string => {
  const body = stripNormalizedRule(rrule);
  const ruleMap = parseRule(body);

  if (!ruleMap.has('FREQ') && action !== 'set-interval' && action !== 'set-count') {
    return body;
  }
  if (!ruleMap.has('FREQ') && (action === 'set-interval' || action === 'set-count')) {
    ruleMap.set('FREQ', 'DAILY');
  }

  if (action === 'set-interval') {
    const interval = parsePositiveInt(value);
    if (interval !== undefined) ruleMap.set('INTERVAL', interval);
    return serializeRule(ruleMap);
  }

  if (action === 'set-count') {
    const count = parsePositiveInt(value);
    if (count !== undefined) {
      ruleMap.delete('UNTIL');
      ruleMap.set('COUNT', count);
    }
    return serializeRule(ruleMap);
  }

  if (action === 'set-until-current') {
    const until = toUntilString(startDate, isAllDay(startDate, endDate));
    if (until !== undefined) {
      ruleMap.delete('COUNT');
      ruleMap.set('UNTIL', until);
    }
    return serializeRule(ruleMap);
  }

  return serializeRule(ruleMap);
};
