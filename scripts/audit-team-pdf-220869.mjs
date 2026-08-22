import fs from 'node:fs';
import { teamGanttRows, teamGanttStats } from '../src/build-team-gantt-220869.js';
import { TEAM_SOURCE_METADATA, TEAM_WORK_SECTIONS } from '../src/team-activity-source-220869.js';

const INPUT = Object.freeze({
  text: 'data/team-pdf-text-220869.txt',
  report: 'data/team-pdf-generation-report-220869.json'
});
const OUTPUT = Object.freeze({
  json: 'data/team-pdf-deep-audit-220869.json',
  markdown: 'data/team-pdf-deep-audit-220869.md'
});
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
const text = normalize(textRaw);
const textLower = text.toLowerCase();
const textKey = thaiKey(textRaw);
const generation = JSON.parse(fs.readFileSync(INPUT.report, 'utf8'));
const errors = [];
const advisories = [];
const addError = (message, detail = null) => errors.push({ message, detail });
const addAdvisory = (message, detail = null) => advisories.push({ message, detail });
const containsPhrase = phrase => {
  const key = thaiKey(phrase);
  return key && textKey.includes(key);
};

for (const glyph of ['\uFFFD', '□', '�']) {
  if (textRaw.includes(glyph)) addError(`พบอักขระเสียหรือ glyph ที่ขาด: ${JSON.stringify(glyph)}`);
}
if (textRaw.includes('…')) addError('พบข้อความถูกตัดด้วยจุดไข่ปลาใน PDF');
if (/\b\d+d\b/.test(textRaw)) addError('พบหน่วยวันภาษาอังกฤษแบบ 34d ใน PDF');

for (const phrase of [
  'แผนงานก่อสร้างห้วยขาแข้ง',
  'กิจกรรมจาก Excel',
  'ขอบเขตจาก Excel',
  'เวลาอนุมานจาก Baseline รายละเอียด v0.8.2',
  'หัวข้องานจาก Excel',
  'โซนหลัก',
  'กิจกรรมตาม Excel',
  'ค่าใช้จ่ายพิเศษตามข้อกำหนดทุกรายการ'
]) {
  if (!containsPhrase(phrase)) addError(`ไม่พบข้อความสำคัญใน PDF: ${phrase}`);
}
for (const section of TEAM_WORK_SECTIONS) {
  if (!containsPhrase(section.source_label)) addError(`ไม่พบหัวข้องานจาก Excel: ${section.source_label}`);
}
for (const zone of [
  'โซนพิพิธภัณฑ์มรดกโลกห้วยขาแข้ง (zone A)',
  'โซนพักค้างคืน 1 (zone B)',
  'โซนพักค้างคืน 2 (zone C)',
  'โซนพื้นที่ศึกษาธรรมชาติ (zone D)',
  'ทั้งโครงการ'
]) {
  if (!containsPhrase(zone)) addError(`ไม่พบโซนจาก Excel: ${zone}`);
}

const sourceIssue = teamGanttRows.find(row => row.source_issue);
if (!sourceIssue) addError('ไม่พบแถว source issue ที่ต้องเก็บจาก Excel');
else {
  if (!containsPhrase(sourceIssue.source_label)) addError('PDF ไม่ได้แสดงข้อความต้นทางแถวที่ผิดรูปแบบ', sourceIssue.source_label);
  if (!containsPhrase(sourceIssue.activity_name)) addError('PDF ไม่ได้แสดงข้อความที่ใช้จับคู่สำหรับแถวที่ผิดรูปแบบ', sourceIssue.activity_name);
  addAdvisory(`คงข้อความผิดรูปแบบจาก Excel แถว ${sourceIssue.source_row} และแสดงข้อความที่ใช้จับคู่แยกต่างหาก`, {
    source_label: sourceIssue.source_label,
    matching_label: sourceIssue.activity_name
  });
}

