/* eslint-disable @typescript-eslint/strict-boolean-expressions */
import { IFilterOperator } from 'tiddlywiki';

export const notHaveGroupTag = ((source, _operator): string[] => {
  const results: string[] = [];
  const gaugeMetaTag = $tw.wiki.getTiddlerText('$:/plugins/linonetwo/calendar-statistic-chart/tags/gauge-meta-tag');
  const gaugeTemplateGroupMetaTag = $tw.wiki.getTiddlerText('$:/plugins/linonetwo/calendar-statistic-chart/tags/gauge-template-group-meta-tag');
  if (!gaugeMetaTag || !gaugeTemplateGroupMetaTag) return results;
  source(function(tiddler, title) {
    if (tiddler) {
      const tags = tiddler.fields.tags.filter(tag => tag !== gaugeMetaTag);
      const tagsOfTags = tags.flatMap(tag => $tw.wiki.getTiddler(tag)?.fields?.tags ?? []);
      // if don't have other tag, or every tag is not template group tag
      if (tagsOfTags.length === 0 || !tagsOfTags.includes(gaugeTemplateGroupMetaTag)) {
        results.push(title);
      }
    }
  });
  return results;
}) satisfies IFilterOperator;
