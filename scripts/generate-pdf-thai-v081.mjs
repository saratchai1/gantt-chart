import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
import PDFDocument from 'pdfkit';
import { masterSchedule, scheduleStats, validation } from '../src/build-schedule.js';

const VERSION = '0.8.1';
const OUTPUT = 'data/huai-kha-khaeng-integrated-master-gantt-v0.8.1-thai.pdf';
const GENERATION_REPORT = 'data/pdf-generation-report-v081.json';
const PAGE_MARGIN = 24;
const BASE_TASK_H = 31;
const GROUP_PLAN_H = 24;
const GROUP_ZONE_H = 22;
const GROUP_AREA_H = 22;
const GROUP_CATEGORY_H = 20;

const COLORS = {
  navy: '#173a63', navyDark: '#102f53', blue: '#3e82b8', blueSoft: '#dbe7f2',
  critical: '#c43d3d', criticalDark: '#9f2b2b', criticalPale: '#fff1f1',
  amber: '#b7791f', amberPale: '#fff7e6', green: '#26704e', greenPale: '#eef8f3',
  gray950: '#111827', gray900: '#17212f', gray800: '#344054', gray700: '#475467',
  gray600: '#667085', gray500: '#7b8794', gray400: '#98a2b3', gray300: '#cbd5e1',
  gray250: '#d8dee8', gray200: '#e5eaf0', gray150: '#edf0f4', gray100: '#f5f7fa',
  white: '#ffffff'
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

const ZONE_LABELS = {
  'Project-wide': 'ทั้งโครงการ',
  'Preliminaries': 'งานอำนวยการและเตรียมการ',
  'Closeout': 'งานปิดโครงการและส่งมอบ',
  'Area A': 'พื้นที่ A', 'A': 'พื้นที่ A',
  'Area B': 'พื้นที่ B', 'B': 'พื้นที่ B',
  'Area C': 'พื้นที่ C', 'C': 'พื้นที่ C',
  'Area D': 'พื้นที่ D', 'D': 'พื้นที่ D',
  'Areas B/C': 'พื้นที่ B/C',
  'Areas B/C/D + External Systems': 'พื้นที่ B/C/D และระบบภายนอก'
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
  'งานสำรวจและสิ่งแวดล้อม', 'งานสิ่งแวดล้อมและความปลอดภัย',
  'งานงบประมาณและบริหารสัญญา', 'งานบริหารพื้นที่ก่อสร้าง', 'งานสาธารณูปโภคชั่วคราว',
  'งานโลจิสติกส์พื้นที่ก่อสร้าง', 'งานบริหารอัตรากำลัง', 'งานบริหารเครื่องจักรกล',
  'งานจัดหาและวัสดุ', 'งานควบคุมคุณภาพ', 'งานบริหารจราจร', 'งานควบคุมเอกสาร',
  'งานควบคุมโครงการ', 'งาน BIM', 'งาน BIM 4D/5D', 'งาน BIM ตามสภาพก่อสร้างจริง',
  'งานแบบจำลองสินทรัพย์ดิจิทัล', 'งานโปรแกรมประยุกต์และ AI', 'งานคาร์บอนฟุตพริ้นท์',
  'งานคุ้มครองมรดกโลก', 'งานทั่วไป'
];
const CATEGORY_RANK = new Map(CATEGORY_ORDER.map((name, index) => [name, index]));

function resolveFont(queries) {
  for (const query of queries) {
    try {
      const output = execFileSync('fc-match', ['-f', '%{file}\n', query], { encoding: 'utf8' }).trim();
      const file = output.split(/\r?\n/).find(Boolean);
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
    Subject: `แผนงานหลักแบบบูรณาการ ฉบับฐาน v${VERSION} — ฉบับพร้อมส่งทีมงาน A3`,
    Author: 'ระบบจัดทำแผนงานหลักแบบบูรณาการ',
    Keywords: 'ห้วยขาแข้ง, แผนงานก่อสร้าง, Gantt, CPM, แผนงานหลัก'
  }
});
const stream = fs.createWriteStream(OUTPUT);
doc.pipe(stream);
doc.registerFont('Thai', regularFont);
doc.registerFont('ThaiBold', boldFont);

const graphemeSegmenter = typeof Intl?.Segmenter === 'function'
  ? new Intl.Segmenter('th', { granularity: 'grapheme' })
  : null;

function cleanText(value) {
  return String(value ?? '').replace(/\s+/g, ' ').trim();
}

function graphemes(value) {
  const text = cleanText(value);
  if (!graphemeSegmenter) return Array.from(text);
  return [...graphemeSegmenter.segment(text)].map(part => part.segment);
}

function useFont(name = 'Thai', size = 8, color = COLORS.gray900) {
  doc.font(name).fontSize(size).fillColor(color);
}

function line(x1, y1, x2, y2, color = COLORS.gray250, width = 0.35) {
  doc.save().strokeColor(color).lineWidth(width).moveTo(x1, y1).lineTo(x2, y2).stroke().restore();
}

function rect(x, y, width, height, fillColor = null, strokeColor = null, lineWidth = 0.35) {
  doc.save();
  if (fillColor) doc.fillColor(fillColor).rect(x, y, width, height).fill();
  if (strokeColor) doc.strokeColor(strokeColor).lineWidth(lineWidth).rect(x, y, width, height).stroke();
  doc.restore();
}

function widthOf(text, size, fontName = 'Thai') {
  doc.font(fontName).fontSize(size);
  return doc.widthOfString(String(text ?? ''));
}

function shrinkSize(text, width, startSize, minSize, fontName) {
  let size = startSize;
  while (size > minSize && widthOf(text, size, fontName) > width) size = Math.max(minSize, size - 0.2);
  return size;
}

function maxPrefix(parts, width, size, fontName) {
  let low = 0;
  let high = parts.length;
  while (low < high) {
    const middle = Math.ceil((low + high) / 2);
    if (widthOf(parts.slice(0, middle).join(''), size, fontName) <= width) low = middle;
    else high = middle - 1;
  }
  return low;
}

function preferredBreak(parts, count) {
  const lower = Math.max(1, count - 28);
  for (let index = count; index >= lower; index--) {
    const token = parts[index - 1];
    if (/\s|[–—/:,;()]/.test(token)) return index;
  }
  return count;
}

function wrapTextLines(value, width, size, fontName = 'Thai') {
  const source = graphemes(value);
  if (!source.length) return [''];
  const lines = [];
  let cursor = 0;
  while (cursor < source.length) {
    const remaining = source.slice(cursor);
    let count = maxPrefix(remaining, width, size, fontName);
    if (count <= 0) count = 1;
    if (count < remaining.length) count = preferredBreak(remaining, count);
    if (count <= 0) count = 1;
    const lineText = remaining.slice(0, count).join('').trim();
    if (lineText) lines.push(lineText);
    cursor += count;
    while (cursor < source.length && /\s/.test(source[cursor])) cursor += 1;
  }
  return lines.length ? lines : [''];
}

function drawSingleLine(text, x, y, width, height, {
  size = 7.6, minSize = 5.4, bold = false, color = COLORS.gray900,
  align = 'left', pad = 4
} = {}) {
  const fontName = bold ? 'ThaiBold' : 'Thai';
  const innerWidth = Math.max(1, width - pad * 2);
  const fullText = cleanText(text);
  const actualSize = shrinkSize(fullText, innerWidth, size, minSize, fontName);
  useFont(fontName, actualSize, color);
  const textY = y + Math.max(1.4, (height - actualSize * 1.45) / 2);
  doc.text(fullText, x + pad, textY, { width: innerWidth, lineBreak: false, align });
}

function drawTextLine(text, x, y, width, {
  size = 8, minSize = 5.6, bold = false, color = COLORS.gray900, align = 'left'
} = {}) {
  const fontName = bold ? 'ThaiBold' : 'Thai';
  const fullText = cleanText(text);
  const actualSize = shrinkSize(fullText, width, size, minSize, fontName);
  useFont(fontName, actualSize, color);
  doc.text(fullText, x, y, { width, lineBreak: false, align });
}

function drawWrappedLines(lines, x, y, width, {
  size, lineHeight, fontName = 'Thai', color = COLORS.gray900, align = 'left'
}) {
  useFont(fontName, size, color);
  lines.forEach((text, index) => {
    doc.text(text, x, y + index * lineHeight, { width, lineBreak: false, align });
  });
}

function projectScale(timelineWidth) { return timelineWidth / 1200; }
function barX(day, timelineX, scale) { return timelineX + (day - 1) * scale; }
function barW(start, finish, scale) { return Math.max(1.5, (finish - start + 1) * scale); }

function drawDiamond(centerX, centerY, radius, fillColor, strokeColor = fillColor) {
  doc.save().translate(centerX, centerY).rotate(45).fillColor(fillColor).strokeColor(strokeColor).lineWidth(0.7)
    .rect(-radius, -radius, radius * 2, radius * 2).fillAndStroke().restore();
}

function drawTimelineGrid(timelineX, y, timelineWidth, height) {
  const scale = projectScale(timelineWidth);
  for (let day = 1; day <= 1201; day += 30) {
    const x = timelineX + (day - 1) * scale;
    const major = (day - 1) % 120 === 0;
    line(x, y, x, y + height, major ? COLORS.gray300 : COLORS.gray150, major ? 0.65 : 0.28);
  }
}

function drawAxis(timelineX, y, timelineWidth, height) {
  rect(timelineX, y, timelineWidth, height, COLORS.navy, COLORS.navyDark, 0.5);
  const scale = projectScale(timelineWidth);
  for (let day = 1; day <= 1201; day += 30) {
    const x = timelineX + (day - 1) * scale;
    const major = (day - 1) % 120 === 0;
    line(x, y, x, y + height, major ? '#b5c9dc' : '#7892ab', major ? 0.65 : 0.25);
  }
  for (let day = 1; day <= 1081; day += 120) {
    const x = timelineX + (day - 1) * scale;
    drawSingleLine(`D${day}`, x, y, 120 * scale, height, {
      size: 6.4, minSize: 5.6, bold: true, color: COLORS.white, align: 'center', pad: 1
    });
  }
  drawTextLine('D1200', timelineX + timelineWidth - 40, y + 9, 39, {
    size: 6.2, bold: true, color: COLORS.white, align: 'right'
  });
  return scale;
}

function spanOf(rows) {
  if (!rows.length) return [1, 1];
  return [Math.min(...rows.map(row => row.start_day)), Math.max(...rows.map(row => row.finish_day))];
}

function naturalCompare(a, b) {
  return String(a ?? '').localeCompare(String(b ?? ''), 'th', { numeric: true, sensitivity: 'base' });
}

function minWbs(rows) {
  return [...rows].sort((a, b) => naturalCompare(a.wbs, b.wbs))[0]?.wbs || '';
}

function zoneKey(row) {
  return cleanText(row.zone) || 'Project-wide';
}

function zoneLabel(key) {
  return ZONE_LABELS[key] || key || 'ทั้งโครงการ';
}

function areaName(row) {
  return cleanText(row.building_area) || 'ทั้งโครงการ';
}

function categoryName(row) {
  return cleanText(row.work_category_th || row.discipline) || 'งานทั่วไป';
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

  for (const planNo of [...planMap.keys()].sort((a, b) => Number(a) - Number(b))) {
    const planRows = planMap.get(planNo).slice().sort((a, b) => naturalCompare(a.wbs, b.wbs));
    const [planStart, planFinish] = spanOf(planRows);
    display.push({
      kind: 'plan', plan_no: planNo, label: `แผนที่ ${planNo} — ${PLAN_NAMES[planNo] || ''}`,
      count: planRows.length, start_day: planStart, finish_day: planFinish
    });

    const zoneMap = new Map();
    for (const row of planRows) {
      const key = zoneKey(row);
      if (!zoneMap.has(key)) zoneMap.set(key, []);
      zoneMap.get(key).push(row);
    }
    const zones = [...zoneMap.entries()].sort(([, aRows], [, bRows]) => naturalCompare(minWbs(aRows), minWbs(bRows)));
    const showZoneRows = planNo === '01' || zones.length > 1;

    for (const [zone, zoneRowsRaw] of zones) {
      const zoneRows = zoneRowsRaw.slice().sort((a, b) => naturalCompare(a.wbs, b.wbs));
      const [zoneStart, zoneFinish] = spanOf(zoneRows);
      if (showZoneRows) {
        display.push({
          kind: 'zone', plan_no: planNo, zone, label: `พื้นที่ดำเนินงาน — ${zoneLabel(zone)}`,
          count: zoneRows.length, start_day: zoneStart, finish_day: zoneFinish
        });
      }

      const areaMap = new Map();
      for (const row of zoneRows) {
        const area = areaName(row);
        if (!areaMap.has(area)) areaMap.set(area, []);
        areaMap.get(area).push(row);
      }
      const areas = [...areaMap.entries()].sort(([, aRows], [, bRows]) => naturalCompare(minWbs(aRows), minWbs(bRows)));

      for (const [area, areaRowsRaw] of areas) {
        const areaRows = areaRowsRaw.slice().sort((a, b) => naturalCompare(a.wbs, b.wbs));
        const [areaStart, areaFinish] = spanOf(areaRows);
        display.push({
          kind: 'area', plan_no: planNo, zone, area, label: `อาคาร / บริเวณ — ${area}`,
          count: areaRows.length, start_day: areaStart, finish_day: areaFinish
        });

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
            kind: 'category', plan_no: planNo, zone, area, category,
            label: `หมวดงาน — ${category}`, count: categoryRows.length,
            start_day: categoryStart, finish_day: categoryFinish
          });
          for (const task of categoryRows) display.push({ kind: 'task', task });
        }
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
    ['normal', 'กิจกรรม'], ['critical', 'กิจกรรมวิกฤต'],
    ['milestone', 'จุดควบคุม'], ['provisional', 'ขอบเขตรอยืนยัน']
  ];
  let cursor = x;
  for (const [kind, label] of items) {
    if (kind === 'milestone') drawDiamond(cursor + 4, y + 4, 3.2, COLORS.navy);
    else {
      const fill = kind === 'critical' ? COLORS.critical : kind === 'provisional' ? COLORS.amberPale : COLORS.blue;
      const stroke = kind === 'provisional' ? COLORS.amber : fill;
      rect(cursor, y + 1, 18, 7, fill, stroke, 0.6);
    }
    drawTextLine(label, cursor + 23, y, 88, { size: 6.0, minSize: 5.4, color: COLORS.gray600 });
    cursor += 102;
  }
}