const normalizedForIds = normalize(textRaw);
const idCounts = {};
for (const row of teamGanttRows) {
  const pattern = new RegExp(escapeRegex(row.team_activity_id), 'g');
  idCounts[row.team_activity_id] = (normalizedForIds.match(pattern) || []).length;
}
const missing = Object.entries(idCounts).filter(([, count]) => count === 0).map(([id]) => id);
const duplicates = Object.entries(idCounts).filter(([, count]) => count > 1).map(([id, count]) => ({ id, count }));
if (missing.length) addError('Activity ID จาก Excel ขาดหายจาก PDF', { count: missing.length, sample: missing.slice(0, 30) });
if (duplicates.length) addError('Activity ID จาก Excel ปรากฏซ้ำใน PDF', { count: duplicates.length, sample: duplicates.slice(0, 30) });

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
  ['special cost activities', generation.special_cost_activities, teamGanttStats.special_cost_activities]
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
if (generation.hierarchy !== 'หัวข้องานจาก Excel → โซนหลัก → กิจกรรมตาม Excel') {
  addError('ลำดับชั้น PDF ไม่ตรงกับไฟล์ทีมงาน', generation.hierarchy);
}
if (generation.pages < 2) addError('PDF มีจำนวนหน้าน้อยผิดปกติ', generation.pages);
if (generation.max_task_row_height > 150) addError('แถวกิจกรรมสูงผิดปกติ', generation.max_task_row_height);

const matchCounts = teamGanttRows.reduce((counts, row) => {
  counts[row.match_level] = (counts[row.match_level] || 0) + 1;
  return counts;
}, {});
for (const [level, expected] of Object.entries(matchCounts)) {
  if (generation.mapping_counts?.[level] !== expected) {
    addError(`จำนวน mapping level ${level} ไม่ตรง`, { expected, actual: generation.mapping_counts?.[level] });
  }
}

const thaiChars = (textRaw.match(/[\u0E00-\u0E7F]/g) || []).length;
const extractedChars = textRaw.replace(/\s/g, '').length;
if (thaiChars < 10000) addError('ข้อความภาษาไทยที่สกัดได้มีน้อยผิดปกติ', thaiChars);
if (extractedChars < 18000) addError('ปริมาณข้อความใน PDF มีน้อยผิดปกติ', extractedChars);
if (!textLower.includes(TEAM_SOURCE_METADATA.source_file.toLowerCase())) {
  addError('ไม่พบชื่อไฟล์ Excel ต้นทางใน PDF', TEAM_SOURCE_METADATA.source_file);
}

const report = {
  status: errors.length ? 'FAIL' : advisories.length ? 'PASS_WITH_ADVISORIES' : 'PASS',
  summary: {
    pdf_pages: generation.pages,
    source_file: TEAM_SOURCE_METADATA.source_file,
    activities: teamGanttRows.length,
    observed_activity_ids: Object.values(idCounts).filter(count => count === 1).length,
    physical_activities: teamGanttStats.physical_activities,
    special_cost_activities: teamGanttStats.special_cost_activities,
    work_groups: generation.work_groups,
    zone_groups: generation.zone_groups,
    source_issues: teamGanttStats.source_issues,
    visible_truncations: generation.visible_truncations,
    thai_characters: thaiChars,
    extracted_nonspace_characters: extractedChars,
    mapping_counts: generation.mapping_counts
  },
  errors,
  advisories
};
fs.writeFileSync(OUTPUT.json, JSON.stringify(report, null, 2));
const md = [
  '# Team Gantt PDF Deep Audit — Excel 220869', '',
  `**Status:** ${report.status}`, '',
  '## Summary', '',
  ...Object.entries(report.summary).map(([key, value]) => `- ${key}: ${typeof value === 'object' ? `\`${JSON.stringify(value)}\`` : value}`), '',
  '## Errors', '',
  ...(errors.length ? errors.map(item => `- ${item.message}${item.detail ? ` — \`${JSON.stringify(item.detail)}\`` : ''}`) : ['- None']), '',
  '## Advisories', '',
  ...(advisories.length ? advisories.map(item => `- ${item.message}${item.detail ? ` — \`${JSON.stringify(item.detail)}\`` : ''}`) : ['- None']), ''
].join('\n');
fs.writeFileSync(OUTPUT.markdown, md);

console.log(`Team PDF deep audit: ${report.status}`);
console.log(`Activity IDs observed exactly once: ${report.summary.observed_activity_ids}/${teamGanttRows.length}`);
console.log(`Works=${generation.work_groups}; zones=${generation.zone_groups}; pages=${generation.pages}`);
console.log(`Errors=${errors.length}; advisories=${advisories.length}`);
if (errors.length) {
  console.error(JSON.stringify(errors, null, 2));
  process.exit(1);
}
