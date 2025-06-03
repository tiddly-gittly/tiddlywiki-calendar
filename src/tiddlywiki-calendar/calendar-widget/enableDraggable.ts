/* eslint-disable @typescript-eslint/strict-boolean-expressions */
import { Draggable } from '@fullcalendar/interaction';
import { IContext } from './initCalendar';

/**
 * Full calendar not only require HTML5 drag&drop draggable, but also require wrapping them with its class.
 */
export function enableSidebarDraggable(context: IContext) {
  setTimeout(() => {
    const sidebarContainer = context.draggableContainerElement;
    if (!sidebarContainer) {
      console.warn('enableSidebarDraggable: sidebarContainer not found');
      return;
    }
    // eslint-disable-next-line no-new
    new Draggable(sidebarContainer, {
      itemSelector: '.tc-draggable',
      appendTo: context.containerElement,
      longPressDelay: 500,
    });
  }, 1);
}
