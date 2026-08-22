import { masterSchedule } from './build-schedule.js';
import {
  TEAM_SOURCE_METADATA,
  TEAM_WORK_SECTIONS,
  TEAM_SPECIAL_COSTS,
  flattenTeamSourceActivities
} from './team-activity-source-220869.js';

const thaiCollator = new Intl.Collator('th', { numeric: true, sensitivity: 'base' });
const normalize = value => String(value ?? '')
  .normalize('NFC')
  .replace(/[–—−]/g, '-')
  .replace(/[()]/g, ' ')
  .replace(/\s+/g, ' ')
  .trim()
  .toLowerCase();

const taskSuffix = row => String(row.activity_id || '').split('-').at(-1) || '';
const rowText = row => normalize([
  row.activity_id,
  row.activity_name,
  row.activity_name_th,
  row.activity_name_en,
  row.building_area,
  row.building_area_th,
  row.building_area_en,
  row.work_category_th,
  row.discipline,
  row.discipline_th,
  row.discipline_en,
  row.source_reference,
  row.notes
].join(' '));

const areaAliases = Object.freeze({
  A_ENTRANCE: ['โซนทางเข้า-ออกหลัก', 'โซนทางเข้า–ออกหลัก'],
  A_DROPOFF: ['จุดรับส่งผู้โดยสาร', 'โซน drop-off', 'drop off', 'drop-off'],
  A_MUSEUM: ['อาคารศูนย์การเรียนรู้ทางธรรมชาติ', 'อาคารรับรอง อาคารพิพิธภัณฑ์และนิทรรศการ', 'พิพิธภัณฑ์และนิทรรศการ'],
  A_RESTAURANT: ['อาคารร้านอาหารและร้านกาแฟ'],
  A_MEETING: ['อาคารประชุมและอเนกประสงค์', 'อาคารประชุม และอเนกประสงค์'],
  A_WATER: ['อาคารผลิตน้ำประปา'],
  A_LAWN: ['สนามหญ้าอเนกประสงค์', 'โซนสนามหญ้าอเนกประสงค์'],
  A_LANDSCAPE: ['ผังบริเวณและภูมิทัศน์ พื้นที่ A', 'งานผังบริเวณและปรับปรุงภูมิทัศน์'],
  A_PUMP_TANK: ['อาคารห้องนิรันดร์ พื้นที่ A', 'ห้องปั๊มและถังเก็บน้ำ พื้นที่ A', 'ห้องปั๊มและถังเก็บน้ำ'],
  A_EQUIPMENT: [],
  B_BATHROOM_WORK: ['อาคารห้องน้ำ พื้นที่ B', 'งานห้องน้ำ'],
  B_BATHROOM_BUILDING: ['อาคารห้องน้ำ พื้นที่ B', 'โซนอาคารห้องน้ำ'],
  B_LANDSCAPE: ['ผังบริเวณและภูมิทัศน์ พื้นที่ B', 'งานผังบริเวณและปรับปรุงภูมิทัศน์'],
  B_WASTE: ['อาคารขยะ พื้นที่ B', 'จุดรวมขยะโครงการ', 'งานจุดรวมขยะโครงการ'],
  B_EQUIPMENT: [],
  B_PARKING: ['ลานจอดรถ พื้นที่ B', 'โซนลานจอดรถ'],
  C_RECEPTION: ['อาคารต้อนรับ พื้นที่ C', 'โซนพื้นที่ต้อนรับ'],
  C_TENT: [
    'บ้านเต็นท์', 'พื้นที่บ้านเต็นท์', 'โซนพื้นที่บ้านเต็นท์',
    'บ้านเต็นท์ Cluster 1', 'บ้านเต็นท์ Cluster 2', 'บ้านเต็นท์ Cluster 3'
  ],
  C_PUMP_TANK: ['อาคารห้องปั๊ม พื้นที่ C', 'ห้องปั๊มและถังเก็บน้ำ'],
  C_EQUIPMENT: [],
  D_NATURE1: ['พื้นที่ศึกษาธรรมชาติ 1', 'โซนศึกษาธรรมชาติ 1'],
  D_NATURE2: ['พื้นที่ศึกษาธรรมชาติ 2', 'โซนศึกษาธรรมชาติ 2'],
  D_NATURE3: ['พื้นที่ศึกษาธรรมชาติ 3', 'โซนศึกษาธรรมชาติ 3']
});