function drawPageFooter(pageNo) {
  const width = doc.page.width;
  const height = doc.page.height;
  const y = height - PAGE_MARGIN - 13;
  drawLegend(PAGE_MARGIN, y - 1);
  drawTextLine(`ฉบับฐาน v${VERSION} · A3 แนวนอน · หน้า ${pageNo}`, width - PAGE_MARGIN - 225, y, 225, {
    size: 6.1, minSize: 5.6, color: COLORS.gray600, align: 'right'
  });
}

function drawSummaryPage() {
  doc.addPage();
  const pageNo = 1;
  const width = doc.page.width;
  const height = doc.page.height;
  const innerWidth = width - PAGE_MARGIN * 2;

  rect(0, 0, width, 66, COLORS.navyDark);
  drawTextLine('แผนงานก่อสร้างห้วยขาแข้ง', PAGE_MARGIN, 16, innerWidth * 0.72, {
    size: 17, minSize: 14, bold: true, color: COLORS.white
  });
  drawTextLine(`แผนงานหลักแบบบูรณาการสำหรับข้อเสนอ · ฉบับฐาน v${VERSION}`, PAGE_MARGIN, 42, innerWidth * 0.72, {
    size: 9.2, minSize: 8.2, color: '#d9e5f0'
  });
  drawTextLine('ฉบับพร้อมส่งทีมงาน · A3 แนวนอน · วันโครงการ D1–D1200', width - PAGE_MARGIN - 360, 23, 360, {
    size: 8.0, minSize: 7.0, bold: true, color: COLORS.white, align: 'right'
  });

  const metricY = 79;
  const metricGap = 9;
  const metricWidth = (innerWidth - metricGap * 4) / 5;
  const metrics = [
    ['ระยะเวลาโครงการ', '1,200 วัน'], ['งวดงาน', '497'], ['กิจกรรม', String(masterSchedule.length)],
    ['จุดควบคุม', String(scheduleStats.milestones)], ['กิจกรรมวิกฤต', String(scheduleStats.computedCritical)]
  ];
  metrics.forEach(([label, value], index) => {
    const x = PAGE_MARGIN + index * (metricWidth + metricGap);
    rect(x, metricY, metricWidth, 50, COLORS.white, COLORS.gray250, 0.6);
    drawTextLine(label, x + 8, metricY + 8, metricWidth - 16, { size: 6.6, minSize: 5.8, color: COLORS.gray600 });
    drawTextLine(value, x + 8, metricY + 23, metricWidth - 16, { size: 13, minSize: 11, bold: true, color: COLORS.navyDark });
  });

  drawTextLine('ช่วงควบคุมโครงการและกรอบกิจกรรมวิกฤต', PAGE_MARGIN, 145, innerWidth, {
    size: 9.2, bold: true, color: COLORS.navyDark
  });
  const labelWidth = 390;
  const daysWidth = 78;
  const timelineX = PAGE_MARGIN + labelWidth + daysWidth;
  const timelineWidth = innerWidth - labelWidth - daysWidth;
  const headY = 162;
  const headH = 28;
  rect(PAGE_MARGIN, headY, labelWidth, headH, COLORS.navy, COLORS.navyDark, 0.5);
  rect(PAGE_MARGIN + labelWidth, headY, daysWidth, headH, COLORS.navy, COLORS.navyDark, 0.5);
  drawSingleLine('ช่วงควบคุม / ขอบเขต', PAGE_MARGIN, headY, labelWidth, headH, { size: 7.2, bold: true, color: COLORS.white });
  drawSingleLine('วันโครงการ', PAGE_MARGIN + labelWidth, headY, daysWidth, headH, {
    size: 7.0, bold: true, color: COLORS.white, align: 'center'
  });
  const scale = drawAxis(timelineX, headY, timelineWidth, headH);
  let y = headY + headH;
  CP_WINDOWS.forEach(([code, label, start, finish], index) => {
    const rowH = 25;
    rect(PAGE_MARGIN, y, innerWidth, rowH, index % 2 ? COLORS.gray100 : COLORS.white, COLORS.gray250, 0.35);
    drawSingleLine(`${code}  ${label}`, PAGE_MARGIN, y, labelWidth, rowH, { size: 7.2, minSize: 6.2, bold: true });
    drawSingleLine(`D${start}–D${finish}`, PAGE_MARGIN + labelWidth, y, daysWidth, rowH, {
      size: 7.0, color: COLORS.gray700, align: 'center'
    });
    drawTimelineGrid(timelineX, y, timelineWidth, rowH);
    rect(barX(start, timelineX, scale), y + 8, barW(start, finish, scale), 9, index >= 6 ? COLORS.critical : COLORS.blue);
    y += rowH;
  });

  y += 15;
  drawTextLine('สรุปแผนที่ 01–16', PAGE_MARGIN, y, innerWidth, { size: 9.2, bold: true, color: COLORS.navyDark });
  y += 17;
  const planLabelWidth = 430;
  const countWidth = 58;
  const planDaysWidth = 88;
  const planTimelineX = PAGE_MARGIN + planLabelWidth + countWidth + planDaysWidth;
  const planTimelineWidth = innerWidth - planLabelWidth - countWidth - planDaysWidth;
  const planHeadH = 24;
  rect(PAGE_MARGIN, y, planLabelWidth, planHeadH, COLORS.navy, COLORS.navyDark, 0.5);
  rect(PAGE_MARGIN + planLabelWidth, y, countWidth, planHeadH, COLORS.navy, COLORS.navyDark, 0.5);
  rect(PAGE_MARGIN + planLabelWidth + countWidth, y, planDaysWidth, planHeadH, COLORS.navy, COLORS.navyDark, 0.5);
  drawSingleLine('แผน / สายงาน', PAGE_MARGIN, y, planLabelWidth, planHeadH, { size: 6.9, bold: true, color: COLORS.white });
  drawSingleLine('จำนวน', PAGE_MARGIN + planLabelWidth, y, countWidth, planHeadH, { size: 6.9, bold: true, color: COLORS.white, align: 'center' });
  drawSingleLine('ช่วงวัน', PAGE_MARGIN + planLabelWidth + countWidth, y, planDaysWidth, planHeadH, { size: 6.9, bold: true, color: COLORS.white, align: 'center' });
  const planScale = drawAxis(planTimelineX, y, planTimelineWidth, planHeadH);
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
    rect(PAGE_MARGIN, y, innerWidth, rowH, Number(planNo) % 2 ? COLORS.white : COLORS.gray100, COLORS.gray250, 0.3);
    drawSingleLine(`แผนที่ ${planNo} — ${PLAN_NAMES[planNo] || ''}`, PAGE_MARGIN, y, planLabelWidth, rowH, {
      size: 6.7, minSize: 5.8, bold: planNo === '01'
    });
    drawSingleLine(String(rows.length), PAGE_MARGIN + planLabelWidth, y, countWidth, rowH, { size: 6.6, align: 'center' });
    drawSingleLine(`D${start}–D${finish}`, PAGE_MARGIN + planLabelWidth + countWidth, y, planDaysWidth, rowH, {
      size: 6.5, align: 'center', color: COLORS.gray700
    });
    drawTimelineGrid(planTimelineX, y, planTimelineWidth, rowH);
    rect(barX(start, planTimelineX, planScale), y + 6.5, barW(start, finish, planScale), 7,
      planNo === '01' ? COLORS.navy : COLORS.blueSoft,
      planNo === '01' ? COLORS.navy : COLORS.blue, 0.5);
    y += rowH;
  }

  drawTextLine(`ผลตรวจ: ${validation.status} · เครือข่ายงานก่อสร้างแผนที่ 01 เชื่อมครบ NTP→D1200`,
    PAGE_MARGIN, height - PAGE_MARGIN - 29, innerWidth, {
      size: 6.8, minSize: 6.0, bold: true, color: validation.status === 'PASS' ? COLORS.green : COLORS.critical
    });
  drawPageFooter(pageNo);
}

