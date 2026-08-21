import fs from 'node:fs';
import { masterSchedule } from '../src/build-schedule.js';

const INPUTS = {
  text: 'data/pdf-text-v081.txt',
  tsv: 'data/pdf-tsv-v081.tsv',
  generation: 'data/pdf-generation-report-v081.json'
};
const OUTPUTS = {
  json: 'data/pdf-deep-audit-v081.json',
  markdown: 'data/pdf-deep-audit-v081.md'
};
for (const file of Object.values(INPUTS)) {
  if (!fs.existsSync(file)) throw new Error(`Missing required PDF audit input: ${file}`);
}

const normalize = value => String(value ?? '')
  .normalize('NFC')
  .replace(/[\u200B-\u200D\uFEFF]/g, '')
  .replace(/\s+/g, ' ')
  .trim();
const thaiSearchKey = value => normalize(value)
  .normalize('NFD')
  .replace(/[\u0300-\u036F\u0E31\u0E34-\u0E3A\u0E47-\u0E4E]/g, '')
  .replace(/[^\u0E00-\u0E7FA-Za-z0-9]/g, '')
  .toLowerCase();
const zoneKey = row => normalize(row.zone) || 'Project-wide';
const areaName = row => normalize(row.building_area) || 'ทั้งโครงการ';
const categoryName = row => normalize(row.work_category_th || row.discipline) || 'งานทั่วไป';

const textRaw = fs.readFileSync(INPUTS.text, 'utf8');
const text = normalize(textRaw);
const textLower = text.toLowerCase();
const textSearchKey = thaiSearchKey(textRaw);
const generation = JSON.parse(fs.readFileSync(INPUTS.generation, 'utf8'));
const errors = [];
const advisories = [];
const addError = (message, detail = null) => errors.push({ message, detail });
const addAdvisory = (message, detail = null) => advisories.push({ message, detail });
const containsThaiPhrase = phrase => {
  const key = thaiSearchKey(phrase);
  return key.length > 0 && textSearchKey.includes(key);
};

for (const term of [
  'baseline v0.8', 'baseline v0.7', 'verify scope', 'continued', ' activities ',
  ' zero-float', ' rows', 'project-wide', 'physical delivery', 'payment & commercial',
  'scope to verify', 'activity / id / area', 'a3 landscape', 'page '
]) {
  if (textLower.includes(term)) addError(`Visible legacy/English term remains in PDF: ${term}`);
}
// Lower-case d is the legacy English day suffix. Upper-case D in 4D/5D and
// project-day notation D1200 is an accepted technical label.
if (/\b\d+d\b/.test(textRaw)) addError('Legacy English day unit remains in PDF (for example 34d).');
for (const glyph of ['\uFFFD', '□', '�']) {
  if (textRaw.includes(glyph)) addError(`Corrupt or missing-glyph marker found: ${JSON.stringify(glyph)}`);
}

for (const phrase of [
  'แผนงานก่อสร้างห้วยขาแข้ง', 'ฉบับฐาน v0.8.1', 'พื้นที่', 'อาคาร', 'หมวดงาน',
  'งานปรับบริเวณ', 'งานโครงสร้าง', 'สถาปัตย์', 'งานระบบไฟฟ้าและสื่อสาร',
  'งานระบบสุขาภิบาลและป้องกันอัคคีภัย', 'งานระบบปรับอากาศและระบายอากาศ',
  'งานระบบพิเศษ', 'จุดควบคุม'
]) {
  if (!containsThaiPhrase(phrase)) addError(`Required Thai content phrase not found in PDF: ${phrase}`);
}

const planMap = new Map();
for (const row of masterSchedule) {
  if (!planMap.has(row.plan_no)) planMap.set(row.plan_no, []);
  planMap.get(row.plan_no).push(row);
}
const expectedPlanGroups = planMap.size;
let expectedZoneGroups = 0;
for (const [planNo, rows] of planMap) {
  const zones = new Set(rows.map(zoneKey));
  if (planNo === '01' || zones.size > 1) expectedZoneGroups += zones.size;
}
const expectedAreaGroups = new Set(masterSchedule.map(row =>
  `${row.plan_no}||${zoneKey(row)}||${areaName(row)}`
)).size;
const expectedCategoryGroups = new Set(masterSchedule.map(row =>
  `${row.plan_no}||${zoneKey(row)}||${areaName(row)}||${categoryName(row)}`
)).size;