const structuralCategories = new Set([
  'งานสำรวจและปักผัง', 'งานโครงสร้าง', 'งานโครงสร้างและงานโยธา',
  'งานโครงสร้างทางน้ำและโยธา', 'งานระบบระบายน้ำ'
]);
const structuralSuffixes = new Set(['REL','SUR','EXC','BLI','RBF','FMF','HOLD','FND','GB','FRM','ROOF','CTRL','EW','DRN','BASE']);
const architectureSuffixes = new Set(['ENV','EWALL','PART','WFIN','DRW','CEIL','FLR','PNT','SAN']);
const electricalSuffixes = new Set(['ELE','ELE1','ELE2','ICT1','ICT2','CTRL','INST']);
const sanitarySuffixes = new Set(['PLB1','SAN','UTIL','PROC']);
const hvacSuffixes = new Set(['HV1','HV2']);
const interiorSuffixes = new Set(['WFIN','DRW','CEIL','FLR','PNT','FURN','EX01','EX02','EX03']);
const equipmentSuffixes = new Set(['FURN','EX01','EX02','EX03','EQP','PUMP','TANK','INST']);
const landscapeSuffixes = new Set(['SUR','CTRL','EW','DRN','UTIL','BASE','PAVE','ELE','FURN','SOIL','SOFT','IRR','MON','REST','FIN']);
const specialSuffixes = new Set(['ICT1','ICT2','EX01','EX02','EX03','ELE','ELE1','ELE2','PROC','PUMP','CTRL','INST','FUNC','COMM']);
const equipmentMappingKeys = new Set(['A_EQUIPMENT','B_EQUIPMENT','C_EQUIPMENT']);
const strongPhysicalMatchLevels = new Set(['AREA_AND_WORK_EXACT','ZONE_EQUIPMENT_SCOPE_MATCH']);

const familyRules = Object.freeze({
  W01: row => structuralCategories.has(row.work_category_th) || structuralSuffixes.has(taskSuffix(row)),
  W02: row => row.work_category_th === 'สถาปัตย์' || architectureSuffixes.has(taskSuffix(row)),
  W03: row => ['งานระบบไฟฟ้าและสื่อสาร','งานไฟฟ้าและระบบควบคุม'].includes(row.work_category_th) || electricalSuffixes.has(taskSuffix(row)),
  W04: row => row.work_category_th === 'งานระบบสุขาภิบาลและป้องกันอัคคีภัย' || sanitarySuffixes.has(taskSuffix(row)),
  W05: row => row.work_category_th === 'งานระบบปรับอากาศและระบายอากาศ' || hvacSuffixes.has(taskSuffix(row)),
  W06: row => ['งานตกแต่งภายในและนิทรรศการ','สถาปัตย์'].includes(row.work_category_th) && interiorSuffixes.has(taskSuffix(row)),
  W07: row => row.work_category_th === 'งานครุภัณฑ์' || equipmentSuffixes.has(taskSuffix(row)),
  W08: row => [
    'งานภูมิทัศน์','งานภูมิทัศน์และงานภายนอก','งานระบบภายนอก','งานระบบระบายน้ำ',
    'งานสิ่งแวดล้อมและฟื้นฟู','งานฟื้นฟูพื้นที่'
  ].includes(row.work_category_th) || landscapeSuffixes.has(taskSuffix(row)),
  W09: row => [
    'งานระบบพิเศษ','งานระบบครัว','งานระบบผลิตน้ำ','งานระบบกระบวนการ',
    'งานไฟฟ้าและระบบควบคุม','งานตกแต่งภายในและนิทรรศการ'
  ].includes(row.work_category_th) || specialSuffixes.has(taskSuffix(row))
});

function areaMatches(row, mappingKey) {
  const aliases = areaAliases[mappingKey] || [];
  if (!aliases.length) return false;
  const area = normalize(row.building_area_th || row.building_area);
  return aliases.some(alias => {
    const key = normalize(alias);
    return area === key || area.includes(key) || key.includes(area);
  });
}

