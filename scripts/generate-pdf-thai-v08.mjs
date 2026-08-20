import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
import PDFDocument from 'pdfkit';
import { masterSchedule, scheduleStats, validation } from '../src/build-schedule.js';

const OUTPUT = 'data/huai-kha-khaeng-integrated-master-gantt-v0.8-thai.pdf';
const GENERATION_REPORT = 'data/pdf-generation-report-v08.json';
const PAGE_MARGIN = 24;
const ROW_H = 28;
const GROUP_PLAN_H = 23;
const GROUP_AREA_H = 21;
const GROUP_CATEGORY_H = 19;

const COLORS = {
  navy: '#173a63', navyDark: '#102f53', blue: '#3e82b8', blueSoft: '#dbe7f2',
  critical: '#c43d3d', criticalDark: '#9f2b2b', criticalPale: '#fff1f1',
  amber: '#b7791f', amberPale: '#fff7e6', green: '#26704e',
  gray950: '#111827', gray900: '#17212f', gray800: '#344054', gray700: '#475467',
  gray600: '#667085', gray500: '#7b8794', gray400: '#98a2b3', gray300: '#cbd5e1',
  gray250: '#d8dee8', gray200: '#e5eaf0', gray150: '#edf0f4', gray100: '#f5f7fa',
  categoryFill: '#eef3f8', categoryStroke: '#d1dbe6', white: '#ffffff'
};

const PLAN_NAMES = {
  '01': 'แผนการดำเนินการโครงการ',
  '02': 'แผนงบประมาณก่อสร้าง',
  '03': 'แผนการจัดการสถานที่ก่อสร้าง',
  '04': 'แผนอัตรากำลัง',
  '05': 'แผนการใช้เครื่องจักรกล',
  '06': 'แผนการจัดหาวัสดุ',
  '07': 'แผนควบคุมคุณภาพ',
  '08': 'แผนความปลอดภัยและอาชีวอนามัย',
  '09': 'แผนจราจร',
  '10': 'แผนลดและป้องกันผลกระทบสิ่งแวดล้อม',
  '11': 'แผนบริหารจัดการเอกสารโครงการ',
  '12': 'แผนบริหารและติดตามความก้าวหน้า',
  '13': 'แผนการใช้แบบจำลองข้อมูลอาคาร',
  '14': 'แผนการใช้โปรแกรมประยุกต์และปัญญาประดิษฐ์',
  '15': 'แผนประเมินคาร์บอนฟุตพริ้นท์',
  '16': 'แผนป้องกันผลกระทบต่อแหล่งมรดกโลก'
};

const CP_WINDOWS = [
  ['CP-01', 'งานสำรวจ หมุดอ้างอิง และการอนุมัติเริ่มต้น', 1, 90],
  ['CP-02', 'ระบบชั่วคราวและความพร้อมเปิดพื้นที่ก่อสร้าง', 31, 180],
  ['CP-03', 'งานออกแบบ การอนุมัติ และการจัดหาวัสดุระยะยาว', 31, 270],
  ['CP-04', 'งานฐานรากและโครงสร้างหลัก — พื้นที่ A', 181, 600],
  ['CP-05', 'งานสถาปัตย์และระบบประกอบอาคาร — พื้นที่ A', 421, 840],
  ['CP-06', 'พื้นที่ B/C/D และระบบภายนอก', 301, 960],
  ['CP-07', 'งานภูมิทัศน์ เก็บรายละเอียด และบูรณาการระบบ', 841, 1080],
  ['CP-08', 'งานทดสอบระบบ แบบก่อสร้างจริง คู่มือ และส่งมอบ', 1081, 1200]
];

