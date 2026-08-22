import fs from 'node:fs';
import {
  TEAM_GANTT_REVISION,
  teamGanttRows,
  teamGanttStats
} from '../src/build-team-gantt-220869-v091.js';

const INPUT = {
  text: 'data/team-pdf-text-220869-v091.txt',
  report: 'data/team-pdf-generation-report-220869-v091.json'
};
const OUTPUT = {
  json: 'data/team-pdf-deep-audit-220869-v091.json',
  markdown: 'data/team-pdf-deep-audit-220869-v091.md'
};
for (const file of Object.values(INPUT)) {
  if (!fs.existsSync(file)) throw new Error(`Missing audit input: ${file}`);
}

const normalize = value => String(value ?? '')
  .normalize('NFC')
  .replace(/[\u200B-\u200D\uFEFF]/g, '')
  .replace(/\s*-\s*/g, '-')
  .replace(/\s+/g, ' ')
  .trim();
const thaiKey = value => normalize(value)
  .normalize('NFD')
  .replace(/[\u0300-\u036F\u0E31\u0E34-\u0E3A\u0E47-\u0E4E]/g, '')
  .replace(/[^\u0E00-\u0E7FA-Za-z0-9]/g, '')
  .toLowerCase();
const escapeRegex = value => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const textRaw = fs.readFileSync(INPUT.text, 'utf8');
const normalizedText = normalize(textRaw);
const lowerText = normalizedText.toLowerCase();
const searchKey = thaiKey(textRaw);
const generation = JSON.parse(fs.readFileSync(INPUT.report, 'utf8'));
const errors = [];
const advisories = [];
const addError = (message, detail = null) => errors.push({ message, detail });
const containsPhrase = phrase => {
  const key = thaiKey(phrase);
  return Boolean(key) && searchKey.includes(key);
};

for (const glyph of ['\uFFFD', '□', '�']) {
  if (textRaw.includes(glyph)) addError(`พบอักขระเสียหรือ glyph ที่ขาด: ${JSON.stringify(glyph)}`);
}
if (textRaw.includes('…')) addError('พบข้อความถูกตัดด้วยจุดไข่ปลาใน PDF');
if (/\b\d+d\b/.test(textRaw)) addError('พบหน่วยวันภาษาอังกฤษแบบ 34d ใน PDF');
if (lowerText.includes('duration')) addError('พบคำว่า Duration ซึ่งอาจทำให้เข้าใจว่าเป็น Work Effort');
if (lowerText.includes('baseline v0.9.0')) addError('พบเลข Revision เก่า v0.9.0 ใน PDF');

for (const phrase of [
  'แผนงานก่อสร้างห้วยขาแข้ง',
  'ฉบับแก้ไข v0.9.1',
  'For Team Approval',
  'ช่วงเวลาครอบคลุม',
  'TBC — รอยืนยัน',
  'ไม่ใช่ Cash Flow หรือ Payment Schedule',
  'ไม่มี Predecessor Network',
  'Summary bar ทั้งช่วงเป็น Critical Path',
  'โซน Drop-off',
  TEAM_GANTT_REVISION.baseline_commit_sha,
  TEAM_GANTT_REVISION.source_register_commit_sha
]) {
  if (!containsPhrase(phrase)) addError(`ไม่พบข้อความควบคุมสำคัญใน PDF: ${phrase}`);
}

const malformedSource = 'โซนพื้นที่ศึกษาธรรมชาติ (zone D)rop-off';
if (containsPhrase(malformedSource)) {
  addError('PDF ฉบับส่งทีมยังแสดงข้อความ Excel ที่ผิดรูปแบบแทนข้อความที่แก้แล้ว', malformedSource);
}

const idCounts = {};
for (const row of teamGanttRows) {
  const pattern = new RegExp(escapeRegex(row.team_activity_id), 'g');
  idCounts[row.team_activity_id] = (normalizedText.match(pattern) || []).length;
}
const missing = Object.entries(idCounts).filter(([, count]) => count === 0).map(([id]) => id);
const duplicates = Object.entries(idCounts).filter(([, count]) => count > 1).map(([id, count]) => ({ id, count }));
if (missing.length) addError('Activity ID จาก Excel ขาดหายจาก PDF', { count: missing.length, sample: missing.slice(0, 30) });
if (duplicates.length) addError('Activity ID จาก Excel ปรากฏซ้ำใน PDF', { count: duplicates.length, sample: duplicates.slice(0, 30) });

