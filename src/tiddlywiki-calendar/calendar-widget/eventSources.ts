import type { IContext } from './initCalendar';

export const defaultEventSources = '[all[shadows+tiddlers]tag[$:/tags/Calendar/EventSource]] -[list[$:/plugins/linonetwo/tw-calendar/settings/disabledEventSources]]';

export function getEventSourceTitles(context: IContext): string[] {
  return $tw.wiki.filterTiddlers(context.eventSources ?? defaultEventSources, context.widget);
}
