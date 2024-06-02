/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable unicorn/no-null */
/* eslint-disable @typescript-eslint/strict-boolean-expressions */
import { getEndDateOfWeek } from '../filter/dateUtils';

/**
 * Get the end date of the week.
 *
 * If you want to get the end date of the last week, use `1` as operand, and so on.
 *
 * ```
 * <<weekend>>
 * <<weekend 0>>
 * <<weekend 1>>
 * <<weekend -1>>
 * ```
 */

exports.name = 'weekend';

exports.params = [
  { name: 'offset', default: '' },
];

exports.run = (offsetString: string): string => {
  let offset = Number(offsetString || 0);
  if (Number.isNaN(offset)) {
    offset = 0;
  }
  return $tw.utils.formatDateString(getEndDateOfWeek(offset), '[UTC]YYYY0MM0DD0hh0mm0ss0XXX');
};