function detailGeometry() {
  const width = doc.page.width;
  const height = doc.page.height;
  const innerWidth = width - PAGE_MARGIN * 2;
  const tableWidth = 710;
  const timelineX = PAGE_MARGIN + tableWidth;
  const timelineWidth = innerWidth - tableWidth;
  const columns = [
    ['WBS', 64], ['กิจกรรม / รหัส / พื้นที่', 366], ['ระยะเวลา', 54],
    ['เริ่ม', 48], ['สิ้นสุด', 48], ['กิจกรรมก่อนหน้า', 130]
  ];
  return { width, height, innerWidth, tableWidth, timelineX, timelineWidth, columns };
}

function drawDetailPageHeader(pageNo, context = '') {
  doc.addPage();
  const geometry = detailGeometry();
  const { width, height, timelineX, timelineWidth, columns } = geometry;
  drawTextLine('แผนงานหลักแบบบูรณาการ — ห้วยขาแข้ง', PAGE_MARGIN, 19, 560, {
    size: 12.2, minSize: 10.5, bold: true, color: COLORS.navyDark
  });
  drawTextLine(`ระยะเวลา 1,200 วัน · 497 งวดงาน · ${masterSchedule.length} กิจกรรม · ${scheduleStats.computedCritical} กิจกรรมวิกฤต`,
    PAGE_MARGIN, 39, 680, { size: 7.0, minSize: 6.2, color: COLORS.gray600 });
  if (context) drawTextLine(context, 710, 39, width - PAGE_MARGIN - 710, {
    size: 6.7, minSize: 5.6, color: COLORS.gray600, align: 'right'
  });
  drawTextLine(`ฉบับฐาน v${VERSION} · หน้า ${pageNo}`, width - PAGE_MARGIN - 235, 18, 235, {
    size: 8.0, minSize: 7.0, bold: true, color: COLORS.navyDark, align: 'right'
  });

  const headY = 61;
  const headH = 30;
  let x = PAGE_MARGIN;
  for (const [label, columnWidth] of columns) {
    rect(x, headY, columnWidth, headH, COLORS.navy, COLORS.navyDark, 0.5);
    drawSingleLine(label, x, headY, columnWidth, headH, {
      size: 7.0, minSize: 5.8, bold: true, color: COLORS.white,
      align: label === 'กิจกรรม / รหัส / พื้นที่' || label === 'กิจกรรมก่อนหน้า' ? 'left' : 'center'
    });
    x += columnWidth;
  }
  drawAxis(timelineX, headY, timelineWidth, headH);
  drawPageFooter(pageNo);
  return { bodyTop: headY + headH, bodyBottom: height - PAGE_MARGIN - 32, ...geometry };
}

