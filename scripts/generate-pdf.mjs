import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
import PDFDocument from 'pdfkit';
import { masterSchedule, scheduleStats, validation } from '../src/build-schedule.js';

const OUTPUT = 'data/huai-kha-khaeng-integrated-master-gantt-v0.7.pdf';
const PAGE_MARGIN = 24;
const ROW_H = 25;
const GROUP_PLAN_H = 23;
const GROUP_AREA_H = 21;
const COLORS = {
  navy: '#173a63', navyDark: '#102f53', blue: '#3e82b8', blueSoft: '#dbe7f2',
  critical: '#c43d3d', criticalDark: '#9f2b2b', criticalPale: '#fff1f1',
  amber: '#b7791f', amberPale: '#fff7e6', green: '#26704e',
  gray950: '#111827', gray900: '#17212f', gray800: '#344054', gray700: '#475467',
  gray600: '#667085', gray500: '#7b8794', gray400: '#98a2b3', gray300: '#cbd5e1',
  gray250: '#d8dee8', gray200: '#e5eaf0', gray150: '#edf0f4', gray100: '#f5f7fa', white: '#ffffff'
};

const PLAN_NAMES = {
  '01': 'แผนการดำเนินการโครงการ / Physical Delivery',
  '02': 'แผนงบประมาณ / Payment & Commercial',
  '03': 'แผนการจัดการสถานที่ / Site Management',
  '04': 'แผนอัตรากำลัง / Workforce',
  '05': 'แผนการใช้เครื่องจักร / Plant',
  '06': 'แผนการจัดหาวัสดุ / Procurement',
  '07': 'แผนควบคุมคุณภาพ / QA/QC',
  '08': 'แผนความปลอดภัย อาชีวอนามัย / HSE',
  '09': 'แผนจราจร / Traffic',
  '10': 'แผนสิ่งแวดล้อม / Environment',
  '11': 'แผนบริหารเอกสารอัตโนมัติ / CDE-EDMS',
  '12': 'แผนติดตามความก้าวหน้า / Project Controls',
  '13': 'แผน BIM / Digital Twin',
  '14': 'แผน Application / AI',
  '15': 'แผน Carbon Footprint',
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

function resolveFont(queries) {
  for (const query of queries) {
    try {
      const out = execFileSync('fc-match', ['-f', '%{file}\n', query], { encoding: 'utf8' }).trim();
      const file = out.split(/\r?\n/).find(Boolean);
      if (file && fs.existsSync(file)) return file;
    } catch {}
  }
  return null;
}

const regularFont = resolveFont([
  'Noto Sans Thai:style=Regular',
  'Noto Sans Thai',
  'Garuda:style=Regular',
  'Garuda',
  'Loma'
]);
const boldFont = resolveFont([
  'Noto Sans Thai:style=Bold',
  'Noto Sans Thai:style=SemiBold',
  'Garuda:style=Bold',
  'Garuda'
]) || regularFont;

if (!regularFont) throw new Error('No Thai-capable font found. Install fonts-noto-core or fonts-thai-tlwg.');
console.log(`PDF Thai regular font: ${regularFont}`);
console.log(`PDF Thai bold font: ${boldFont}`);

fs.mkdirSync('data', { recursive: true });
const doc = new PDFDocument({
  size: 'A3',
  layout: 'landscape',
  autoFirstPage: false,
  bufferPages: false,
  compress: true,
  margins: { top: PAGE_MARGIN, bottom: PAGE_MARGIN, left: PAGE_MARGIN, right: PAGE_MARGIN },
  info: {
    Title: 'Integrated Master Gantt — โครงการพัฒนาแหล่งท่องเที่ยวห้วยขาแข้ง',
    Subject: 'Proposal Integrated Master Schedule Baseline v0.7 — readable A3 issue',
    Author: 'Integrated project schedule generator',
    Keywords: 'Huai Kha Khaeng, Gantt, CPM, construction, schedule, proposal'
  }
});
const stream = fs.createWriteStream(OUTPUT);
doc.pipe(stream);
doc.registerFont('Thai', regularFont);
doc.registerFont('ThaiBold', boldFont);

const segmenter = typeof Intl?.Segmenter === 'function'
  ? new Intl.Segmenter('th', { granularity: 'grapheme' })
  : null;

function graphemes(value) {
  const text = String(value ?? '').replace(/\s+/g, ' ').trim();
  if (!segmenter) return Array.from(text);
  return [...segmenter.segment(text)].map(part => part.segment);
}

function useFont(name = 'Thai', size = 8, color = COLORS.gray900) {
  doc.font(name).fontSize(size).fillColor(color);
}

function line(x1, y1, x2, y2, color = COLORS.gray250, width = 0.35) {
  doc.save().strokeColor(color).lineWidth(width).moveTo(x1, y1).lineTo(x2, y2).stroke().restore();
}

function rect(x, y, w, h, fillColor = null, strokeColor = null, width = 0.35) {
  doc.save();
  if (fillColor) doc.fillColor(fillColor).rect(x, y, w, h).fill();
  if (strokeColor) doc.strokeColor(strokeColor).lineWidth(width).rect(x, y, w, h).stroke();
  doc.restore();
}

function fitText(text, width, size = 8, fontName = 'Thai') {
  const parts = graphemes(text);
  const value = parts.join('');
  doc.font(fontName).fontSize(size);
  if (doc.widthOfString(value) <= width) return value;
  const suffix = '…';
  let lo = 0;
  let hi = parts.length;
  while (lo < hi) {
    const mid = Math.ceil((lo + hi) / 2);
    const candidate = parts.slice(0, mid).join('') + suffix;
    if (doc.widthOfString(candidate) <= width) lo = mid;
    else hi = mid - 1;
  }
  return parts.slice(0, Math.max(0, lo)).join('') + suffix;
}

function textCell(text, x, y, w, h, {
  size = 7.6, bold = false, color = COLORS.gray900, align = 'left', pad = 4
} = {}) {
  const name = bold ? 'ThaiBold' : 'Thai';
  const innerW = Math.max(1, w - pad * 2);
  const shown = fitText(text, innerW, size, name);
  useFont(name, size, color);
  const yy = y + Math.max(1.5, (h - size * 1.45) / 2);
  doc.text(shown, x + pad, yy, { width: innerW, lineBreak: false, align });
}

function textLine(text, x, y, w, { size = 8, bold = false, color = COLORS.gray900, align = 'left' } = {}) {
  const name = bold ? 'ThaiBold' : 'Thai';
  const shown = fitText(text, w, size, name);
  useFont(name, size, color);
  doc.text(shown, x, y, { width: w, lineBreak: false, align });
}

function projectScale(timelineW) { return timelineW / 1200; }
function barX(day, timelineX, scale) { return timelineX + (day - 1) * scale; }
function barW(start, finish, scale) { return Math.max(1.5, (finish - start + 1) * scale); }

function drawDiamond(cx, cy, radius, fillColor, strokeColor = fillColor) {
  doc.save().translate(cx, cy).rotate(45).fillColor(fillColor).strokeColor(strokeColor).lineWidth(0.7)
    .rect(-radius, -radius, radius * 2, radius * 2).fillAndStroke().restore();
}

function drawTimelineGrid(timelineX, y, timelineW, h) {
  const scale = projectScale(timelineW);
  for (let day = 1; day <= 1201; day += 30) {
    const x = timelineX + (day - 1) * scale;
    const major = (day - 1) % 120 === 0;
    line(x, y, x, y + h, major ? COLORS.gray300 : COLORS.gray150, major ? 0.65 : 0.28);
  }
}

function drawAxis(timelineX, y, timelineW, h) {
  rect(timelineX, y, timelineW, h, COLORS.navy, COLORS.navyDark, 0.5);
  const scale = projectScale(timelineW);
  for (let day = 1; day <= 1201; day += 30) {
    const x = timelineX + (day - 1) * scale;
    const major = (day - 1) % 120 === 0;
    line(x, y, x, y + h, major ? '#b5c9dc' : '#7892ab', major ? 0.65 : 0.25);
  }
  for (let day = 1; day <= 1081; day += 120) {
    const x = timelineX + (day - 1) * scale;
    const cellW = 120 * scale;
    textCell(`D${day}`, x, y, cellW, h, { size: 6.4, bold: true, color: COLORS.white, align: 'center', pad: 1 });
  }
  textLine('D1200', timelineX + timelineW - 39, y + 9, 38, { size: 6.2, bold: true, color: COLORS.white, align: 'right' });
  return scale;
}

function spanOf(rows) {
  if (!rows.length) return [1, 1];
  return [Math.min(...rows.map(r => r.start_day)), Math.max(...rows.map(r => r.finish_day))];
}

function groupSchedule(rows) {
  const plans = new Map();
  const areas = new Map();
  for (const r of rows) {
    if (!plans.has(r.plan_no)) plans.set(r.plan_no, []);
    plans.get(r.plan_no).push(r);
    const areaName = r.building_area || 'Project-wide';
    const key = `${r.plan_no}|${areaName}`;
    if (!areas.has(key)) areas.set(key, []);
    areas.get(key).push(r);
  }
  return { plans, areas };
}

function buildDisplayRows(rows) {
  const { plans, areas } = groupSchedule(rows);
  const display = [];
  let lastPlan = null;
  let lastArea = null;
  for (const r of rows) {
    if (r.plan_no !== lastPlan) {
      const members = plans.get(r.plan_no) || [r];
      const [s, f] = spanOf(members);
      display.push({
        kind: 'plan',
        plan_no: r.plan_no,
        label: `Plan ${r.plan_no} — ${PLAN_NAMES[r.plan_no] || ''}`,
        count: members.length,
        start_day: s,
        finish_day: f
      });
      lastPlan = r.plan_no;
      lastArea = null;
    }
    const areaName = r.building_area || 'Project-wide';
    if (areaName !== lastArea) {
      const members = areas.get(`${r.plan_no}|${areaName}`) || [r];
      const [s, f] = spanOf(members);
      display.push({ kind: 'area', label: areaName, count: members.length, start_day: s, finish_day: f });
      lastArea = areaName;
    }
    display.push({ kind: 'task', task: r });
  }
  return display;
}

function predecessorText(r) {
  const links = r.predecessors || [];
  if (!links.length) return '—';
  return links.map(p => `${p.id}${p.relationship && p.relationship !== 'FS' ? `(${p.relationship})` : ''}${p.lagDays ? `+${p.lagDays}` : ''}`).join('; ');
}

function drawLegend(x, y) {
  const items = [
    ['normal', 'Activity'],
    ['critical', 'Zero-float'],
    ['milestone', 'Milestone'],
    ['provisional', 'Scope to verify']
  ];
  let cx = x;
  for (const [kind, label] of items) {
    if (kind === 'milestone') drawDiamond(cx + 4, y + 4, 3.2, COLORS.navy);
    else {
      const fill = kind === 'critical' ? COLORS.critical : kind === 'provisional' ? COLORS.amberPale : COLORS.blue;
      const stroke = kind === 'provisional' ? COLORS.amber : fill;
      rect(cx, y + 1, 18, 7, fill, stroke, 0.6);
    }
    textLine(label, cx + 23, y, 85, { size: 6.0, color: COLORS.gray600 });
    cx += 100;
  }
}

function drawPageFooter(pageNo) {
  const w = doc.page.width;
  const h = doc.page.height;
  const y = h - PAGE_MARGIN + 3;
  drawLegend(PAGE_MARGIN, y - 2);
  textLine(`Baseline v0.7 · A3 Landscape · Page ${pageNo}`, w - PAGE_MARGIN - 190, y, 190, {
    size: 6.1, color: COLORS.gray600, align: 'right'
  });
}

function drawSummaryPage() {
  doc.addPage();
  const pageNo = 1;
  const w = doc.page.width;
  const h = doc.page.height;
  const innerW = w - PAGE_MARGIN * 2;

  rect(0, 0, w, 66, COLORS.navyDark);
  textLine('แผนงานก่อสร้างห้วยขาแข้ง', PAGE_MARGIN, 16, innerW * 0.72, { size: 17, bold: true, color: COLORS.white });
  textLine('PROPOSAL INTEGRATED MASTER SCHEDULE · BASELINE v0.7', PAGE_MARGIN, 42, innerW * 0.72, { size: 9.2, color: '#d9e5f0' });
  textLine('A3 readable issue · Project Day D1–D1200', w - PAGE_MARGIN - 300, 23, 300, { size: 8.0, bold: true, color: COLORS.white, align: 'right' });

  const metricY = 79;
  const metricGap = 9;
  const metricW = (innerW - metricGap * 4) / 5;
  const metrics = [
    ['Project duration', '1,200 days'],
    ['Installments', '497'],
    ['Activities', String(masterSchedule.length)],
    ['Milestones', String(scheduleStats.milestones)],
    ['Zero-float', String(scheduleStats.computedCritical)]
  ];
  metrics.forEach(([label, value], i) => {
    const x = PAGE_MARGIN + i * (metricW + metricGap);
    rect(x, metricY, metricW, 50, COLORS.white, COLORS.gray250, 0.6);
    textLine(label, x + 8, metricY + 8, metricW - 16, { size: 6.6, color: COLORS.gray600 });
    textLine(value, x + 8, metricY + 23, metricW - 16, { size: 13, bold: true, color: COLORS.navyDark });
  });

  textLine('Project Control Windows / Critical Narrative', PAGE_MARGIN, 145, innerW, { size: 9.2, bold: true, color: COLORS.navyDark });
  const tableX = PAGE_MARGIN;
  const labelW = 390;
  const daysW = 78;
  const timelineX = tableX + labelW + daysW;
  const timelineW = innerW - labelW - daysW;
  const headY = 162;
  const headH = 28;
  rect(tableX, headY, labelW, headH, COLORS.navy, COLORS.navyDark, 0.5);
  rect(tableX + labelW, headY, daysW, headH, COLORS.navy, COLORS.navyDark, 0.5);
  textCell('Control window / scope', tableX, headY, labelW, headH, { size: 7.2, bold: true, color: COLORS.white });
  textCell('Project Days', tableX + labelW, headY, daysW, headH, { size: 7.0, bold: true, color: COLORS.white, align: 'center' });
  const scale = drawAxis(timelineX, headY, timelineW, headH);
  let y = headY + headH;
  CP_WINDOWS.forEach(([code, label, s, f], i) => {
    const rh = 25;
    const fill = i % 2 ? COLORS.gray100 : COLORS.white;
    rect(tableX, y, innerW, rh, fill, COLORS.gray250, 0.35);
    textCell(`${code}  ${label}`, tableX, y, labelW, rh, { size: 7.2, bold: true });
    textCell(`D${s}–D${f}`, tableX + labelW, y, daysW, rh, { size: 7.0, color: COLORS.gray700, align: 'center' });
    drawTimelineGrid(timelineX, y, timelineW, rh);
    rect(barX(s, timelineX, scale), y + 8, barW(s, f, scale), 9, i >= 6 ? COLORS.critical : COLORS.blue);
    y += rh;
  });

  y += 15;
  textLine('Plan 01–16 Summary', PAGE_MARGIN, y, innerW, { size: 9.2, bold: true, color: COLORS.navyDark });
  y += 17;
  const pLabelW = 430;
  const countW = 58;
  const pDaysW = 88;
  const pTimelineX = PAGE_MARGIN + pLabelW + countW + pDaysW;
  const pTimelineW = innerW - pLabelW - countW - pDaysW;
  const ph = 24;
  rect(PAGE_MARGIN, y, pLabelW, ph, COLORS.navy, COLORS.navyDark, 0.5);
  rect(PAGE_MARGIN + pLabelW, y, countW, ph, COLORS.navy, COLORS.navyDark, 0.5);
  rect(PAGE_MARGIN + pLabelW + countW, y, pDaysW, ph, COLORS.navy, COLORS.navyDark, 0.5);
  textCell('Plan / workstream', PAGE_MARGIN, y, pLabelW, ph, { size: 6.9, bold: true, color: COLORS.white });
  textCell('Rows', PAGE_MARGIN + pLabelW, y, countW, ph, { size: 6.9, bold: true, color: COLORS.white, align: 'center' });
  textCell('Span', PAGE_MARGIN + pLabelW + countW, y, pDaysW, ph, { size: 6.9, bold: true, color: COLORS.white, align: 'center' });
  const pScale = drawAxis(pTimelineX, y, pTimelineW, ph);
  y += ph;
  const byPlan = new Map();
  for (const r of masterSchedule) {
    if (!byPlan.has(r.plan_no)) byPlan.set(r.plan_no, []);
    byPlan.get(r.plan_no).push(r);
  }
  for (const plan of [...byPlan.keys()].sort((a, b) => Number(a) - Number(b))) {
    const rows = byPlan.get(plan);
    const [s, f] = spanOf(rows);
    const rh = 20;
    rect(PAGE_MARGIN, y, innerW, rh, Number(plan) % 2 ? COLORS.white : COLORS.gray100, COLORS.gray250, 0.3);
    textCell(`Plan ${plan} — ${PLAN_NAMES[plan] || ''}`, PAGE_MARGIN, y, pLabelW, rh, { size: 6.7, bold: plan === '01' });
    textCell(String(rows.length), PAGE_MARGIN + pLabelW, y, countW, rh, { size: 6.6, align: 'center' });
    textCell(`D${s}–D${f}`, PAGE_MARGIN + pLabelW + countW, y, pDaysW, rh, { size: 6.5, align: 'center', color: COLORS.gray700 });
    drawTimelineGrid(pTimelineX, y, pTimelineW, rh);
    rect(barX(s, pTimelineX, pScale), y + 6.5, barW(s, f, pScale), 7, plan === '01' ? COLORS.navy : COLORS.blueSoft, plan === '01' ? COLORS.navy : COLORS.blue, 0.5);
    y += rh;
  }

  textLine(`Validation: ${validation.status} · Physical network Plan 01 complete NTP→D1200`, PAGE_MARGIN, h - PAGE_MARGIN - 29, innerW, {
    size: 6.8, bold: true, color: validation.status === 'PASS' ? COLORS.green : COLORS.critical
  });
  drawPageFooter(pageNo);
}

function detailGeometry() {
  const w = doc.page.width;
  const h = doc.page.height;
  const innerW = w - PAGE_MARGIN * 2;
  const tableW = 646;
  const timelineX = PAGE_MARGIN + tableW;
  const timelineW = innerW - tableW;
  const columns = [
    ['WBS', 62],
    ['Activity / ID / Area', 322],
    ['Dur.', 42],
    ['Start', 50],
    ['Finish', 50],
    ['Predecessor', 120]
  ];
  return { w, h, innerW, tableW, timelineX, timelineW, columns };
}

function drawDetailPageHeader(pageNo, context = '') {
  doc.addPage();
  const { w, h, innerW, tableW, timelineX, timelineW, columns } = detailGeometry();
  textLine('Integrated Master Schedule — ห้วยขาแข้ง', PAGE_MARGIN, 19, 520, { size: 12.2, bold: true, color: COLORS.navyDark });
  textLine(`1,200 Project Days · 497 Installments · ${masterSchedule.length} activities · ${scheduleStats.computedCritical} zero-float`, PAGE_MARGIN, 39, 640, { size: 7.0, color: COLORS.gray600 });
  if (context) textLine(context, 675, 39, w - PAGE_MARGIN - 675, { size: 6.8, color: COLORS.gray600, align: 'right' });
  textLine(`BASELINE v0.7 · PAGE ${pageNo}`, w - PAGE_MARGIN - 230, 18, 230, { size: 8.0, bold: true, color: COLORS.navyDark, align: 'right' });

  const headY = 61;
  const headH = 30;
  let x = PAGE_MARGIN;
  for (const [label, cw] of columns) {
    rect(x, headY, cw, headH, COLORS.navy, COLORS.navyDark, 0.5);
    textCell(label, x, headY, cw, headH, { size: 7.0, bold: true, color: COLORS.white, align: label === 'Activity / ID / Area' || label === 'Predecessor' ? 'left' : 'center' });
    x += cw;
  }
  drawAxis(timelineX, headY, timelineW, headH);
  drawPageFooter(pageNo);
  return { bodyTop: headY + headH, bodyBottom: h - PAGE_MARGIN - 26, ...detailGeometry() };
}

function drawGroupRow(row, y, geom) {
  const { innerW, tableW, timelineX, timelineW } = geom;
  const isPlan = row.kind === 'plan';
  const rh = isPlan ? GROUP_PLAN_H : GROUP_AREA_H;
  const fill = isPlan ? '#eaf1f7' : '#f7f9fb';
  const color = isPlan ? COLORS.navyDark : COLORS.gray800;
  rect(PAGE_MARGIN, y, innerW, rh, fill, isPlan ? '#c7d5e3' : COLORS.gray250, 0.4);
  textCell(row.label, PAGE_MARGIN, y, tableW - 106, rh, { size: isPlan ? 8.5 : 7.8, bold: true, color, pad: isPlan ? 7 : 14 });
  textCell(`${row.count} rows`, PAGE_MARGIN + tableW - 106, y, 106, rh, { size: 6.4, color: COLORS.gray600, align: 'right', pad: 7 });
  drawTimelineGrid(timelineX, y, timelineW, rh);
  const scale = projectScale(timelineW);
  rect(barX(row.start_day, timelineX, scale), y + (rh - 6) / 2, barW(row.start_day, row.finish_day, scale), 6, isPlan ? COLORS.navy : '#91a9bd');
  return rh;
}

function drawTaskRow(r, y, geom, rowIndex) {
  const { tableW, timelineX, timelineW, columns } = geom;
  const isProv = r.scope_applicability === 'WHERE_APPLICABLE';
  const isCritical = r.computed_critical === 'Y';
  const fill = isProv ? COLORS.amberPale : rowIndex % 2 ? COLORS.white : '#fcfdfe';
  rect(PAGE_MARGIN, y, tableW + timelineW, ROW_H, fill, COLORS.gray150, 0.28);
  if (isCritical) rect(PAGE_MARGIN, y, 3, ROW_H, COLORS.critical);

  let x = PAGE_MARGIN;
  textCell(r.wbs, x, y, columns[0][1], ROW_H, { size: 7.1, bold: isCritical, color: COLORS.gray800, align: 'center', pad: 2 });
  x += columns[0][1];

  const activityW = columns[1][1];
  const title = fitText(r.activity_name, activityW - 10, 8.0, isCritical ? 'ThaiBold' : 'Thai');
  useFont(isCritical ? 'ThaiBold' : 'Thai', 8.0, isCritical ? COLORS.criticalDark : COLORS.gray950);
  doc.text(title, x + 5, y + 3.4, { width: activityW - 10, lineBreak: false });
  const sub = `${r.activity_id} · ${r.building_area || 'Project-wide'}${isProv ? ' · VERIFY SCOPE' : ''}`;
  useFont('Thai', 5.5, isProv ? COLORS.amber : COLORS.gray500);
  doc.text(fitText(sub, activityW - 10, 5.5, 'Thai'), x + 5, y + 14.4, { width: activityW - 10, lineBreak: false });
  x += activityW;

  textCell(r.milestone === 'Y' ? 'MS' : `${r.duration_days}d`, x, y, columns[2][1], ROW_H, { size: 7.0, bold: r.milestone === 'Y', align: 'center', pad: 1 });
  x += columns[2][1];
  textCell(`D${r.start_day}`, x, y, columns[3][1], ROW_H, { size: 6.8, align: 'center', pad: 1 });
  x += columns[3][1];
  textCell(`D${r.finish_day}`, x, y, columns[4][1], ROW_H, { size: 6.8, align: 'center', pad: 1 });
  x += columns[4][1];
  textCell(predecessorText(r), x, y, columns[5][1], ROW_H, { size: 5.8, color: COLORS.gray700, pad: 3 });

  drawTimelineGrid(timelineX, y, timelineW, ROW_H);
  const scale = projectScale(timelineW);
  const midY = y + ROW_H / 2;
  if (r.milestone === 'Y') {
    const fillColor = isCritical ? COLORS.critical : isProv ? COLORS.amber : COLORS.navy;
    drawDiamond(barX(r.start_day, timelineX, scale), midY, 4.0, fillColor);
  } else {
    const fillColor = isCritical ? COLORS.critical : isProv ? '#ffe4ad' : r.basis_type === 'SOURCE' ? COLORS.blue : '#6f9abd';
    const strokeColor = isCritical ? COLORS.criticalDark : isProv ? COLORS.amber : '#4f7898';
    rect(barX(r.start_day, timelineX, scale), y + 8, barW(r.start_day, r.finish_day, scale), 9, fillColor, strokeColor, isProv ? 0.8 : 0.4);
  }

  return ROW_H;
}

function rowHeight(row) {
  return row.kind === 'plan' ? GROUP_PLAN_H : row.kind === 'area' ? GROUP_AREA_H : ROW_H;
}

function minimumBlockHeight(display, index) {
  const row = display[index];
  let h = rowHeight(row);
  if (row.kind === 'plan') {
    if (display[index + 1]?.kind === 'area') h += rowHeight(display[index + 1]);
    const taskIndex = display[index + 1]?.kind === 'area' ? index + 2 : index + 1;
    if (display[taskIndex]?.kind === 'task') h += ROW_H;
  } else if (row.kind === 'area' && display[index + 1]?.kind === 'task') {
    h += ROW_H;
  }
  return h;
}

function drawDetailPages() {
  const display = buildDisplayRows(masterSchedule);
  let pageNo = 2;
  let currentPlan = '';
  let currentArea = '';
  let geom = drawDetailPageHeader(pageNo);
  let y = geom.bodyTop;
  let taskStripe = 0;

  for (let i = 0; i < display.length; i++) {
    const row = display[i];
    const minBlock = minimumBlockHeight(display, i);
    if (y > geom.bodyTop && y + minBlock > geom.bodyBottom) {
      pageNo += 1;
      const context = [currentPlan, currentArea].filter(Boolean).join(' · ');
      geom = drawDetailPageHeader(pageNo, context ? `ต่อ / Continued: ${context}` : '');
      y = geom.bodyTop;
      taskStripe = 0;
    }

    if (row.kind === 'plan') {
      currentPlan = row.label;
      currentArea = '';
      y += drawGroupRow(row, y, geom);
    } else if (row.kind === 'area') {
      currentArea = row.label;
      y += drawGroupRow(row, y, geom);
    } else {
      y += drawTaskRow(row.task, y, geom, taskStripe++);
    }
  }
  return pageNo;
}

drawSummaryPage();
const finalPageNo = drawDetailPages();
doc.end();

await new Promise((resolve, reject) => {
  stream.on('finish', resolve);
  stream.on('error', reject);
});

const size = fs.statSync(OUTPUT).size;
console.log(`Generated readable A3 Gantt PDF: ${OUTPUT}`);
console.log(`PDF pages generated deterministically: ${finalPageNo}`);
console.log(`PDF size: ${size} bytes`);
