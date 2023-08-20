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
}

export function getCustomButtons() {
  return ({
    backToDefaultLayout: {
      /** set by setToolbarIcons() above */
      text: '',
      hint: $tw.wiki.getTiddlerText('$:/language/Buttons/FullScreen/Hint') ?? 'Exit',
      click: () => {
        $tw.wiki.setText('$:/layout', 'text', undefined, '');
      },
    },
    searchLayout: {
      /** set by setToolbarIcons() above */
      text: '',
      hint: $tw.wiki.getTiddlerText('$:/language/Search/Standard/Hint') ?? 'Search',
      click: () => {
        $tw.wiki.setText('$:/layout', 'text', undefined, '$:/plugins/linonetwo/tw-calendar/tiddlywiki-ui/PageLayout/EventsCalendarSearchLayout');
      },
    },
  });
}
