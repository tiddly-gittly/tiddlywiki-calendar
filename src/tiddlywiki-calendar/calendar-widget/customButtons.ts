/* eslint-disable @typescript-eslint/strict-boolean-expressions */
import { getIsSmallScreen } from './constants';

export function setToolbarIcons() {
  const backToDefaultLayoutButton = document.querySelector('.fc-backToDefaultLayout-button');
  if (backToDefaultLayoutButton) {
    const svgIcon = $tw.wiki.renderTiddler('text/html', '$:/plugins/linonetwo/tw-calendar/Images/ExitLayout')?.replace('<p>', '')?.replace('</p>', '') ?? '';
    backToDefaultLayoutButton.innerHTML = getIsSmallScreen() ? svgIcon : `${$tw.wiki.getTiddlerText('$:/language/Buttons/Close/Caption') ?? 'Close'} ${svgIcon}`;
  }
  const searchLayoutButton = document.querySelector('.fc-searchLayout-button');
  if (searchLayoutButton) {
    const svgIcon = $tw.wiki.renderTiddler('text/html', '$:/plugins/linonetwo/tw-calendar/tiddlywiki-ui/Images/CalendarSearchImage')?.replace('<p>', '')?.replace('</p>', '') ?? '';
    searchLayoutButton.innerHTML = getIsSmallScreen() ? svgIcon : `${$tw.wiki.getTiddlerText('$:/language/Search/Search') ?? 'Search'} ${svgIcon}`;
  }
  const toggleSidebarButton = document.querySelector('.fc-toggleSidebar-button');
  if (toggleSidebarButton) {
    const svgIcon = $tw.wiki.renderTiddler('text/html', '$:/core/images/chevron-left')?.replace('<p>', '')?.replace('</p>', '') ?? '';
    toggleSidebarButton.innerHTML = getIsSmallScreen() ? svgIcon : `${$tw.wiki.getTiddlerText('$:/language/Buttons/ShowSideBar/Caption') ?? 'ShowSideBar'} ${svgIcon}`;
  }
}

export function getCustomButtons() {
  return ({
    backToDefaultLayout: {
      /** set by setToolbarIcons() above */
      text: '',
      hint: $tw.wiki.getTiddlerText('$:/language/Buttons/FullScreen/Hint') ?? 'Exit',
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
      hint: $tw.wiki.getTiddlerText('$:/language/Buttons/ShowSideBar/Caption') ?? 'ShowSideBar',
      click: () => {
        const opened = ($tw.wiki.getTiddlerText('$:/state/event-calendar-sidebar') ?? 'no') === 'yes';
        $tw.wiki.setText('$:/state/event-calendar-sidebar', 'text', undefined, opened ? 'no' : 'yes');
      },
    },
  });
}
