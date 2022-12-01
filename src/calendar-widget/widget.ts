import type { Calendar } from '@fullcalendar/core';
import type { Widget as IWidget, IChangedTiddlers } from 'tiddlywiki';
import { changedTiddlerInViewRange } from './changeDetector';
import { initCalendar, tiddlerEventSourceID } from './initCalendar';
import './widget.css';

const Widget = (require('$:/core/modules/widgets/widget.js') as { widget: typeof IWidget }).widget;

class CalendarWidget extends Widget {
  // constructor(parseTreeNode: IParseTreeNode, options?: unknown) {
  //   super(parseTreeNode, options);
  // }

  #calendar?: Calendar;
  #containerElement?: HTMLDivElement;
  #mountElement?: HTMLDivElement;

  refresh(changedTiddlers: IChangedTiddlers): boolean {
    if (
      Object.keys(changedTiddlers).some((changedTiddlerTitle) => {
        if (changedTiddlers[changedTiddlerTitle].modified) {
          return changedTiddlerInViewRange(changedTiddlerTitle, this.#calendar);
        }
        return false;
      })
    ) {
      this.#calendar?.getEventSourceById(tiddlerEventSourceID)?.refetch();
      // this won't cause this.render to be called...
      return true;
    }
    return false;
  }

  /**
   * Lifecycle method: Render this widget into the DOM
   */
  render(parent: Node, _nextSibling: Node): void {
    this.parentDomNode = parent;
    this.computeAttributes();
    this.execute();

    if (this.#containerElement === undefined || this.#mountElement === undefined) {
      this.#containerElement = document.createElement('div');
      this.#mountElement = document.createElement('div');
      this.#containerElement.appendChild(this.#mountElement);
      this.#mountElement.classList.add('tiddlywiki-calendar-widget-container');
      const [width, height] = [this.getAttribute('width'), this.getAttribute('height')];
      this.#containerElement.style.width = width;
      this.#containerElement.style.height = height;
    }
    if (this.#calendar === undefined) {
      this.#calendar = initCalendar(this.#mountElement, { parentWidget: this.parentWidget });
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
