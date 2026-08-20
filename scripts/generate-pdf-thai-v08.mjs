import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const sourcePath = path.join(here, 'generate-pdf.mjs');
const runtimePath = path.join(here, '.generate-pdf-thai-v08-runtime.mjs');

let source = fs.readFileSync(sourcePath, 'utf8');

function replaceRequired(needle, replacement, label) {
  if (!source.includes(needle)) {
    throw new Error(`PDF generator block changed; missing ${label}.`);
  }
  source = source.replace(needle, replacement);
}

function replaceOptional(needle, replacement) {
  source = source.replaceAll(needle, replacement);
}

const regularNeedle = `const regularFont = resolveFont([\n  'Noto Sans Thai:style=Regular',\n  'Noto Sans Thai',\n  'Garuda:style=Regular',\n  'Garuda',\n  'Loma'\n]);`;
const boldNeedle = `const boldFont = resolveFont([\n  'Noto Sans Thai:style=Bold',\n  'Noto Sans Thai:style=SemiBold',\n  'Garuda:style=Bold',\n  'Garuda'\n]) || regularFont;`;

replaceRequired(
  regularNeedle,
  `const regularFont = resolveFont([\n  'Garuda:style=Regular',\n  'Garuda',\n  'Loma',\n  'Noto Sans Thai:style=Regular',\n  'Noto Sans Thai'\n]);`,
  'regular font selection'
);
replaceRequired(
  boldNeedle,
  `const boldFont = resolveFont([\n  'Garuda:style=Bold',\n  'Garuda',\n  'Loma:style=Bold',\n  'Noto Sans Thai:style=Bold',\n  'Noto Sans Thai:style=SemiBold'\n]) || regularFont;`,
  'bold font selection'
);
replaceRequired(
  "const OUTPUT = 'data/huai-kha-khaeng-integrated-master-gantt-v0.7.pdf';",
  "const OUTPUT = 'data/huai-kha-khaeng-integrated-master-gantt-v0.8-thai.pdf';",
  'v0.7 output path'
);