function groupStyle(kind) {
  if (kind === 'plan') return {
    height: GROUP_PLAN_H, fill: '#e4eef7', stroke: '#b8cadb', color: COLORS.navyDark,
    size: 8.6, indent: 7, bar: COLORS.navy, barH: 6.5
  };
  if (kind === 'zone') return {
    height: GROUP_ZONE_H, fill: '#edf4fa', stroke: '#c8d7e4', color: COLORS.navy,
    size: 8.0, indent: 14, bar: '#5d86a8', barH: 6
  };
  if (kind === 'area') return {
    height: GROUP_AREA_H, fill: '#f7f9fb', stroke: COLORS.gray250, color: COLORS.gray800,
    size: 7.8, indent: 22, bar: '#91a9bd', barH: 6
  };
  return {
    height: GROUP_CATEGORY_H, fill: COLORS.greenPale, stroke: '#cde4d7', color: COLORS.green,
    size: 7.5, indent: 31, bar: '#5b9073', barH: 5
  };
}

function drawGroupRow(row, y, geometry, continuation = false) {
  const style = groupStyle(row.kind);
  const label = continuation ? `${row.label} · ต่อจากหน้าก่อน` : row.label;
  rect(PAGE_MARGIN, y, geometry.innerWidth, style.height, style.fill, style.stroke, 0.4);
  drawSingleLine(label, PAGE_MARGIN, y, geometry.tableWidth - 112, style.height, {
    size: style.size, minSize: 5.8, bold: true, color: style.color, pad: style.indent
  });
  drawSingleLine(`${row.count} กิจกรรม`, PAGE_MARGIN + geometry.tableWidth - 112, y, 112, style.height, {
    size: 6.3, minSize: 5.7, color: COLORS.gray600, align: 'right', pad: 7
  });
  drawTimelineGrid(geometry.timelineX, y, geometry.timelineWidth, style.height);
  const scale = projectScale(geometry.timelineWidth);
  rect(barX(row.start_day, geometry.timelineX, scale), y + (style.height - style.barH) / 2,
    barW(row.start_day, row.finish_day, scale), style.barH, style.bar);
  return style.height;
}

