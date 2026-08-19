import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
import PDFDocument from 'pdfkit';
import { masterSchedule, scheduleStats, validation } from '../src/build-schedule.js';

const OUTPUT = 'data/huai-kha-khaeng-integrated-master-gantt-v0.7.pdf';
const PAGE_MARGIN = 18;
const COLORS = {
  navy: '#173a63', navyDark: '#102f53', blue: '#3e82b8', blueSoft: '#dbe7f2',
  critical: '#c43d3d', criticalDark: '#9f2b2b', amber: '#c58a2a', amberPale: '#fff3d8',
  gray900: '#17212f', gray700: '#475467', gray600: '#667085', gray400: '#98a2b3',
  gray300: '#cbd5e1', gray250: '#d8dee8', gray200: '#e5eaf0', gray100: '#f4f6f8', white: '#ffffff'
};

const PLAN_NAMES = {
  '01': 'แผนการดำเนินการโครงการ / Physical Delivery', '02': 'แผนงบประมาณ / Payment & Commercial',
  '03': 'แผนการจัดการสถานที่ / Site Management', '04': 'แผนอัตรากำลัง / Workforce',
  '05': 'แผนการใช้เครื่องจักร / Plant', '06': 'แผนการจัดหาวัสดุ / Procurement',
  '07': 'แผนควบคุมคุณภาพ / QA/QC', '08': 'แผนความปลอดภัย อาชีวอนามัย / HSE',
  '09': 'แผนจราจร / Traffic', '10': 'แผนสิ่งแวดล้อม / Environment',
  '11': 'แผนบริหารเอกสารอัตโนมัติ / CDE-EDMS', '12': 'แผนติดตามความก้าวหน้า / Project Controls',
  '13': 'แผน BIM / Digital Twin', '14': 'แผน Application / AI', '15': 'แผน Carbon Footprint',
  '16': 'แผนป้องกันผลกระทบต่อมรดกโลก / Heritage'
};

const CP_WINDOWS = [
  ['CP-01', 'Survey / benchmark / initial approval', 1, 90],
  ['CP-02', 'Temporary site systems / workfront readiness', 31, 180],
  ['CP-03', 'Design / approvals / long-lead procurement', 31, 270],
  ['CP-04', 'Foundations / main structure — Area A', 181, 600],
  ['CP-05', 'Architecture / MEP — Area A', 421, 840],
  ['CP-06', 'Areas B/C/D + external systems', 301, 960],
  ['CP-07', 'Landscape / detail completion / integration', 841, 1080],
  ['CP-08', 'Commissioning / as-built / O&M / handover', 1081, 1200]
];

function findFont(family) {
  try {
    const out = execFileSync('fc-match', ['-f', '%{file}\n', family], { encoding: 'utf8' }).trim();
    const first = out.split(/\r?\n/).find(Boolean);
    if (first && fs.existsSync(first)) return first;
  } catch {}
  return null;
}

const regularFont = findFont('Noto Sans Thai') || findFont('Noto Sans') || '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf';
const boldFont = findFont('Noto Sans Thai:style=Bold') || findFont('Noto Sans:style=Bold') || regularFont;
if (!fs.existsSync(regularFont)) throw new Error(`No usable Unicode font found: ${regularFont}`);

fs.mkdirSync('data', { recursive: true });
const doc = new PDFDocument({
  size: 'A3', layout: 'landscape', bufferPages: true, autoFirstPage: false, compress: true,
  margins: { top: PAGE_MARGIN, bottom: PAGE_MARGIN, left: PAGE_MARGIN, right: PAGE_MARGIN },
  info: {
    Title: 'Integrated Master Gantt — โครงการพัฒนาแหล่งท่องเที่ยวห้วยขาแข้ง',
    Subject: 'Proposal Integrated Master Schedule Baseline v0.7',
    Author: 'Integrated project schedule generator',
    Keywords: 'Huai Kha Khaeng, Gantt, CPM, construction, schedule, proposal'
  }
});
const stream = fs.createWriteStream(OUTPUT);
doc.pipe(stream);
doc.registerFont('Thai', regularFont);
doc.registerFont('ThaiBold', boldFont);

