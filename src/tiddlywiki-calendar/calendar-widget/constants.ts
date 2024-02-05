import moment from 'moment-timezone';

export const officialCalendarLayouts = [
  '$:/plugins/linonetwo/tw-calendar/tiddlywiki-ui/PageLayout/EventsCalendarLayout',
  '$:/plugins/linonetwo/tw-calendar/tiddlywiki-ui/PageLayout/TiddlersCalendarLayout',
  '$:/plugins/linonetwo/tw-calendar/tiddlywiki-ui/PageLayout/EventsCalendarSearchLayout',
];
export const getInCalendarLayout = () => officialCalendarLayouts.includes($tw.wiki.getTiddlerText('$:/layout') ?? '');
export const getIsSmallScreen = () => window.innerWidth <= 600;
export const tiddlerEventSourceID = 'tiddlers';
export const timeZoneOffset = moment.duration({ minutes: new Date().getTimezoneOffset() });
export const allowedTiddlerTypeToPreview = ['', 'text/vnd.tiddlywiki', 'text/plain', 'text/x-markdown', 'text/markdown', 'text/x-tiddlywiki'];
export const isMobile = $tw.wiki.getTiddlerText('$:/info/browser/is/mobile') === 'yes' || $tw.wiki.getTiddlerText('$:/info/tidgi-mobile') === 'yes';
/**
 * If time span longer or equal to this, show time at bottom too, so easier to see
 */
export const DURATION_THRESHOLD_FOR_SHOWING_TIME_AT_BOTTOM = 60 * 60 * 3 * 1000;
export const getIsSearchMode = () => $tw.wiki.getTiddlerText('$:/layout') === '$:/plugins/linonetwo/tw-calendar/tiddlywiki-ui/PageLayout/EventsCalendarSearchLayout';
export const draftTiddlerTitle = '$:/state/Calendar/PageLayout/create-tiddler';
export const draftTiddlerCaptionTitle = `${draftTiddlerTitle}-caption`;
