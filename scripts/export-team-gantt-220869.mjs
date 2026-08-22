import fs from 'node:fs';
import {
  TEAM_SOURCE_METADATA,
  flattenTeamSourceActivities
} from '../src/team-activity-source-220869.js';
import {
  teamGanttRows,
  teamGanttStats,
  teamGanttCSV
} from '../src/build-team-gantt-220869.js';

fs.mkdirSync('data', { recursive: true });
fs.writeFileSync('data/team-gantt-220869.json', JSON.stringify({
  metadata: TEAM_SOURCE_METADATA,
  stats: teamGanttStats,
  activities: teamGanttRows
}, null, 2));
fs.writeFileSync('data/team-gantt-220869.csv', `\uFEFF${teamGanttCSV()}`);
fs.writeFileSync('data/team-source-register-220869.json', JSON.stringify({
  metadata: TEAM_SOURCE_METADATA,
  activities: flattenTeamSourceActivities()
}, null, 2));

const mappingHeaders = [
  'source_row','source_kind','work_name','zone_code','zone_name','source_label','activity_name',
  'source_issue','normalization_note','match_level','mapping_note','start_day','finish_day',
  'duration_days','matched_activity_count','matched_activity_ids'
];
const quote = value => `"${String(value ?? '').replaceAll('"', '""')}"`;
const mappingCSV = [
  mappingHeaders.join(','),
  ...teamGanttRows.map(row => mappingHeaders.map(header => quote(
    header === 'matched_activity_ids' ? row.matched_activity_ids.join(';') : row[header]
  )).join(','))
].join('\n');
fs.writeFileSync('data/team-gantt-mapping-register-220869.csv', `\uFEFF${mappingCSV}`);

console.log(`Exported ${teamGanttRows.length} source-driven team Gantt activities.`);
console.log(`Physical=${teamGanttStats.physical_activities}; Special costs=${teamGanttStats.special_cost_activities}`);
console.log(`Exact mappings=${teamGanttStats.exact_area_work_matches}; Fallback mappings=${teamGanttStats.fallback_matches}`);
console.log('Outputs: team-gantt-220869.json/csv, source register, mapping register.');
