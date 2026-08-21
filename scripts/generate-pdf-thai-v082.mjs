import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const sourcePath = path.join(here, 'generate-pdf-thai-v081.mjs');
const runtimePath = path.join(here, '.generate-pdf-thai-v082-runtime.mjs');
let source = fs.readFileSync(sourcePath, 'utf8');

function replaceRequired(needle, replacement, label) {
  if (!source.includes(needle)) throw new Error(`PDF v0.8.1 generator changed; missing ${label}.`);
  source = source.replace(needle, replacement);
}

function replaceRegexRequired(pattern, replacement, label) {
  if (!pattern.test(source)) throw new Error(`PDF v0.8.1 generator changed; missing ${label}.`);
  source = source.replace(pattern, replacement);
}

replaceRequired(
  "import { masterSchedule, scheduleStats, validation } from '../src/build-schedule.js';",
  "import { masterSchedule, scheduleStats, validation } from '../src/build-schedule.js';\nimport { buildWebHierarchy, naturalCompare as hierarchyNaturalCompare, subzoneName as hierarchySubzoneName, workCategoryName as hierarchyWorkCategoryName } from '../src/web-hierarchy.js';",
  'shared web hierarchy import'
);
replaceRequired("const VERSION = '0.8.1';", "const VERSION = '0.8.2';", 'version');
replaceRequired(
  "const OUTPUT = 'data/huai-kha-khaeng-integrated-master-gantt-v0.8.1-thai.pdf';",
  "const OUTPUT = 'data/huai-kha-khaeng-integrated-master-gantt-v0.8.2-thai.pdf';",
  'output path'
);
replaceRequired(
  "const GENERATION_REPORT = 'data/pdf-generation-report-v081.json';",
  "const GENERATION_REPORT = 'data/pdf-generation-report-v082.json';",
  'generation report path'
);

replaceRequired(
  "\nconst PLAN_NAMES = {",
  `\nconst PDF_HIERARCHY_COLORS = Object.freeze({
  plan: Object.freeze({ fill: '#e4eef7', stroke: '#b8cadb', text: '#102f53', bar: '#173a63' }),
  main_zone: Object.freeze({ fill: '#d9ecfb', stroke: '#8eb9dd', text: '#174d78', bar: '#2f7ebc' }),
  auxiliary_zone: Object.freeze({ fill: '#edf3f8', stroke: '#c5d3df', text: '#315c78', bar: '#7895aa' }),
  subzone: Object.freeze({ fill: '#e6f5e9', stroke: '#b8dcc2', text: '#1f6840', bar: '#4f9a68' }),
  work: Object.freeze({ fill: '#eceff2', stroke: '#cfd5dc', text: '#45515e', bar: '#7a8793' })
});

const PLAN_NAMES = {`,
  'PDF hierarchy color palette'
);