function aggregateRows(rows) {
  const sorted = [...rows].sort((a, b) =>
    Number(a.start_day) - Number(b.start_day)
    || Number(a.finish_day) - Number(b.finish_day)
    || String(a.activity_id).localeCompare(String(b.activity_id))
  );
  const start = Math.min(...sorted.map(row => Number(row.start_day)));
  const finish = Math.max(...sorted.map(row => Number(row.finish_day)));
  return {
    start_day: start,
    finish_day: finish,
    duration_days: finish - start + 1,
    matched_activity_ids: sorted.map(row => row.activity_id),
    matched_activity_count: sorted.length,
    computed_critical: sorted.some(row => row.computed_critical === 'Y') ? 'Y' : 'N',
    source_timing_count: sorted.filter(row => row.timing_basis === 'SOURCE').length,
    assumption_timing_count: sorted.filter(row => row.timing_basis === 'ASSUMPTION').length
  };
}

function mapPhysicalSourceItem(item) {
  const plan01 = masterSchedule.filter(row => row.plan_no === '01');
  const zoneRows = plan01.filter(row => String(row.zone || '').toUpperCase() === item.zone_code);
  const familyRule = familyRules[item.work_code] || (() => true);
  const familyRows = zoneRows.filter(familyRule);
  const exactAreaRows = zoneRows.filter(row => areaMatches(row, item.mapping_key));
  const exact = exactAreaRows.filter(familyRule);
  const zoneEquipmentRows = equipmentMappingKeys.has(item.mapping_key)
    ? zoneRows.filter(row => row.work_category_th === 'งานครุภัณฑ์' || equipmentSuffixes.has(taskSuffix(row)))
    : [];

  let matched = exact;
  let matchLevel = 'AREA_AND_WORK_EXACT';
  let mappingNote = 'จับคู่โซนย่อยและหมวดงานกับกิจกรรมรายละเอียดใน Baseline';

  if (!matched.length && zoneEquipmentRows.length) {
    matched = zoneEquipmentRows;
    matchLevel = 'ZONE_EQUIPMENT_SCOPE_MATCH';
    mappingNote = 'รายการ Excel เป็นงานครุภัณฑ์ระดับโซน จึงจับคู่เฉพาะกิจกรรมครุภัณฑ์/อุปกรณ์ในโซน ไม่ใช้ช่วงรวมของหมวดงานอื่น';
  }
  if (!matched.length && exactAreaRows.length) {
    matched = exactAreaRows;
    matchLevel = 'AREA_ALL_WORK_FALLBACK';
    mappingNote = 'Baseline ไม่มีหมวดงานย่อยตรงชื่อ Excel ในพื้นที่นี้ จึงใช้ช่วงรวมของโซนย่อยเดียวกัน';
  }
  if (!matched.length && familyRows.length) {
    matched = familyRows;
    matchLevel = 'ZONE_WORK_FALLBACK';
    mappingNote = 'Baseline ไม่มีชื่อโซนย่อยตรงกับ Excel จึงใช้ช่วงหมวดงานเดียวกันภายในโซนหลัก';
  }
  if (!matched.length) {
    matched = zoneRows;
    matchLevel = 'ZONE_ALL_WORK_FALLBACK';
    mappingNote = 'Baseline ไม่มีทั้งชื่อโซนย่อยและหมวดงานตรงกัน จึงใช้ช่วงรวมโซนหลักเพื่อไม่สร้างวันที่ขึ้นใหม่';
  }

  if (!matched.length) {
    throw new Error(`No baseline timing could be derived for Excel source row ${item.source_row}: ${item.source_label}`);
  }

  return {
    team_activity_id: `T220869-${item.work_code}-${String(item.source_row).padStart(3, '0')}`,
    wbs: `${Number(item.work_code.slice(1))}.${item.zone_code}.${String(item.source_row).padStart(3, '0')}`,
    work_code: item.work_code,
    work_name: item.work_label,
    zone_code: item.zone_code,
    zone_name: item.zone_label,
    activity_name: item.display_label,
    source_label: item.source_label,
    source_row: item.source_row,
    source_kind: item.source_kind,
    source_issue: item.source_issue || '',
    normalization_note: item.normalization_note || '',
    mapping_key: item.mapping_key,
    match_level: matchLevel,
    mapping_note: mappingNote,
    timing_basis: 'DERIVED_FROM_EXISTING_BASELINE',
    timing_source: 'Existing integrated master schedule v0.8.2; Excel 220869 supplies scope labels only',
    ...aggregateRows(matched)
  };
}