function font(name = 'Thai', size = 7, color = COLORS.gray900) { doc.font(name).fontSize(size).fillColor(color); }
function line(x1, y1, x2, y2, color = COLORS.gray250, width = 0.35) {
  doc.save().strokeColor(color).lineWidth(width).moveTo(x1, y1).lineTo(x2, y2).stroke().restore();
}
function rect(x, y, w, h, fillColor = null, strokeColor = null, width = 0.35) {
  doc.save();
  if (fillColor) doc.fillColor(fillColor).rect(x, y, w, h).fill();
  if (strokeColor) doc.strokeColor(strokeColor).lineWidth(width).rect(x, y, w, h).stroke();
  doc.restore();
}
function fitText(text, width, size = 6.2, fontName = 'Thai') {
  const value = String(text ?? '');
  doc.font(fontName).fontSize(size);
  if (doc.widthOfString(value) <= width) return value;
  const suffix = '…';
  let lo = 0, hi = value.length;
  while (lo < hi) {
    const mid = Math.ceil((lo + hi) / 2);
    if (doc.widthOfString(value.slice(0, mid) + suffix) <= width) lo = mid;
    else hi = mid - 1;
  }
  return value.slice(0, Math.max(0, lo)) + suffix;
}
function textCell(text, x, y, w, h, { size = 6.2, bold = false, color = COLORS.gray900, align = 'left', pad = 3 } = {}) {
  const name = bold ? 'ThaiBold' : 'Thai';
  const shown = fitText(text, Math.max(1, w - pad * 2), size, name);
  font(name, size, color);
  doc.text(shown, x + pad, y + Math.max(0, (h - size * 1.28) / 2 - 0.5), {
    width: Math.max(1, w - pad * 2), height: h, lineBreak: false, align
  });
}
function projectScale(timelineW) { return timelineW / 1200; }
function barX(day, timelineX, scale) { return timelineX + (day - 1) * scale; }
function barW(start, finish, scale) { return Math.max(1.25, (finish - start + 1) * scale); }
function drawDiamond(cx, cy, radius, fillColor, strokeColor = fillColor) {
  doc.save().translate(cx, cy).rotate(45).fillColor(fillColor).strokeColor(strokeColor).lineWidth(0.5)
    .rect(-radius, -radius, radius * 2, radius * 2).fillAndStroke().restore();
}
function drawLegend(x, y) {
  const items = [['task', 'Activity'], ['critical', 'Zero-float critical'], ['milestone', 'Milestone'], ['provisional', 'WHERE_APPLICABLE / provisional scope']];
  let cx = x;
  for (const [kind, label] of items) {
    if (kind === 'milestone') drawDiamond(cx + 4, y + 4, 3.2, COLORS.navy);
    else {
      const fill = kind === 'critical' ? COLORS.critical : kind === 'provisional' ? COLORS.amberPale : COLORS.blue;
      const stroke = kind === 'provisional' ? COLORS.amber : fill;
      rect(cx, y, 18, 7, fill, stroke, 0.6);
    }
    font('Thai', 5.6, COLORS.gray700);
    doc.text(label, cx + 22, y - 0.5, { lineBreak: false });
    cx += doc.widthOfString(label) + 43;
  }
}
function drawAxis(timelineX, timelineY, timelineW, axisH, { labels = true } = {}) {
  const scale = projectScale(timelineW);
  rect(timelineX, timelineY, timelineW, axisH, COLORS.navy, COLORS.navyDark, 0.5);
  for (let m = 0; m <= 40; m++) {
    const x = timelineX + m * 30 * scale;
    const major = m % 5 === 0;
    line(x, timelineY, x, timelineY + axisH, major ? '#b5c9dc' : '#6f8dab', major ? 0.65 : 0.25);
    if (labels && m < 40) {
      const cellX = timelineX + m * 30 * scale;
      const cellW = 30 * scale;
      font('ThaiBold', 4.8, COLORS.white);
      doc.text(`M${m + 1}`, cellX, timelineY + 5.2, { width: cellW, align: 'center', lineBreak: false });
      font('Thai', 4.1, '#d9e5f0');
      doc.text(`D${m * 30 + 1}`, cellX, timelineY + 13.0, { width: cellW, align: 'center', lineBreak: false });
    }
  }
  return scale;
}
function drawTimelineGrid(timelineX, y, timelineW, h) {
  const scale = projectScale(timelineW);
  for (let m = 0; m <= 40; m++) {
    const x = timelineX + m * 30 * scale;
    const major = m % 5 === 0;
    line(x, y, x, y + h, major ? COLORS.gray300 : '#edf0f4', major ? 0.55 : 0.25);
  }
}
function spanOf(rows) {
  if (!rows.length) return [1, 1];
  return [Math.min(...rows.map(r => r.start_day)), Math.max(...rows.map(r => r.finish_day))];
}
function buildSpanMaps(rows) {
  const plan = new Map(), area = new Map();
  for (const r of rows) {
    if (!plan.has(r.plan_no)) plan.set(r.plan_no, []);
    plan.get(r.plan_no).push(r);
    const key = `${r.plan_no}|${r.building_area || 'Project-wide'}`;
    if (!area.has(key)) area.set(key, []);
    area.get(key).push(r);
  }
  return { plan, area };
}
function buildDisplayRows(rows) {
  const { plan, area } = buildSpanMaps(rows);
  const out = [];
  let lastPlan = null, lastArea = null;
  for (const r of rows) {
    if (r.plan_no !== lastPlan) {
      const group = plan.get(r.plan_no), [s, f] = spanOf(group);
      out.push({ kind: 'plan', plan_no: r.plan_no, label: `Plan ${r.plan_no} — ${PLAN_NAMES[r.plan_no] || ''}`, count: group.length, start_day: s, finish_day: f });
      lastPlan = r.plan_no; lastArea = null;
    }
    const areaName = r.building_area || 'Project-wide';
    if (areaName !== lastArea) {
      const group = area.get(`${r.plan_no}|${areaName}`) || [r], [s, f] = spanOf(group);
      out.push({ kind: 'area', label: areaName, count: group.length, start_day: s, finish_day: f });
      lastArea = areaName;
    }
    out.push({ kind: 'task', task: r });
  }
  return out;
}

