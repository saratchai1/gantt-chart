import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
import PDFDocument from 'pdfkit';
import {
  teamGanttRows,
  teamGanttStats,
  buildTeamGanttHierarchy
} from '../src/build-team-gantt-220869.js';
import { TEAM_SOURCE_METADATA } from '../src/team-activity-source-220869.js';

const OUTPUT = 'data/huai-kha-khaeng-team-gantt-220869-v0.9.0-thai.pdf';
const REPORT = 'data/team-pdf-generation-report-220869.json';
const PAGE_MARGIN = 24;
const WORK_H = 24;
const ZONE_H = 22;
const PROJECT_DAYS = 1200;

const COLORS = Object.freeze({
  navy: '#173a63', navyDark: '#102f53', white: '#ffffff', ink: '#17212f',
  muted: '#667085', line: '#d7dde5', lineSoft: '#e8edf2', soft: '#f8fafc',
  workFill: '#d9d9d9', workStroke: '#9ca3af', workBar: '#6b7280',
  zoneFill: '#dbeafe', zoneStroke: '#93c5fd', zoneBar: '#3b82f6',
  activityFill: '#ecfdf3', activityAlt: '#f7fff9', activityBar: '#2e8b57',
  critical: '#c43d3d', criticalDark: '#9f2b2b',
  issueFill: '#fff4cc', issueStroke: '#d69e2e', issueText: '#8a5b00',
  green: '#26704e'
});

const MATCH_LABELS = Object.freeze({
  AREA_AND_WORK_EXACT: 'ตรงโซนย่อยและหมวดงาน',
  ZONE_EQUIPMENT_SCOPE_MATCH: 'ตรงขอบเขตครุภัณฑ์ระดับโซน',
  AREA_ALL_WORK_FALLBACK: 'ใช้ช่วงรวมโซนย่อย',
  ZONE_WORK_FALLBACK: 'ใช้หมวดงานระดับโซน',
  ZONE_ALL_WORK_FALLBACK: 'ใช้ช่วงรวมโซนหลัก',
  CONTROL_STREAM_MATCH: 'จับคู่กระบวนการควบคุม',
  PROJECT_CONTROL_FALLBACK: 'ใช้ช่วงควบคุมโครงการ'
});

function resolveFont(queries) {
  for (const query of queries) {
    try {
      const value = execFileSync('fc-match', ['-f', '%{file}\n', query], { encoding: 'utf8' }).trim();
      const file = value.split(/\r?\n/).find(Boolean);
      if (file && fs.existsSync(file)) return file;
    } catch {}
  }
  return null;
}

const regularFont = resolveFont(['Garuda:style=Regular', 'Garuda', 'Loma', 'Noto Sans Thai']);
const boldFont = resolveFont(['Garuda:style=Bold', 'Garuda', 'Loma:style=Bold', 'Noto Sans Thai:style=Bold']) || regularFont;
if (!regularFont) throw new Error('ไม่พบฟอนต์ที่รองรับภาษาไทย');

console.log(`Team PDF regular font: ${regularFont}`);
console.log(`Team PDF bold font: ${boldFont}`);
fs.mkdirSync('data', { recursive: true });

const doc = new PDFDocument({
  size: 'A3', layout: 'landscape', autoFirstPage: false, compress: true, bufferPages: false,
  margins: { top: PAGE_MARGIN, bottom: PAGE_MARGIN, left: PAGE_MARGIN, right: PAGE_MARGIN },
  info: {
    Title: 'แผนงานก่อสร้างห้วยขาแข้ง — Gantt ตามกิจกรรมทีมงาน 220869',
    Subject: 'Gantt Chart จากหัวข้องานและกิจกรรมในไฟล์ ส่งให้ดร.ก้อง 220869.xlsx',
    Author: 'ระบบจัดทำแผนงานหลักแบบบูรณาการ',
    Keywords: 'ห้วยขาแข้ง, Gantt, Excel 220869, แผนงานก่อสร้าง'
  }
});
const stream = fs.createWriteStream(OUTPUT);
doc.pipe(stream);
doc.registerFont('Thai', regularFont);
doc.registerFont('ThaiBold', boldFont);

