import type { CustomContentGenerator, EventContentArg } from '@fullcalendar/core';
import compact from 'lodash/compact';
import type { h } from 'preact';
import { allowedTiddlerTypeToPreview } from './constants';
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
  return (argument) => {
    /** this is for empty tiddler, normally we will use captionElement below */
    const titleElement = `<div>${argument.event.title}</div>`;
    const timeElement = `<div>${argument.timeText}</div>`;
    const tiddler = $tw.wiki.getTiddler(argument.event.title);
    if (tiddler === undefined) {
      return { html: [titleElement, timeElement].join('') };
    }

    let captionResult: string | undefined | null;
    if (typeof tiddler.fields.caption === 'string' && context.parentWidget !== undefined) {
      if (tiddler.fields.caption.includes('{{')) {
        const childTree = $tw.wiki.parseText('text/vnd.tiddlywiki', tiddler.fields.caption).tree;
        const astNode = { type: 'tiddler', children: childTree };
        const newWidgetNode = context.parentWidget.makeChildWidget(astNode);
        // render tw content needs a temp real dom element, can't use vdom from `createElement`
        const temporaryEle = document.createElement('div');
        // eslint-disable-next-line unicorn/no-null
        newWidgetNode.render(temporaryEle, null);
        captionResult = temporaryEle.textContent;
      } else {
        // if caption not including transclusion (or maybe other wikitext syntax?) skip the expensive rendering
        captionResult = tiddler.fields.caption;
      }
    }

    const startDate = tiddler.fields[context.startDateFields?.[0] ?? 'startDate'] as string | undefined;
    const endDate = tiddler.fields[context.endDateFields?.[0] ?? 'endDate'] as string | undefined;
    const durationText = startDate !== undefined && endDate !== undefined ? getDateDuration(startDate, endDate) : undefined;
    const durationElement = durationText !== undefined && `<div>${durationText}</div>`;
    // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
    const captionElement = typeof captionResult === 'string'
      // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
      ? `<div class="${tiddler?.fields?.text ? 'fc-event-title-with-text' : ''}">${captionResult}</div>`
      : titleElement;
    // on small view like dayGridMonth that can only display an element
    if (['dayGridMonth'].includes(argument.view.type)) {
      return { html: [captionElement].join('') };
    }
    // on timeGridDay view, show full text, but ignore too long text that causes lagging
    const textElement = allowedTiddlerTypeToPreview.includes(tiddler.fields.type ?? '')
      ? `<div>${(tiddler.fields.text ?? '').substring(0, 2000)}</div>`
      : `<div>${tiddler.fields.type} too large</div>`;
    const tagsElement = `<div class="fc-event-main-tags">${tiddler.fields.tags?.map((tag) => `<span>${tag}</span>`)?.join('') ?? ''}</div>`;
    return { html: compact([captionElement, tagsElement, timeElement, durationElement, textElement]).join('') };
  };
}
