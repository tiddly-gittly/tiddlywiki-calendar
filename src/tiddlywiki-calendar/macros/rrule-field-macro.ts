import { getRuleField } from './rrule-utilities';

type MacroDefinition = {
  name: string;
  params: Array<{ name: string; default: string }>;
  run: (rrule: string, field: string, fallback: string) => string;
};

const macro = exports as MacroDefinition;

macro.name = 'rrule-field-macro';

macro.params = [
  { name: 'rrule', default: '' },
  { name: 'field', default: '' },
  { name: 'fallback', default: '' },
];

macro.run = (rrule: string, field: string, fallback: string): string => getRuleField(rrule, field) ?? fallback;