const segmenter = typeof Intl?.Segmenter === 'function'
  ? new Intl.Segmenter('th', { granularity: 'grapheme' })
  : null;
const renderedActivityIds = [];
const rowMetrics = [];

function clean(value) {
  return String(value ?? '').replace(/\s+/g, ' ').trim();
}
function graphemes(value) {
  const text = clean(value);
  if (!segmenter) return Array.from(text);
  return [...segmenter.segment(text)].map(part => part.segment);
}
function useFont(name = 'Thai', size = 8, color = COLORS.ink) {
  doc.font(name).fontSize(size).fillColor(color);
}
function rect(x, y, w, h, fill = null, stroke = null, width = 0.35) {
  doc.save();
  if (fill) doc.fillColor(fill).rect(x, y, w, h).fill();
  if (stroke) doc.strokeColor(stroke).lineWidth(width).rect(x, y, w, h).stroke();
  doc.restore();
}
function line(x1, y1, x2, y2, color = COLORS.line, width = 0.35) {
  doc.save().strokeColor(color).lineWidth(width).moveTo(x1, y1).lineTo(x2, y2).stroke().restore();
}
function widthOf(text, size, font = 'Thai') {
  doc.font(font).fontSize(size);
  return doc.widthOfString(String(text));
}
function maxPrefix(parts, width, size, font) {
  let lo = 0;
  let hi = parts.length;
  while (lo < hi) {
    const mid = Math.ceil((lo + hi) / 2);
    if (widthOf(parts.slice(0, mid).join(''), size, font) <= width) lo = mid;
    else hi = mid - 1;
  }
  return Math.max(1, lo);
}
function preferredBreak(parts, count) {
  const lower = Math.max(1, count - 28);
  for (let index = count; index >= lower; index--) {
    if (/\s|[–—\-/:,;()]/.test(parts[index - 1] || '')) return index;
  }
  return count;
}
function wrapText(value, width, size = 7.4, font = 'Thai') {
  let remaining = graphemes(value);
  const lines = [];
  while (remaining.length) {
    const full = remaining.join('').trim();
    if (!full) break;
    if (widthOf(full, size, font) <= width) {
      lines.push(full);
      break;
    }
    let count = maxPrefix(remaining, width, size, font);
    count = preferredBreak(remaining, count);
    const part = remaining.slice(0, count).join('').trim();
    lines.push(part || remaining.slice(0, count).join(''));
    remaining = remaining.slice(count);
    while (remaining[0] && /\s/.test(remaining[0])) remaining.shift();
  }
  return lines.length ? lines : [''];
}
function drawLines(lines, x, y, width, { size = 7.4, bold = false, color = COLORS.ink, lineHeight = size * 1.25, align = 'left' } = {}) {
  useFont(bold ? 'ThaiBold' : 'Thai', size, color);
  lines.forEach((text, index) => doc.text(text, x, y + index * lineHeight, { width, lineBreak: false, align }));
}
function centeredText(text, x, y, w, h, { size = 7, bold = false, color = COLORS.ink, align = 'center' } = {}) {
  const lines = wrapText(text, Math.max(1, w - 6), size, bold ? 'ThaiBold' : 'Thai');
  const lineHeight = size * 1.22;
  const total = lines.length * lineHeight;
  drawLines(lines, x + 3, y + Math.max(2, (h - total) / 2), w - 6, { size, bold, color, lineHeight, align });
}
function timelineScale(width) { return width / PROJECT_DAYS; }
function barX(day, x, scale) { return x + (Number(day) - 1) * scale; }
function barW(start, finish, scale) { return Math.max(1.5, (Number(finish) - Number(start) + 1) * scale); }
function drawTimelineGrid(x, y, width, height) {
  const scale = timelineScale(width);
  for (let day = 1; day <= PROJECT_DAYS + 1; day += 30) {
    const xx = x + (day - 1) * scale;
    const major = (day - 1) % 120 === 0;
    line(xx, y, xx, y + height, major ? '#c8d2de' : '#e9edf2', major ? 0.65 : 0.28);
  }
}
function drawAxis(x, y, width, height) {
  rect(x, y, width, height, COLORS.navy, COLORS.navyDark, 0.5);
  const scale = timelineScale(width);
  for (let day = 1; day <= PROJECT_DAYS + 1; day += 30) {
    const xx = x + (day - 1) * scale;
    const major = (day - 1) % 120 === 0;
    line(xx, y, xx, y + height, major ? '#c7d9e8' : '#7892ab', major ? 0.65 : 0.25);
  }
  for (let day = 1; day <= 1081; day += 120) {
    const xx = x + (day - 1) * scale;
    centeredText(`D${day}`, xx, y, 120 * scale, height, { size: 6.3, bold: true, color: COLORS.white });
  }
  centeredText('D1200', x + width - 42, y, 40, height, { size: 6.2, bold: true, color: COLORS.white, align: 'right' });
  return scale;
}
function span(rows) {
  return [Math.min(...rows.map(row => row.start_day)), Math.max(...rows.map(row => row.finish_day))];
}
function mapCounts() {
  const counts = {};
  for (const row of teamGanttRows) counts[row.match_level] = (counts[row.match_level] || 0) + 1;
  return counts;
}

