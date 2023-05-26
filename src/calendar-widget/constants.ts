import moment from 'moment-timezone';

export const getInCalendarLayout = () => $tw.wiki.getTiddlerText('$:/layout') === '$:/plugins/linonetwo/tw-calendar/tiddlywiki-ui/PageLayout/CalendarLayout';
export const isSmallScreen = window.innerWidth <= 600;
export const tiddlerEventSourceID = 'tiddlers';
export const timeZoneOffset = moment.duration({ minutes: new Date().getTimezoneOffset() });
export const allowedTiddlerTypeToPreview = ['', 'text/vnd.tiddlywiki', 'text/plain', 'text/x-markdown', 'text/markdown', 'text/x-tiddlywiki'];
export const isMobile = $tw.wiki.getTiddlerText('$:/info/browser/is/mobile') === 'yes';