function addSummaryPage() {
  doc.addPage();
  const w = doc.page.width, h = doc.page.height, innerW = w - PAGE_MARGIN * 2;
  rect(0, 0, w, 70, COLORS.navyDark);
  font('ThaiBold', 18, COLORS.white); doc.text('แผนงานก่อสร้างห้วยขาแข้ง', PAGE_MARGIN, 17, { lineBreak: false });
  font('Thai', 10, '#d9e5f0'); doc.text('PROPOSAL INTEGRATED MASTER SCHEDULE · BASELINE v0.7', PAGE_MARGIN, 43, { lineBreak: false });
  font('ThaiBold', 8, COLORS.navyDark); doc.text('Project Control Windows / Critical Narrative', PAGE_MARGIN, 85, { lineBreak: false });

  const tableX = PAGE_MARGIN, labelW = 360, daysW = 74;
  const timelineX = tableX + labelW + daysW, timelineW = innerW - labelW - daysW;
  const headY = 101, headH = 24;
  rect(tableX, headY, labelW, headH, COLORS.navy, COLORS.white, 0.4);
  rect(tableX + labelW, headY, daysW, headH, COLORS.navy, COLORS.white, 0.4);
  textCell('Control window / scope', tableX, headY, labelW, headH, { size: 6.5, bold: true, color: COLORS.white });
  textCell('Project Days', tableX + labelW, headY, daysW, headH, { size: 6.5, bold: true, color: COLORS.white, align: 'center' });
  const scale = drawAxis(timelineX, headY, timelineW, headH);
  let y = headY + headH;
  for (let i = 0; i < CP_WINDOWS.length; i++) {
    const [code, label, s, f] = CP_WINDOWS[i], rh = 24;
    rect(tableX, y, innerW, rh, i % 2 ? COLORS.gray100 : COLORS.white, COLORS.gray250, 0.3);
    textCell(`${code}  ${label}`, tableX, y, labelW, rh, { size: 6.5, bold: true });
    textCell(`D${s}–D${f}`, tableX + labelW, y, daysW, rh, { size: 6.2, color: COLORS.gray700, align: 'center' });
    drawTimelineGrid(timelineX, y, timelineW, rh);
    rect(barX(s, timelineX, scale), y + 8, barW(s, f, scale), 8, i >= 6 ? COLORS.critical : COLORS.blue);
    y += rh;
  }

  y += 18;
  font('ThaiBold', 8, COLORS.navyDark); doc.text('Plan 01–16 Summary', PAGE_MARGIN, y, { lineBreak: false });
  y += 16;
  const planLabelW = 390, countW = 58, planDaysW = 80;
  const pTimelineX = PAGE_MARGIN + planLabelW + countW + planDaysW;
  const pTimelineW = innerW - planLabelW - countW - planDaysW, pHeadH = 22;
  rect(PAGE_MARGIN, y, planLabelW, pHeadH, COLORS.navy, COLORS.white, 0.4);
  rect(PAGE_MARGIN + planLabelW, y, countW, pHeadH, COLORS.navy, COLORS.white, 0.4);
  rect(PAGE_MARGIN + planLabelW + countW, y, planDaysW, pHeadH, COLORS.navy, COLORS.white, 0.4);
  textCell('Plan / workstream', PAGE_MARGIN, y, planLabelW, pHeadH, { size: 6.2, bold: true, color: COLORS.white });
  textCell('Rows', PAGE_MARGIN + planLabelW, y, countW, pHeadH, { size: 6.2, bold: true, color: COLORS.white, align: 'center' });
  textCell('Span', PAGE_MARGIN + planLabelW + countW, y, planDaysW, pHeadH, { size: 6.2, bold: true, color: COLORS.white, align: 'center' });
  const pScale = drawAxis(pTimelineX, y, pTimelineW, pHeadH, { labels: false });
  y += pHeadH;
  for (let p = 1; p <= 16; p++) {
    const planNo = String(p).padStart(2, '0'), rows = masterSchedule.filter(r => r.plan_no === planNo);
    if (!rows.length) continue;
    const [s, f] = spanOf(rows), rh = 17.5;
    rect(PAGE_MARGIN, y, innerW, rh, p % 2 ? COLORS.gray100 : COLORS.white, COLORS.gray250, 0.25);
    textCell(`Plan ${planNo} — ${PLAN_NAMES[planNo] || ''}`, PAGE_MARGIN, y, planLabelW, rh, { size: 5.6, bold: planNo === '01' });
    textCell(rows.length, PAGE_MARGIN + planLabelW, y, countW, rh, { size: 5.6, align: 'center' });
    textCell(`D${s}–D${f}`, PAGE_MARGIN + planLabelW + countW, y, planDaysW, rh, { size: 5.4, align: 'center' });
    drawTimelineGrid(pTimelineX, y, pTimelineW, rh);
    rect(barX(s, pTimelineX, pScale), y + 6.2, barW(s, f, pScale), 5.2, planNo === '01' ? COLORS.navy : '#7798b6');
    y += rh;
  }
  drawLegend(PAGE_MARGIN, h - 34);
  font('Thai', 5.3, COLORS.gray600);
  doc.text('Benchmark PDF is used only as a reference for WBS / Gantt presentation depth. Detailed proposal timing remains relative Project Day D1–D1200 and is not represented as approved contract dates.', PAGE_MARGIN, h - 20, { width: innerW, lineBreak: false });
}