const CATEGORY_ORDER = [
  'งานอำนวยการและเตรียมการ', 'จุดควบคุมกรอบเวลาหลัก', 'งานบริหารและจุดควบคุม',
  'งานสำรวจและปักผัง', 'งานโครงสร้าง', 'งานโครงสร้างและงานโยธา', 'สถาปัตย์',
  'งานระบบประกอบอาคาร', 'งานระบบไฟฟ้าและสื่อสาร', 'งานระบบสุขาภิบาลและป้องกันอัคคีภัย',
  'งานระบบปรับอากาศและระบายอากาศ', 'งานระบบพิเศษ', 'งานระบบครัว', 'งานระบบผลิตน้ำ',
  'งานครุภัณฑ์', 'งานตกแต่งภายในและนิทรรศการ', 'งานภูมิทัศน์และงานภายนอก',
  'งานภูมิทัศน์', 'งานระบบระบายน้ำ', 'งานระบบภายนอก', 'งานสิ่งแวดล้อมและฟื้นฟู',
  'งานทดสอบและเดินระบบ', 'งานตรวจสอบและแก้ไขข้อบกพร่อง', 'งานแบบก่อสร้างจริงและส่งมอบ',
  'งานคู่มือและการฝึกอบรม', 'งานทะเบียนทรัพย์สิน', 'งานส่งมอบ', 'งานปิดโครงการและส่งมอบ',
  'งานความปลอดภัยและอาชีวอนามัย', 'งานโครงสร้างทางน้ำและโยธา', 'งานฟื้นฟูพื้นที่',
  'งานไฟฟ้าและระบบควบคุม', 'งานยกและเคลื่อนย้าย', 'งานระบบกระบวนการ',
  'งานสำรวจและสิ่งแวดล้อม', 'งานสิ่งแวดล้อมและความปลอดภัย'
];
const CATEGORY_RANK = new Map(CATEGORY_ORDER.map((name, index) => [name, index]));

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
  'Garuda:style=Regular', 'Garuda', 'Loma', 'Noto Sans Thai:style=Regular', 'Noto Sans Thai'
]);
const boldFont = resolveFont([
  'Garuda:style=Bold', 'Garuda', 'Loma:style=Bold', 'Noto Sans Thai:style=Bold',
  'Noto Sans Thai:style=SemiBold'
]) || regularFont;

if (!regularFont) throw new Error('ไม่พบฟอนต์ที่รองรับภาษาไทย โปรดติดตั้ง fonts-thai-tlwg หรือ fonts-noto-core');
console.log(`PDF bilingual Thai/Latin regular font: ${regularFont}`);
console.log(`PDF bilingual Thai/Latin bold font: ${boldFont}`);