for (const [label, actual, expected] of [
  ['task rows', generation.task_rows, masterSchedule.length],
  ['rendered task rows', generation.rendered_task_rows, masterSchedule.length],
  ['unique rendered task rows', generation.unique_rendered_task_rows, masterSchedule.length],
  ['plan groups', generation.plan_group_rows, expectedPlanGroups],
  ['zone groups', generation.zone_group_rows, expectedZoneGroups],
  ['area groups', generation.area_group_rows, expectedAreaGroups],
  ['category groups', generation.category_group_rows, expectedCategoryGroups]
]) {
  if (actual !== expected) addError(`PDF ${label} count is incorrect`, { expected, actual });
}
for (const [label, list] of [
  ['missing activity IDs', generation.missing_activity_ids],
  ['duplicate activity IDs', generation.duplicate_activity_ids],
  ['unexpected activity IDs', generation.unexpected_activity_ids],
  ['activity-title truncations', generation.activity_title_truncations],
  ['activity-subline truncations', generation.activity_subline_truncations],
  ['predecessor truncations', generation.predecessor_truncations],
  ['group-label truncations', generation.group_label_truncations]
]) {
  if ((list || []).length) addError(`PDF contains ${label}`, { count: list.length, sample: list.slice(0, 20) });
}
if (generation.truncation_count !== 0) addError('PDF generation report records truncated visible content', generation.truncation_count);
if (generation.required_hierarchy !== 'แผน → พื้นที่ดำเนินงาน → อาคาร/บริเวณ → หมวดงาน → กิจกรรม') {
  addError('PDF hierarchy declaration is incorrect', generation.required_hierarchy);
}
if (generation.max_task_row_height > 240) addError('A dynamic task row is unreasonably tall', generation.max_task_row_height);
if (generation.max_task_row_height > 110) addAdvisory('Some rows are tall because all predecessors are shown without truncation', generation.max_task_row_height);

function parseTsv(tsv) {
  const lines = tsv.replace(/^\uFEFF/, '').split(/\r?\n/).filter(Boolean);
  const header = lines.shift().split('\t');
  return lines.map(line => {
    const parts = line.split('\t');
    const row = {};
    for (let index = 0; index < header.length - 1; index++) row[header[index]] = parts[index] ?? '';
    row[header.at(-1)] = parts.slice(header.length - 1).join('\t');
    return row;
  });
}

const lineMap = new Map();
for (const word of parseTsv(fs.readFileSync(INPUTS.tsv, 'utf8')).filter(row => row.text)) {
  const page = Number(word.page_num || 0);
  if (!page) continue;
  const key = [page, word.block_num, word.par_num, word.line_num].join('|');
  if (!lineMap.has(key)) lineMap.set(key, { page, words: [] });
  lineMap.get(key).words.push({ left: Number(word.left || 0), text: word.text || '' });
}

const expectedIds = new Set(masterSchedule.map(row => row.activity_id));
const observedIdPages = new Map();
for (const line of lineMap.values()) {
  line.words.sort((a, b) => a.left - b.left);
  const lineLeft = line.words[0]?.left ?? 9999;
  if (line.page < 2 || lineLeft < 70 || lineLeft > 540) continue;
  const joined = line.words.map(word => word.text).join(' ')
    .replace(/\s*-\s*/g, '-')
    .replace(/\s+/g, ' ');
  for (const candidate of joined.match(/P\d{2}(?:-[A-Z0-9]+)+/g) || []) {
    if (!expectedIds.has(candidate)) continue;
    if (!observedIdPages.has(candidate)) observedIdPages.set(candidate, []);
    observedIdPages.get(candidate).push(line.page);
  }
}
const missingIds = [...expectedIds].filter(id => !observedIdPages.has(id));
const duplicateRows = [...observedIdPages.entries()].filter(([, pages]) => pages.length !== 1);
if (missingIds.length) addError('Activity rows are missing from the PDF activity column', {
  count: missingIds.length, sample: missingIds.slice(0, 30)
});
if (duplicateRows.length) addError('Activity IDs appear more than once in the PDF activity column', {
  count: duplicateRows.length, sample: duplicateRows.slice(0, 30)
});