const expectedTbcRows = [22, 33, 64, 74, 83, 108];
const actualTbcRows = teamGanttRows
  .filter(row => row.timing_status === 'TBC_TEAM_CONFIRMATION')
  .map(row => row.source_row)
  .sort((a, b) => a - b);
if (JSON.stringify(actualTbcRows) !== JSON.stringify(expectedTbcRows)) {
  addError('ชุดรายการ TBC ในข้อมูลไม่ตรงผล Review', { expected: expectedTbcRows, actual: actualTbcRows });
}
if ((normalizedText.match(/TBC — รอยืนยัน/g) || []).length < expectedTbcRows.length) {
  addError('จำนวนป้าย TBC — รอยืนยันใน PDF น้อยกว่าจำนวนกิจกรรม TBC', {
    expected_minimum: expectedTbcRows.length,
    observed: (normalizedText.match(/TBC — รอยืนยัน/g) || []).length
  });
}

const row108 = teamGanttRows.find(row => row.source_row === 108);
if (!row108 || row108.timing_status !== 'TBC_TEAM_CONFIRMATION') addError('แถว Excel 108 ไม่ได้ถูกเปลี่ยนเป็น TBC');
if (row108?.matched_activity_ids.some(id => id.startsWith('P01-A29-'))) addError('แถว Excel 108 ยังจับคู่กับ A29');
const row127 = teamGanttRows.find(row => row.source_row === 127);
if (!row127 || row127.activity_name !== 'โซน Drop-off') addError('แถว Excel 127 ยังไม่ได้แก้คำแสดงผล');
if (row127?.source_resolution_status !== 'RESOLVED_DISPLAY_NORMALIZATION') addError('แถว Excel 127 ไม่มีสถานะ Resolution ที่ตรวจสอบย้อนกลับได้');

const expectedWorkGroups = teamGanttStats.works;
const expectedZoneGroups = new Set(teamGanttRows.map(row => `${row.work_code}|${row.zone_code}`)).size;
for (const [label, actual, expected] of [
  ['activities', generation.activities, teamGanttRows.length],
  ['rendered activity rows', generation.rendered_activity_rows, teamGanttRows.length],
  ['unique rendered activity rows', generation.unique_rendered_activity_rows, teamGanttRows.length],
  ['work groups', generation.work_groups, expectedWorkGroups],
  ['zone groups', generation.zone_groups, expectedZoneGroups],
  ['task rows', generation.task_rows, teamGanttRows.length],
  ['physical activities', generation.physical_activities, teamGanttStats.physical_activities],
  ['special cost activities', generation.special_cost_activities, teamGanttStats.special_cost_activities],
  ['confirmed timing rows', generation.confirmed_timing_rows, teamGanttStats.confirmed_timing_rows],
  ['TBC timing rows', generation.tbc_timing_rows, teamGanttStats.tbc_timing_rows],
  ['control-window rows', generation.control_window_rows, teamGanttStats.control_window_rows],
  ['critical exposure rows', generation.critical_exposure_rows, teamGanttStats.critical_exposure_rows],
  ['resolved source issues', generation.resolved_source_issues, teamGanttStats.resolved_source_issues],
  ['unresolved source issues', generation.unresolved_source_issues, 0]
]) {
  if (actual !== expected) addError(`จำนวน ${label} ใน PDF ไม่ถูกต้อง`, { expected, actual });
}
for (const [label, list] of [
  ['missing activity IDs', generation.missing_activity_ids],
  ['duplicate activity IDs', generation.duplicate_activity_ids],
  ['unexpected activity IDs', generation.unexpected_activity_ids]
]) {
  if ((list || []).length) addError(`Generation report พบ ${label}`, { count: list.length, sample: list.slice(0, 20) });
}
if (generation.visible_truncations !== 0) addError('Generation report ระบุว่ามีข้อความถูกตัด', generation.visible_truncations);
if (generation.version !== '0.9.1') addError('Generation report ใช้ Revision ไม่ถูกต้อง', generation.version);
if (generation.issue_status !== 'FOR_TEAM_APPROVAL') addError('Generation report ไม่มีสถานะ For Team Approval', generation.issue_status);
if (generation.hierarchy !== 'หัวข้องานจาก Excel → โซนหลัก → กิจกรรมตาม Excel') addError('ลำดับชั้น PDF ไม่ถูกต้อง', generation.hierarchy);
if (generation.timing_semantics !== 'Elapsed span / TBC / control allowance window') addError('คำจำกัดความเวลาใน Generation report ไม่ถูกต้อง', generation.timing_semantics);
if (JSON.stringify(generation.tbc_source_rows) !== JSON.stringify(expectedTbcRows)) {
  addError('Generation report ระบุแถว TBC ไม่ถูกต้อง', generation.tbc_source_rows);
}
if (generation.revision?.baseline_commit_sha !== TEAM_GANTT_REVISION.baseline_commit_sha) addError('PDF ไม่ได้ตรึง Baseline Commit ที่กำหนด');
if (generation.revision?.source_register_commit_sha !== TEAM_GANTT_REVISION.source_register_commit_sha) addError('PDF ไม่ได้ตรึง Source Register Commit ที่กำหนด');
if (generation.pages < 2) addError('PDF มีจำนวนหน้าน้อยผิดปกติ', generation.pages);
if (generation.max_task_row_height > 180) addError('แถวกิจกรรมสูงผิดปกติ', generation.max_task_row_height);

