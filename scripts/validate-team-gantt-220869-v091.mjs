import fs from 'node:fs';
import {
  TEAM_SOURCE_ACTIVITY_COUNT,
  TEAM_WORK_SECTIONS,
  TEAM_SPECIAL_COSTS,
  flattenTeamSourceActivities
} from '../src/team-activity-source-220869.js';
import {
  TEAM_GANTT_REVISION,
  teamGanttRows,
  teamGanttStats
} from '../src/build-team-gantt-220869-v091.js';

const errors = [];
const advisories = [];
const addError = (message, detail = null) => errors.push({ message, detail });
const sourceRows = flattenTeamSourceActivities();
const expectedTbcRows = [22, 33, 64, 74, 83, 108];
const strongLevels = new Set(['AREA_AND_WORK_EXACT', 'ZONE_EQUIPMENT_SCOPE_MATCH']);

if (TEAM_GANTT_REVISION.version !== '0.9.1') addError('Revision must be v0.9.1', TEAM_GANTT_REVISION.version);
if (TEAM_GANTT_REVISION.baseline_commit_sha !== 'fef660d14ae8ddecda66af3980cee939ac72c84d') {
  addError('Pinned detailed baseline commit is incorrect', TEAM_GANTT_REVISION.baseline_commit_sha);
}
if (TEAM_GANTT_REVISION.source_register_commit_sha !== '1405af254e0ffb590455de45170cbcf25d38790c') {
  addError('Pinned Excel source-register commit is incorrect', TEAM_GANTT_REVISION.source_register_commit_sha);
}
if (!TEAM_GANTT_REVISION.source_file_id) addError('Source file ID is not pinned');
if (TEAM_SOURCE_ACTIVITY_COUNT !== 107) addError('Excel source activity count must be 107', TEAM_SOURCE_ACTIVITY_COUNT);
if (sourceRows.filter(row => row.source_kind === 'PHYSICAL_SCOPE').length !== 96) addError('Physical Excel activity count must be 96');
if (TEAM_SPECIAL_COSTS.length !== 11) addError('Special-cost activity count must be 11', TEAM_SPECIAL_COSTS.length);
if (TEAM_WORK_SECTIONS.length !== 9) addError('Physical work-section count must be 9', TEAM_WORK_SECTIONS.length);
if (teamGanttRows.length !== 107) addError('Built team Gantt row count must be 107', teamGanttRows.length);

const ids = teamGanttRows.map(row => row.team_activity_id);
const duplicateIds = ids.filter((id, index) => ids.indexOf(id) !== index);
if (duplicateIds.length) addError('Duplicate team activity IDs', [...new Set(duplicateIds)]);

