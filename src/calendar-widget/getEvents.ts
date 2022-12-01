/* eslint-disable @typescript-eslint/require-await */
/* eslint-disable unicorn/no-array-callback-reference */
import type { EventInput, EventSourceFunc, EventSourceFuncArg } from '@fullcalendar/core';
import { toTWUTCString } from '../utils';
import type { ITiddlerFields, Tiddler } from 'tiddlywiki';

export enum CalendarEventType {
  /** Real event created by the calendar */
  Event,
  /** Normal tiddler fallback to use created and modified */
  NormalTiddler,
}
const normalTiddlerEventLengthInHour = 1;

export function getEvents(filter: string): EventInput[] {
  const tiddlerTitles = $tw.wiki.filterTiddlers(filter);
  const fullCalendarEvents = tiddlerTitles
    .map((title) => $tw.wiki.getTiddler(title))
    .filter((tiddler): tiddler is Tiddler => tiddler !== undefined)
    .map((tiddler) => tiddler.fields)
    .flatMap(mapTiddlerFieldsToFullCalendarEventObject);
  return fullCalendarEvents;
}

const f = (twDate: string) => $tw.utils.parseDate(twDate);
function mapTiddlerFieldsToFullCalendarEventObject(fields: ITiddlerFields): EventInput[] {
  const { title, startDate, endDate, created, modified, color, tags } = fields;
  const backgroundColor = color ?? tags?.map((tagName) => $tw.wiki.getTiddler(tagName)?.fields?.color).find(Boolean);
  const options: Partial<EventInput> = {
    title,
    id: title,
    interactive: true,
    backgroundColor,
  };
  /**
   * CalendarEventType.Event
   * If it has startDate and endDate, means this is an event created by the calendar
   */
  if (typeof startDate === 'string' && typeof endDate === 'string') {
    return [
      {
        ...options,
        start: f(startDate),
        end: f(endDate),
        extendedProps: {
          type: CalendarEventType.Event,
        },
      },
    ];
  }
  /**
   * CalendarEventType.NormalTiddler
   * Normal tiddler render as dot in the timeline, for both of its created and modified time
   */
  const fallbackResults = [];
  const tiddlerEvent = {
    ...options,
    editable: false,
    extendedProps: {
      type: CalendarEventType.NormalTiddler,
    },
  };
  if (created !== undefined) {
    /** created is a point, we don't know how long does user cost for the first edit, to make it a duration, we create a fake end to it. */
    const createdFakeEnd = new Date(created);
    createdFakeEnd.setHours(created.getHours() + normalTiddlerEventLengthInHour);
    fallbackResults.push({ ...tiddlerEvent, start: created, end: createdFakeEnd });
  }
  // @ts-expect-error https://stackoverflow.com/questions/4944750/how-to-subtract-date-time-in-javascript
  const dateDiff = Math.abs(created - modified);
  // only add modified if these two time is longer than the fake length of the event
  if (modified !== undefined && dateDiff > 1000 * 60 * 60 * normalTiddlerEventLengthInHour) {
    /** modified is a point, we don't know how long does user cost for the first edit, to make it a duration, we create a fake end to it. */
    const modifiedFakeEnd = new Date(modified);
    modifiedFakeEnd.setHours(modified.getHours() + normalTiddlerEventLengthInHour);
    fallbackResults.push({ ...tiddlerEvent, start: modified, end: modifiedFakeEnd });
  }
  return fallbackResults;
}

export const getEventOnFullCalendarViewChange: EventSourceFunc = async (argument: EventSourceFuncArg) => {
  const { start, end } = argument;
  const [startTwString, endTwString] = [start, end].map((date) => toTWUTCString(date));
  const getFilterOnField = (field: string) => `[all[tiddlers]]:filter[get[${field}]compare:date:gteq[${startTwString}]compare:date:lteq[${endTwString}]]`;
  const titles = ['created', 'modified', 'startDate'].map(getFilterOnField).flatMap((filter) => $tw.wiki.filterTiddlers(filter));
  const eventsOnPeriod = getEvents(`${titles.join(' ')}`);
  return eventsOnPeriod;
};
