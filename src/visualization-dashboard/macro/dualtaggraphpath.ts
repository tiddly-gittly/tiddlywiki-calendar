const DEFAULT_MAX_DISTANCE = 8;
const DEFAULT_RELATION_TYPES = ['tag-parent', 'tag-child', 'link', 'backlink', 'transclude', 'backtransclude', 'list', 'backlist'] as const;
const ALLOWED_RELATION_TYPES = new Set<string>(DEFAULT_RELATION_TYPES);

type MacroDefinition = {
  name: string;
  params: Array<{ name: string }>;
  run: (startTiddler: string, endTiddler: string, maxDistance: string, relationTypes: string, excludeFilter: string) => string;
};

type BooleanLookup = Partial<Record<string, true>>;
type DistanceLookup = Partial<Record<string, number>>;
type PathLookup = Partial<Record<string, string | undefined>>;
type NeighborCache = Partial<Record<string, string[]>>;

const macro = exports as MacroDefinition;

function toStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
}

function parseNonNegativeInteger(value: string | undefined, fallback: number): number {
  const parsed = parseInt(value || '', 10);
  return Number.isNaN(parsed) || parsed < 0 ? fallback : parsed;
}

function parseRelationTypes(value: string | undefined): string[] {
  const parsed = toStringArray($tw.utils.parseStringArray(value || ''));
  const normalized = parsed.filter((type) => ALLOWED_RELATION_TYPES.has(type));
  return normalized.length > 0 ? normalized : [...DEFAULT_RELATION_TYPES];
}

function readListField(title: string, fieldName: string): string[] {
  const tiddler = $tw.wiki.getTiddler(title);
  if (!tiddler) return [];
  return toStringArray($tw.utils.parseStringArray((tiddler.fields[fieldName] as string | undefined) || ''));
}

function buildExcludedTitles(excludeFilter: string | undefined): BooleanLookup {
  if (!excludeFilter) return {};
  try {
    const titles = toStringArray($tw.wiki.filterTiddlers(excludeFilter));
    const excludedTitles: BooleanLookup = {};
    for (const title of titles) {
      excludedTitles[title] = true;
    }
    return excludedTitles;
  } catch {
    return {};
  }
}

function addNeighbors(
  result: string[],
  titles: string[],
  excludedTitles: BooleanLookup,
  endPoints: BooleanLookup,
  currentTitle: string,
): void {
  for (const title of titles) {
    if (!title || title === currentTitle) continue;
    if (excludedTitles[title] && !endPoints[title]) continue;
    if (!result.includes(title)) {
      result.push(title);
    }
  }
}

function getNeighbors(
  title: string,
  relationTypes: string[],
  excludedTitles: BooleanLookup,
  endPoints: BooleanLookup,
  cache: NeighborCache,
): string[] {
  const cacheKey = `${title}\u0000${relationTypes.join(' ')}`;
  if (cache[cacheKey] !== undefined) {
    return cache[cacheKey].slice(0);
  }

  const neighbors: string[] = [];
  const relationSet = new Set(relationTypes);

  if (relationSet.has('tag-parent')) {
    addNeighbors(neighbors, readListField(title, 'tags'), excludedTitles, endPoints, title);
  }
  if (relationSet.has('tag-child')) {
    addNeighbors(neighbors, $tw.wiki.getTiddlersWithTag(title), excludedTitles, endPoints, title);
  }
  if (relationSet.has('link')) {
    addNeighbors(neighbors, $tw.wiki.getTiddlerLinks(title), excludedTitles, endPoints, title);
  }
  if (relationSet.has('backlink')) {
    addNeighbors(neighbors, $tw.wiki.getTiddlerBacklinks(title), excludedTitles, endPoints, title);
  }
  if (relationSet.has('transclude')) {
    addNeighbors(neighbors, $tw.wiki.getTiddlerTranscludes(title), excludedTitles, endPoints, title);
  }
  if (relationSet.has('backtransclude')) {
    addNeighbors(neighbors, $tw.wiki.getTiddlerBacktranscludes(title), excludedTitles, endPoints, title);
  }
  if (relationSet.has('list')) {
    addNeighbors(neighbors, readListField(title, 'list'), excludedTitles, endPoints, title);
  }
  if (relationSet.has('backlist')) {
    addNeighbors(neighbors, $tw.wiki.findListingsOfTiddler(title, 'list'), excludedTitles, endPoints, title);
  }

  cache[cacheKey] = neighbors.slice(0);
  return neighbors;
}

function reconstructPath(previousByTitle: PathLookup, endTitle: string): string[] {
  const path: string[] = [];
  let title: string | undefined = endTitle;
  while (title !== undefined) {
    path.unshift(title);
    title = previousByTitle[title];
  }
  return path;
}

function tiddlerExists(title: string): boolean {
  return $tw.wiki.tiddlerExists(title) || $tw.wiki.isShadowTiddler(title);
}

macro.name = 'dualtaggraphpath';

macro.params = [
  { name: 'startTiddler' },
  { name: 'endTiddler' },
  { name: 'maxDistance' },
  { name: 'relationTypes' },
  { name: 'excludeFilter' },
];

macro.run = function(
  startTiddler: string,
  endTiddler: string,
  maxDistance: string,
  relationTypes: string,
  excludeFilter: string,
): string {
  if (!startTiddler || !endTiddler) return '';
  if (startTiddler === endTiddler) {
    return tiddlerExists(startTiddler) ? $tw.utils.stringifyList([startTiddler]) : '';
  }
  if (!tiddlerExists(startTiddler) || !tiddlerExists(endTiddler)) return '';

  const parsedMaxDistance = parseNonNegativeInteger(maxDistance, DEFAULT_MAX_DISTANCE);
  const parsedRelationTypes = parseRelationTypes(relationTypes);
  const excludedTitles = buildExcludedTitles(excludeFilter);
  const endPoints: BooleanLookup = {};
  endPoints[startTiddler] = true;
  endPoints[endTiddler] = true;

  const queue: string[] = [startTiddler];
  let queueIndex = 0;
  const previousByTitle: PathLookup = {};
  const distanceByTitle: DistanceLookup = {};
  const neighborCache: NeighborCache = {};

  previousByTitle[startTiddler] = undefined;
  distanceByTitle[startTiddler] = 0;

  while (queueIndex < queue.length) {
    const currentTitle = queue[queueIndex];
    queueIndex += 1;
    const currentDistance = distanceByTitle[currentTitle];
    if (currentDistance === undefined) continue;
    if (currentDistance >= parsedMaxDistance) continue;

    const neighbors = getNeighbors(currentTitle, parsedRelationTypes, excludedTitles, endPoints, neighborCache);
    for (const neighborTitle of neighbors) {
      if (neighborTitle in distanceByTitle) continue;
      previousByTitle[neighborTitle] = currentTitle;
      distanceByTitle[neighborTitle] = currentDistance + 1;
      if (neighborTitle === endTiddler) {
        return $tw.utils.stringifyList(reconstructPath(previousByTitle, endTiddler));
      }
      queue.push(neighborTitle);
    }
  }

  return '';
};
