import type { Calendar } from '@fullcalendar/core';
import type { Widget as IWidget, IChangedTiddlers } from 'tiddlywiki';
import { getEvents } from './getEvents';
import { initCalendar } from './initCalendar';
import './widget.css';

const Widget = (require('$:/core/modules/widgets/widget.js') as { widget: typeof IWidget }).widget;

class CalendarWidget extends Widget {
  // constructor(parseTreeNode: IParseTreeNode, options?: unknown) {
  //   super(parseTreeNode, options);
  // }

  #calendar?: Calendar;
  #containerElement?: HTMLDivElement;

  refresh(_changedTiddlers: IChangedTiddlers): boolean {
    return false;
  }

  /**
   * Lifecycle method: Render this widget into the DOM
   */
  render(parent: Node, _nextSibling: Node): void {
    this.parentDomNode = parent;
    this.computeAttributes();
    this.execute();

    if (this.#containerElement === undefined) {
      this.#containerElement = document.createElement('div');
      this.#containerElement.classList.add('tiddlywiki-calendar-widget-container');
    }
    const events = getEvents('[all[tiddlers]]');
    if (this.#calendar === undefined) {
      this.#calendar = initCalendar(this.#containerElement, events);
      // fix https://github.com/fullcalendar/fullcalendar/issues/4976
      setTimeout(() => {
        this.#calendar?.render();
      }, 0);
    } else {
      this.#calendar.render();
    }
    this.domNodes.push(this.#containerElement);
    // eslint-disable-next-line unicorn/prefer-dom-node-append
    parent.appendChild(this.#containerElement);
  }

  // TODO: do this in destroy()
  removeChildDomNodes() {
    super.removeChildDomNodes();
    this.#calendar?.destroy();
  }
}

/* eslint-disable @typescript-eslint/no-unsafe-member-access */
exports.widget = CalendarWidget;
