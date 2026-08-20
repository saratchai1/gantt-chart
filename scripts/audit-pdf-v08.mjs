import fs from 'node:fs';
import { masterSchedule } from '../src/build-schedule.js';

const PDF_TEXT = 'data/pdf-text-v08.txt';
const PDF_TSV = 'data/pdf-tsv-v08.tsv';
const GENERATION_REPORT = 'data/pdf-generation-report-v08.json';
const AUDIT_JSON = 'data/pdf-deep-audit-v08.json';
const AUDIT_MD = 'data/pdf-deep-audit-v08.md';

for (const file of [PDF_TEXT, PDF_TSV, GENERATION_REPORT]) {
  if (!fs.existsSync(file)) throw new Error(`Missing required PDF audit input: ${file}`);
}

const normalize = value => String(value ?? '')
  .normalize('NFC')
  .replace(/[\u200B-\u200D\uFEFF]/g, '')
  .replace(/\s+/g, ' ')
  .trim();

const textRaw = fs.readFileSync(PDF_TEXT, 'utf8');
const text = normalize(textRaw);
const textLower = text.toLowerCase();
const generation = JSON.parse(fs.readFileSync(GENERATION_REPORT, 'utf8'));
const errors = [];
const advisories = [];

function addError(message, detail = null) { errors.push({ message, detail }); }
function addAdvisory(message, detail = null) { advisories.push({ message, detail }); }

const forbiddenVisibleTerms = [
  'baseline v0.7', 'verify scope', 'continued:', ' activities ', ' zero-float',
  ' rows', 'project-wide', 'physical delivery', 'payment & commercial',
  'scope to verify', 'activity / id / area'
];
for (const term of forbiddenVisibleTerms) {
  if (textLower.includes(term.toLowerCase())) addError(`Visible legacy/English term remains in PDF: ${term}`);
}

const corruptGlyphs = ['\uFFFD', '□', '�'];
for (const glyph of corruptGlyphs) {
  if (textRaw.includes(glyph)) addError(`Corrupt or missing-glyph marker found in extracted PDF text: ${JSON.stringify(glyph)}`);
}

const requiredPhrases = [
  'แผนงานก่อสร้างห้วยขาแข้ง',
  'งานปรับบริเวณ',
  'งานโครงสร้าง',
  'สถาปัตย์',
  'งานระบบไฟฟ้าและสื่อสาร',
  'งานระบบสุขาภิบาลและป้องกันอัคคีภัย',
  'งานระบบปรับอากาศและระบายอากาศ',
  'งานระบบพิเศษ'
];
for (const phrase of requiredPhrases) {
  if (!text.includes(normalize(phrase))) addError(`Required Thai hierarchy/content phrase not found in PDF: ${phrase}`);
}

const expectedPlanGroups = new Set(masterSchedule.map(row => row.plan_no)).size;
const expectedAreaGroups = new Set(masterSchedule.map(row => `${row.plan_no}||${row.building_area || 'ทั้งโครงการ'}`)).size;
const plan01Rows = masterSchedule.filter(row => row.plan_no === '01');
const expectedCategoryGroups = new Set(plan01Rows.map(row => `${row.building_area || 'ทั้งโครงการ'}||${row.work_category_th || row.discipline || 'งานทั่วไป'}`)).size;
const plan01Categories = [...new Set(plan01Rows.map(row => row.work_category_th || row.discipline || 'งานทั่วไป'))];

if (generation.task_rows !== masterSchedule.length) {
  addError('PDF generation report task-row count does not equal master schedule activity count', {
    expected: masterSchedule.length, actual: generation.task_rows
  });
}
if (generation.plan_group_rows !== expectedPlanGroups) {
  addError('PDF plan-group count is incorrect', { expected: expectedPlanGroups, actual: generation.plan_group_rows });
}
if (generation.area_group_rows !== expectedAreaGroups) {
  addError('PDF area-group count is incorrect', { expected: expectedAreaGroups, actual: generation.area_group_rows });
}
if (generation.category_group_rows !== expectedCategoryGroups) {
  addError('PDF Plan-01 work-category group count is incorrect', {
    expected: expectedCategoryGroups, actual: generation.category_group_rows
  });
}
for (const category of plan01Categories) {
  if (!text.includes(normalize(category))) addError(`Plan-01 work category is absent from extracted PDF text: ${category}`);
}