const replacements = [
  ['PDF Thai regular font:', 'PDF bilingual Thai/Latin regular font:'],
  ['PDF Thai bold font:', 'PDF bilingual Thai/Latin bold font:'],
  ['Proposal Integrated Master Schedule Baseline v0.7 — readable A3 issue', 'แผนงานหลักแบบบูรณาการ Baseline v0.8 — ฉบับตรวจทาน A3'],
  ['PROPOSAL INTEGRATED MASTER SCHEDULE · BASELINE v0.7', 'แผนงานหลักแบบบูรณาการสำหรับข้อเสนอ · BASELINE v0.8'],
  ['BASELINE v0.7', 'BASELINE v0.8'],
  ['Baseline v0.7', 'Baseline v0.8'],
  ['A3 readable issue · Project Day D1–D1200', 'ฉบับตรวจทาน A3 · วันโครงการ D1–D1200'],
  ['แผนการดำเนินการโครงการ / Physical Delivery', 'แผนการดำเนินการโครงการ'],
  ['แผนงบประมาณ / Payment & Commercial', 'แผนงบประมาณก่อสร้าง'],
  ['แผนการจัดการสถานที่ / Site Management', 'แผนการจัดการสถานที่ก่อสร้าง'],
  ['แผนอัตรากำลัง / Workforce', 'แผนอัตรากำลัง'],
  ['แผนการใช้เครื่องจักร / Plant', 'แผนการใช้เครื่องจักรกล'],
  ['แผนการจัดหาวัสดุ / Procurement', 'แผนการจัดหาวัสดุ'],
  ['แผนควบคุมคุณภาพ / QA/QC', 'แผนควบคุมคุณภาพ'],
  ['แผนความปลอดภัย อาชีวอนามัย / HSE', 'แผนความปลอดภัยและอาชีวอนามัย'],
  ['แผนจราจร / Traffic', 'แผนจราจร'],
  ['แผนสิ่งแวดล้อม / Environment', 'แผนลดและป้องกันผลกระทบสิ่งแวดล้อม'],
  ['แผนบริหารเอกสารอัตโนมัติ / CDE-EDMS', 'แผนบริหารจัดการเอกสารโครงการ'],
  ['แผนติดตามความก้าวหน้า / Project Controls', 'แผนบริหารและติดตามความก้าวหน้า'],
  ['แผน BIM / Digital Twin', 'แผนการใช้แบบจำลองข้อมูลอาคาร'],
  ['แผน Application / AI', 'แผนการใช้โปรแกรมประยุกต์และปัญญาประดิษฐ์'],
  ['แผน Carbon Footprint', 'แผนประเมินคาร์บอนฟุตพริ้นท์'],
  ['แผนป้องกันผลกระทบต่อมรดกโลก / Heritage', 'แผนป้องกันผลกระทบต่อแหล่งมรดกโลก'],
  ['Survey / benchmark / initial approval', 'งานสำรวจ หมุดอ้างอิง และการอนุมัติเริ่มต้น'],
  ['Temporary site systems / workfront readiness', 'ระบบชั่วคราวและความพร้อมเปิดพื้นที่ก่อสร้าง'],
  ['Design / approvals / long-lead procurement', 'งานออกแบบ การอนุมัติ และการจัดหาวัสดุระยะยาว'],
  ['Foundations / main structure — Area A', 'งานฐานรากและโครงสร้างหลัก — พื้นที่ A'],
  ['Architecture / MEP — Area A', 'งานสถาปัตย์และระบบประกอบอาคาร — พื้นที่ A'],
  ['Areas B/C/D + external systems', 'พื้นที่ B/C/D และระบบภายนอก'],
  ['Landscape / detail completion / integration', 'งานภูมิทัศน์ เก็บรายละเอียด และบูรณาการระบบ'],
  ['Commissioning / as-built / O&M / handover', 'งานทดสอบระบบ แบบก่อสร้างจริง คู่มือ และส่งมอบ'],
  ['Project duration', 'ระยะเวลาโครงการ'],
  ['1,200 days', '1,200 วัน'],
  ['Installments', 'งวดงาน'],
  ['Activities', 'กิจกรรม'],
  ['Milestones', 'จุดควบคุม'],
  ['Zero-float', 'กิจกรรมวิกฤต'],
  ['Project Control Windows / Critical Narrative', 'ช่วงควบคุมโครงการและกรอบกิจกรรมวิกฤต'],
  ['Control window / scope', 'ช่วงควบคุม / ขอบเขต'],
  ['Project Days', 'วันโครงการ'],
  ['Plan 01–16 Summary', 'สรุปแผนที่ 01–16'],
  ['Plan / workstream', 'แผน / สายงาน'],
  ['Rows', 'จำนวน'],
  ['Span', 'ช่วงวัน'],
  ['Integrated Master Schedule — ห้วยขาแข้ง', 'แผนงานก่อสร้างห้วยขาแข้ง — แผนงานหลักแบบบูรณาการ'],
  ['1,200 Project Days · 497 Installments ·', 'ระยะเวลา 1,200 วัน · 497 งวดงาน ·'],
  ['Activity / ID / Area', 'กิจกรรม / รหัส / พื้นที่'],
  ['Dur.', 'ระยะเวลา'],
  ['Start', 'เริ่ม'],
  ['Finish', 'สิ้นสุด'],
  ['Predecessor', 'กิจกรรมก่อนหน้า'],
  ["['normal', 'Activity']", "['normal', 'กิจกรรม']"],
  ["['critical', 'Zero-float']", "['critical', 'กิจกรรมวิกฤต']"],
  ["['milestone', 'Milestone']", "['milestone', 'จุดควบคุม']"],
  ["['provisional', 'Scope to verify']", "['provisional', 'ขอบเขตรอยืนยัน']"],
  ['Validation:', 'ผลตรวจ:'],
  ['Physical network Plan 01 complete NTP→D1200', 'เครือข่ายงานก่อสร้างแผนที่ 01 เชื่อมครบ NTP→D1200'],
  ['A3 Landscape · Page', 'A3 แนวนอน · หน้า'],
  ['Generated readable A3 Gantt PDF:', 'สร้างไฟล์ PDF Gantt A3 ภาษาไทยแล้ว:']
];

for (const [needle, replacement] of replacements) {
  replaceOptional(needle, replacement);
}

replaceOptional('label: `Plan ${r.plan_no} — ${PLAN_NAMES[r.plan_no] || \'\'}`', 'label: `แผนที่ ${r.plan_no} — ${PLAN_NAMES[r.plan_no] || \'\'}`');
replaceOptional('`${row.count} rows`', '`${row.count} กิจกรรม`');
replaceOptional('`Plan ${plan} — ${PLAN_NAMES[plan] || \'\'}`', '`แผนที่ ${plan} — ${PLAN_NAMES[plan] || \'\'}`');

fs.writeFileSync(runtimePath, source, 'utf8');
try {
  await import(`${pathToFileURL(runtimePath).href}?build=${Date.now()}`);
} finally {
  fs.rmSync(runtimePath, { force: true });
}
