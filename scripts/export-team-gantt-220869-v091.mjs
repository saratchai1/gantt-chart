import fs from 'node:fs';
import {
  TEAM_SOURCE_METADATA,
  flattenTeamSourceActivities
} from '../src/team-activity-source-220869.js';
import {
  TEAM_GANTT_REVISION,
  teamGanttRows,
  teamGanttStats,
  teamGanttCSV
} from '../src/build-team-gantt-220869-v091.js';

fs.mkdirSync('data', { recursive: true });
const payload = {
  metadata: {
    ...TEAM_SOURCE_METADATA,
    revision: TEAM_GANTT_REVISION
  },
  stats: teamGanttStats,
  activities: teamGanttRows
};
for (const file of ['data/team-gantt-220869-v091.json', 'data/team-gantt-220869.json']) {
  fs.writeFileSync(file, JSON.stringify(payload, null, 2));
}
for (const file of ['data/team-gantt-220869-v091.csv', 'data/team-gantt-220869.csv']) {
  fs.writeFileSync(file, `\uFEFF${teamGanttCSV()}`);
}
fs.writeFileSync('data/team-source-register-220869.json', JSON.stringify({
  metadata: {
    ...TEAM_SOURCE_METADATA,
    revision: TEAM_GANTT_REVISION
  },
  activities: flattenTeamSourceActivities()
}, null, 2));

const mappingHeaders = [
  'source_row','source_kind','work_name','zone_code','zone_name','source_label','activity_name',
  'source_resolution_status','normalization_note','mapping_status','match_level','mapping_note',
  'timing_status','start_day','finish_day','elapsed_span_days','duration_basis','timing_basis',
  'baseline_version','baseline_commit_sha','source_register_commit_sha','matched_activity_count',
  'matched_activity_ids','critical_exposure','critical_exposure_note','network_basis'
];
const quote = value => `"${String(value ?? '').replaceAll('"', '""')}"`;
const mappingCSV = [
  mappingHeaders.join(','),
  ...teamGanttRows.map(row => mappingHeaders.map(header => quote(
    header === 'matched_activity_ids' ? row.matched_activity_ids.join(';') : row[header]
  )).join(','))
].join('\n');
for (const file of ['data/team-gantt-mapping-register-220869-v091.csv', 'data/team-gantt-mapping-register-220869.csv']) {
  fs.writeFileSync(file, `\uFEFF${mappingCSV}`);
}

const tbcRows = teamGanttRows.filter(row => row.timing_status === 'TBC_TEAM_CONFIRMATION');
const tbcHeaders = [
  'source_row','team_activity_id','work_name','zone_code','zone_name','source_label','activity_name',
  'timing_status','mapping_note','required_confirmation','confirmed_start_day','confirmed_finish_day',
  'confirmed_package_reference','reviewer','review_date','status'
];
const tbcCSV = [
  tbcHeaders.join(','),
  ...tbcRows.map(row => tbcHeaders.map(header => {
    const values = {
      ...row,
      required_confirmation: row.source_row === 108
        ? 'ยืนยัน Package/แบบ/BOQ ของห้องปั๊มและถังเก็บน้ำ พื้นที่ A พร้อมช่วงเวลา'
        : 'ยืนยันว่าหมวดงานนี้มีขอบเขตในโซนย่อยดังกล่าว และระบุ Start/Finish ที่อนุมัติ',
      confirmed_start_day: '',
      confirmed_finish_day: '',
      confirmed_package_reference: '',
      reviewer: '',
      review_date: '',
      status: 'OPEN'
    };
    return quote(values[header]);
  }).join(','))
].join('\n');
fs.writeFileSync('data/team-gantt-timing-confirmation-register-220869-v091.csv', `\uFEFF${tbcCSV}`);

console.log(`Exported ${teamGanttRows.length} corrected team Gantt activities for v0.9.1.`);
console.log(`Confirmed timing=${teamGanttStats.confirmed_timing_rows}; TBC=${teamGanttStats.tbc_timing_rows}; control windows=${teamGanttStats.control_window_rows}`);
console.log('Outputs include versioned JSON/CSV, mapping register, source register and TBC timing-confirmation register.');