for (const row of teamGanttRows) {
  if (!row.activity_name?.trim()) addError('Missing activity name', row.team_activity_id);
  if (!row.work_name?.trim()) addError('Missing work heading', row.team_activity_id);
  if (!row.zone_name?.trim()) addError('Missing zone heading', row.team_activity_id);
  if (row.baseline_commit_sha !== TEAM_GANTT_REVISION.baseline_commit_sha) addError('Row baseline pin mismatch', row.team_activity_id);
  if (row.source_register_commit_sha !== TEAM_GANTT_REVISION.source_register_commit_sha) addError('Row source-register pin mismatch', row.team_activity_id);
  if (row.network_basis !== 'SUMMARY_VIEW_NO_INDEPENDENT_CPM_NETWORK') addError('Summary network disclaimer missing', row.team_activity_id);

  if (row.timing_status === 'TBC_TEAM_CONFIRMATION') {
    if (row.start_day !== null || row.finish_day !== null || row.elapsed_span_days !== null || row.duration_days !== null) {
      addError('TBC row must not carry a false time bar', row.team_activity_id);
    }
    if (row.matched_activity_count !== 0 || row.matched_activity_ids.length !== 0) {
      addError('TBC row must not retain active baseline mappings', row.team_activity_id);
    }
    if (row.match_level !== 'TIMING_TBC' || row.mapping_status !== 'TBC') addError('TBC status fields are inconsistent', row.team_activity_id);
    if (row.critical_exposure !== 'NOT_ASSESSED_TBC') addError('TBC critical exposure must be unassessed', row.team_activity_id);
    continue;
  }

  if (!Number.isInteger(row.start_day) || !Number.isInteger(row.finish_day)) addError('Confirmed/control row has non-integer timing', row.team_activity_id);
  if (row.start_day < 1 || row.finish_day > 1200 || row.finish_day < row.start_day) {
    addError('Timing outside D1–D1200', { id: row.team_activity_id, start: row.start_day, finish: row.finish_day });
  }
  const expectedSpan = row.finish_day - row.start_day + 1;
  if (row.elapsed_span_days !== expectedSpan || row.duration_days !== expectedSpan) addError('Elapsed-span calculation mismatch', row.team_activity_id);
  if (!row.matched_activity_count || row.matched_activity_count !== row.matched_activity_ids.length) {
    addError('Confirmed/control row has invalid baseline mapping count', row.team_activity_id);
  }

  if (row.source_kind === 'PHYSICAL_SCOPE') {
    if (row.timing_status !== 'MAPPED_ELAPSED_SPAN') addError('Physical confirmed row has incorrect timing status', row.team_activity_id);
    if (!strongLevels.has(row.match_level)) addError('Physical row still uses an unsafe area/zone fallback', {
      id: row.team_activity_id,
      source_row: row.source_row,
      match_level: row.match_level
    });
  } else if (row.source_kind === 'SPECIAL_COST') {
    if (row.timing_status !== 'CONTROL_ALLOWANCE_WINDOW') addError('Special cost is not marked as a control/allowance window', row.team_activity_id);
    if (row.duration_basis !== 'CONTROL_WINDOW_ELAPSED_SPAN_NOT_COST_LOADING') addError('Special-cost duration basis is misleading', row.team_activity_id);
    if (!row.mapping_note.includes('ไม่ใช่ Cash Flow หรือ Payment Schedule')) addError('Special-cost cash-flow disclaimer missing', row.team_activity_id);
  }

  if (!['NONE', 'CONTAINS_ZERO_FLOAT_DETAIL'].includes(row.critical_exposure)) {
    addError('Critical exposure semantics are invalid', row.team_activity_id);
  }
}

const actualTbcRows = teamGanttRows
  .filter(row => row.timing_status === 'TBC_TEAM_CONFIRMATION')
  .map(row => row.source_row)
  .sort((a, b) => a - b);
if (JSON.stringify(actualTbcRows) !== JSON.stringify(expectedTbcRows)) {
  addError('TBC source rows do not match the reviewed correction set', { expected: expectedTbcRows, actual: actualTbcRows });
}

const pumpTank = teamGanttRows.find(row => row.source_row === 108);
if (!pumpTank) addError('Excel row 108 is missing');
else {
  if (pumpTank.timing_status !== 'TBC_TEAM_CONFIRMATION') addError('Excel row 108 pump/tank item must be TBC');
  if (pumpTank.matched_activity_ids.some(id => id.startsWith('P01-A29-'))) addError('Excel row 108 is still incorrectly mapped to A29');
  if (!pumpTank.mapping_note.includes('อาคารห้องนิรันดร์')) addError('Excel row 108 rejection rationale is not documented');
}

const correctedDropOff = teamGanttRows.find(row => row.source_row === 127);
if (!correctedDropOff) addError('Excel row 127 is missing');
else {
  if (correctedDropOff.activity_name !== 'โซน Drop-off') addError('Excel row 127 display label is not corrected');
  if (!correctedDropOff.source_label.includes('(zone D)rop-off')) addError('Excel row 127 original source text was not preserved');
  if (correctedDropOff.source_resolution_status !== 'RESOLVED_DISPLAY_NORMALIZATION') addError('Excel row 127 resolution status is incorrect');
  if (correctedDropOff.source_issue) addError('Excel row 127 remains incorrectly flagged as unresolved');
}

