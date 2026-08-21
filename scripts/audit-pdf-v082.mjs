import fs from 'node:fs';
import { masterSchedule } from '../src/build-schedule.js';
import { buildWebHierarchy } from '../src/web-hierarchy.js';

const INPUTS = {
  text: 'data/pdf-text-v082.txt',
  tsv: 'data/pdf-tsv-v082.tsv',
  generation: 'data/pdf-generation-report-v082.json'
};
const OUTPUTS = {
  json: 'data/pdf-deep-audit-v082.json',
  markdown: 'data/pdf-deep-audit-v082.md'
};
const EXPECTED_HIERARCHY = 'แผน → โซนหลัก/พื้นที่ดำเนินงาน → โซนย่อย/อาคาร–บริเวณ → งาน/หมวดงาน → กิจกรรม';
const EXPECTED_COLORS = {
  main_zone: { fill: '#d9ecfb', stroke: '#8eb9dd', text: '#174d78', bar: '#2f7ebc' },
  subzone: { fill: '#e6f5e9', stroke: '#b8dcc2', text: '#1f6840', bar: '#4f9a68' },
  work: { fill: '#eceff2', stroke: '#cfd5dc', text: '#45515e', bar: '#7a8793' }
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

const textRaw = fs.readFileSync(INPUTS.text, 'utf8');
const text = normalize(textRaw);
const textLower = text.toLowerCase();
const textSearchKey = thaiSearchKey(textRaw);
const generation = JSON.parse(fs.readFileSync(INPUTS.generation, 'utf8'));
const hierarchy = buildWebHierarchy(masterSchedule);
const errors = [];
const advisories = [];

const addError = (message, detail = null) => errors.push({ message, detail });
const addAdvisory = (message, detail = null) => advisories.push({ message, detail });
const containsThaiPhrase = phrase => {
  const key = thaiSearchKey(phrase);
  return key.length > 0 && textSearchKey.includes(key);
};

for (const term of [
  'ฉบับฐาน v0.8.1', 'verify scope', 'continued', ' activities ', ' zero-float',
  ' rows', 'project-wide', 'physical delivery', 'payment & commercial',
  'scope to verify', 'activity / id / area', 'a3 landscape', 'page '
]) {
  if (textLower.includes(term.toLowerCase())) addError(`Visible legacy/English term remains in PDF: ${term}`);
}
if (/\b\d+d\b/.test(textRaw)) addError('Legacy English day unit remains in PDF (for example 34d).');

for (const glyph of ['\uFFFD', '□', '�']) {
  if (textRaw.includes(glyph)) addError(`Corrupt or missing-glyph marker found: ${JSON.stringify(glyph)}`);
}

for (const phrase of [
  'แผนงานก่อสร้างห้วยขาแข้ง',
  'ฉบับฐาน v0.8.2',
  'โซนหลัก A',
  'โซนหลัก B',
  'โซนหลัก C',
  'โซนหลัก D',
  'โซนย่อย',
  'งาน — งานโครงสร้าง',
  'งาน — สถาปัตย์',
  'งานระบบไฟฟ้าและสื่อสาร',
  'งานระบบสุขาภิบาลและป้องกันอัคคีภัย',
  'งานระบบปรับอากาศและระบายอากาศ',
  'งานระบบพิเศษ',
  'จุดควบคุม'
]) {
  if (!containsThaiPhrase(phrase)) addError(`Required Thai content phrase not found in PDF: ${phrase}`);
}

const expectedCounts = {
  task_rows: masterSchedule.length,
  rendered_task_rows: masterSchedule.length,
  unique_rendered_task_rows: masterSchedule.length,
  plan_group_rows: hierarchy.stats.plans,
  zone_group_rows: hierarchy.stats.zones,
  main_zone_group_rows: hierarchy.stats.main_zones,
  area_group_rows: hierarchy.stats.subzones,
  category_group_rows: hierarchy.stats.works
};
for (const [field, expected] of Object.entries(expectedCounts)) {
  const actual = generation[field];
  if (actual !== expected) addError(`PDF ${field} count is incorrect`, { expected, actual });
}

if (generation.version !== '0.8.2') addError('PDF generation report version is incorrect', generation.version);
if (generation.output !== 'data/huai-kha-khaeng-integrated-master-gantt-v0.8.2-thai.pdf') {
  addError('PDF output path is incorrect', generation.output);
}
if (generation.required_hierarchy !== EXPECTED_HIERARCHY) {
  addError('PDF hierarchy declaration is incorrect', generation.required_hierarchy);
}
if (generation.hierarchy_source !== 'src/web-hierarchy.js') {
  addError('PDF does not declare the shared web hierarchy as its source', generation.hierarchy_source);
}

for (const [semantic, expected] of Object.entries(EXPECTED_COLORS)) {
  const actual = generation.hierarchy_color_semantics?.[semantic];
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    addError(`PDF ${semantic} color semantics are incorrect`, { expected, actual });
  }
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
if (generation.max_task_row_height > 240) addError('A dynamic task row is unreasonably tall', generation.max_task_row_height);
if (generation.max_task_row_height > 110) addAdvisory('Some rows are tall because all predecessors are shown without truncation', generation.max_task_row_height);
if (generation.pages < 2 || generation.pages > 140) addError('PDF page count is outside the expected range', generation.pages);

function parseTsv(tsv) {
  const lines = tsv.replace(/^\uFEFF/, '').split(/\r?\n/).filter(Boolean);
  const header = lines.shift()?.split('\t') || [];
  return lines.map(line => {
    const parts = line.split('\t');
    const row = {};
    for (let index = 0; index < header.length - 1; index++) row[header[index]] = parts[index] ?? '';
    if (header.length) row[header.at(-1)] = parts.slice(header.length - 1).join('\t');
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
  if (line.page < 2 || lineLeft < 70 || lineLeft > 560) continue;
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
    main_zone_groups: generation.main_zone_group_rows,
    subzone_groups: generation.area_group_rows,
    work_groups: generation.category_group_rows,
    truncations: generation.truncation_count,
    max_task_row_height: generation.max_task_row_height,
    max_activity_title_lines: generation.max_activity_title_lines,
    max_predecessor_lines: generation.max_predecessor_lines,
    thai_characters: thaiChars,
    extracted_nonspace_characters: extractedChars,
    hierarchy_source: generation.hierarchy_source,
    color_semantics: generation.hierarchy_color_semantics
  },
  ids_per_page: idsPerPage,
  errors,
  advisories
};
fs.writeFileSync(OUTPUTS.json, JSON.stringify(report, null, 2));

const markdown = [
  '# PDF Deep Audit — ฉบับฐาน v0.8.2 ภาษาไทย', '',
  `**Status:** ${report.status}`, '',
  '## Summary', '',
  ...Object.entries(report.summary).map(([key, value]) => `- ${key}: ${typeof value === 'object' ? `\`${JSON.stringify(value)}\`` : value}`), '',
  '## Errors', '',
  ...(errors.length ? errors.map(item => `- ${item.message}${item.detail ? ` — \`${JSON.stringify(item.detail)}\`` : ''}`) : ['- None']), '',
  '## Advisories', '',
  ...(advisories.length ? advisories.map(item => `- ${item.message}${item.detail ? ` — \`${JSON.stringify(item.detail)}\`` : ''}`) : ['- None']), ''
].join('\n');
fs.writeFileSync(OUTPUTS.markdown, markdown);

console.log(`PDF deep audit status: ${report.status}`);
console.log(`Activity rows observed: ${observedIdPages.size}/${masterSchedule.length}`);
console.log(`Hierarchy groups: plan=${generation.plan_group_rows}, zone=${generation.zone_group_rows}, main zone=${generation.main_zone_group_rows}, subzone=${generation.area_group_rows}, work=${generation.category_group_rows}`);
console.log(`Truncations: ${generation.truncation_count}; max task height=${generation.max_task_row_height}`);
console.log(`Thai characters extracted: ${thaiChars}; nonspace characters=${extractedChars}`);
console.log(`Errors: ${errors.length}; Advisories: ${advisories.length}`);
if (errors.length) {
  console.error(JSON.stringify(errors, null, 2));
  process.exit(1);
}
