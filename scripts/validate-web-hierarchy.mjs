import fs from 'node:fs';
import { masterSchedule } from '../src/build-schedule.js';
import { buildWebHierarchy, canonicalZone, isMainZone } from '../src/web-hierarchy.js';

const planNames = Object.fromEntries(
  [...new Set(masterSchedule.map(row => row.plan_no))].map(planNo => [planNo, `แผน ${planNo}`])
);
const hierarchy = buildWebHierarchy(masterSchedule, planNames);
const errors = [];
const advisories = [];
const addError = (message, detail = null) => errors.push({ message, detail });
const addAdvisory = (message, detail = null) => advisories.push({ message, detail });

const expectedIds = masterSchedule.map(row => row.activity_id);
const expectedSet = new Set(expectedIds);
const renderedIds = hierarchy.activity_ids;
const renderedSet = new Set(renderedIds);

if (renderedIds.length !== masterSchedule.length) {
  addError('Hierarchy activity-row count does not equal the master schedule', {
    expected: masterSchedule.length,
    actual: renderedIds.length
  });
}
if (renderedSet.size !== expectedSet.size) {
  addError('Hierarchy contains duplicate activity rows', {
    expected_unique: expectedSet.size,
    actual_unique: renderedSet.size
  });
}
const missingIds = expectedIds.filter(id => !renderedSet.has(id));
const unexpectedIds = renderedIds.filter(id => !expectedSet.has(id));
if (missingIds.length) addError('Hierarchy is missing activity IDs', missingIds.slice(0, 30));
if (unexpectedIds.length) addError('Hierarchy contains unexpected activity IDs', unexpectedIds.slice(0, 30));

const plan01 = hierarchy.plans.find(plan => plan.plan_no === '01');
if (!plan01) {
  addError('Plan 01 hierarchy is missing');
} else {
  const plan01Zones = new Set(plan01.zones.map(zone => canonicalZone(zone.zone_code)));
  for (const code of ['A', 'B', 'C', 'D']) {
    if (!plan01Zones.has(code)) addError(`Plan 01 main zone ${code} is missing`);
  }
  for (const zone of plan01.zones.filter(zone => isMainZone(zone.zone_code))) {
    if (!zone.subzones.length) addError(`Main zone ${zone.zone_code} has no subzones`);
    for (const subzone of zone.subzones) {
      if (!subzone.works.length) addError('Subzone has no work-category groups', {
        zone: zone.zone_code,
        subzone: subzone.label
      });
    }
  }
}

if (hierarchy.stats.plans !== 16) addError('Expected 16 plan groups', hierarchy.stats.plans);
if (hierarchy.stats.main_zones < 4) addError('Expected at least four A–D main-zone groups', hierarchy.stats.main_zones);
if (!hierarchy.stats.subzones) addError('No subzone groups were created');
if (!hierarchy.stats.works) addError('No work-category groups were created');

const css = fs.readFileSync('style.css', 'utf8');
const html = fs.readFileSync('detailed.html', 'utf8');
const app = fs.readFileSync('app.js', 'utf8');
const requiredCssSelectors = [
  '.zone-row', '.subzone-row', '.work-row',
  '.tgroup.zone', '.tgroup.subzone', '.tgroup.work',
  '.swatch.zone-main', '.swatch.subzone', '.swatch.work'
];
for (const selector of requiredCssSelectors) {
  if (!css.includes(selector)) addError(`Required hierarchy CSS selector is missing: ${selector}`);
}
for (const variable of ['--zone-blue-bg', '--subzone-green-bg', '--work-gray-bg']) {
  if (!css.includes(variable)) addError(`Required hierarchy color variable is missing: ${variable}`);
}
for (const phrase of [
  'สีฟ้า — โซนหลัก A–D',
  'สีเขียว — โซนย่อย / อาคาร–บริเวณ',
  'สีเทา — งาน / หมวดงาน',
  'แผนงานรายละเอียด 1,066 กิจกรรม'
]) {
  if (!html.includes(phrase)) addError(`Required detailed hierarchy explanation is missing from detailed.html: ${phrase}`);
}
for (const type of ['plan', 'zone', 'subzone', 'work']) {
  if (!app.includes(`${type}: new Set()`)) addError(`Collapse-state set is missing for hierarchy type: ${type}`);
}
if (!app.includes('buildWebHierarchy(rows, planNames)')) addError('Detailed web app does not render from the shared hierarchy model');

const nonMainZoneGroups = hierarchy.plans
  .flatMap(plan => plan.zones)
  .filter(zone => !zone.main_zone).length;
if (nonMainZoneGroups > hierarchy.stats.zones * 0.8) {
  addAdvisory('Most hierarchy zone groups are project/support phases rather than A–D main zones', {
    non_main_zone_groups: nonMainZoneGroups,
    total_zone_groups: hierarchy.stats.zones
  });
}

const report = {
  status: errors.length ? 'FAIL' : advisories.length ? 'PASS_WITH_ADVISORIES' : 'PASS',
  validated_page: 'detailed.html',
  hierarchy: hierarchy.stats,
  plan01_main_zones: plan01
    ? plan01.zones.filter(zone => zone.main_zone).map(zone => ({
      code: zone.zone_code,
      label: zone.label,
      subzones: zone.subzones.length,
      works: zone.subzones.reduce((sum, subzone) => sum + subzone.works.length, 0),
      activities: zone.rows.length
    }))
    : [],
  missing_activity_ids: missingIds,
  unexpected_activity_ids: unexpectedIds,
  errors,
  advisories
};

fs.mkdirSync('data', { recursive: true });
fs.writeFileSync('data/web-hierarchy-validation.json', JSON.stringify(report, null, 2));
console.log(`Detailed web hierarchy validation: ${report.status}`);
console.log(`Plans=${hierarchy.stats.plans}; zones=${hierarchy.stats.zones}; main zones=${hierarchy.stats.main_zones}; subzones=${hierarchy.stats.subzones}; works=${hierarchy.stats.works}; activities=${hierarchy.stats.activities}`);
console.log(`Errors=${errors.length}; advisories=${advisories.length}`);
if (errors.length) {
  console.error(JSON.stringify(errors, null, 2));
  process.exit(1);
}