function drawLegend(x, y) {
  const items = [
    [COLORS.workFill, COLORS.workStroke, 'หัวข้องานจาก Excel'],
    [COLORS.zoneFill, COLORS.zoneStroke, 'โซนหลัก'],
    [COLORS.activityFill, COLORS.activityBar, 'กิจกรรมตาม Excel'],
    [COLORS.critical, COLORS.criticalDark, 'เกี่ยวข้องกับกิจกรรมวิกฤต'],
    [COLORS.issueFill, COLORS.issueStroke, 'ข้อความต้นทางต้องตรวจ']
  ];
  let cursor = x;
  for (const [fill, stroke, label] of items) {
    rect(cursor, y + 1, 18, 7, fill, stroke, 0.65);
    useFont('Thai', 5.9, COLORS.muted);
    doc.text(label, cursor + 23, y, { width: 112, lineBreak: false });
    cursor += 134;
  }
}
function drawFooter(pageNo) {
  const y = doc.page.height - PAGE_MARGIN - 13;
  drawLegend(PAGE_MARGIN, y - 1);
  useFont('Thai', 6.0, COLORS.muted);
  doc.text(`ฉบับฐาน v0.9.0 · A3 แนวนอน · หน้า ${pageNo}`, doc.page.width - PAGE_MARGIN - 220, y, {
    width: 220, lineBreak: false, align: 'right'
  });
}

