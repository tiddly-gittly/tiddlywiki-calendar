/* eslint-disable unicorn/no-null */
/* eslint-disable @typescript-eslint/strict-boolean-expressions */
import { IFilterOperator } from 'tiddlywiki';
import { getStartDateOfWeek } from './dateUtils';

/**
 * Get the start date of the week.
 *
 * Operands 1 - If you want to get the start date of the last week, use `1` as operand, and so on.
 * Operands 2 - Which day of the week to get the end date of. 1 is Sunday, 2 is Monday, and so on.
 *
 * ```
 * [daystart[],[1]]
 * [daystart[0],[7]]
 * [daystart[1],[2]]
 * [daystart[-1],[1]]
 * ```
 */
export const daystart = ((_source, operator): string[] => {
  let weekOffset = Number(operator.operands[0] || 0);
  if (Number.isNaN(weekOffset)) {
    weekOffset = 0;
  }
  let dayOfWeek = Number(operator.operands[1] || 1);
  if (Number.isNaN(dayOfWeek)) {
    dayOfWeek = 1;
  }
  const weekStart = getStartDateOfWeek(weekOffset);
  const dayStartTime = weekStart.getTime() + (dayOfWeek - 1) * 24 * 60 * 60 * 1000;
  const dayStartDate = new Date(dayStartTime);
  return [$tw.utils.formatDateString(dayStartDate, '[UTC]YYYY0MM0DD0hh0mm0ss0XXX')];
}) satisfies IFilterOperator;
