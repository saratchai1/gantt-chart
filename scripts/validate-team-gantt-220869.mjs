import fs from 'node:fs';
import {
  TEAM_SOURCE_ACTIVITY_COUNT,
  TEAM_WORK_SECTIONS,
  TEAM_SPECIAL_COSTS,
  flattenTeamSourceActivities
} from '../src/team-activity-source-220869.js';
import { teamGanttRows, teamGanttStats } from '../src/build-team-gantt-220869.js';

const errors = [];
const advisories = [];
const addError = (message, detail = null) => errors.push({ message, detail });
const addAdvisory = (message, detail = null) => advisories.push({ message, detail });
const sourceRows = flattenTeamSourceActivities();

if (TEAM_SOURCE_ACTIVITY_COUNT !== 107) addError('Excel source activity count must be 107', TEAM_SOURCE_ACTIVITY_COUNT);
if (sourceRows.filter(row => row.source_kind === 'PHYSICAL_SCOPE').length !== 96) addError('Physical Excel activity count must be 96');
if (TEAM_SPECIAL_COSTS.length !== 11) addError('Special-cost activity count must be 11', TEAM_SPECIAL_COSTS.length);
if (TEAM_WORK_SECTIONS.length !== 9) addError('Physical work-section count must be 9', TEAM_WORK_SECTIONS.length);
if (teamGanttRows.length !== sourceRows.length) addError('Built team Gantt row count does not match Excel source', {
  source: sourceRows.length,
  built: teamGanttRows.length
});

const ids = teamGanttRows.map(row => row.team_activity_id);
const duplicateIds = ids.filter((id, index) => ids.indexOf(id) !== index);
if (duplicateIds.length) addError('Duplicate team activity IDs', [...new Set(duplicateIds)]);

const sourceKeys = sourceRows.map(row => `${row.source_kind}:${row.source_row}:${row.work_code}`);
const duplicateSourceKeys = sourceKeys.filter((key, index) => sourceKeys.indexOf(key) !== index);
if (duplicateSourceKeys.length) addError('Duplicate source activity rows', [...new Set(duplicateSourceKeys)]);

for (const row of teamGanttRows) {
  if (!row.activity_name?.trim()) addError('Missing activity name', row.team_activity_id);
  if (!row.work_name?.trim()) addError('Missing work heading', row.team_activity_id);
  if (!row.zone_name?.trim()) addError('Missing zone heading', row.team_activity_id);
  if (!Number.isInteger(row.start_day) || !Number.isInteger(row.finish_day)) addError('Non-integer timing', row.team_activity_id);
  if (row.start_day < 1 || row.finish_day > 1200 || row.finish_day < row.start_day) addError('Timing outside D1–D1200', {
    id: row.team_activity_id,
    start: row.start_day,
    finish: row.finish_day
  });
  if (row.duration_days !== row.finish_day - row.start_day + 1) addError('Duration calculation mismatch', row.team_activity_id);
  if (!row.matched_activity_count || !row.matched_activity_ids?.length) addError('No baseline activities mapped', row.team_activity_id);
  if (row.matched_activity_count !== row.matched_activity_ids.length) addError('Matched activity count mismatch', row.team_activity_id);
  if (row.timing_basis !== 'DERIVED_FROM_EXISTING_BASELINE') addError('Timing provenance is not explicit', row.team_activity_id);
}

const sourceIssues = teamGanttRows.filter(row => row.source_issue);
if (sourceIssues.length !== 1 || sourceIssues[0]?.source_row !== 127) {
  addError('The malformed Excel source label at row 127 must remain explicitly flagged', sourceIssues.map(row => ({
    source_row: row.source_row,
    source_issue: row.source_issue
  })));
}
if (!sourceIssues[0]?.source_label.includes('(zone D)rop-off') || sourceIssues[0]?.activity_name !== 'โซน Drop-off') {
  addError('Row 127 must preserve the source label and expose the normalized display label separately');
}

const fallbackRows = teamGanttRows.filter(row => row.source_kind === 'PHYSICAL_SCOPE' && row.match_level !== 'AREA_AND_WORK_EXACT');
if (fallbackRows.length) addAdvisory('Some Excel rows require area- or zone-level timing fallback because the existing detailed baseline does not use the same package name or work split', {
  count: fallbackRows.length,
  by_level: fallbackRows.reduce((acc, row) => {
    acc[row.match_level] = (acc[row.match_level] || 0) + 1;
    return acc;
  }, {}),
  sample: fallbackRows.slice(0, 20).map(row => ({
    id: row.team_activity_id,
    source_row: row.source_row,
    work: row.work_name,
    zone: row.zone_code,
    activity: row.activity_name,
    match_level: row.match_level
  }))
});

const workCounts = teamGanttRows.reduce((acc, row) => {
  acc[row.work_name] = (acc[row.work_name] || 0) + 1;
  return acc;
}, {});
const zoneCounts = teamGanttRows.reduce((acc, row) => {
  acc[row.zone_code] = (acc[row.zone_code] || 0) + 1;
  return acc;
}, {});

const report = {
  status: errors.length ? 'FAIL' : advisories.length ? 'PASS_WITH_ADVISORIES' : 'PASS',
  source_file: teamGanttStats.source_file,
  source_activity_count: sourceRows.length,
  built_activity_count: teamGanttRows.length,
  physical_activity_count: teamGanttStats.physical_activities,
  special_cost_activity_count: teamGanttStats.special_cost_activities,
  work_section_count: TEAM_WORK_SECTIONS.length + 1,
  zone_count: teamGanttStats.zones,
  exact_area_work_matches: teamGanttStats.exact_area_work_matches,
  fallback_matches: teamGanttStats.fallback_matches,
  source_issue_count: teamGanttStats.source_issues,
  project_span: `D${teamGanttStats.start_day}–D${teamGanttStats.finish_day}`,
  work_counts: workCounts,
  zone_counts: zoneCounts,
  errors,
  advisories
};

fs.mkdirSync('data', { recursive: true });
fs.writeFileSync('data/team-gantt-validation-220869.json', JSON.stringify(report, null, 2));

console.log(`Team Excel Gantt validation: ${report.status}`);
console.log(`Source/Built activities: ${sourceRows.length}/${teamGanttRows.length}`);
console.log(`Physical=${teamGanttStats.physical_activities}; Special costs=${teamGanttStats.special_cost_activities}; Works=${report.work_section_count}`);
console.log(`Exact mappings=${teamGanttStats.exact_area_work_matches}; Fallback mappings=${teamGanttStats.fallback_matches}`);
console.log(`Source issues retained=${teamGanttStats.source_issues}`);
console.log(`Errors=${errors.length}; Advisories=${advisories.length}`);
if (errors.length) {
  console.error(JSON.stringify(errors, null, 2));
  process.exit(1);
}