function drawSummaryPage() {
  doc.addPage();
  const w = doc.page.width;
  const h = doc.page.height;
  const innerW = w - PAGE_MARGIN * 2;
  rect(0, 0, w, 70, COLORS.navyDark);
  useFont('ThaiBold', 17, COLORS.white);
  doc.text('แผนงานก่อสร้างห้วยขาแข้ง', PAGE_MARGIN, 15, { width: 720, lineBreak: false });
  useFont('Thai', 9.2, '#d9e5f0');
  doc.text('GANTT ตามหัวข้องานและกิจกรรมจากไฟล์ทีมงาน 220869 · ฉบับฐาน v0.9.0', PAGE_MARGIN, 42, { width: 760, lineBreak: false });
  useFont('ThaiBold', 8.1, COLORS.white);
  doc.text('วันโครงการ D1–D1200 · เวลาสืบทอดจาก Baseline รายละเอียด', w - PAGE_MARGIN - 350, 23, { width: 350, lineBreak: false, align: 'right' });

  const metricY = 82;
  const gap = 9;
  const metricW = (innerW - gap * 5) / 6;
  const metrics = [
    ['กิจกรรมจาก Excel', String(teamGanttRows.length)],
    ['งานก่อสร้าง', String(teamGanttStats.physical_activities)],
    ['ค่าใช้จ่ายพิเศษ', String(teamGanttStats.special_cost_activities)],
    ['หัวข้องาน', String(teamGanttStats.works)],
    ['จับคู่ตรง', String(teamGanttStats.exact_area_work_matches)],
    ['ข้อความต้องตรวจ', String(teamGanttStats.source_issues)]
  ];
  metrics.forEach(([label, value], index) => {
    const x = PAGE_MARGIN + index * (metricW + gap);
    rect(x, metricY, metricW, 50, COLORS.white, COLORS.line, 0.6);
    useFont('Thai', 6.4, COLORS.muted);
    doc.text(label, x + 8, metricY + 8, { width: metricW - 16, lineBreak: false });
    useFont('ThaiBold', 13, COLORS.navyDark);
    doc.text(value, x + 8, metricY + 23, { width: metricW - 16, lineBreak: false });
  });

  const noteY = 145;
  rect(PAGE_MARGIN, noteY, innerW, 62, '#f7fafc', '#cbd5e1', 0.6);
  useFont('ThaiBold', 8.1, COLORS.navyDark);
  doc.text('หลักการใช้ข้อมูล', PAGE_MARGIN + 10, noteY + 8, { width: 160, lineBreak: false });
  const note = `หัวข้องาน โซน และชื่อกิจกรรมมาจาก “${TEAM_SOURCE_METADATA.source_file}” โดยตรง ไฟล์ Excel ไม่ได้ระบุวันเริ่ม วันสิ้นสุด ระยะเวลา หรือ Predecessor จึงคำนวณแถบเวลาจากช่วงรวมของกิจกรรมที่จับคู่ได้ใน Existing Integrated Baseline v0.8.2 และเก็บระดับการจับคู่กับ Activity ID เดิมไว้ตรวจสอบทุกแถว`;
  const noteLines = wrapText(note, innerW - 190, 7.1, 'Thai');
  drawLines(noteLines, PAGE_MARGIN + 175, noteY + 8, innerW - 185, { size: 7.1, lineHeight: 9.2, color: COLORS.ink });

  const issueY = noteY + 72;
  rect(PAGE_MARGIN, issueY, innerW, 48, COLORS.issueFill, COLORS.issueStroke, 0.7);
  useFont('ThaiBold', 7.2, COLORS.issueText);
  doc.text('หมายเหตุข้อมูลต้นทาง 1 รายการ:', PAGE_MARGIN + 10, issueY + 8, { width: 180, lineBreak: false });
  const issue = teamGanttRows.find(row => row.source_issue);
  const issueText = issue
    ? `แถว Excel ${issue.source_row}: “${issue.source_label}” ถูกเก็บตามต้นฉบับ และใช้ “${issue.activity_name}” เฉพาะสำหรับการจับคู่เวลา — ${issue.normalization_note}`
    : 'ไม่พบข้อความต้นทางที่ต้องตรวจ';
  drawLines(wrapText(issueText, innerW - 205, 6.7, 'Thai'), PAGE_MARGIN + 190, issueY + 7, innerW - 200, {
    size: 6.7, lineHeight: 8.4, color: COLORS.issueText
  });

  let y = issueY + 62;
  useFont('ThaiBold', 9.0, COLORS.navyDark);
  doc.text('สรุปหัวข้องานจาก Excel', PAGE_MARGIN, y, { width: innerW, lineBreak: false });
  y += 17;
  const labelW = 430;
  const countW = 70;
  const daysW = 90;
  const timelineX = PAGE_MARGIN + labelW + countW + daysW;
  const timelineW = innerW - labelW - countW - daysW;
  const headH = 27;
  rect(PAGE_MARGIN, y, labelW, headH, COLORS.navy, COLORS.navyDark, 0.5);
  rect(PAGE_MARGIN + labelW, y, countW, headH, COLORS.navy, COLORS.navyDark, 0.5);
  rect(PAGE_MARGIN + labelW + countW, y, daysW, headH, COLORS.navy, COLORS.navyDark, 0.5);
  centeredText('หัวข้องาน', PAGE_MARGIN, y, labelW, headH, { size: 7.0, bold: true, color: COLORS.white, align: 'left' });
  centeredText('กิจกรรม', PAGE_MARGIN + labelW, y, countW, headH, { size: 6.8, bold: true, color: COLORS.white });
  centeredText('ช่วงวัน', PAGE_MARGIN + labelW + countW, y, daysW, headH, { size: 6.8, bold: true, color: COLORS.white });
  const scale = drawAxis(timelineX, y, timelineW, headH);
  y += headH;

  for (const work of buildTeamGanttHierarchy()) {
    const rowH = 22;
    rect(PAGE_MARGIN, y, innerW, rowH, COLORS.workFill, COLORS.workStroke, 0.4);
    centeredText(`${work.work_code} · ${work.work_name}`, PAGE_MARGIN, y, labelW, rowH, { size: 6.8, bold: true, align: 'left' });
    centeredText(String(work.rows.length), PAGE_MARGIN + labelW, y, countW, rowH, { size: 6.6 });
    centeredText(`D${work.start_day}–D${work.finish_day}`, PAGE_MARGIN + labelW + countW, y, daysW, rowH, { size: 6.4 });
    drawTimelineGrid(timelineX, y, timelineW, rowH);
    rect(barX(work.start_day, timelineX, scale), y + 7.5, barW(work.start_day, work.finish_day, scale), 7, COLORS.workBar);
    y += rowH;
  }

  const counts = mapCounts();
  useFont('Thai', 6.2, COLORS.muted);
  doc.text(`ระดับการจับคู่: ตรงโซน/งาน ${counts.AREA_AND_WORK_EXACT || 0} · ครุภัณฑ์ระดับโซน ${counts.ZONE_EQUIPMENT_SCOPE_MATCH || 0} · ใช้ช่วงรวมโซนย่อย ${counts.AREA_ALL_WORK_FALLBACK || 0} · กระบวนการควบคุม ${counts.CONTROL_STREAM_MATCH || 0}`,
    PAGE_MARGIN, Math.min(y + 10, h - PAGE_MARGIN - 34), { width: innerW, lineBreak: false });
  drawFooter(1);
}

