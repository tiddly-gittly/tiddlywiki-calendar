/* eslint-disable @typescript-eslint/no-unsafe-member-access */

/**
 * Get the `['一', '二', '三', '四', '五', '六', '日']` of the week.
 */

exports.name = 'montosun';

exports.params = [];

exports.run = (): string => {
  const languageCode = $tw.wiki.getTiddler($tw.wiki.getTiddlerText('$:/language', 'en-GB'))?.fields?.name;
  if (languageCode === 'en-GB') {
    return `['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']`;
  }
  return `['一', '二', '三', '四', '五', '六', '日']`;
};