function drawDetailedPageHeader(pageNo) {
  const w = doc.page.width, innerW = w - PAGE_MARGIN * 2;
  font('ThaiBold', 9.5, COLORS.navyDark);
  doc.text('Integrated Master Gantt — โครงการพัฒนาแหล่งท่องเที่ยวห้วยขาแข้ง', PAGE_MARGIN, 13, { lineBreak: false });
  font('Thai', 5.6, COLORS.gray600);
  doc.text(`Baseline v0.7 · 1,200 Project Days · 497 Installments · ${masterSchedule.length.toLocaleString('en-US')} schedule rows · Detailed Integrated Master Schedule`, PAGE_MARGIN, 28.5, { lineBreak: false });
  font('Thai', 5.5, COLORS.gray600); doc.text(`Page ${pageNo}`, w - PAGE_MARGIN - 80, 16, { width: 80, align: 'right', lineBreak: false });

  const headerY = 42, headerH = 24;
  const cols = [['No.', 28, 'center'], ['WBS', 52, 'left'], ['Activity / Work Package', 302, 'left'], ['Dur.', 38, 'center'], ['Start', 38, 'center'], ['Finish', 38, 'center'], ['Predecessor', 82, 'left']];
  const leftW = cols.reduce((a, c) => a + c[1], 0), timelineX = PAGE_MARGIN + leftW, timelineW = innerW - leftW;
  let x = PAGE_MARGIN;
  for (const [label, cw, align] of cols) {
    rect(x, headerY, cw, headerH, COLORS.navy, COLORS.white, 0.4);
    textCell(label, x, headerY, cw, headerH, { size: 5.7, bold: true, color: COLORS.white, align });
    x += cw;
  }
  drawAxis(timelineX, headerY, timelineW, headerH);
  return { bodyY: headerY + headerH, cols, timelineX, timelineW, scale: projectScale(timelineW) };
}