replaceRegexRequired(
  /function naturalCompare\(a, b\) \{[\s\S]*?\nfunction predecessorText\(row\) \{/,
  `function naturalCompare(a, b) {
  return hierarchyNaturalCompare(a, b);
}

function areaName(row) {
  return hierarchySubzoneName(row);
}

function categoryName(row) {
  return hierarchyWorkCategoryName(row);
}

function categoryRank(name) {
  return CATEGORY_RANK.has(name) ? CATEGORY_RANK.get(name) : 999;
}

function buildDisplayRows(rows) {
  const hierarchy = buildWebHierarchy(rows, PLAN_NAMES);
  const display = [];
  for (const plan of hierarchy.plans) {
    display.push({
      kind: 'plan', plan_no: plan.plan_no,
      label: plan.label.replace(/^แผน /, 'แผนที่ '),
      count: plan.count, start_day: plan.start_day, finish_day: plan.finish_day
    });
    for (const zone of plan.zones) {
      display.push({
        kind: 'zone', plan_no: plan.plan_no, zone: zone.zone_code,
        main_zone: zone.main_zone, label: zone.label,
        count: zone.count, start_day: zone.start_day, finish_day: zone.finish_day
      });
      for (const subzone of zone.subzones) {
        display.push({
          kind: 'area', plan_no: plan.plan_no, zone: zone.zone_code,
          area: subzone.label, label: \`โซนย่อย — \${subzone.label}\`,
          count: subzone.count, start_day: subzone.start_day, finish_day: subzone.finish_day
        });
        for (const work of subzone.works) {
          display.push({
            kind: 'category', plan_no: plan.plan_no, zone: zone.zone_code,
            area: subzone.label, category: work.label, label: \`งาน — \${work.label}\`,
            count: work.count, start_day: work.start_day, finish_day: work.finish_day
          });
          for (const task of work.rows) display.push({ kind: 'task', task });
        }
      }
    }
  }
  return display;
}

function predecessorText(row) {`,
  'shared hierarchy flattening block'
);

replaceRegexRequired(
  /function drawLegend\(x, y\) \{[\s\S]*?\n\}\n\nfunction drawPageFooter/,
  `function drawLegend(x, y) {
  const items = [
    ['main_zone', 'โซนหลัก'], ['subzone', 'โซนย่อย'], ['work', 'งาน'],
    ['normal', 'กิจกรรม'], ['critical', 'วิกฤต'], ['milestone', 'จุดควบคุม'],
    ['provisional', 'รอยืนยัน']
  ];
  let cursor = x;
  for (const [kind, label] of items) {
    if (kind === 'milestone') {
      drawDiamond(cursor + 4, y + 4, 3.2, COLORS.navy);
    } else {
      let fill = COLORS.blue;
      let stroke = fill;
      if (kind === 'main_zone') {
        fill = PDF_HIERARCHY_COLORS.main_zone.fill;
        stroke = PDF_HIERARCHY_COLORS.main_zone.stroke;
      } else if (kind === 'subzone') {
        fill = PDF_HIERARCHY_COLORS.subzone.fill;
        stroke = PDF_HIERARCHY_COLORS.subzone.stroke;
      } else if (kind === 'work') {
        fill = PDF_HIERARCHY_COLORS.work.fill;
        stroke = PDF_HIERARCHY_COLORS.work.stroke;
      } else if (kind === 'critical') {
        fill = COLORS.critical;
        stroke = COLORS.critical;
      } else if (kind === 'provisional') {
        fill = COLORS.amberPale;
        stroke = COLORS.amber;
      }
      rect(cursor, y + 1, 16, 7, fill, stroke, 0.6);
    }
    drawTextLine(label, cursor + 20, y, 69, { size: 5.75, minSize: 5.1, color: COLORS.gray600 });
    cursor += 89;
  }
}

function drawPageFooter`,
  'hierarchy and task legend'
);

replaceRequired(
  "['WBS', 64], ['กิจกรรม / รหัส / พื้นที่', 366], ['ระยะเวลา', 54],",
  "['WBS', 64], ['โซน / งาน / กิจกรรม / รหัส', 366], ['ระยะเวลา', 54],",
  'detail activity column heading'
);
replaceRequired(
  "align: label === 'กิจกรรม / รหัส / พื้นที่' || label === 'กิจกรรมก่อนหน้า' ? 'left' : 'center'",
  "align: label === 'โซน / งาน / กิจกรรม / รหัส' || label === 'กิจกรรมก่อนหน้า' ? 'left' : 'center'",
  'detail activity column alignment'
);

replaceRegexRequired(
  /function groupStyle\(kind\) \{[\s\S]*?\n\}\n\nfunction drawGroupRow/,
  `function groupStyle(row) {
  if (row.kind === 'plan') return {
    height: GROUP_PLAN_H,
    fill: PDF_HIERARCHY_COLORS.plan.fill,
    stroke: PDF_HIERARCHY_COLORS.plan.stroke,
    color: PDF_HIERARCHY_COLORS.plan.text,
    size: 8.6, indent: 7,
    bar: PDF_HIERARCHY_COLORS.plan.bar, barH: 6.5
  };
  if (row.kind === 'zone') {
    const palette = row.main_zone ? PDF_HIERARCHY_COLORS.main_zone : PDF_HIERARCHY_COLORS.auxiliary_zone;
    return {
      height: GROUP_ZONE_H, fill: palette.fill, stroke: palette.stroke, color: palette.text,
      size: row.main_zone ? 8.2 : 8.0, indent: 14, bar: palette.bar, barH: 6
    };
  }
  if (row.kind === 'area') return {
    height: GROUP_AREA_H,
    fill: PDF_HIERARCHY_COLORS.subzone.fill,
    stroke: PDF_HIERARCHY_COLORS.subzone.stroke,
    color: PDF_HIERARCHY_COLORS.subzone.text,
    size: 7.9, indent: 22,
    bar: PDF_HIERARCHY_COLORS.subzone.bar, barH: 6
  };
  return {
    height: GROUP_CATEGORY_H,
    fill: PDF_HIERARCHY_COLORS.work.fill,
    stroke: PDF_HIERARCHY_COLORS.work.stroke,
    color: PDF_HIERARCHY_COLORS.work.text,
    size: 7.5, indent: 31,
    bar: PDF_HIERARCHY_COLORS.work.bar, barH: 5
  };
}

function drawGroupRow`,
  'zone/subzone/work row colors'
);
replaceRequired('  const style = groupStyle(row.kind);', '  const style = groupStyle(row);', 'group style invocation');

replaceRequired(
  "drawTextLine('ฉบับพร้อมส่งทีมงาน · A3 แนวนอน · วันโครงการ D1–D1200'",
  "drawTextLine('ฉบับสีตามลำดับโซนและงาน · A3 แนวนอน · วันโครงการ D1–D1200'",
  'summary issue description'
);
replaceRequired(
  "required_hierarchy: 'แผน → พื้นที่ดำเนินงาน → อาคาร/บริเวณ → หมวดงาน → กิจกรรม',",
  "required_hierarchy: 'แผน → โซนหลัก/พื้นที่ดำเนินงาน → โซนย่อย/อาคาร–บริเวณ → งาน/หมวดงาน → กิจกรรม',\n  hierarchy_source: 'src/web-hierarchy.js',\n  main_zone_group_rows: displayRows.filter(row => row.kind === 'zone' && row.main_zone).length,\n  hierarchy_color_semantics: PDF_HIERARCHY_COLORS,",
  'hierarchy declaration and semantic report'
);
replaceRequired(
  'console.log(`Hierarchy rows: plans=${report.plan_group_rows}, zones=${report.zone_group_rows}, areas=${report.area_group_rows}, categories=${report.category_group_rows}, tasks=${report.task_rows}`);',
  'console.log(`Hierarchy rows: plans=${report.plan_group_rows}, zones=${report.zone_group_rows}, main zones=${report.main_zone_group_rows}, subzones=${report.area_group_rows}, works=${report.category_group_rows}, tasks=${report.task_rows}`);',
  'hierarchy log'
);

fs.writeFileSync(runtimePath, source, 'utf8');
try {
  await import(`${pathToFileURL(runtimePath).href}?build=${Date.now()}`);
} finally {
  fs.rmSync(runtimePath, { force: true });
}
