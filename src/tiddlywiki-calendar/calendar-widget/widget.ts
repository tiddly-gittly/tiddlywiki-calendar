/* eslint-disable @typescript-eslint/strict-boolean-expressions */
/* eslint-disable @typescript-eslint/prefer-nullish-coalescing */
import { widget as Widget } from '$:/core/modules/widgets/widget.js';
import type { Calendar } from '@fullcalendar/core';
import { ConnectionObserver } from '@wessberg/connection-observer';
import debounce from 'lodash/debounce';
import type { IChangedTiddlers, IParseTreeNode, IWidgetInitialiseOptions } from 'tiddlywiki';

import { changedTiddlerInViewRange } from './changeDetector';
import { draftTiddlerTitle, getIsSearchMode, tiddlerEventSourceID } from './constants';
import { type IContext, initCalendar } from './initCalendar';

class CalendarWidget extends Widget {
  #calendar?: Calendar;
  #containerElement?: HTMLDivElement;
  #mountElement?: HTMLDivElement;
  connectionObserver = new ConnectionObserver(entries => {
    for (const { connected } of entries) {
      if (!connected) {
        this.destroy();
        this.connectionObserver?.disconnect?.();
      }
    }
  });

  constructor(parseTreeNode: IParseTreeNode, options?: IWidgetInitialiseOptions) {
    super(parseTreeNode, options);
    this.refreshTiddlerEventCalendar = debounce(this.refreshTiddlerEventCalendar.bind(this), 500);
  }

  /**
   * When some tiddler changed, refresh the calendar to show the change. By rerun `calendar-widget/eventContent.ts` and `calendar-widget/getEvents.ts`
   * This method is debounced, to prevent lazy-load a tiddler trigger refresh again and again, for every item in the view.
   * @param force recreate the whole calendar, to make change to config take effect.
   */
  refreshTiddlerEventCalendar(force = false) {
    if (force) {
      this.#calendar?.destroy();
      const context = this.getContext();
      this.#calendar = initCalendar(this.#mountElement!, context);
      this.#calendar?.render();
    } else {
      this.#triggerRefetch();
    }
  }

  #triggerRefetch() {
    this.#calendar?.getEventSourceById(tiddlerEventSourceID)?.refetch();
  }

  refresh(changedTiddlers: IChangedTiddlers): boolean {
    let refreshed = false;
    let refreshImmediately = false;
    const context = this.getContext();
    if (
      Object.keys(changedTiddlers).some((changedTiddlerTitle) => {
        if (changedTiddlerTitle.startsWith(draftTiddlerTitle)) {
          // when draft tiddler changed, refresh immediately, to show new event on typing or dragging
          refreshImmediately = true;
          return true;
        }
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
      if (refreshImmediately) {
        this.#triggerRefetch();
      } else {
        this.refreshTiddlerEventCalendar();
      }
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
      this.refreshTiddlerEventCalendar(true);
      // this won't cause this.render to be called...
      refreshed = true;
    }
    if (
      Object.keys(changedTiddlers).some((changedTiddlerTitle) => {
        // when sidebar toggle, need to do full refresh, otherwise the UI will break.
        if (changedTiddlerTitle.startsWith('$:/state/event-calendar-sidebar')) return true;
        return false;
      })
    ) {
      this.#calendar?.updateSize();
      this.#triggerRefetch();
    }
    if (
      getIsSearchMode() &&
      (changedTiddlers['$:/temp/volatile/linonetwo/tw-calendar/tiddlywiki-ui/PageLayout/EventsCalendarSearchLayout/keywords']?.modified === true ||
        changedTiddlers['$:/state/linonetwo/tw-calendar/tiddlywiki-ui/PageLayout/EventsCalendarSearchLayout/pagination']?.modified === true)
    ) {
      this.refreshTiddlerEventCalendar();
      refreshed = true;
    }
    this.refreshChildren(changedTiddlers);
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
      this.connectionObserver.observe(this.parentDomNode);
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
    this.#calendar?.destroy();
  }

  getContext(): IContext {
    /* eslint-disable @typescript-eslint/strict-boolean-expressions */
    const draggableContainerElementSelector = this.getAttribute('draggableContainer');
    return {
      endDateFields: this.getAttribute('endDateFields')?.split(','),
      filter: this.getAttribute('filter'),
      obscureFilter: this.getAttribute('obscureFilter'),
      hideToolbar: this.getAttribute('hideToolbar') === 'yes',
      initialDate: this.getAttribute('initialDate') || undefined,
      initialView: this.getAttribute('initialView') || undefined,
      defaultTags: $tw.utils.parseStringArray(this.getAttribute('defaultTags') || '') ?? [],
      parentWidget: this.parentWidget,
      widget: this,
      containerElement: this.#containerElement,
      draggableContainerElement: draggableContainerElementSelector ? document.querySelector<HTMLDivElement>(draggableContainerElementSelector) ?? undefined : undefined,
      readonly: this.getAttribute('readonly') === 'yes',
      // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
      slotDuration: this.getAttribute('slotDuration') || $tw.wiki.getTiddlerText('$:/plugins/linonetwo/tw-calendar/settings/slotDuration'),
      startDateFields: this.getAttribute('startDateFields')?.split(','),
      timeZone: this.getAttribute('timeZone'),
    };
  }
}

declare let exports: {
  widget: typeof CalendarWidget;
};
exports.widget = CalendarWidget;