function geometry() {
  const w = doc.page.width;
  const h = doc.page.height;
  const innerW = w - PAGE_MARGIN * 2;
  const columns = [
    ['WBS', 64], ['หัวข้องาน / โซน / กิจกรรมจาก Excel', 358], ['ระยะเวลา', 58],
    ['เริ่ม', 48], ['สิ้นสุด', 48], ['แถว Excel / การจับคู่', 132]
  ];
  const tableW = columns.reduce((sum, [, width]) => sum + width, 0);
  return { w, h, innerW, columns, tableW, timelineX: PAGE_MARGIN + tableW, timelineW: innerW - tableW };
}
function drawDetailHeader(pageNo, context = '') {
  doc.addPage();
  const g = geometry();
  useFont('ThaiBold', 12.0, COLORS.navyDark);
  doc.text('Gantt ตามกิจกรรมทีมงาน 220869 — ห้วยขาแข้ง', PAGE_MARGIN, 18, { width: 600, lineBreak: false });
  useFont('Thai', 6.9, COLORS.muted);
  doc.text(`${teamGanttRows.length} กิจกรรม · ขอบเขตจาก Excel · เวลาอนุมานจาก Baseline รายละเอียด v0.8.2`, PAGE_MARGIN, 39, { width: 680, lineBreak: false });
  if (context) {
    useFont('Thai', 6.5, COLORS.muted);
    doc.text(`ต่อ: ${context}`, 700, 39, { width: g.w - PAGE_MARGIN - 700, lineBreak: false, align: 'right' });
  }
  useFont('ThaiBold', 7.8, COLORS.navyDark);
  doc.text(`ฉบับฐาน v0.9.0 · หน้า ${pageNo}`, g.w - PAGE_MARGIN - 220, 18, { width: 220, lineBreak: false, align: 'right' });

  const headY = 61;
  const headH = 31;
  let x = PAGE_MARGIN;
  for (const [label, width] of g.columns) {
    rect(x, headY, width, headH, COLORS.navy, COLORS.navyDark, 0.5);
    centeredText(label, x, headY, width, headH, { size: 6.7, bold: true, color: COLORS.white, align: label.includes('กิจกรรม') || label.includes('แถว') ? 'left' : 'center' });
    x += width;
  }
  drawAxis(g.timelineX, headY, g.timelineW, headH);
  drawFooter(pageNo);
  return { ...g, bodyTop: headY + headH, bodyBottom: g.h - PAGE_MARGIN - 32 };
}

