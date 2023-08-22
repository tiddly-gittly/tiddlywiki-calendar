/* eslint-disable @typescript-eslint/prefer-nullish-coalescing */
import type { Calendar } from '@fullcalendar/core';
import type { IChangedTiddlers, Widget as IWidget } from 'tiddlywiki';

import { changedTiddlerInViewRange } from './changeDetector';
import { getIsSearchMode, tiddlerEventSourceID } from './constants';
import { type IContext, initCalendar } from './initCalendar';

const Widget = (require('$:/core/modules/widgets/widget.js') as { widget: typeof IWidget }).widget;

class CalendarWidget extends Widget {
  #calendar?: Calendar;
  #containerElement?: HTMLDivElement;
  #mountElement?: HTMLDivElement;
  #popPreviewElement?: HTMLDivElement;

  refresh(changedTiddlers: IChangedTiddlers): boolean {
    let refreshed = false;
    const context = this.getContext();
    if (
      Object.keys(changedTiddlers).some((changedTiddlerTitle) => {
        if (changedTiddlerTitle.startsWith('$:/state/')) return false;
        // if modified date is within calendar view, refresh to show new event
        const endDateKey = context.endDateFields?.[0] ?? 'endDate';
        if (changedTiddlers[changedTiddlerTitle].modified === true) {
          return changedTiddlerInViewRange(changedTiddlerTitle, this.#calendar, endDateKey);
        }
        if (changedTiddlers[changedTiddlerTitle].deleted === true) {
          // have to react to each deleted tiddler, because we can't get deleted tiddler fields, so can't check if it's a calendar entry
          // maybe can set a state tiddler as flag, and only react to deletion when that flag exist, then delete that flag
          return true;
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
    if (
      getIsSearchMode() &&
      (changedTiddlers['$:/temp/volatile/linonetwo/tw-calendar/tiddlywiki-ui/PageLayout/EventsCalendarSearchLayout/keywords']?.modified === true ||
        changedTiddlers['$:/state/linonetwo/tw-calendar/tiddlywiki-ui/PageLayout/EventsCalendarSearchLayout/pagination']?.modified === true)
    ) {
      this.#calendar?.getEventSourceById(tiddlerEventSourceID)?.refetch();
      refreshed = true;
    }
    return refreshed;
  }

  /**
   * Lifecycle method: Render this widget into the DOM
   */
  render(parent: Element, _nextSibling: Element | null): void {
    this.parentDomNode = parent;
    this.computeAttributes();
    this.execute();

    if (this.#containerElement === undefined || this.#mountElement === undefined) {
      this.#containerElement = document.createElement('div');
      this.#mountElement = document.createElement('div');
      this.#containerElement.append(this.#mountElement);
      this.#mountElement.classList.add('tiddlywiki-calendar-widget-container');
      const [width, height] = [this.getAttribute('width'), this.getAttribute('height')];
      if (width !== undefined) {
        this.#containerElement.style.width = width;
      }
      if (height !== undefined) {
        this.#containerElement.style.height = height;
      }
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

  destroy() {
    super.destroy();
    this.#calendar?.destroy();
  }

  getContext(): IContext {
    /* eslint-disable @typescript-eslint/strict-boolean-expressions */
    return {
      endDateFields: this.getAttribute('endDateFields')?.split(','),
      filter: this.getAttribute('filter'),
      hideToolbar: (this.getAttribute('hideToolbar') === 'yes') || (this.getAttribute('hideToolbar') === 'true'),
      initialDate: this.getAttribute('initialDate'),
      initialView: this.getAttribute('initialView'),
      defaultTags: $tw.utils.parseStringArray(this.getAttribute('defaultTags') || '') ?? [],
      parentWidget: this.parentWidget,
      containerElement: this.#containerElement,
      readonly: (this.getAttribute('readonly') === 'yes') || (this.getAttribute('readonly') === 'true'),
      // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
      slotDuration: this.getAttribute('slotDuration') || $tw.wiki.getTiddlerText('$:/plugins/linonetwo/tw-calendar/settings/slotDuration'),
      startDateFields: this.getAttribute('startDateFields')?.split(','),
      timeZone: this.getAttribute('timeZone'),
    };
  }
}

/* eslint-disable @typescript-eslint/no-unsafe-member-access */
exports.widget = CalendarWidget;