function renderTaskBar(r, y, rowH, timelineX, timelineW, scale) {
  drawTimelineGrid(timelineX, y, timelineW, rowH);
  const critical = r.computed_critical === 'Y', provisional = r.scope_applicability === 'WHERE_APPLICABLE', control = r.scope_applicability === 'CONTROL_STREAM';
  const fill = critical ? COLORS.critical : provisional ? COLORS.amberPale : control ? '#7e9bb6' : COLORS.blue;
  const stroke = critical ? COLORS.criticalDark : provisional ? COLORS.amber : fill;
  if (r.milestone === 'Y') drawDiamond(barX(r.start_day, timelineX, scale), y + rowH / 2, 3.1, provisional ? COLORS.amber : fill, stroke);
  else rect(barX(r.start_day, timelineX, scale), y + (rowH - 6) / 2, barW(r.start_day, r.finish_day, scale), 6, fill, stroke, provisional ? 0.75 : 0.35);
}

function addDetailedPages() {
  const display = buildDisplayRows(masterSchedule), seq = new Map(masterSchedule.map((r, i) => [r.activity_id, i + 1]));
  const rowH = 12.7;
  let pageNo = 2, page, y, bottom;
  const beginPage = () => {
    doc.addPage(); page = drawDetailedPageHeader(pageNo++); y = page.bodyY; bottom = doc.page.height - 28;
  };
  beginPage();

  for (const item of display) {
    if (y + rowH > bottom) beginPage();
    const { cols, timelineX, timelineW, scale } = page;
    if (item.kind === 'plan' || item.kind === 'area') {
      const isPlan = item.kind === 'plan', bg = isPlan ? COLORS.blueSoft : COLORS.gray100;
      rect(PAGE_MARGIN, y, doc.page.width - PAGE_MARGIN * 2, rowH, bg, COLORS.gray250, 0.3);
      textCell(isPlan ? item.plan_no : '', PAGE_MARGIN, y, cols[0][1], rowH, { size: 5.7, bold: true, color: COLORS.navyDark, align: 'center' });
      const labelX = PAGE_MARGIN + cols[0][1], labelW = cols.slice(1).reduce((a, c) => a + c[1], 0) - cols.at(-1)[1];
      textCell(`${isPlan ? '' : '↳ '}${item.label}  (${item.count} rows)`, labelX, y, labelW, rowH, { size: isPlan ? 6.2 : 5.7, bold: true, color: isPlan ? COLORS.navyDark : COLORS.gray700 });
      drawTimelineGrid(timelineX, y, timelineW, rowH);
      rect(barX(item.start_day, timelineX, scale), y + 4.8, barW(item.start_day, item.finish_day, scale), isPlan ? 3.4 : 2.8, isPlan ? COLORS.navy : COLORS.gray400);
      y += rowH; continue;
    }

    const r = item.task, provisional = r.scope_applicability === 'WHERE_APPLICABLE', critical = r.computed_critical === 'Y';
    const bg = provisional ? '#fffaf0' : (seq.get(r.activity_id) % 2 ? COLORS.white : '#fbfcfd');
    rect(PAGE_MARGIN, y, doc.page.width - PAGE_MARGIN * 2, rowH, bg, COLORS.gray200, 0.22);
    let x = PAGE_MARGIN;
    const values = [seq.get(r.activity_id), r.wbs, r.activity_name, r.milestone === 'Y' ? 'MS' : `${r.duration_days}d`, `D${r.start_day}`, `D${r.finish_day}`, r.predecessor || '—'];
    for (let i = 0; i < cols.length; i++) {
      const [, cw, align] = cols[i];
      const color = i === 2 && critical ? COLORS.criticalDark : i === 2 && provisional ? '#8a5a10' : COLORS.gray900;
      textCell(values[i], x, y, cw, rowH, { size: i === 2 ? 5.8 : 5.25, bold: i === 2 && (critical || r.milestone === 'Y'), color, align });
      line(x + cw, y, x + cw, y + rowH, COLORS.gray200, 0.22); x += cw;
    }
    renderTaskBar(r, y, rowH, timelineX, timelineW, scale);
    y += rowH;
  }
}

