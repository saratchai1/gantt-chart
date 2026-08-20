import fs from 'node:fs';
import { masterSchedule } from '../src/build-schedule.js';

const INPUTS = {
  text: 'data/pdf-text-v08.txt',
  tsv: 'data/pdf-tsv-v08.tsv',
  generation: 'data/pdf-generation-report-v08.json'
};
const OUTPUTS = {
  json: 'data/pdf-deep-audit-v08.json',
  markdown: 'data/pdf-deep-audit-v08.md'
};

for (const file of Object.values(INPUTS)) {
  if (!fs.existsSync(file)) throw new Error(`Missing required PDF audit input: ${file}`);
}

const normalize = value => String(value ?? '')
  .normalize('NFC')
  .replace(/[\u200B-\u200D\uFEFF]/g, '')
  .replace(/\s+/g, ' ')
  .trim();

// Poppler may separate Thai combining marks from the base glyph. This key is
// used only for a limited set of broad semantic presence checks. Hierarchy is
// verified structurally from the generator report, not by fragile exact text
// matching against every Thai category heading.
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
const errors = [];
const advisories = [];

const addError = (message, detail = null) => errors.push({ message, detail });
const addAdvisory = (message, detail = null) => advisories.push({ message, detail });
const containsThaiPhrase = phrase => {
  const key = thaiSearchKey(phrase);
  return key.length > 0 && textSearchKey.includes(key);
};

for (const term of [
  'baseline v0.7', 'verify scope', 'continued:', ' activities ', ' zero-float',
  ' rows', 'project-wide', 'physical delivery', 'payment & commercial',
  'scope to verify', 'activity / id / area'
]) {
  if (textLower.includes(term.toLowerCase())) addError(`Visible legacy/English term remains in PDF: ${term}`);
}

for (const glyph of ['\uFFFD', '□', '�']) {
  if (textRaw.includes(glyph)) addError(`Corrupt or missing-glyph marker found: ${JSON.stringify(glyph)}`);
}

for (const phrase of [
  'แผนงานก่อสร้างห้วยขาแข้ง',
  'งานปรับบริเวณ',
  'งานโครงสร้าง',
  'สถาปัตย์',
  'งานระบบไฟฟ้าและสื่อสาร',
  'งานระบบสุขาภิบาลและป้องกันอัคคีภัย',
  'งานระบบปรับอากาศและระบายอากาศ',
  'งานระบบพิเศษ'
]) {
  if (!containsThaiPhrase(phrase)) addError(`Required Thai content phrase not found in PDF: ${phrase}`);
}

const expectedPlanGroups = new Set(masterSchedule.map(row => row.plan_no)).size;
const expectedAreaGroups = new Set(masterSchedule.map(row =>
  `${row.plan_no}||${row.building_area || 'ทั้งโครงการ'}`
)).size;
const plan01Rows = masterSchedule.filter(row => row.plan_no === '01');
const expectedCategoryGroups = new Set(plan01Rows.map(row =>
  `${row.building_area || 'ทั้งโครงการ'}||${row.work_category_th || row.discipline || 'งานทั่วไป'}`
)).size;

for (const [label, actual, expected] of [
  ['task rows', generation.task_rows, masterSchedule.length],
  ['plan groups', generation.plan_group_rows, expectedPlanGroups],
  ['area groups', generation.area_group_rows, expectedAreaGroups],
  ['Plan-01 category groups', generation.category_group_rows, expectedCategoryGroups]
]) {
  if (actual !== expected) addError(`PDF ${label} count is incorrect`, { expected, actual });
}

const titleTruncations = generation.activity_title_truncations || [];
const titleTruncationRate = masterSchedule.length ? titleTruncations.length / masterSchedule.length : 0;
const groupTruncations = generation.group_label_truncations || [];
if (titleTruncationRate > 0.15) {
  addError('More than 15% of activity titles are truncated', {
    count: titleTruncations.length,
    activities: masterSchedule.length,
    rate_pct: Number((titleTruncationRate * 100).toFixed(2)),
    sample: titleTruncations.slice(0, 12)
  });
} else if (titleTruncations.length) {
  addAdvisory('Some long activity titles end with ellipsis after two display lines', {
    count: titleTruncations.length,
    rate_pct: Number((titleTruncationRate * 100).toFixed(2)),
    sample: titleTruncations.slice(0, 12)
  });
}
if (groupTruncations.length > 5) {
  addError('Too many plan/area/category headings are truncated', {
    count: groupTruncations.length,
    sample: groupTruncations.slice(0, 12)
  });
} else if (groupTruncations.length) {
  addAdvisory('A small number of long hierarchy headings are shortened', {
    count: groupTruncations.length,
    sample: groupTruncations
  });
}

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
  lineMap.get(key).words.push({
    left: Number(word.left || 0),
    text: word.text || ''
  });
}

const expectedIds = new Set(masterSchedule.map(row => row.activity_id));
const observedIdPages = new Map();
for (const line of lineMap.values()) {
  line.words.sort((a, b) => a.left - b.left);
  const lineLeft = line.words[0]?.left ?? 9999;
  if (line.page < 2 || lineLeft < 70 || lineLeft > 500) continue;
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
  .filter(([page, count]) => Number(page) >= 2 && count < 4)
  .map(([page, count]) => ({ page: Number(page), activity_rows: count }));
if (sparseDetailPages.length) addAdvisory('Some detail pages contain fewer than four activities', sparseDetailPages);

const thaiChars = (textRaw.match(/[\u0E00-\u0E7F]/g) || []).length;
const extractedChars = textRaw.replace(/\s/g, '').length;
if (thaiChars < 20000) addError('Extracted PDF text contains unexpectedly little Thai content', { thaiChars });
if (extractedChars < 50000) addError('Extracted PDF text volume is unexpectedly low', { extractedChars });

const report = {
  status: errors.length ? 'FAIL' : advisories.length ? 'PASS_WITH_ADVISORIES' : 'PASS',
  summary: {
    pdf_pages: generation.pages,
    master_schedule_activities: masterSchedule.length,
    observed_activity_rows: observedIdPages.size,
    plan_groups: generation.plan_group_rows,
    area_groups: generation.area_group_rows,
    plan01_category_groups: generation.category_group_rows,
    title_truncations: titleTruncations.length,
    title_truncation_rate_pct: Number((titleTruncationRate * 100).toFixed(2)),
    group_heading_truncations: groupTruncations.length,
    thai_characters: thaiChars,
    extracted_nonspace_characters: extractedChars
  },
  ids_per_page: idsPerPage,
  errors,
  advisories
};
fs.writeFileSync(OUTPUTS.json, JSON.stringify(report, null, 2));

const markdown = [
  '# PDF Deep Audit — Baseline v0.8 ภาษาไทย', '',
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
console.log(`Hierarchy groups: plan=${generation.plan_group_rows}, area=${generation.area_group_rows}, Plan01 category=${generation.category_group_rows}`);
console.log(`Title truncations: ${titleTruncations.length}/${masterSchedule.length} (${report.summary.title_truncation_rate_pct}%)`);
console.log(`Group-heading truncations: ${groupTruncations.length}`);
console.log(`Thai characters extracted: ${thaiChars}`);
console.log(`Errors: ${errors.length}; Advisories: ${advisories.length}`);
if (errors.length) {
  console.error(JSON.stringify(errors, null, 2));
  process.exit(1);
}