if (teamGanttStats.tbc_timing_rows !== expectedTbcRows.length) addError('TBC timing count mismatch', teamGanttStats.tbc_timing_rows);
if (teamGanttStats.confirmed_timing_rows !== 101) addError('Confirmed/control timing row count must be 101', teamGanttStats.confirmed_timing_rows);
if (teamGanttStats.control_window_rows !== 11) addError('Control-window row count must be 11', teamGanttStats.control_window_rows);
if (teamGanttStats.weak_mapping_rows !== 0) addError('Unsafe physical fallback mappings remain', teamGanttStats.weak_mapping_rows);
if (teamGanttStats.unresolved_source_issues !== 0) addError('Unresolved source issues remain', teamGanttStats.unresolved_source_issues);
if (teamGanttStats.resolved_source_issues !== 1) addError('Resolved source normalization count must be 1', teamGanttStats.resolved_source_issues);

const workCounts = teamGanttRows.reduce((acc, row) => {
  acc[row.work_name] = (acc[row.work_name] || 0) + 1;
  return acc;
}, {});
const timingStatusCounts = teamGanttRows.reduce((acc, row) => {
  acc[row.timing_status] = (acc[row.timing_status] || 0) + 1;
  return acc;
}, {});
const matchLevelCounts = teamGanttRows.reduce((acc, row) => {
  acc[row.match_level] = (acc[row.match_level] || 0) + 1;
  return acc;
}, {});

const report = {
  status: errors.length ? 'FAIL' : advisories.length ? 'PASS_WITH_ADVISORIES' : 'PASS',
  version: TEAM_GANTT_REVISION.version,
  revision: TEAM_GANTT_REVISION,
  source_activity_count: sourceRows.length,
  built_activity_count: teamGanttRows.length,
  physical_activity_count: teamGanttStats.physical_activities,
  special_cost_activity_count: teamGanttStats.special_cost_activities,
  confirmed_timing_rows: teamGanttStats.confirmed_timing_rows,
  tbc_timing_rows: teamGanttStats.tbc_timing_rows,
  tbc_source_rows: teamGanttStats.tbc_source_rows,
  control_window_rows: teamGanttStats.control_window_rows,
  weak_mapping_rows: teamGanttStats.weak_mapping_rows,
  resolved_source_issues: teamGanttStats.resolved_source_issues,
  unresolved_source_issues: teamGanttStats.unresolved_source_issues,
  critical_exposure_rows: teamGanttStats.critical_exposure_rows,
  project_confirmed_span: `D${teamGanttStats.start_day}–D${teamGanttStats.finish_day}`,
  work_counts: workCounts,
  timing_status_counts: timingStatusCounts,
  match_level_counts: matchLevelCounts,
  errors,
  advisories
};

fs.mkdirSync('data', { recursive: true });
for (const output of ['data/team-gantt-validation-220869-v091.json', 'data/team-gantt-validation-220869.json']) {
  fs.writeFileSync(output, JSON.stringify(report, null, 2));
}

console.log(`Team Excel Gantt v0.9.1 validation: ${report.status}`);
console.log(`Source/Built activities: ${sourceRows.length}/${teamGanttRows.length}`);
console.log(`Confirmed timing=${teamGanttStats.confirmed_timing_rows}; TBC=${teamGanttStats.tbc_timing_rows}; control windows=${teamGanttStats.control_window_rows}`);
console.log(`Unsafe fallback mappings=${teamGanttStats.weak_mapping_rows}; resolved source issues=${teamGanttStats.resolved_source_issues}; unresolved=${teamGanttStats.unresolved_source_issues}`);
console.log(`Timing statuses=${JSON.stringify(timingStatusCounts)}`);
console.log(`Errors=${errors.length}; Advisories=${advisories.length}`);
if (errors.length) {
  console.error(JSON.stringify(errors, null, 2));
  process.exit(1);
}
