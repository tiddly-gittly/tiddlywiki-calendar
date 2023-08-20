/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable unicorn/prevent-abbreviations */
/*
Display passed-in tiddler names in a tree like <<toc>> respect to their tag relationship
*/

exports.name = 'input-only-tag-tree';

exports.params = [{ name: 'tags' }];

const textMacros = `
\\define tag-styles()
background-color:$(backgroundColor)$;
fill:$(foregroundColor)$;
color:$(foregroundColor)$;
\\end

\\define tag-body-inner(colour,fallbackTarget,colourA,colourB,icon)
\\whitespace trim
<$vars foregroundColor=<<contrastcolour target:"""$colour$""" fallbackTarget:"""$fallbackTarget$""" colourA:"""$colourA$""" colourB:"""$colourB$""">> backgroundColor="""$colour$""">
  <$button class="tc-tag-label" style=<<tag-styles>>>
    <$transclude $variable="tag-tree-button-action" tagName=<<currentTiddler>> />
    <$transclude tiddler="""$icon$"""/>
    <$transclude field="caption">
      <$view field="title"/>
    </$transclude>
  </$button>
</$vars>
\\end
`;

exports.run = function(tagsString = '') {
  const tags = tagsString.split(' ').filter((tag) => tag.length > 0);
  // remove all tags that has direct parent in the array, so we won't create duplicate trees
  const tagsWithoutDuplicate = tags.filter((tag) => {
    const tiddler = $tw.wiki.getTiddler(tag);
    if (tiddler === undefined) return true;
    if ((tiddler.fields.tags ?? []).some((tagOfTag) => tags.includes(tagOfTag))) return false;
    return true;
  });
  if (tagsWithoutDuplicate.length === 0) return '';
  return `${textMacros}<ul>
    ${
    tagsWithoutDuplicate
      .map((tag) => buildTocWithOfferedTiddlers(tag, tags))
      .map((item) => `<li>${item}</li>`)
      .join('')
  }
    </ul>`;
};

function buildTocWithOfferedTiddlers(rootTiddler: string, offeredTiddlers: string[]): string {
  const tiddlersTaggingTheRoot = $tw.wiki.filterTiddlers(`[tag[${rootTiddler}]]`);
  const paletteName = $tw.wiki.getTiddlerText('$:/palette') ?? '$:/palettes/Vanilla';
  const rootButton = `
  <$let
    currentTiddler="${rootTiddler}"
    icon={{{ [[${rootTiddler}]] :cascade[all[shadows+tiddlers]tag[$:/tags/TiddlerIconFilter]!is[draft]get[text]] }}}
    fallbackTarget={{${paletteName}##tag-background}}
    colourA={{${paletteName}##foreground}}
    colourB={{${paletteName}##background}}
    colour={{{ [[${rootTiddler}]] :cascade[all[shadows+tiddlers]tag[$:/tags/TiddlerColourFilter]!is[draft]get[text]] }}}
  >
    <$macrocall $name="tag-body-inner" colour=<<colour>> fallbackTarget=<<fallbackTarget>> colourA=<<colourA>> colourB=<<colourB> icon=<<icon>>/>
  </$let>`;
  if (tiddlersTaggingTheRoot.length === 0) return rootButton;
  return `${rootButton}
  <ul>
	${
    tiddlersTaggingTheRoot
      .filter((tag) => offeredTiddlers.includes(tag))
      .map((tag) => `<li>${buildTocWithOfferedTiddlers(tag, offeredTiddlers)}</li>`)
      .join('')
  }
	</ul>`;
}
