/* eslint-disable unicorn/no-null */
/* eslint-disable @typescript-eslint/strict-boolean-expressions */
import { IFilterOperator } from 'tiddlywiki';
import { getEndDateOfWeek } from './dateUtils';

/**
 * Get the end date of the day.
 *
 * Operands 1 - If you want to get the end date of the last week, use `1` as operand, and so on.
 * Operands 2 - Which day of the week to get the end date of. 1 is Sunday, 2 is Monday, and so on.
 *
 * ```
 * [dayend[],[1]]
 * [dayend[0],[7]]
 * [dayend[1],[2]]
 * [dayend[-1],[1]]
 * ```
 */
export const dayend = ((_source, operator): string[] => {
  let weekOffset = Number(operator.operands[0] || 0);
  if (Number.isNaN(weekOffset)) {
    weekOffset = 0;
  }
  let dayOfWeek = Number(operator.operands[1] || 1);
  if (Number.isNaN(dayOfWeek)) {
    dayOfWeek = 1;
  }
  const weekEnd = getEndDateOfWeek(weekOffset);
  const dayEndTime = weekEnd.getTime() - (7 - dayOfWeek) * 24 * 60 * 60 * 1000;
  const dayEndDate = new Date(dayEndTime);
  return [$tw.utils.formatDateString(dayEndDate, '[UTC]YYYY0MM0DD0hh0mm0ss0XXX')];
}) satisfies IFilterOperator;
