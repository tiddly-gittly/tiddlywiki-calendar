/* eslint-disable unicorn/no-null */
/* eslint-disable @typescript-eslint/strict-boolean-expressions */
import { IFilterOperator } from 'tiddlywiki';
import { getDiffInHours } from './dateUtils';

/**
 * Convert hours to HH:MM:SS format, rounded to nearest 15 minutes
 */
function formatDuration(hours: number): string {
  // Round to nearest 15 minutes (0.25 hours)
  const roundedHours = Math.round(hours * 4) / 4;

  // Convert to total minutes
  const totalMinutes = Math.round(roundedHours * 60);

  // Calculate hours, minutes, seconds
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  const s = 0; // Always 0 seconds since we round to minutes

  // Format as HH:MM:SS
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

/**
 * Calculate the usage frequency and average duration of tag combinations within recent specified days
 *
 * Input: Calendar entry tiddlers
 * Output: String array in format "tagCombination|count|avgDuration", sorted by count in descending order
 * tagCombination is a combination of tags, multiple tags separated by spaces
 *
 * ```
 * [all[tiddlers]!is[system]field:calendarEntry[yes]tagsfreq[7]]
 * ```
 */
export const tagsfreq = ((source, operator): string[] => {
  const daysLimit = Number(operator.operand || 7);
  const now = new Date();
  const cutoffDate = new Date(now.getTime() - daysLimit * 24 * 60 * 60 * 1000);

  // Statistics for tag combination frequency and duration
  const tagGroupStats: Record<string, { count: number; totalDuration: number }> = {};

  source(function(tiddler, _title) {
    if (!tiddler) return;

    // Check if within time range
    let dateInRange = false;

    // Check startDate
    if (tiddler.fields.startDate) {
      const startDate = $tw.utils.parseDate(tiddler.fields.startDate as string);
      if (startDate && startDate >= cutoffDate) {
        dateInRange = true;
      }
    }

    // Check endDate
    if (tiddler.fields.endDate) {
      const endDate = $tw.utils.parseDate(tiddler.fields.endDate as string);
      if (endDate && endDate >= cutoffDate) {
        dateInRange = true;
      }
    }

    // If no date fields, check created and modified
    if (!tiddler.fields.startDate && !tiddler.fields.endDate) {
      if (tiddler.fields.created) {
        const created = $tw.utils.parseDate(String(tiddler.fields.created));
        if (created && created >= cutoffDate) {
          dateInRange = true;
        }
      }
      if (tiddler.fields.modified) {
        const modified = $tw.utils.parseDate(String(tiddler.fields.modified));
        if (modified && modified >= cutoffDate) {
          dateInRange = true;
        }
      }
    }

    if (!dateInRange) return;

    // Calculate duration (hours), rounded to nearest 15 minutes
    let duration = 1; // Default 1 hour
    if (tiddler.fields.startDate && tiddler.fields.endDate) {
      const startDate = $tw.utils.parseDate(tiddler.fields.startDate as string);
      const endDate = $tw.utils.parseDate(tiddler.fields.endDate as string);
      if (startDate && endDate) {
        const rawDuration = getDiffInHours(endDate, startDate);
        // Round to nearest 15 minutes (0.25 hours)
        duration = Math.round(rawDuration * 4) / 4;
        if (duration <= 0) duration = 0.25; // At least 15 minutes
      }
    }

    // Count tag combinations
    if (tiddler.fields.tags) {
      let userTags: string[] = [];

      // Handle tags field, could be string or array
      if (typeof tiddler.fields.tags === 'string') {
        // Parse tags string safely
        userTags = $tw.utils.parseStringArray(tiddler.fields.tags as string)
          .filter((tag: string) => tag && !tag.startsWith('$:/'));
      } else if (Array.isArray(tiddler.fields.tags)) {
        // If array, filter directly
        userTags = tiddler.fields.tags
          .filter((tag: string) => tag && !tag.startsWith('$:/'));
      }

      // Sort to ensure same tag combinations have same key
      userTags.sort();

      if (userTags.length > 0) {
        // Use stringifyList to safely handle tags with spaces
        const tagGroup = $tw.utils.stringifyList(userTags);

        if (!tagGroupStats[tagGroup]) {
          tagGroupStats[tagGroup] = { count: 0, totalDuration: 0 };
        }
        tagGroupStats[tagGroup].count++;
        tagGroupStats[tagGroup].totalDuration += duration;
      }
    }
  });

  // Convert to result array and sort
  const results = Object.entries(tagGroupStats)
    .map(([tagGroup, stats]) => {
      const avgDuration = stats.totalDuration / stats.count;
      const avgDurationFormatted = formatDuration(avgDuration);
      return `${tagGroup}|${stats.count}|${avgDurationFormatted}`;
    })
    .sort((a, b) => {
      const countA = Number(a.split('|')[1]);
      const countB = Number(b.split('|')[1]);
      return countB - countA; // Descending order
    })
    .slice(0, 10); // Only take top 10

  return results;
}) satisfies IFilterOperator;