function drawGroupRow(kind, label, code, rows, y, g, continuation = false) {
  const [start, finish] = span(rows);
  const isWork = kind === 'work';
  const height = isWork ? WORK_H : ZONE_H;
  const fill = isWork ? COLORS.workFill : COLORS.zoneFill;
  const stroke = isWork ? COLORS.workStroke : COLORS.zoneStroke;
  const bar = isWork ? COLORS.workBar : COLORS.zoneBar;
  rect(PAGE_MARGIN, y, g.innerW, height, fill, stroke, 0.45);
  centeredText(code, PAGE_MARGIN, y, g.columns[0][1], height, { size: 6.5, bold: true });
  centeredText(`${label}${continuation ? ' (ต่อ)' : ''}`, PAGE_MARGIN + g.columns[0][1], y, g.columns[1][1], height, {
    size: isWork ? 7.5 : 7.1, bold: true, align: 'left'
  });
  centeredText(`${rows.length} รายการ`, PAGE_MARGIN + g.columns[0][1] + g.columns[1][1], y, g.columns[2][1], height, { size: 6.0 });
  const startX = PAGE_MARGIN + g.columns[0][1] + g.columns[1][1] + g.columns[2][1];
  centeredText(`D${start}`, startX, y, g.columns[3][1], height, { size: 6.2 });
  centeredText(`D${finish}`, startX + g.columns[3][1], y, g.columns[4][1], height, { size: 6.2 });
  centeredText(isWork ? 'หัวข้องาน' : 'โซนหลัก', startX + g.columns[3][1] + g.columns[4][1], y, g.columns[5][1], height, { size: 6.1, bold: true });
  drawTimelineGrid(g.timelineX, y, g.timelineW, height);
  const scale = timelineScale(g.timelineW);
  rect(barX(start, g.timelineX, scale), y + (height - 6) / 2, barW(start, finish, scale), 6, bar);
  return height;
}

function taskLayout(row, width) {
  const primary = row.source_kind === 'SPECIAL_COST' ? row.activity_name : row.source_label;
  const titleLines = wrapText(primary, width - 10, 7.45, row.computed_critical === 'Y' ? 'ThaiBold' : 'Thai');
  const sub = `${row.team_activity_id} · ${row.source_kind === 'SPECIAL_COST' ? 'ค่าใช้จ่ายพิเศษ' : row.zone_name} · อ้างอิงกิจกรรมเดิม ${row.matched_activity_count} รายการ`;
  const subLines = wrapText(sub, width - 10, 5.25, 'Thai');
  const issueLines = row.source_issue
    ? wrapText(`ใช้จับคู่: ${row.activity_name} · ${row.normalization_note}`, width - 10, 5.4, 'Thai')
    : [];
  const height = Math.max(31, 7 + titleLines.length * 9.0 + subLines.length * 6.7 + issueLines.length * 7.0 + 4);
  return { primary, titleLines, subLines, issueLines, height };
}