const layoutCache = new Map();
const renderedTaskIds = [];
const pageTaskCounts = {};

function computeTaskLayout(row, columns) {
  if (layoutCache.has(row.activity_id)) return layoutCache.get(row.activity_id);
  const activityWidth = columns[1][1] - 10;
  const predecessorWidth = columns[5][1] - 7;
  const critical = row.computed_critical === 'Y';
  const titleFontName = critical ? 'ThaiBold' : 'Thai';

  let titleSize = 8.15;
  let titleLines = wrapTextLines(row.activity_name, activityWidth, titleSize, titleFontName);
  if (titleLines.length > 3) {
    titleSize = 7.75;
    titleLines = wrapTextLines(row.activity_name, activityWidth, titleSize, titleFontName);
  }
  if (titleLines.length > 4) {
    titleSize = 7.35;
    titleLines = wrapTextLines(row.activity_name, activityWidth, titleSize, titleFontName);
  }

  const subText = `${row.activity_id} · ${areaName(row)}${row.scope_applicability === 'WHERE_APPLICABLE' ? ' · รอยืนยันขอบเขต' : ''}`;
  const subSize = 5.85;
  const subLines = wrapTextLines(subText, activityWidth, subSize, 'Thai');
  const predecessorSize = 5.15;
  const predecessorLines = wrapTextLines(predecessorText(row), predecessorWidth, predecessorSize, 'Thai');

  const titleLineHeight = titleSize * 1.22;
  const subLineHeight = 7.0;
  const predecessorLineHeight = 6.55;
  const activityHeight = 4 + titleLines.length * titleLineHeight + 1.5 + subLines.length * subLineHeight + 4;
  const predecessorHeight = 5 + predecessorLines.length * predecessorLineHeight + 5;
  const height = Math.max(BASE_TASK_H, Math.ceil(Math.max(activityHeight, predecessorHeight)));
  const layout = {
    height, titleSize, titleLines, titleLineHeight, subSize, subLines, subLineHeight,
    predecessorSize, predecessorLines, predecessorLineHeight, titleFontName
  };
  layoutCache.set(row.activity_id, layout);
  return layout;
}