fs.mkdirSync('data', { recursive: true });
const doc = new PDFDocument({
  size: 'A3',
  layout: 'landscape',
  autoFirstPage: false,
  bufferPages: false,
  compress: true,
  margins: { top: PAGE_MARGIN, bottom: PAGE_MARGIN, left: PAGE_MARGIN, right: PAGE_MARGIN },
  info: {
    Title: 'แผนงานก่อสร้างห้วยขาแข้ง — แผนงานหลักแบบบูรณาการ',
    Subject: 'แผนงานหลักแบบบูรณาการ Baseline v0.8 — ฉบับตรวจทาน A3',
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
const truncations = [];

function cleanText(value) {
  return String(value ?? '').replace(/\s+/g, ' ').trim();
}

function graphemes(value) {
  const text = cleanText(value);
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

function widthOf(parts, size, fontName) {
  doc.font(fontName).fontSize(size);
  return doc.widthOfString(Array.isArray(parts) ? parts.join('') : String(parts));
}

function maxPrefix(parts, width, size, fontName, suffix = '') {
  let lo = 0;
  let hi = parts.length;
  while (lo < hi) {
    const mid = Math.ceil((lo + hi) / 2);
    const candidate = parts.slice(0, mid).join('') + suffix;
    if (widthOf(candidate, size, fontName) <= width) lo = mid;
    else hi = mid - 1;
  }
  return lo;
}

function fitText(text, width, size = 8, fontName = 'Thai', meta = null) {
  const parts = graphemes(text);
  const value = parts.join('');
  if (widthOf(value, size, fontName) <= width) return value;
  const suffix = '…';
  const count = maxPrefix(parts, width, size, fontName, suffix);
  const shown = parts.slice(0, Math.max(0, count)).join('') + suffix;
  if (meta) truncations.push({ ...meta, original: value, shown, mode: 'single-line' });
  return shown;
}

function findPreferredBreak(parts, count) {
  const lowerBound = Math.max(1, count - 24);
  for (let i = count; i >= lowerBound; i--) {
    const token = parts[i - 1];
    if (/\s|[–—/:,()]/.test(token)) return i;
  }
  return count;
}

function wrapTextTwoLines(text, width, size = 7.5, fontName = 'Thai', meta = null) {
  const parts = graphemes(text);
  const value = parts.join('');
  if (widthOf(value, size, fontName) <= width) return [value];

  let firstCount = maxPrefix(parts, width, size, fontName);
  firstCount = findPreferredBreak(parts, firstCount);
  const first = parts.slice(0, firstCount).join('').trim();
  const remaining = parts.slice(firstCount).join('').trim();
  const remainingParts = graphemes(remaining);
  if (widthOf(remaining, size, fontName) <= width) return [first, remaining];

  const suffix = '…';
  const secondCount = maxPrefix(remainingParts, width, size, fontName, suffix);
  const second = remainingParts.slice(0, Math.max(0, secondCount)).join('').trim() + suffix;
  if (meta) truncations.push({ ...meta, original: value, shown: `${first}\n${second}`, mode: 'two-line' });
  return [first, second];
}

function textCell(text, x, y, w, h, {
  size = 7.6, bold = false, color = COLORS.gray900, align = 'left', pad = 4, meta = null
} = {}) {
  const name = bold ? 'ThaiBold' : 'Thai';
  const innerW = Math.max(1, w - pad * 2);
  const shown = fitText(text, innerW, size, name, meta);
  useFont(name, size, color);
  const yy = y + Math.max(1.5, (h - size * 1.45) / 2);
  doc.text(shown, x + pad, yy, { width: innerW, lineBreak: false, align });
}

function textLine(text, x, y, w, {
  size = 8, bold = false, color = COLORS.gray900, align = 'left', meta = null
} = {}) {
  const name = bold ? 'ThaiBold' : 'Thai';
  const shown = fitText(text, w, size, name, meta);
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
  textLine('D1200', timelineX + timelineW - 39, y + 9, 38, {
    size: 6.2, bold: true, color: COLORS.white, align: 'right'
  });
  return scale;
}

function spanOf(rows) {
  if (!rows.length) return [1, 1];
  return [Math.min(...rows.map(r => r.start_day)), Math.max(...rows.map(r => r.finish_day))];
}

function naturalCompare(a, b) {
  return String(a ?? '').localeCompare(String(b ?? ''), 'th', { numeric: true, sensitivity: 'base' });
}

function minWbs(rows) {
  return [...rows].sort((a, b) => naturalCompare(a.wbs, b.wbs))[0]?.wbs || '';
}

function categoryName(row) {
  return row.work_category_th || row.discipline || 'งานทั่วไป';
}

function categoryRank(name) {
  return CATEGORY_RANK.has(name) ? CATEGORY_RANK.get(name) : 999;
}

function buildDisplayRows(rows) {
  const display = [];
  const planMap = new Map();
  for (const row of rows) {
    if (!planMap.has(row.plan_no)) planMap.set(row.plan_no, []);
    planMap.get(row.plan_no).push(row);
  }

  const planNumbers = [...planMap.keys()].sort((a, b) => Number(a) - Number(b));
  for (const planNo of planNumbers) {
    const planRows = planMap.get(planNo).slice().sort((a, b) => naturalCompare(a.wbs, b.wbs));
    const [planStart, planFinish] = spanOf(planRows);
    display.push({
      kind: 'plan', plan_no: planNo, label: `แผนที่ ${planNo} — ${PLAN_NAMES[planNo] || ''}`,
      count: planRows.length, start_day: planStart, finish_day: planFinish
    });

    const areaMap = new Map();
    for (const row of planRows) {
      const area = row.building_area || 'ทั้งโครงการ';
      if (!areaMap.has(area)) areaMap.set(area, []);
      areaMap.get(area).push(row);
    }
    const areas = [...areaMap.entries()].sort(([, aRows], [, bRows]) => naturalCompare(minWbs(aRows), minWbs(bRows)));

    for (const [area, areaRowsRaw] of areas) {
      const areaRows = areaRowsRaw.slice().sort((a, b) => naturalCompare(a.wbs, b.wbs));
      const [areaStart, areaFinish] = spanOf(areaRows);
      display.push({ kind: 'area', plan_no: planNo, label: area, count: areaRows.length, start_day: areaStart, finish_day: areaFinish });

      if (planNo === '01') {
        const categoryMap = new Map();
        for (const row of areaRows) {
          const category = categoryName(row);
          if (!categoryMap.has(category)) categoryMap.set(category, []);
          categoryMap.get(category).push(row);
        }
        const categories = [...categoryMap.entries()].sort(([aName, aRows], [bName, bRows]) =>
          categoryRank(aName) - categoryRank(bName)
          || naturalCompare(minWbs(aRows), minWbs(bRows))
          || naturalCompare(aName, bName)
        );
        for (const [category, categoryRowsRaw] of categories) {
          const categoryRows = categoryRowsRaw.slice().sort((a, b) => naturalCompare(a.wbs, b.wbs));
          const [categoryStart, categoryFinish] = spanOf(categoryRows);
          display.push({
            kind: 'category', plan_no: planNo, area, label: category, count: categoryRows.length,
            start_day: categoryStart, finish_day: categoryFinish
          });
          for (const task of categoryRows) display.push({ kind: 'task', task });
        }
      } else {
        for (const task of areaRows) display.push({ kind: 'task', task });
      }
    }
  }
  return display;
}

function predecessorText(row) {
  const links = row.predecessors || [];
  if (!links.length) return '—';
  return links.map(link =>
    `${link.id}${link.relationship && link.relationship !== 'FS' ? `(${link.relationship})` : ''}${link.lagDays ? `+${link.lagDays}` : ''}`
  ).join('; ');
}

function drawLegend(x, y) {
  const items = [
    ['normal', 'กิจกรรม'], ['critical', 'กิจกรรมวิกฤต'], ['milestone', 'จุดควบคุม'], ['provisional', 'ขอบเขตรอยืนยัน']
  ];
  let cx = x;
  for (const [kind, label] of items) {
    if (kind === 'milestone') drawDiamond(cx + 4, y + 4, 3.2, COLORS.navy);
    else {
      const fill = kind === 'critical' ? COLORS.critical : kind === 'provisional' ? COLORS.amberPale : COLORS.blue;
      const stroke = kind === 'provisional' ? COLORS.amber : fill;
      rect(cx, y + 1, 18, 7, fill, stroke, 0.6);
    }
    textLine(label, cx + 23, y, 87, { size: 6.0, color: COLORS.gray600 });
    cx += 102;
  }
}

function drawPageFooter(pageNo) {
  const w = doc.page.width;
  const h = doc.page.height;
  const y = h - PAGE_MARGIN - 13;
  drawLegend(PAGE_MARGIN, y - 1);
  textLine(`Baseline v0.8 · A3 แนวนอน · หน้า ${pageNo}`, w - PAGE_MARGIN - 210, y, 210, {
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
  textLine('แผนงานก่อสร้างห้วยขาแข้ง', PAGE_MARGIN, 16, innerW * 0.72, {
    size: 17, bold: true, color: COLORS.white
  });
  textLine('แผนงานหลักแบบบูรณาการสำหรับข้อเสนอ · BASELINE v0.8', PAGE_MARGIN, 42, innerW * 0.72, {
    size: 9.2, color: '#d9e5f0'
  });
  textLine('ฉบับตรวจทาน A3 · วันโครงการ D1–D1200', w - PAGE_MARGIN - 330, 23, 330, {
    size: 8.0, bold: true, color: COLORS.white, align: 'right'
  });

  const metricY = 79;
  const metricGap = 9;
  const metricW = (innerW - metricGap * 4) / 5;
  const metrics = [
    ['ระยะเวลาโครงการ', '1,200 วัน'], ['งวดงาน', '497'], ['กิจกรรม', String(masterSchedule.length)],
    ['จุดควบคุม', String(scheduleStats.milestones)], ['กิจกรรมวิกฤต', String(scheduleStats.computedCritical)]
  ];
  metrics.forEach(([label, value], index) => {
    const x = PAGE_MARGIN + index * (metricW + metricGap);
    rect(x, metricY, metricW, 50, COLORS.white, COLORS.gray250, 0.6);
    textLine(label, x + 8, metricY + 8, metricW - 16, { size: 6.6, color: COLORS.gray600 });
    textLine(value, x + 8, metricY + 23, metricW - 16, { size: 13, bold: true, color: COLORS.navyDark });
  });

  textLine('ช่วงควบคุมโครงการและกรอบกิจกรรมวิกฤต', PAGE_MARGIN, 145, innerW, {
    size: 9.2, bold: true, color: COLORS.navyDark
  });
  const tableX = PAGE_MARGIN;
  const labelW = 390;
  const daysW = 78;
  const timelineX = tableX + labelW + daysW;
  const timelineW = innerW - labelW - daysW;
  const headY = 162;
  const headH = 28;
  rect(tableX, headY, labelW, headH, COLORS.navy, COLORS.navyDark, 0.5);
  rect(tableX + labelW, headY, daysW, headH, COLORS.navy, COLORS.navyDark, 0.5);
  textCell('ช่วงควบคุม / ขอบเขต', tableX, headY, labelW, headH, { size: 7.2, bold: true, color: COLORS.white });
  textCell('วันโครงการ', tableX + labelW, headY, daysW, headH, {
    size: 7.0, bold: true, color: COLORS.white, align: 'center'
  });
  const scale = drawAxis(timelineX, headY, timelineW, headH);
  let y = headY + headH;
  CP_WINDOWS.forEach(([code, label, start, finish], index) => {
    const rowH = 25;
    rect(tableX, y, innerW, rowH, index % 2 ? COLORS.gray100 : COLORS.white, COLORS.gray250, 0.35);
    textCell(`${code}  ${label}`, tableX, y, labelW, rowH, { size: 7.2, bold: true });
    textCell(`D${start}–D${finish}`, tableX + labelW, y, daysW, rowH, {
      size: 7.0, color: COLORS.gray700, align: 'center'
    });
    drawTimelineGrid(timelineX, y, timelineW, rowH);
    rect(barX(start, timelineX, scale), y + 8, barW(start, finish, scale), 9, index >= 6 ? COLORS.critical : COLORS.blue);
    y += rowH;
  });

  y += 15;
  textLine('สรุปแผนที่ 01–16', PAGE_MARGIN, y, innerW, { size: 9.2, bold: true, color: COLORS.navyDark });
  y += 17;
  const planLabelW = 430;
  const countW = 58;
  const planDaysW = 88;
  const planTimelineX = PAGE_MARGIN + planLabelW + countW + planDaysW;
  const planTimelineW = innerW - planLabelW - countW - planDaysW;
  const planHeadH = 24;
  rect(PAGE_MARGIN, y, planLabelW, planHeadH, COLORS.navy, COLORS.navyDark, 0.5);
  rect(PAGE_MARGIN + planLabelW, y, countW, planHeadH, COLORS.navy, COLORS.navyDark, 0.5);
  rect(PAGE_MARGIN + planLabelW + countW, y, planDaysW, planHeadH, COLORS.navy, COLORS.navyDark, 0.5);
  textCell('แผน / สายงาน', PAGE_MARGIN, y, planLabelW, planHeadH, { size: 6.9, bold: true, color: COLORS.white });
  textCell('จำนวน', PAGE_MARGIN + planLabelW, y, countW, planHeadH, {
    size: 6.9, bold: true, color: COLORS.white, align: 'center'
  });
  textCell('ช่วงวัน', PAGE_MARGIN + planLabelW + countW, y, planDaysW, planHeadH, {
    size: 6.9, bold: true, color: COLORS.white, align: 'center'
  });
  const planScale = drawAxis(planTimelineX, y, planTimelineW, planHeadH);
  y += planHeadH;

  const byPlan = new Map();
  for (const row of masterSchedule) {
    if (!byPlan.has(row.plan_no)) byPlan.set(row.plan_no, []);
    byPlan.get(row.plan_no).push(row);
  }
  for (const planNo of [...byPlan.keys()].sort((a, b) => Number(a) - Number(b))) {
    const rows = byPlan.get(planNo);
    const [start, finish] = spanOf(rows);
    const rowH = 20;
    rect(PAGE_MARGIN, y, innerW, rowH, Number(planNo) % 2 ? COLORS.white : COLORS.gray100, COLORS.gray250, 0.3);
    textCell(`แผนที่ ${planNo} — ${PLAN_NAMES[planNo] || ''}`, PAGE_MARGIN, y, planLabelW, rowH, {
      size: 6.7, bold: planNo === '01'
    });
    textCell(String(rows.length), PAGE_MARGIN + planLabelW, y, countW, rowH, { size: 6.6, align: 'center' });
    textCell(`D${start}–D${finish}`, PAGE_MARGIN + planLabelW + countW, y, planDaysW, rowH, {
      size: 6.5, align: 'center', color: COLORS.gray700
    });
    drawTimelineGrid(planTimelineX, y, planTimelineW, rowH);
    rect(barX(start, planTimelineX, planScale), y + 6.5, barW(start, finish, planScale), 7,
      planNo === '01' ? COLORS.navy : COLORS.blueSoft,
      planNo === '01' ? COLORS.navy : COLORS.blue, 0.5);
    y += rowH;
  }

  textLine(`ผลตรวจ: ${validation.status} · เครือข่ายงานก่อสร้างแผนที่ 01 เชื่อมครบ NTP→D1200`,
    PAGE_MARGIN, h - PAGE_MARGIN - 29, innerW, {
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
    ['WBS', 62], ['กิจกรรม / รหัส / พื้นที่', 352], ['ระยะเวลา', 44],
    ['เริ่ม', 48], ['สิ้นสุด', 48], ['กิจกรรมก่อนหน้า', 92]
  ];
  return { w, h, innerW, tableW, timelineX, timelineW, columns };
}

function drawDetailPageHeader(pageNo, context = '') {
  doc.addPage();
  const { w, h, innerW, tableW, timelineX, timelineW, columns } = detailGeometry();
  textLine('แผนงานหลักแบบบูรณาการ — ห้วยขาแข้ง', PAGE_MARGIN, 19, 540, {
    size: 12.2, bold: true, color: COLORS.navyDark
  });
  textLine(`ระยะเวลา 1,200 วัน · 497 งวดงาน · ${masterSchedule.length} กิจกรรม · ${scheduleStats.computedCritical} กิจกรรมวิกฤต`,
    PAGE_MARGIN, 39, 660, { size: 7.0, color: COLORS.gray600 });
  if (context) textLine(context, 680, 39, w - PAGE_MARGIN - 680, {
    size: 6.8, color: COLORS.gray600, align: 'right', meta: { type: 'continuation-context', pageNo }
  });
  textLine(`BASELINE v0.8 · หน้า ${pageNo}`, w - PAGE_MARGIN - 230, 18, 230, {
    size: 8.0, bold: true, color: COLORS.navyDark, align: 'right'
  });

  const headY = 61;
  const headH = 30;
  let x = PAGE_MARGIN;
  for (const [label, width] of columns) {
    rect(x, headY, width, headH, COLORS.navy, COLORS.navyDark, 0.5);
    textCell(label, x, headY, width, headH, {
      size: 7.0, bold: true, color: COLORS.white,
      align: label === 'กิจกรรม / รหัส / พื้นที่' || label === 'กิจกรรมก่อนหน้า' ? 'left' : 'center'
    });
    x += width;
  }
  drawAxis(timelineX, headY, timelineW, headH);
  drawPageFooter(pageNo);
  return { bodyTop: headY + headH, bodyBottom: h - PAGE_MARGIN - 32, ...detailGeometry() };
}

function groupStyle(kind) {
  if (kind === 'plan') return {
    height: GROUP_PLAN_H, fill: '#eaf1f7', stroke: '#c7d5e3', color: COLORS.navyDark,
    size: 8.5, indent: 7, bar: COLORS.navy, barH: 6
  };
  if (kind === 'area') return {
    height: GROUP_AREA_H, fill: '#f7f9fb', stroke: COLORS.gray250, color: COLORS.gray800,
    size: 7.8, indent: 14, bar: '#91a9bd', barH: 6
  };
  return {
    height: GROUP_CATEGORY_H, fill: COLORS.categoryFill, stroke: COLORS.categoryStroke, color: COLORS.gray800,
    size: 7.4, indent: 24, bar: '#6f8fa9', barH: 5
  };
}

function drawGroupRow(row, y, geometry, continuation = false) {
  const { innerW, tableW, timelineX, timelineW } = geometry;
  const style = groupStyle(row.kind);
  const label = continuation ? `${row.label} (ต่อ)` : row.label;
  rect(PAGE_MARGIN, y, innerW, style.height, style.fill, style.stroke, 0.4);
  textCell(label, PAGE_MARGIN, y, tableW - 106, style.height, {
    size: style.size, bold: true, color: style.color, pad: style.indent,
    meta: { type: `${row.kind}-label`, label, continuation }
  });
  textCell(`${row.count} กิจกรรม`, PAGE_MARGIN + tableW - 106, y, 106, style.height, {
    size: 6.3, color: COLORS.gray600, align: 'right', pad: 7
  });
  drawTimelineGrid(timelineX, y, timelineW, style.height);
  const scale = projectScale(timelineW);
  rect(barX(row.start_day, timelineX, scale), y + (style.height - style.barH) / 2,
    barW(row.start_day, row.finish_day, scale), style.barH, style.bar);
  return style.height;
}

function drawTaskRow(row, y, geometry, rowIndex) {
  const { tableW, timelineX, timelineW, columns } = geometry;
  const provisional = row.scope_applicability === 'WHERE_APPLICABLE';
  const critical = row.computed_critical === 'Y';
  const fill = provisional ? COLORS.amberPale : rowIndex % 2 ? COLORS.white : '#fcfdfe';
  rect(PAGE_MARGIN, y, tableW + timelineW, ROW_H, fill, COLORS.gray150, 0.28);
  if (critical) rect(PAGE_MARGIN, y, 3, ROW_H, COLORS.critical);

  let x = PAGE_MARGIN;
  textCell(row.wbs, x, y, columns[0][1], ROW_H, {
    size: 7.0, bold: critical, color: COLORS.gray800, align: 'center', pad: 2
  });
  x += columns[0][1];

  const activityW = columns[1][1];
  const titleFont = critical ? 'ThaiBold' : 'Thai';
  const titleColor = critical ? COLORS.criticalDark : COLORS.gray950;
  const titleLines = wrapTextTwoLines(row.activity_name, activityW - 10, 7.35, titleFont, {
    type: 'activity-title', activity_id: row.activity_id, wbs: row.wbs
  });
  useFont(titleFont, 7.35, titleColor);
  const titleY = titleLines.length === 1 ? y + 5.2 : y + 2.1;
  titleLines.forEach((text, index) => {
    doc.text(text, x + 5, titleY + index * 8.6, { width: activityW - 10, lineBreak: false });
  });
  const sub = `${row.activity_id} · ${row.building_area || 'ทั้งโครงการ'}${provisional ? ' · รอยืนยันขอบเขต' : ''}`;
  useFont('Thai', 5.25, provisional ? COLORS.amber : COLORS.gray500);
  doc.text(fitText(sub, activityW - 10, 5.25, 'Thai', {
    type: 'activity-subline', activity_id: row.activity_id
  }), x + 5, y + 20.4, { width: activityW - 10, lineBreak: false });
  x += activityW;

  textCell(row.milestone === 'Y' ? 'จุด' : `${row.duration_days} วัน`, x, y, columns[2][1], ROW_H, {
    size: 6.55, bold: row.milestone === 'Y', align: 'center', pad: 1
  });
  x += columns[2][1];
  textCell(`D${row.start_day}`, x, y, columns[3][1], ROW_H, { size: 6.6, align: 'center', pad: 1 });
  x += columns[3][1];
  textCell(`D${row.finish_day}`, x, y, columns[4][1], ROW_H, { size: 6.6, align: 'center', pad: 1 });
  x += columns[4][1];
  textCell(predecessorText(row), x, y, columns[5][1], ROW_H, {
    size: 5.55, color: COLORS.gray700, pad: 3,
    meta: { type: 'predecessor', activity_id: row.activity_id }
  });

  drawTimelineGrid(timelineX, y, timelineW, ROW_H);
  const scale = projectScale(timelineW);
  const midY = y + ROW_H / 2;
  if (row.milestone === 'Y') {
    const fillColor = critical ? COLORS.critical : provisional ? COLORS.amber : COLORS.navy;
    drawDiamond(barX(row.start_day, timelineX, scale), midY, 4.0, fillColor);
  } else {
    const fillColor = critical ? COLORS.critical : provisional ? '#ffe4ad'
      : row.basis_type === 'SOURCE' ? COLORS.blue : '#6f9abd';
    const strokeColor = critical ? COLORS.criticalDark : provisional ? COLORS.amber : '#4f7898';
    rect(barX(row.start_day, timelineX, scale), y + (ROW_H - 9) / 2,
      barW(row.start_day, row.finish_day, scale), 9, fillColor, strokeColor, provisional ? 0.8 : 0.4);
  }
  return ROW_H;
}

function rowHeight(row) {
  if (row.kind === 'plan') return GROUP_PLAN_H;
  if (row.kind === 'area') return GROUP_AREA_H;
  if (row.kind === 'category') return GROUP_CATEGORY_H;
  return ROW_H;
}

function minimumBlockHeight(display, index) {
  const row = display[index];
  if (row.kind === 'task') return ROW_H;
  let height = rowHeight(row);
  for (let next = index + 1; next < display.length; next++) {
    const candidate = display[next];
    if (candidate.kind === 'task') {
      height += ROW_H;
      break;
    }
    if (row.kind === 'area' && candidate.kind === 'area') break;
    if (row.kind === 'category' && candidate.kind !== 'task') break;
    if (row.kind === 'plan' && candidate.kind === 'plan') break;
    height += rowHeight(candidate);
  }
  return height;
}

function drawDetailPages(display) {
  let pageNo = 2;
  let currentPlan = '';
  let currentArea = '';
  let currentCategory = null;
  let geometry = drawDetailPageHeader(pageNo);
  let y = geometry.bodyTop;
  let taskStripe = 0;

  for (let index = 0; index < display.length; index++) {
    const row = display[index];
    const minBlock = minimumBlockHeight(display, index);
    if (y > geometry.bodyTop && y + minBlock > geometry.bodyBottom) {
      pageNo += 1;
      const context = [currentPlan, currentArea, currentCategory?.label].filter(Boolean).join(' · ');
      geometry = drawDetailPageHeader(pageNo, context ? `ต่อ: ${context}` : '');
      y = geometry.bodyTop;
      taskStripe = 0;
      if (row.kind === 'task' && currentCategory) {
        y += drawGroupRow(currentCategory, y, geometry, true);
      }
    }

    if (row.kind === 'plan') {
      currentPlan = row.label;
      currentArea = '';
      currentCategory = null;
      y += drawGroupRow(row, y, geometry);
    } else if (row.kind === 'area') {
      currentArea = row.label;
      currentCategory = null;
      y += drawGroupRow(row, y, geometry);
    } else if (row.kind === 'category') {
      currentCategory = row;
      y += drawGroupRow(row, y, geometry);
    } else {
      y += drawTaskRow(row.task, y, geometry, taskStripe++);
    }
  }
  return pageNo;
}

const displayRows = buildDisplayRows(masterSchedule);
drawSummaryPage();
const finalPageNo = drawDetailPages(displayRows);
doc.end();

await new Promise((resolve, reject) => {
  stream.on('finish', resolve);
  stream.on('error', reject);
});

const size = fs.statSync(OUTPUT).size;
const truncationByType = truncations.reduce((acc, item) => {
  acc[item.type] = (acc[item.type] || 0) + 1;
  return acc;
}, {});
const report = {
  output: OUTPUT,
  pages: finalPageNo,
  size_bytes: size,
  activities: masterSchedule.length,
  plan_group_rows: displayRows.filter(row => row.kind === 'plan').length,
  area_group_rows: displayRows.filter(row => row.kind === 'area').length,
  category_group_rows: displayRows.filter(row => row.kind === 'category').length,
  task_rows: displayRows.filter(row => row.kind === 'task').length,
  truncation_count: truncations.length,
  truncation_by_type: truncationByType,
  activity_title_truncations: truncations.filter(item => item.type === 'activity-title'),
  group_label_truncations: truncations.filter(item => /-label$/.test(item.type)),
  all_truncations: truncations
};
fs.writeFileSync(GENERATION_REPORT, JSON.stringify(report, null, 2));

console.log(`สร้างไฟล์ PDF Gantt A3 ภาษาไทยแล้ว: ${OUTPUT}`);
console.log(`PDF pages generated deterministically: ${finalPageNo}`);
console.log(`PDF size: ${size} bytes`);
console.log(`Hierarchy rows: plans=${report.plan_group_rows}, areas=${report.area_group_rows}, categories=${report.category_group_rows}, tasks=${report.task_rows}`);
console.log(`PDF truncations: ${report.truncation_count} (${JSON.stringify(report.truncation_by_type)})`);
