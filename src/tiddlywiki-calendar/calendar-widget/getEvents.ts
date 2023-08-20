/* eslint-disable @typescript-eslint/require-await */
/* eslint-disable unicorn/no-array-callback-reference */
import type { EventInput, EventSourceFunc, EventSourceFuncArg } from '@fullcalendar/core';
import type { ITiddlerFields, Tiddler } from 'tiddlywiki';
import type { IContext } from './initCalendar';

export enum CalendarEventType {
  /** Real event created by the calendar */
  Event,
  /** Normal tiddler fallback to use created and modified */
  NormalTiddler,
  /** Use user provided field to display event */
  CustomField,
}
const normalTiddlerEventLengthInHour = 1;
const allDayDateLength = 60 * 60 * 24 * 1000;

export const getEventOnFullCalendarViewChange = (context: IContext): EventSourceFunc => async (argument: EventSourceFuncArg) => {
  const { start, end } = argument;
  const [startTwString, endTwString] = [start, end].map((date) => $tw.utils.stringifyDate(date));
  const sourceFilter = context?.filter ?? '[all[tiddlers]!is[system]]';
  const getFilterOnField = (field: string) => `${sourceFilter}:filter[get[${field}]compare:date:gteq[${startTwString}]compare:date:lteq[${endTwString}]]`;
  const fields = context.startDateFields ?? ['created', 'modified', 'startDate'];
  const titles = fields
    .map(getFilterOnField)
    .flatMap((filter) => $tw.wiki.filterTiddlers(filter))
    // in case there is a space in title
    .map((title) => `[[${title}]]`);
  const eventsOnPeriod = getEvents(`${titles.join(' ')}`, context);
  return eventsOnPeriod;
};

export function getEvents(filter: string, context: IContext): EventInput[] {
  const tiddlerTitles = $tw.wiki.filterTiddlers(filter);
  const currentPalette: Record<string, string> = $tw.wiki.getTiddlerData($tw.wiki.getTiddlerText('$:/palette') ?? '$:/palettes/Vanilla');
  const fullCalendarEvents = tiddlerTitles
    .map((title) => $tw.wiki.getTiddler(title))
    .filter((tiddler): tiddler is Tiddler => tiddler !== undefined)
    .map((tiddler) => tiddler.fields)
    .flatMap((tiddlerField) => mapTiddlerFieldsToFullCalendarEventObject(tiddlerField, context, currentPalette));
  return fullCalendarEvents;
}

// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
const contrastColour: (colour: string, fallbackTarget: string, colourFore: string, colourBack: string) => number[] | string =
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  require('$:/core/modules/macros/contrastcolour.js').run;
const parseDate = (twDate: string) => {
  const result = $tw.utils.parseDate(twDate);
  if (result === null) throw new Error('null result from parseDate');
  return result;
};

function mapTiddlerFieldsToFullCalendarEventObject(fields: ITiddlerFields, context: IContext, palette: Record<string, string>): EventInput[] {
  const { title, startDate, endDate, created, modified, color, tags } = fields;
  const backgroundColor = color ?? tags?.map((tagName) => $tw.wiki.getTiddler(tagName)?.fields?.color).find(Boolean);
  let textColor: string | undefined;
  if (backgroundColor !== undefined) {
    const contractColorResult = contrastColour(backgroundColor, palette['tag-background'], palette.foreground, palette.background);
    if (Array.isArray(contractColorResult)) {
      textColor = `rgba(${contractColorResult.join(',')})`;
    } else {
      textColor = contractColorResult;
    }
  }
  const options: Partial<EventInput> = {
    title,
    id: title,
    interactive: true,
    backgroundColor,
    textColor,
  };
  /**
   * Use user defined fields for top priority, and hide all other type of events, so only events that user want to see will show. User can add default fields if they want to see the full result.
   */
  if (Array.isArray(context.startDateFields)) {
    return context.startDateFields
      .map((fieldName, index) => {
        const startDateFieldValue = fields[fieldName] as string | undefined;
        let startDateFromField: Date;
        // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions, array-callback-return
        if (!startDateFieldValue) return;
        try {
          startDateFromField = parseDate(startDateFieldValue);
        } catch (error) {
          throw new Error(
            `field ${fieldName} in tiddler ${title} is not a valid date format: ${startDateFieldValue} , causing ${(error as Error).message} ${(error as Error).stack ?? ''}`,
          );
        }
        const correspondingEndFieldName = context.endDateFields?.[index];
        let endDateFromFieldValue: string | undefined;
        let endDateFromField: Date | undefined;
        // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
        if (correspondingEndFieldName) {
          endDateFromFieldValue = fields[correspondingEndFieldName] as string | undefined;
          if (endDateFromFieldValue !== undefined) {
            try {
              endDateFromField = parseDate(endDateFromFieldValue);
            } catch (error) {
              throw new Error(
                `field ${correspondingEndFieldName} in tiddler ${title} is not a valid date format: ${endDateFromFieldValue} , causing ${(error as Error).message} ${
                  (error as Error).stack ?? ''
                }`,
              );
            }
          }
        }
        if (endDateFromField === undefined) {
          /** created is a point, we don't know how long does user cost for the first edit, to make it a duration, we create a fake end to it. */
          const startDateFromFieldFakeEnd = new Date(startDateFromField);
          startDateFromFieldFakeEnd.setHours(startDateFromField.getHours() + normalTiddlerEventLengthInHour);
          endDateFromField = startDateFromFieldFakeEnd;
        }
        const result: EventInput = {
          ...options,
          startEditable: false,
          durationEditable: false,
          start: startDateFromField,
          end: endDateFromField,
          // @ts-expect-error The left-hand side of an arithmetic operation must be of type 'any', 'number', 'bigint' or an enum type.ts(2362)
          allDay: endDateFromField - startDateFromField === allDayDateLength,
          extendedProps: {
            type: CalendarEventType.CustomField,
          },
        };
        return result;
      })
      .filter((item): item is EventInput => item !== undefined);
  }
  /**
   * CalendarEventType.Event
   * If it has startDate and endDate, means this is an event created by the calendar
   */
  if (typeof startDate === 'string' && typeof endDate === 'string') {
    const start = parseDate(startDate);
    const end = parseDate(endDate);
    return [
      {
        ...options,
        start,
        end,
        // @ts-expect-error The left-hand side of an arithmetic operation must be of type 'any', 'number', 'bigint' or an enum type.ts(2362)
        allDay: end - start === allDayDateLength,
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
    startEditable: false,
    durationEditable: false,
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
