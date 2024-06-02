/* eslint-disable unicorn/no-null */
/* eslint-disable @typescript-eslint/strict-boolean-expressions */
import { IFilterOperator } from 'tiddlywiki';
import { getStartDateOfWeek } from './dateUtils';

/**
 * Get the start date of the week.
 *
 * If you want to get the start date of the last week, use `1` as operand, and so on.
 *
 * ```
 * [weekstart[]]
 * [weekstart[0]]
 * [weekstart[1]]
 * [weekstart[-1]]
 * ```
 */
export const weekstart = ((_source, operator): string[] => {
  let offset = Number(operator.operand || 0);
  if (Number.isNaN(offset)) {
    offset = 0;
  }
  return [$tw.utils.formatDateString(getStartDateOfWeek(offset), '[UTC]YYYY0MM0DD0hh0mm0ss0XXX')];
}) satisfies IFilterOperator;