function addPageFooters() {
  const range = doc.bufferedPageRange();
  for (let i = 0; i < range.count; i++) {
    doc.switchToPage(range.start + i);
    const w = doc.page.width, h = doc.page.height;
    line(PAGE_MARGIN, h - 25, w - PAGE_MARGIN, h - 25, COLORS.gray250, 0.35);
    font('Thai', 4.9, COLORS.gray600);
    const left = i === 0 ? 'Proposal Integrated Master Schedule · Baseline v0.7' : 'Relative Project Days · timing/source provenance retained · WHERE_APPLICABLE = confirm against IFC / BOQ / equipment schedule';
    doc.text(left, PAGE_MARGIN, h - 19, { width: w - PAGE_MARGIN * 2 - 120, lineBreak: false });
    doc.text(`${i + 1} / ${range.count}`, w - PAGE_MARGIN - 100, h - 19, { width: 100, align: 'right', lineBreak: false });
  }
}

addSummaryPage();
addDetailedPages();
addPageFooters();
doc.end();

await new Promise((resolve, reject) => { stream.on('finish', resolve); stream.on('error', reject); });
console.log(`Generated PDF: ${OUTPUT}`);
console.log(`Rows: ${masterSchedule.length}; milestones: ${scheduleStats.milestones}; validation: ${validation.status}`);
