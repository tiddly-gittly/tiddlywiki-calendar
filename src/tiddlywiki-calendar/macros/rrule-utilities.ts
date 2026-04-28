type RuleMap = Map<string, string>;

export const allDayDateLength = 60 * 60 * 24 * 1000;

export const stripNormalizedRule = (rrule: string): string =>
  rrule
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((line) => !line.startsWith('DTSTART:'))
    .map((line) => (line.startsWith('RRULE:') ? line.slice('RRULE:'.length) : line))
    .join(';')
    .replace(/;;+/g, ';')
    .replace(/^;|;$/g, '');

export const parseRule = (body: string): RuleMap => {
  const parts = body.split(';').map((part) => part.trim()).filter(Boolean);
  const result: RuleMap = new Map();
  for (const part of parts) {
    const separatorIndex = part.indexOf('=');
    if (separatorIndex === -1) continue;
    const key = part.slice(0, separatorIndex).trim().toUpperCase();
    const value = part.slice(separatorIndex + 1).trim();
    if (key !== '' && value !== '') result.set(key, value);
  }
  return result;
};

export const serializeRule = (ruleMap: RuleMap): string => {
  const preferredOrder = ['FREQ', 'INTERVAL', 'COUNT', 'UNTIL'];
  const orderedEntries: Array<[string, string]> = [];
  for (const key of preferredOrder) {
    const value = ruleMap.get(key);
    if (value !== undefined) orderedEntries.push([key, value]);
  }
  for (const [key, value] of ruleMap.entries()) {
    if (!preferredOrder.includes(key)) orderedEntries.push([key, value]);
  }
  return orderedEntries.map(([key, value]) => `${key}=${value}`).join(';');
};

export const parsePositiveInt = (value: string): string | undefined => {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? String(parsed) : undefined;
};

export const isAllDay = (startDate: string, endDate: string): boolean => {
  const start = $tw.utils.parseDate(startDate);
  const end = $tw.utils.parseDate(endDate);
  return start instanceof Date && end instanceof Date && end.getTime() - start.getTime() === allDayDateLength;
};

export const toUntilString = (twDate: string, allDay: boolean): string | undefined => {
  const date = $tw.utils.parseDate(twDate);
  if (!(date instanceof Date)) return undefined;
  if (allDay) {
    return date.toISOString().slice(0, 10).replaceAll('-', '');
  }
  return date.toISOString().replaceAll('-', '').replaceAll(':', '').replace(/\.\d{3}Z$/, 'Z');
};

export const getRuleField = (rrule: string, fieldName: string): string | undefined => {
  const body = stripNormalizedRule(rrule);
  const ruleMap = parseRule(body);
  return ruleMap.get(fieldName.toUpperCase());
};

export const formatUntil = (value: string): string => {
  if (/^\d{8}$/.test(value)) {
    return `${value.slice(0, 4)}-${value.slice(4, 6)}-${value.slice(6, 8)}`;
  }
  if (/^\d{8}T\d{6}Z$/.test(value)) {
    return `${value.slice(0, 4)}-${value.slice(4, 6)}-${value.slice(6, 8)} ${value.slice(9, 11)}:${value.slice(11, 13)}`;
  }
  return value;
};