const specialCostRules = Object.freeze({
  SC_TEMP_FENCE: row => row.activity_id === 'P03-SITE-005' || /boundary|barricade|temporary fence/.test(rowText(row)),
  SC_SPECIAL_SCAFFOLD: row => /^P08-.*-WAH$/.test(row.activity_id) || /scaffold|work-at-height|fall-protection|fall rescue/.test(rowText(row)),
  SC_DUST_CONTROL: row => row.plan_no === '10' && /dust|air quality|environmental control|monitoring|boundary|sediment/.test(rowText(row)),
  SC_SPECIAL_PLANT: row => row.plan_no === '05',
  SC_OFFSITE_WORKER_ACCOMMODATION: row => row.plan_no === '04',
  SC_DRONE: row => row.plan_no === '14' || /drone|uav|aerial|unmanned/.test(rowText(row)),
  SC_RELOCATION_DEMOLITION: row => ['P03-SITE-001','P10-ENV-003','P10-ENV-REST','P03-SITE-DEMOB'].includes(row.activity_id) || /demolition|relocation|remove temporary|restoration/.test(rowText(row)),
  SC_FIELD_OFFICE: row => row.activity_id === 'P03-SITE-002',
  SC_EMPLOYER_FACILITIES: row => row.activity_id === 'P03-SITE-002' || row.activity_id === 'P04-WF-REVIEW',
  SC_SITE_EXIT_CLEANING: row => row.plan_no === '09' || /cleaning|public road|route control|wheel wash|site exit/.test(rowText(row)),
  SC_SPECIALIST_TESTING: row => row.plan_no === '07' || row.work_category_th === 'งานทดสอบและเดินระบบ' || ['PRECOM','FUNC','COMM'].includes(taskSuffix(row))
});

function mapSpecialCost(item) {
  const rule = specialCostRules[item.mapping_key];
  let matched = rule ? masterSchedule.filter(rule) : [];
  let matchLevel = 'CONTROL_STREAM_MATCH';
  let mappingNote = 'จับคู่กับกิจกรรมควบคุม/สนับสนุนที่มีอยู่ใน Baseline';
  if (!matched.length) {
    matched = masterSchedule.filter(row => row.plan_no === '03');
    matchLevel = 'PROJECT_CONTROL_FALLBACK';
    mappingNote = 'ไม่พบคำสำคัญเฉพาะ จึงใช้ช่วงงานบริหารพื้นที่ก่อสร้างเป็นฐานเวลาโดยไม่สร้างวันใหม่';
  }

  return {
    team_activity_id: `T220869-W10-${String(item.number).padStart(2, '0')}`,
    wbs: `10.${String(item.number).padStart(2, '0')}`,
    work_code: 'W10',
    work_name: 'ค่าใช้จ่ายพิเศษตามข้อกำหนดทุกรายการ',
    zone_code: 'PROJECT',
    zone_name: 'ทั้งโครงการ',
    activity_name: item.display_label,
    source_label: item.source_label,
    source_row: item.source_row,
    source_kind: 'SPECIAL_COST',
    source_issue: '',
    normalization_note: item.continuation_rows?.length
      ? `รวมข้อความต่อเนื่องจากแถว ${item.continuation_rows.map(row => row.source_row).join(', ')}`
      : '',
    mapping_key: item.mapping_key,
    match_level: matchLevel,
    mapping_note: mappingNote,
    timing_basis: 'DERIVED_FROM_EXISTING_BASELINE',
    timing_source: 'Existing integrated master schedule v0.8.2; Excel 220869 supplies cost headings only',
    ...aggregateRows(matched)
  };
}

const sourceItems = flattenTeamSourceActivities();
const physicalSourceItems = sourceItems.filter(item => item.source_kind === 'PHYSICAL_SCOPE');