const titleTruncations = generation.activity_title_truncations || [];
const titleTruncationRate = masterSchedule.length ? titleTruncations.length / masterSchedule.length : 0;
const groupTruncations = generation.group_label_truncations || [];
if (titleTruncationRate > 0.15) {
  addError('More than 15% of activity titles are truncated in the PDF', {
    count: titleTruncations.length,
    activities: masterSchedule.length,
    rate_pct: Number((titleTruncationRate * 100).toFixed(2)),
    sample: titleTruncations.slice(0, 12)
  });
} else if (titleTruncations.length) {
  addAdvisory('Some long activity titles use a final ellipsis after two display lines', {
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
  addAdvisory('A small number of long group headings are shortened with ellipsis', {
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

const words = parseTsv(fs.readFileSync(PDF_TSV, 'utf8')).filter(row => row.level === '5' || row.text);
const lineMap = new Map();
for (const word of words) {
  const page = Number(word.page_num || 0);
  if (!page) continue;
  const key = [page, word.block_num, word.par_num, word.line_num].join('|');
  if (!lineMap.has(key)) lineMap.set(key, { page, words: [] });
  lineMap.get(key).words.push({
    left: Number(word.left || 0),
    top: Number(word.top || 0),
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
  const candidates = joined.match(/P\d{2}(?:-[A-Z0-9]+)+/g) || [];
  for (const candidate of candidates) {
    if (!expectedIds.has(candidate)) continue;
    if (!observedIdPages.has(candidate)) observedIdPages.set(candidate, []);
    observedIdPages.get(candidate).push(line.page);
  }
}

const missingIds = [...expectedIds].filter(id => !observedIdPages.has(id));
const duplicateSelfRows = [...observedIdPages.entries()].filter(([, pages]) => pages.length !== 1);
const unexpectedIds = [...observedIdPages.keys()].filter(id => !expectedIds.has(id));
if (missingIds.length) addError('Activity rows missing from the PDF left-hand activity column', {
  count: missingIds.length, sample: missingIds.slice(0, 30)
});
if (duplicateSelfRows.length) addError('Activity IDs appear more than once in the PDF left-hand activity column', {
  count: duplicateSelfRows.length, sample: duplicateSelfRows.slice(0, 30)
});
if (unexpectedIds.length) addError('Unexpected activity IDs found in the PDF left-hand activity column', {
  count: unexpectedIds.length, sample: unexpectedIds.slice(0, 30)
});

const idsPerPage = {};
for (const [, pages] of observedIdPages) {
  for (const page of pages) idsPerPage[page] = (idsPerPage[page] || 0) + 1;
}
const emptyDetailPages = [];
for (let page = 2; page <= generation.pages; page++) {
  if (!idsPerPage[page]) emptyDetailPages.push(page);
}
if (emptyDetailPages.length) addError('One or more detail pages contain no activity rows', { pages: emptyDetailPages });

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
fs.writeFileSync(AUDIT_JSON, JSON.stringify(report, null, 2));

const md = [
  '# PDF Deep Audit — Baseline v0.8 ภาษาไทย',
  '',
  `**Status:** ${report.status}`,
  '',
  '## Summary',
  '',
  ...Object.entries(report.summary).map(([key, value]) => `- ${key}: ${value}`),
  '',
  '## Errors',
  '',
  ...(errors.length ? errors.map(item => `- ${item.message}${item.detail ? ` — \`${JSON.stringify(item.detail)}\`` : ''}`) : ['- None']),
  '',
  '## Advisories',
  '',
  ...(advisories.length ? advisories.map(item => `- ${item.message}${item.detail ? ` — \`${JSON.stringify(item.detail)}\`` : ''}`) : ['- None']),
  ''
].join('\n');
fs.writeFileSync(AUDIT_MD, md);

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