const thaiChars = (textRaw.match(/[\u0E00-\u0E7F]/g) || []).length;
const extractedChars = textRaw.replace(/\s/g, '').length;
if (thaiChars < 10000) addError('ข้อความภาษาไทยที่สกัดได้มีน้อยผิดปกติ', thaiChars);
if (extractedChars < 18000) addError('ปริมาณข้อความใน PDF มีน้อยผิดปกติ', extractedChars);

const report = {
  status: errors.length ? 'FAIL' : advisories.length ? 'PASS_WITH_ADVISORIES' : 'PASS',
  summary: {
    pdf_pages: generation.pages,
    version: generation.version,
    source_file: TEAM_GANTT_REVISION.source_file,
    source_register_commit_sha: TEAM_GANTT_REVISION.source_register_commit_sha,
    baseline_commit_sha: TEAM_GANTT_REVISION.baseline_commit_sha,
    activities: teamGanttRows.length,
    observed_activity_ids: Object.values(idCounts).filter(count => count === 1).length,
    confirmed_timing_rows: teamGanttStats.confirmed_timing_rows,
    tbc_timing_rows: teamGanttStats.tbc_timing_rows,
    tbc_source_rows: actualTbcRows,
    control_window_rows: teamGanttStats.control_window_rows,
    critical_exposure_rows: teamGanttStats.critical_exposure_rows,
    resolved_source_issues: teamGanttStats.resolved_source_issues,
    unresolved_source_issues: teamGanttStats.unresolved_source_issues,
    visible_truncations: generation.visible_truncations,
    thai_characters: thaiChars,
    extracted_nonspace_characters: extractedChars,
    mapping_counts: generation.mapping_counts
  },
  errors,
  advisories
};
fs.writeFileSync(OUTPUT.json, JSON.stringify(report, null, 2));
const markdown = [
  '# Team Gantt PDF Deep Audit — Excel 220869 v0.9.1', '',
  `**Status:** ${report.status}`, '',
  '## Summary', '',
  ...Object.entries(report.summary).map(([key, value]) => `- ${key}: ${typeof value === 'object' ? `\`${JSON.stringify(value)}\`` : value}`), '',
  '## Errors', '',
  ...(errors.length ? errors.map(item => `- ${item.message}${item.detail ? ` — \`${JSON.stringify(item.detail)}\`` : ''}`) : ['- None']), '',
  '## Advisories', '',
  ...(advisories.length ? advisories.map(item => `- ${item.message}${item.detail ? ` — \`${JSON.stringify(item.detail)}\`` : ''}`) : ['- None']), ''
].join('\n');
fs.writeFileSync(OUTPUT.markdown, markdown);

console.log(`Team PDF v0.9.1 deep audit: ${report.status}`);
console.log(`Activity IDs observed exactly once: ${report.summary.observed_activity_ids}/${teamGanttRows.length}`);
console.log(`Confirmed=${teamGanttStats.confirmed_timing_rows}; TBC=${teamGanttStats.tbc_timing_rows}; control windows=${teamGanttStats.control_window_rows}`);
console.log(`Errors=${errors.length}; advisories=${advisories.length}`);
if (errors.length) {
  console.error(JSON.stringify(errors, null, 2));
  process.exit(1);
}
