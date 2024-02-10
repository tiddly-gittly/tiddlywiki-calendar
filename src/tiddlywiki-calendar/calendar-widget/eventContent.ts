/* eslint-disable @typescript-eslint/strict-boolean-expressions */
import type { CustomContentGenerator, EventContentArg } from '@fullcalendar/core';
import type { h, VNode } from '@fullcalendar/core/preact';
import { allowedTiddlerTypeToPreview, draftTiddlerCaptionTitle, draftTiddlerTitle, DURATION_THRESHOLD_FOR_SHOWING_TIME_AT_BOTTOM } from './constants';
import type { IContext } from './initCalendar';

// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
const dateDurationMacro = require('$:/plugins/linonetwo/tw-calendar/date-duration-macro');
// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
const getDateDuration = dateDurationMacro.run as (startDateString: string, endDateString: string) => string;

/**
 * Get content of event in 'timeGridThreeDay' and 'timeGridWeek'
 * See `$:/plugins/linonetwo/tw-calendar/calendar-widget/widget.css` for style about container (.fc-event-main-tags).
 */
export function getEventContent(context: IContext): CustomContentGenerator<EventContentArg> {
  return (argument, createElement: typeof h) => {
    // if this tiddler is calendar draft, use draft caption instead
    const titleText = argument.event.title === draftTiddlerTitle ? ($tw.wiki.getTiddler(draftTiddlerCaptionTitle)?.fields?.['draft.title'] ?? '...') : argument.event.title;
    const titleElement = createElement('div', {}, titleText);
    const timeElement = createElement('div', {}, argument.timeText);
    const tiddler = $tw.wiki.getTiddler(argument.event.title);
    let duration = 0;
    /** this is for empty tiddler or tiddler not created (when user select range of time to create one), normally we will use captionElement below */
    if (tiddler === undefined) {
      let durationElement: VNode | undefined;
      if (argument.event._instance !== undefined && argument.event.end instanceof Date && argument.event.start instanceof Date) {
        const startDate = $tw.utils.formatDateString(argument.event.start, '[UTC]YYYY0MM0DD0hh0mm0ss0XXX');
        const endDate = $tw.utils.formatDateString(argument.event.end, '[UTC]YYYY0MM0DD0hh0mm0ss0XXX');
        const durationText = getDateDuration(startDate, endDate);
        durationElement = createElement('div', {}, durationText);
        // @ts-expect-error The left-hand side of an arithmetic operation must be of type 'any', 'number', 'bigint' or an enum type.ts(2362)
        duration = argument.event.end - argument.event.start;
        if (duration >= DURATION_THRESHOLD_FOR_SHOWING_TIME_AT_BOTTOM) {
          return createElement('div', { style: 'height: 100%; display: flex; flex-direction: column; justify-content: space-between;' }, [
            createElement('div', {}, [titleElement, timeElement, durationElement]),
            createElement('div', {}, [timeElement, durationElement]),
          ]);
        }
      }
      return createElement('div', {}, [titleElement, timeElement, durationElement]);
    }

    /**
     * This might be empty due to lazy load
     */
    const tiddlerText = tiddler.fields.text;
    if (tiddler.hasField('_is_skinny')) {
      // trigger lazyLoad after render, don't block UI rendering.
      setTimeout(() => {
        // Tell any listeners about the need to lazily load $tw.wiki tiddler
        $tw.wiki.dispatchEvent('lazyLoad', tiddler.fields.title);
        // lazy load later, not blocking user interaction to add new event
      }, 1000);
    }
    let captionResult: string | undefined | null;
    if (typeof tiddler.fields.caption === 'string' && context.parentWidget !== undefined) {
      if (tiddler.fields.caption.includes('{{')) {
        const childTree = $tw.wiki.parseText('text/vnd.tiddlywiki', tiddler.fields.caption).tree;
        const astNode = { type: 'tiddler', children: childTree };
        const newWidgetNode = context.parentWidget.makeChildWidget(astNode);
        // render tw content needs a temp real dom element, can't use vdom from `createElement`
        const temporaryEle = context.parentWidget.document.createElement('div');
        // eslint-disable-next-line unicorn/no-null
        newWidgetNode.render(temporaryEle, null);
        captionResult = temporaryEle.textContent;
      } else {
        // if caption not including transclusion (or maybe other wikitext syntax?) skip the expensive rendering
        captionResult = tiddler.fields.caption;
      }
    }

    const startDateString = tiddler.fields[context.startDateFields?.[0] ?? 'startDate'] as string | undefined;
    const endDateString = tiddler.fields[context.endDateFields?.[0] ?? 'endDate'] as string | undefined;
    let durationText = '';
    if (startDateString !== undefined && endDateString !== undefined) {
      durationText = getDateDuration(startDateString, endDateString);
      // @ts-expect-error The left-hand side of an arithmetic operation must be of type 'any', 'number', 'bigint' or an enum type.ts(2362)
      duration = $tw.utils.parseDate(endDateString) - $tw.utils.parseDate(startDateString);
    }
    const durationElement = durationText !== undefined && createElement('div', {}, durationText);
    const captionElement = typeof captionResult === 'string'
      ? createElement('div', { class: tiddlerText ? 'fc-event-title-with-text' : '' }, captionResult)
      : titleElement;
    // on small view like dayGridMonth that can only display an element
    if (['dayGridMonth'].includes(argument.view.type)) {
      return { html: [captionElement].join('') };
    }
    // on timeGridDay view, show full text, but ignore too long text that causes lagging
    const textElement = allowedTiddlerTypeToPreview.includes(tiddler.fields.type ?? '')
      ? createElement('div', {}, (tiddlerText ?? '').substring(0, 2000))
      : createElement('div', {}, `(${tiddler.fields.type} too large)`);
    const tagsElement = createElement('div', { class: 'fc-event-main-tags' }, tiddler.fields.tags?.map?.((tag) => createElement('span', {}, tag)));
    const contents = createElement('div', {}, [captionElement, tagsElement, timeElement, durationElement, textElement]);
    if (duration >= DURATION_THRESHOLD_FOR_SHOWING_TIME_AT_BOTTOM) {
      return createElement('div', { style: 'height: 100%; display: flex; flex-direction: column; justify-content: space-between;' }, [
        contents,
        createElement('div', {}, [timeElement, durationElement]),
      ]);
    }
    return contents;
  };
}
