/* eslint-disable @typescript-eslint/no-unsafe-member-access */

/*
Display passed-in tiddler names in a tree like <<toc>> respect to their tag relationship
*/

exports.name = 'tag-tree-picker';

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
  const tags = $tw.utils.parseStringArray(tagsString).filter((tag) => tag.length > 0);
  if (tags.length === 0) return '';

  const tagSet = new Set(tags);
  const childrenByParent = new Map<string, string[]>();

  for (const tag of tags) {
    childrenByParent.set(tag, []);
  }

  for (const tag of tags) {
    const tiddler = $tw.wiki.getTiddler(tag);
    if (tiddler === undefined) continue;
    for (const parentTag of (tiddler.fields.tags ?? [])) {
      if (!tagSet.has(parentTag)) continue;
      childrenByParent.get(parentTag)?.push(tag);
    }
  }

  // remove all tags that has direct parent in the offered array, so we won't create duplicate trees
  const tagsWithoutDuplicate = tags.filter((tag) => {
    const tiddler = $tw.wiki.getTiddler(tag);
    if (tiddler === undefined) return true;
    return !(tiddler.fields.tags ?? []).some((tagOfTag) => tagSet.has(tagOfTag));
  });

  const treeRoots = tagsWithoutDuplicate.length > 0 ? tagsWithoutDuplicate : tags;
  return `${textMacros}<ul class="linonetwo-tag-tree-picker-macro">
    ${
    treeRoots
      .map((tag) => buildTocWithOfferedTiddlers(tag, childrenByParent, new Set()))
      .map((item) => `<li>${item}</li>`)
      .join('')
  }
    </ul>`;
};

function buildTocWithOfferedTiddlers(rootTiddler: string, childrenByParent: Map<string, string[]>, path: Set<string>): string {
  const tiddlersTaggingTheRoot = childrenByParent.get(rootTiddler) ?? [];
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
    <$macrocall $name="tag-body-inner" colour=<<colour>> fallbackTarget=<<fallbackTarget>> colourA=<<colourA>> colourB=<<colourB>> icon=<<icon>>/>
  </$let>`;
  if (tiddlersTaggingTheRoot.length === 0) return rootButton;

  const nextPath = new Set(path);
  nextPath.add(rootTiddler);
  const childTree = tiddlersTaggingTheRoot
    .filter((tag) => !nextPath.has(tag))
    .map((tag) => `<li>${buildTocWithOfferedTiddlers(tag, childrenByParent, nextPath)}</li>`)
    .join('');

  if (childTree.length === 0) return rootButton;

  return `${rootButton}
  <ul>
	${childTree}
	</ul>`;
}