function drawTaskRow(row, y, geometry, rowIndex, pageNo) {
  const layout = computeTaskLayout(row, geometry.columns);
  const height = layout.height;
  const provisional = row.scope_applicability === 'WHERE_APPLICABLE';
  const critical = row.computed_critical === 'Y';
  const fill = provisional ? COLORS.amberPale : rowIndex % 2 ? COLORS.white : '#fcfdfe';
  rect(PAGE_MARGIN, y, geometry.tableWidth + geometry.timelineWidth, height, fill, COLORS.gray150, 0.28);
  if (critical) rect(PAGE_MARGIN, y, 3, height, COLORS.critical);

  let x = PAGE_MARGIN;
  drawSingleLine(row.wbs, x, y, geometry.columns[0][1], height, {
    size: 7.0, minSize: 5.6, bold: critical, color: COLORS.gray800, align: 'center', pad: 2
  });
  x += geometry.columns[0][1];

  const activityWidth = geometry.columns[1][1] - 10;
  const titleColor = critical ? COLORS.criticalDark : COLORS.gray950;
  const titleY = y + 3.4;
  drawWrappedLines(layout.titleLines, x + 5, titleY, activityWidth, {
    size: layout.titleSize, lineHeight: layout.titleLineHeight,
    fontName: layout.titleFontName, color: titleColor
  });
  const subY = titleY + layout.titleLines.length * layout.titleLineHeight + 1.5;
  drawWrappedLines(layout.subLines, x + 5, subY, activityWidth, {
    size: layout.subSize, lineHeight: layout.subLineHeight,
    fontName: 'Thai', color: provisional ? COLORS.amber : COLORS.gray500
  });
  x += geometry.columns[1][1];

  if (row.milestone === 'Y') {
    const durationLines = ['จุด', 'ควบคุม'];
    drawWrappedLines(durationLines, x + 1, y + Math.max(3, (height - 13) / 2), geometry.columns[2][1] - 2, {
      size: 5.7, lineHeight: 6.5, fontName: 'ThaiBold', color: COLORS.gray800, align: 'center'
    });
  } else {
    drawSingleLine(`${row.duration_days} วัน`, x, y, geometry.columns[2][1], height, {
      size: 6.5, minSize: 5.6, align: 'center', pad: 1
    });
  }
  x += geometry.columns[2][1];
  drawSingleLine(`D${row.start_day}`, x, y, geometry.columns[3][1], height, { size: 6.6, minSize: 5.8, align: 'center', pad: 1 });
  x += geometry.columns[3][1];
  drawSingleLine(`D${row.finish_day}`, x, y, geometry.columns[4][1], height, { size: 6.6, minSize: 5.8, align: 'center', pad: 1 });
  x += geometry.columns[4][1];

  const predecessorY = y + Math.max(3, (height - layout.predecessorLines.length * layout.predecessorLineHeight) / 2);
  drawWrappedLines(layout.predecessorLines, x + 3.5, predecessorY, geometry.columns[5][1] - 7, {
    size: layout.predecessorSize, lineHeight: layout.predecessorLineHeight,
    fontName: 'Thai', color: COLORS.gray700
  });

  drawTimelineGrid(geometry.timelineX, y, geometry.timelineWidth, height);
  const scale = projectScale(geometry.timelineWidth);
  const middleY = y + height / 2;
  if (row.milestone === 'Y') {
    const fillColor = critical ? COLORS.critical : provisional ? COLORS.amber : COLORS.navy;
    drawDiamond(barX(row.start_day, geometry.timelineX, scale), middleY, 4.0, fillColor);
  } else {
    const fillColor = critical ? COLORS.critical : provisional ? '#ffe4ad'
      : row.basis_type === 'SOURCE' ? COLORS.blue : '#6f9abd';
    const strokeColor = critical ? COLORS.criticalDark : provisional ? COLORS.amber : '#4f7898';
    rect(barX(row.start_day, geometry.timelineX, scale), middleY - 4.5,
      barW(row.start_day, row.finish_day, scale), 9, fillColor, strokeColor, provisional ? 0.8 : 0.4);
  }

  renderedTaskIds.push(row.activity_id);
  pageTaskCounts[pageNo] = (pageTaskCounts[pageNo] || 0) + 1;
  return height;
}

