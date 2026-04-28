/* eslint-disable @typescript-eslint/no-unsafe-assignment */
(function slateWriteWidgetIIFE() {
  if (!$tw.browser) {
    return;
  }
  // separate the widget from the exports here, so we can skip the require of react code if `!$tw.browser`. Those ts code will error if loaded in the nodejs side.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const components = require('$:/plugins/linonetwo/tw-calendar/calendar-widget/widget.js');
  const { widget } = components;

  exports.calendar = widget;
})();
