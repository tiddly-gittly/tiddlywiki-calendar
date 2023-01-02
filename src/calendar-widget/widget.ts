import type { Calendar } from '@fullcalendar/core';
import type { Widget as IWidget, IChangedTiddlers } from 'tiddlywiki';
import { changedTiddlerInViewRange } from './changeDetector';
import { IContext, initCalendar, tiddlerEventSourceID } from './initCalendar';
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
    let refreshed = false;
    const context = this.getContext();
    if (
      Object.keys(changedTiddlers).some((changedTiddlerTitle) => {
        // if modified date is within calendar view, refresh to show new event
        const endDateKey = context.endDateFields?.[0] ?? 'endDate';
        if (changedTiddlers[changedTiddlerTitle].modified === true) {
          return changedTiddlerInViewRange(changedTiddlerTitle, this.#calendar, endDateKey);
        }
        return false;
      })
    ) {
      this.#calendar?.getEventSourceById(tiddlerEventSourceID)?.refetch();
      // this won't cause this.render to be called...
      refreshed = true;
    }
    if (
      Object.keys(changedTiddlers).some((changedTiddlerTitle) => {
        // if setting changed, refresh the whole calendar, to make options take effect
        if (changedTiddlerTitle.startsWith('$:/plugins/linonetwo/tw-calendar/settings')) return true;
        return false;
      })
    ) {
      this.#calendar?.destroy();
      this.#calendar = initCalendar(this.#mountElement!, context);
      this.#calendar?.render();
      // this won't cause this.render to be called...
      refreshed = true;
    }
    return refreshed;
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
      // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
      if (height) {
        this.#mountElement.style.minHeight = height;
      }
    }
    if (this.#calendar === undefined) {
      this.#calendar = initCalendar(this.#mountElement, this.getContext());
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

  getContext(): IContext {
    /* eslint-disable @typescript-eslint/strict-boolean-expressions */
    return {
      endDateFields: this.getAttribute('endDateFields')?.split(','),
      filter: this.getAttribute('filter'),
      hideToolbar: this.getAttribute('hideToolbar') === 'yes' || this.getAttribute('hideToolbar') === 'true',
      initialDate: this.getAttribute('initialDate'),
      initialView: this.getAttribute('initialView'),
      parentWidget: this.parentWidget,
      readonly: this.getAttribute('readonly') === 'yes' || this.getAttribute('readonly') === 'true',
      slotDuration: this.getAttribute('slotDuration') || $tw.wiki.getTiddlerText('$:/plugins/linonetwo/tw-calendar/settings/slotDuration'),
      startDateFields: this.getAttribute('startDateFields')?.split(','),
      timeZone: this.getAttribute('timeZone'),
    };
  }
}

/* eslint-disable @typescript-eslint/no-unsafe-member-access */
exports.widget = CalendarWidget;
