/* eslint-disable @typescript-eslint/no-unsafe-member-access */

/**
 * Return localized short weekday names, ordered Monday through Sunday,
 * as a JavaScript array literal for chart templates.
 */

exports.name = 'montosun';

exports.params = [];

exports.run = (): string => {
  const mondayToSunday = [1, 2, 3, 4, 5, 6, 0];
  const labels = mondayToSunday.map((dayIndex) => $tw.wiki.getTiddlerText(`$:/language/Date/Short/Day/${dayIndex}`, String(dayIndex)));
  return JSON.stringify(labels);
};
