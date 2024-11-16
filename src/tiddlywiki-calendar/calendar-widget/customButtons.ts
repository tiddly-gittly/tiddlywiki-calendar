/* eslint-disable @typescript-eslint/strict-boolean-expressions */
import { Draggable } from '@fullcalendar/interaction';
import { getIsSmallScreen } from './constants';
import { IContext } from './initCalendar';
export function setToolbarIcons() {
  const backToStandardLayoutButton = document.querySelector('.fc-backToStandardLayout-button');
  if (backToStandardLayoutButton) {
    const svgIcon = $tw.wiki.renderTiddler('text/html', '$:/core/images/standard-layout')?.replace('<p>', '')?.replace('</p>', '') ?? '';
    backToStandardLayoutButton.innerHTML = getIsSmallScreen() ? svgIcon : `${$tw.wiki.getTiddlerText('$:/language/PageTemplate/Name') ?? 'Close'} ${svgIcon}`;
  }
  const searchLayoutButton = document.querySelector('.fc-searchLayout-button');
  if (searchLayoutButton) {
    const svgIcon = $tw.wiki.renderTiddler('text/html', '$:/plugins/linonetwo/tw-calendar/tiddlywiki-ui/Images/CalendarSearchImage')?.replace('<p>', '')?.replace('</p>', '') ?? '';
    searchLayoutButton.innerHTML = getIsSmallScreen() ? svgIcon : `${$tw.wiki.getTiddlerText('$:/language/Search/Search') ?? 'Search'} ${svgIcon}`;
  }
  const toggleSidebarButton = document.querySelector('.fc-toggleSidebar-button');
  if (toggleSidebarButton) {
    const sidebarOpened = ($tw.wiki.getTiddlerText('$:/state/event-calendar-sidebar') ?? 'no') === 'yes';
    const svgIcon = $tw.wiki.renderTiddler('text/html', sidebarOpened ? '$:/core/images/chevron-right' : '$:/core/images/chevron-left')?.replace('<p>', '')?.replace('</p>', '') ??
      '';
    toggleSidebarButton.innerHTML = getIsSmallScreen() ? svgIcon : `${$tw.wiki.getTiddlerText('$:/language/Buttons/ShowSideBar/Caption') ?? 'ShowSideBar'} ${svgIcon}`;
  }
}

export function getCustomButtons(context: IContext) {
  const sidebarOpened = ($tw.wiki.getTiddlerText('$:/state/event-calendar-sidebar') ?? 'no') === 'yes';

  return ({
    backToStandardLayout: {
      /** set by setToolbarIcons() above */
      text: '',
      hint: $tw.wiki.getTiddlerText('$:/language/PageTemplate/Name') ?? 'Exit',
      click: () => {
        // Remove initialParams so it won't affect next open
        $tw.wiki.deleteTiddler('$:/state/Calendar/PageLayout/EventCalendar/initialParams');
        $tw.wiki.setText('$:/layout', 'text', undefined, '');
      },
    },
    searchLayout: {
      /** set by setToolbarIcons() above */
      text: '',
      hint: $tw.wiki.getTiddlerText('$:/language/Search/Standard/Hint') ?? 'Search',
      click: () => {
        // Remove initialParams so it won't affect next open
        $tw.wiki.deleteTiddler('$:/state/Calendar/PageLayout/EventCalendar/initialParams');
        $tw.wiki.setText('$:/layout', 'text', undefined, '$:/plugins/linonetwo/tw-calendar/tiddlywiki-ui/PageLayout/EventsCalendarSearchLayout');
      },
    },
    toggleSidebar: {
      /** set by setToolbarIcons() above */
      text: '',
      hint: sidebarOpened
        ? ($tw.wiki.getTiddlerText('$:/language/Buttons/CloseSideBar/Caption') ?? 'CloseSideBar')
        : ($tw.wiki.getTiddlerText('$:/language/Buttons/ShowSideBar/Caption') ?? 'ShowSideBar'),
      click: () => {
        const sidebarOpened = ($tw.wiki.getTiddlerText('$:/state/event-calendar-sidebar') ?? 'no') === 'yes';
        $tw.wiki.setText('$:/state/event-calendar-sidebar', 'text', undefined, sidebarOpened ? 'no' : 'yes');
        if (!sidebarOpened) {
          // is about to open
          setTimeout(() => {
            const sidebarContainer = context.containerElement?.parentElement?.parentElement?.querySelector<HTMLDivElement>('.event-calendar-sidebar');
            if (!sidebarContainer) return;
            // eslint-disable-next-line no-new
            new Draggable(sidebarContainer, {
              itemSelector: '.tc-draggable',
              appendTo: context.containerElement,
            });
          }, 1);
        }
      },
    },
  });
}