export const teamGanttRows = Object.freeze([
  ...physicalSourceItems.map(mapPhysicalSourceItem),
  ...TEAM_SPECIAL_COSTS.map(mapSpecialCost)
]);

export const teamGanttStats = Object.freeze({
  source_file: TEAM_SOURCE_METADATA.source_file,
  source_rows: sourceItems.length,
  physical_activities: teamGanttRows.filter(row => row.source_kind === 'PHYSICAL_SCOPE').length,
  special_cost_activities: teamGanttRows.filter(row => row.source_kind === 'SPECIAL_COST').length,
  works: new Set(teamGanttRows.map(row => row.work_code)).size,
  zones: new Set(teamGanttRows.map(row => row.zone_code)).size,
  exact_area_work_matches: teamGanttRows.filter(row => row.match_level === 'AREA_AND_WORK_EXACT').length,
  explicit_scope_matches: teamGanttRows.filter(row => strongPhysicalMatchLevels.has(row.match_level)).length,
  fallback_matches: teamGanttRows.filter(row => !strongPhysicalMatchLevels.has(row.match_level) && row.source_kind === 'PHYSICAL_SCOPE').length,
  source_issues: teamGanttRows.filter(row => row.source_issue).length,
  start_day: Math.min(...teamGanttRows.map(row => row.start_day)),
  finish_day: Math.max(...teamGanttRows.map(row => row.finish_day))
});

export function buildTeamGanttHierarchy(rows = teamGanttRows) {
  const workMap = new Map();
  for (const row of rows) {
    if (!workMap.has(row.work_code)) {
      workMap.set(row.work_code, {
        work_code: row.work_code,
        work_name: row.work_name,
        source_row: row.work_code === 'W10' ? 140 : TEAM_WORK_SECTIONS.find(work => work.work_code === row.work_code)?.source_row,
        rows: [],
        zones: []
      });
    }
    workMap.get(row.work_code).rows.push(row);
  }

  const works = [...workMap.values()].sort((a, b) => Number(a.work_code.slice(1)) - Number(b.work_code.slice(1)));
  for (const work of works) {
    const zoneMap = new Map();
    for (const row of work.rows) {
      if (!zoneMap.has(row.zone_code)) zoneMap.set(row.zone_code, { zone_code: row.zone_code, zone_name: row.zone_name, rows: [] });
      zoneMap.get(row.zone_code).rows.push(row);
    }
    work.zones = [...zoneMap.values()].sort((a, b) => {
      const rank = { A: 1, B: 2, C: 3, D: 4, PROJECT: 5 };
      return (rank[a.zone_code] || 99) - (rank[b.zone_code] || 99) || thaiCollator.compare(a.zone_name, b.zone_name);
    });
    for (const zoneGroup of work.zones) {
      zoneGroup.rows.sort((a, b) => a.source_row - b.source_row || thaiCollator.compare(a.activity_name, b.activity_name));
      zoneGroup.start_day = Math.min(...zoneGroup.rows.map(row => row.start_day));
      zoneGroup.finish_day = Math.max(...zoneGroup.rows.map(row => row.finish_day));
      zoneGroup.duration_days = zoneGroup.finish_day - zoneGroup.start_day + 1;
    }
    work.start_day = Math.min(...work.rows.map(row => row.start_day));
    work.finish_day = Math.max(...work.rows.map(row => row.finish_day));
    work.duration_days = work.finish_day - work.start_day + 1;
  }
  return works;
}

export function teamGanttCSV(rows = teamGanttRows) {
  const headers = [
    'team_activity_id','wbs','work_code','work_name','zone_code','zone_name','activity_name',
    'source_label','source_row','source_kind','source_issue','normalization_note','start_day',
    'finish_day','duration_days','timing_basis','match_level','mapping_note','matched_activity_count',
    'matched_activity_ids','computed_critical'
  ];
  const quote = value => `"${String(value ?? '').replaceAll('"', '""')}"`;
  return [headers.join(','), ...rows.map(row => headers.map(header => {
    const value = header === 'matched_activity_ids' ? row.matched_activity_ids.join(';') : row[header];
    return quote(value);
  }).join(','))].join('\n');
}