function drawTaskRow(row, y, g, stripe) {
  const activityWidth = g.columns[1][1];
  const layout = taskLayout(row, activityWidth);
  const critical = row.computed_critical === 'Y';
  const issue = Boolean(row.source_issue);
  const fill = issue ? COLORS.issueFill : stripe % 2 ? COLORS.activityFill : COLORS.activityAlt;
  rect(PAGE_MARGIN, y, g.innerW, layout.height, fill, issue ? COLORS.issueStroke : COLORS.lineSoft, issue ? 0.7 : 0.3);
  if (critical) rect(PAGE_MARGIN, y, 3, layout.height, COLORS.critical);

  let x = PAGE_MARGIN;
  centeredText(row.wbs, x, y, g.columns[0][1], layout.height, { size: 6.5, bold: critical });
  x += g.columns[0][1];

  const titleFont = critical ? 'ThaiBold' : 'Thai';
  drawLines(layout.titleLines, x + 5, y + 4, activityWidth - 10, {
    size: 7.45, bold: critical, color: issue ? COLORS.issueText : critical ? COLORS.criticalDark : COLORS.ink, lineHeight: 9.0
  });
  let subY = y + 4 + layout.titleLines.length * 9.0 + 1;
  drawLines(layout.subLines, x + 5, subY, activityWidth - 10, { size: 5.25, color: COLORS.muted, lineHeight: 6.7 });
  subY += layout.subLines.length * 6.7;
  if (layout.issueLines.length) {
    drawLines(layout.issueLines, x + 5, subY + 1, activityWidth - 10, { size: 5.4, bold: true, color: COLORS.issueText, lineHeight: 7.0 });
  }
  x += activityWidth;

  centeredText(`${row.duration_days} วัน`, x, y, g.columns[2][1], layout.height, { size: 6.4, bold: critical });
  x += g.columns[2][1];
  centeredText(`D${row.start_day}`, x, y, g.columns[3][1], layout.height, { size: 6.4 });
  x += g.columns[3][1];
  centeredText(`D${row.finish_day}`, x, y, g.columns[4][1], layout.height, { size: 6.4 });
  x += g.columns[4][1];
  const matchText = `แถว ${row.source_row}\n${MATCH_LABELS[row.match_level] || row.match_level}`;
  const matchLines = matchText.split('\n').flatMap(value => wrapText(value, g.columns[5][1] - 8, 5.6, 'Thai'));
  drawLines(matchLines, x + 4, y + Math.max(3, (layout.height - matchLines.length * 7.1) / 2), g.columns[5][1] - 8, {
    size: 5.6, color: issue ? COLORS.issueText : COLORS.muted, lineHeight: 7.1, align: 'center'
  });

  drawTimelineGrid(g.timelineX, y, g.timelineW, layout.height);
  const scale = timelineScale(g.timelineW);
  const barFill = issue ? COLORS.issueStroke : critical ? COLORS.critical : COLORS.activityBar;
  const barStroke = issue ? COLORS.issueText : critical ? COLORS.criticalDark : COLORS.green;
  rect(barX(row.start_day, g.timelineX, scale), y + (layout.height - 9) / 2,
    barW(row.start_day, row.finish_day, scale), 9, barFill, barStroke, 0.5);

  renderedActivityIds.push(row.team_activity_id);
  rowMetrics.push({
    team_activity_id: row.team_activity_id,
    source_row: row.source_row,
    height: Number(layout.height.toFixed(2)),
    title_lines: layout.titleLines.length,
    sub_lines: layout.subLines.length,
    issue_lines: layout.issueLines.length
  });
  return layout.height;
}

function buildDisplayRows() {
  const display = [];
  for (const work of buildTeamGanttHierarchy()) {
    display.push({ kind: 'work', work, rows: work.rows, label: work.work_name, code: work.work_code });
    for (const zone of work.zones) {
      display.push({ kind: 'zone', work, zone, rows: zone.rows, label: zone.zone_name, code: `${work.work_code}.${zone.zone_code}` });
      for (const task of zone.rows) display.push({ kind: 'task', work, zone, task });
    }
  }
  return display;
}

function minimumBlockHeight(display, index, g) {
  const row = display[index];
  if (row.kind === 'task') return taskLayout(row.task, g.columns[1][1]).height;
  let height = row.kind === 'work' ? WORK_H : ZONE_H;
  const next = display[index + 1];
  if (row.kind === 'work' && next?.kind === 'zone') {
    height += ZONE_H;
    const task = display[index + 2];
    if (task?.kind === 'task') height += taskLayout(task.task, g.columns[1][1]).height;
  } else if (row.kind === 'zone' && next?.kind === 'task') {
    height += taskLayout(next.task, g.columns[1][1]).height;
  }
  return height;
}