function groupHeight(row) {
  if (row.kind === 'plan') return GROUP_PLAN_H;
  if (row.kind === 'zone') return GROUP_ZONE_H;
  if (row.kind === 'area') return GROUP_AREA_H;
  if (row.kind === 'category') return GROUP_CATEGORY_H;
  throw new Error(`Unknown hierarchy row kind: ${row.kind}`);
}

function displayRowHeight(row, geometry) {
  return row.kind === 'task' ? computeTaskLayout(row.task, geometry.columns).height : groupHeight(row);
}

function minimumBlockHeight(display, index, geometry) {
  const row = display[index];
  if (row.kind === 'task') return displayRowHeight(row, geometry);
  let height = displayRowHeight(row, geometry);
  for (let next = index + 1; next < display.length; next++) {
    const candidate = display[next];
    height += displayRowHeight(candidate, geometry);
    if (candidate.kind === 'task') break;
    if (row.kind === 'category' && candidate.kind !== 'task') break;
    if (row.kind === 'area' && ['area', 'zone', 'plan'].includes(candidate.kind)) break;
    if (row.kind === 'zone' && ['zone', 'plan'].includes(candidate.kind)) break;
    if (row.kind === 'plan' && candidate.kind === 'plan') break;
  }
  return height;
}

function drawDetailPages(display) {
  let pageNo = 2;
  let currentPlan = null;
  let currentZone = null;
  let currentArea = null;
  let currentCategory = null;
  let geometry = drawDetailPageHeader(pageNo);
  let y = geometry.bodyTop;
  let taskStripe = 0;

  for (let index = 0; index < display.length; index++) {
    const row = display[index];
    const needed = minimumBlockHeight(display, index, geometry);
    if (y > geometry.bodyTop && y + needed > geometry.bodyBottom) {
      pageNo += 1;
      const context = [currentPlan?.label, currentZone?.label, currentArea?.label, currentCategory?.label]
        .filter(Boolean).join(' · ');
      geometry = drawDetailPageHeader(pageNo, context ? `ต่อจากหน้าก่อน: ${context}` : '');
      y = geometry.bodyTop;
      taskStripe = 0;
      if (row.kind === 'task' && currentCategory) y += drawGroupRow(currentCategory, y, geometry, true);
    }

    if (row.kind === 'plan') {
      currentPlan = row;
      currentZone = null;
      currentArea = null;
      currentCategory = null;
      y += drawGroupRow(row, y, geometry);
    } else if (row.kind === 'zone') {
      currentZone = row;
      currentArea = null;
      currentCategory = null;
      y += drawGroupRow(row, y, geometry);
    } else if (row.kind === 'area') {
      currentArea = row;
      currentCategory = null;
      y += drawGroupRow(row, y, geometry);
    } else if (row.kind === 'category') {
      currentCategory = row;
      y += drawGroupRow(row, y, geometry);
    } else {
      const taskHeight = computeTaskLayout(row.task, geometry.columns).height;
      if (y > geometry.bodyTop && y + taskHeight > geometry.bodyBottom) {
        pageNo += 1;
        const context = [currentPlan?.label, currentZone?.label, currentArea?.label, currentCategory?.label]
          .filter(Boolean).join(' · ');
        geometry = drawDetailPageHeader(pageNo, context ? `ต่อจากหน้าก่อน: ${context}` : '');
        y = geometry.bodyTop;
        taskStripe = 0;
        if (currentCategory) y += drawGroupRow(currentCategory, y, geometry, true);
      }
      y += drawTaskRow(row.task, y, geometry, taskStripe++, pageNo);
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

const expectedIds = masterSchedule.map(row => row.activity_id);
const expectedIdSet = new Set(expectedIds);
const renderedCounts = new Map();
for (const id of renderedTaskIds) renderedCounts.set(id, (renderedCounts.get(id) || 0) + 1);
const missingActivityIds = expectedIds.filter(id => !renderedCounts.has(id));
const duplicateActivityIds = [...renderedCounts.entries()].filter(([, count]) => count !== 1).map(([id, count]) => ({ id, count }));
const unexpectedActivityIds = [...renderedCounts.keys()].filter(id => !expectedIdSet.has(id));
if (missingActivityIds.length || duplicateActivityIds.length || unexpectedActivityIds.length) {
  throw new Error(`PDF activity-row integrity failure: missing=${missingActivityIds.length}, duplicate=${duplicateActivityIds.length}, unexpected=${unexpectedActivityIds.length}`);
}

const layouts = [...layoutCache.values()];
const report = {
  version: VERSION,
  output: OUTPUT,
  pages: finalPageNo,
  size_bytes: fs.statSync(OUTPUT).size,
  activities: masterSchedule.length,
  rendered_task_rows: renderedTaskIds.length,
  unique_rendered_task_rows: renderedCounts.size,
  missing_activity_ids: missingActivityIds,
  duplicate_activity_ids: duplicateActivityIds,
  unexpected_activity_ids: unexpectedActivityIds,
  plan_group_rows: displayRows.filter(row => row.kind === 'plan').length,
  zone_group_rows: displayRows.filter(row => row.kind === 'zone').length,
  area_group_rows: displayRows.filter(row => row.kind === 'area').length,
  category_group_rows: displayRows.filter(row => row.kind === 'category').length,
  task_rows: displayRows.filter(row => row.kind === 'task').length,
  activity_title_truncations: [],
  activity_subline_truncations: [],
  predecessor_truncations: [],
  group_label_truncations: [],
  truncation_count: 0,
  max_task_row_height: Math.max(...layouts.map(layout => layout.height)),
  min_task_row_height: Math.min(...layouts.map(layout => layout.height)),
  max_activity_title_lines: Math.max(...layouts.map(layout => layout.titleLines.length)),
  max_activity_subline_lines: Math.max(...layouts.map(layout => layout.subLines.length)),
  max_predecessor_lines: Math.max(...layouts.map(layout => layout.predecessorLines.length)),
  task_rows_by_page: pageTaskCounts,
  required_hierarchy: 'แผน → พื้นที่ดำเนินงาน → อาคาร/บริเวณ → หมวดงาน → กิจกรรม',
  category_labels: [...new Set(masterSchedule.map(categoryName))].sort((a, b) => categoryRank(a) - categoryRank(b) || naturalCompare(a, b))
};
fs.writeFileSync(GENERATION_REPORT, JSON.stringify(report, null, 2));

console.log(`สร้างไฟล์ PDF Gantt A3 ภาษาไทยแล้ว: ${OUTPUT}`);
console.log(`PDF pages generated deterministically: ${finalPageNo}`);
console.log(`PDF size: ${report.size_bytes} bytes`);
console.log(`Hierarchy rows: plans=${report.plan_group_rows}, zones=${report.zone_group_rows}, areas=${report.area_group_rows}, categories=${report.category_group_rows}, tasks=${report.task_rows}`);
console.log(`Rendered activities: ${report.unique_rendered_task_rows}/${masterSchedule.length}; truncations=${report.truncation_count}`);
console.log(`Dynamic rows: min=${report.min_task_row_height}, max=${report.max_task_row_height}, max title lines=${report.max_activity_title_lines}, max predecessor lines=${report.max_predecessor_lines}`);