const idsPerPage = {};
for (const pages of observedIdPages.values()) {
  for (const page of pages) idsPerPage[page] = (idsPerPage[page] || 0) + 1;
}
const emptyDetailPages = [];
for (let page = 2; page <= generation.pages; page++) {
  if (!idsPerPage[page]) emptyDetailPages.push(page);
}
if (emptyDetailPages.length) addError('Detail pages without activity rows were found', { pages: emptyDetailPages });
const sparseDetailPages = Object.entries(idsPerPage)
  .filter(([page, count]) => Number(page) >= 2 && count < 3)
  .map(([page, count]) => ({ page: Number(page), activity_rows: count }));
if (sparseDetailPages.length) addAdvisory('Some detail pages contain fewer than three activities', sparseDetailPages);

const thaiChars = (textRaw.match(/[\u0E00-\u0E7F]/g) || []).length;
const extractedChars = textRaw.replace(/\s/g, '').length;
if (thaiChars < 90000) addError('Extracted PDF text contains unexpectedly little Thai content', { thaiChars });
if (extractedChars < 170000) addError('Extracted PDF text volume is unexpectedly low', { extractedChars });

const report = {
  status: errors.length ? 'FAIL' : advisories.length ? 'PASS_WITH_ADVISORIES' : 'PASS',
  summary: {
    pdf_pages: generation.pages,
    master_schedule_activities: masterSchedule.length,
    observed_activity_rows: observedIdPages.size,
    plan_groups: generation.plan_group_rows,
    zone_groups: generation.zone_group_rows,
    area_groups: generation.area_group_rows,
    category_groups: generation.category_group_rows,
    truncations: generation.truncation_count,
    max_task_row_height: generation.max_task_row_height,
    max_activity_title_lines: generation.max_activity_title_lines,
    max_predecessor_lines: generation.max_predecessor_lines,
    thai_characters: thaiChars,
    extracted_nonspace_characters: extractedChars
  },
  ids_per_page: idsPerPage,
  errors,
  advisories
};
fs.writeFileSync(OUTPUTS.json, JSON.stringify(report, null, 2));

const markdown = [
  '# PDF Deep Audit — ฉบับฐาน v0.8.1 ภาษาไทย', '',
  `**Status:** ${report.status}`, '',
  '## Summary', '',
  ...Object.entries(report.summary).map(([key, value]) => `- ${key}: ${value}`), '',
  '## Errors', '',
  ...(errors.length ? errors.map(item => `- ${item.message}${item.detail ? ` — \`${JSON.stringify(item.detail)}\`` : ''}`) : ['- None']), '',
  '## Advisories', '',
  ...(advisories.length ? advisories.map(item => `- ${item.message}${item.detail ? ` — \`${JSON.stringify(item.detail)}\`` : ''}`) : ['- None']), ''
].join('\n');
fs.writeFileSync(OUTPUTS.markdown, markdown);

console.log(`PDF deep audit status: ${report.status}`);
console.log(`Activity rows observed: ${observedIdPages.size}/${masterSchedule.length}`);
console.log(`Hierarchy groups: plan=${generation.plan_group_rows}, zone=${generation.zone_group_rows}, area=${generation.area_group_rows}, category=${generation.category_group_rows}`);
console.log(`Truncations: ${generation.truncation_count}; max task height=${generation.max_task_row_height}`);
console.log(`Thai characters extracted: ${thaiChars}; nonspace characters=${extractedChars}`);
console.log(`Errors: ${errors.length}; Advisories: ${advisories.length}`);
if (errors.length) {
  console.error(JSON.stringify(errors, null, 2));
  process.exit(1);
}
