import type { CustomContentGenerator, EventContentArg } from '@fullcalendar/core';
import type { h } from 'preact';
import type { IContext } from './initCalendar';

export function getEventContent(context: IContext): CustomContentGenerator<EventContentArg> {
  return (argument, createElement: typeof h) => {
    const titleElement = createElement('div', {}, argument.event.title);
    const timeElement = createElement('div', {}, argument.timeText);
    const tiddler = $tw.wiki.getTiddler(argument.event.title);
    if (tiddler === undefined) {
      return [titleElement, timeElement];
    }
    const tagsElement = createElement('div', { class: 'fc-event-main-tags' }, tiddler.fields.tags?.map((tag) => createElement('span', {}, tag)) ?? '');
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
    // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
    const captionElement = typeof captionResult === 'string' ? createElement('div', {}, captionResult) : undefined;
    // TODO: handle overflow
    // TODO: handler text ...
    return [captionElement, tagsElement, timeElement];
  };
}