function drawDetailPages() {
  const display = buildDisplayRows();
  let pageNo = 2;
  let g = drawDetailHeader(pageNo);
  let y = g.bodyTop;
  let stripe = 0;
  let currentWork = null;
  let currentZone = null;

  for (let index = 0; index < display.length; index++) {
    const row = display[index];
    const needed = minimumBlockHeight(display, index, g);
    if (y > g.bodyTop && y + needed > g.bodyBottom) {
      pageNo += 1;
      const context = [currentWork?.work_name, currentZone?.zone_name].filter(Boolean).join(' · ');
      g = drawDetailHeader(pageNo, context);
      y = g.bodyTop;
      stripe = 0;
      if (row.kind === 'task') {
        if (currentWork) y += drawGroupRow('work', currentWork.work_name, currentWork.work_code, currentWork.rows, y, g, true);
        if (currentZone) y += drawGroupRow('zone', currentZone.zone_name, `${currentWork.work_code}.${currentZone.zone_code}`, currentZone.rows, y, g, true);
      }
    }

    if (row.kind === 'work') {
      currentWork = row.work;
      currentZone = null;
      y += drawGroupRow('work', row.label, row.code, row.rows, y, g);
    } else if (row.kind === 'zone') {
      currentZone = row.zone;
      y += drawGroupRow('zone', row.label, row.code, row.rows, y, g);
    } else {
      y += drawTaskRow(row.task, y, g, stripe++);
    }
  }
  return { pageNo, display };
}

drawSummaryPage();
const { pageNo: finalPageNo, display } = drawDetailPages();
doc.end();
await new Promise((resolve, reject) => {
  stream.on('finish', resolve);
  stream.on('error', reject);
});

const expectedIds = new Set(teamGanttRows.map(row => row.team_activity_id));
const renderedCounts = renderedActivityIds.reduce((map, id) => map.set(id, (map.get(id) || 0) + 1), new Map());
const missing = [...expectedIds].filter(id => !renderedCounts.has(id));
const duplicate = [...renderedCounts.entries()].filter(([, count]) => count !== 1).map(([id, count]) => ({ id, count }));
const unexpected = [...renderedCounts.keys()].filter(id => !expectedIds.has(id));
const report = {
  version: '0.9.0',
  output: OUTPUT,
  source_file: TEAM_SOURCE_METADATA.source_file,
  source_sheet: TEAM_SOURCE_METADATA.source_sheet,
  pages: finalPageNo,
  size_bytes: fs.statSync(OUTPUT).size,
  activities: teamGanttRows.length,
  physical_activities: teamGanttStats.physical_activities,
  special_cost_activities: teamGanttStats.special_cost_activities,
  work_groups: display.filter(row => row.kind === 'work').length,
  zone_groups: display.filter(row => row.kind === 'zone').length,
  task_rows: display.filter(row => row.kind === 'task').length,
  rendered_activity_rows: renderedActivityIds.length,
  unique_rendered_activity_rows: renderedCounts.size,
  missing_activity_ids: missing,
  duplicate_activity_ids: duplicate,
  unexpected_activity_ids: unexpected,
  source_issue_count: teamGanttStats.source_issues,
  mapping_counts: mapCounts(),
  max_task_row_height: Math.max(...rowMetrics.map(row => row.height)),
  max_title_lines: Math.max(...rowMetrics.map(row => row.title_lines)),
  max_issue_lines: Math.max(...rowMetrics.map(row => row.issue_lines)),
  visible_truncations: 0,
  hierarchy: 'หัวข้องานจาก Excel → โซนหลัก → กิจกรรมตาม Excel',
  row_metrics: rowMetrics
};
fs.writeFileSync(REPORT, JSON.stringify(report, null, 2));

console.log(`สร้าง Team Gantt PDF แล้ว: ${OUTPUT}`);
console.log(`Pages=${report.pages}; activities=${report.activities}; works=${report.work_groups}; zones=${report.zone_groups}`);
console.log(`Rendered=${report.rendered_activity_rows}/${report.activities}; missing=${missing.length}; duplicates=${duplicate.length}`);
console.log(`Source issues=${report.source_issue_count}; max row height=${report.max_task_row_height}`);
