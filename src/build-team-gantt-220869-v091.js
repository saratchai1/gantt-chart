import {
  teamGanttRows as legacyTeamGanttRows
} from './build-team-gantt-220869.js';
import {
  TEAM_SOURCE_METADATA,
  TEAM_WORK_SECTIONS
} from './team-activity-source-220869.js';

const thaiCollator = new Intl.Collator('th', { numeric: true, sensitivity: 'base' });

export const TEAM_GANTT_REVISION = Object.freeze({
  version: '0.9.1',
  issue_status: 'FOR_TEAM_APPROVAL',
  source_file: TEAM_SOURCE_METADATA.source_file,
  source_sheet: TEAM_SOURCE_METADATA.source_sheet,
  source_rows: '1–154',
  source_file_id: 'file_00000000f65c81faae3adc35640d6567',
  source_register_commit_sha: '1405af254e0ffb590455de45170cbcf25d38790c',
  baseline_version: 'v0.8.2',
  baseline_commit_sha: 'fef660d14ae8ddecda66af3980cee939ac72c84d',
  baseline_scope: 'Integrated detailed master schedule, 1,066 activities',
  timing_definition: 'Elapsed span between earliest mapped start and latest mapped finish; not work effort',
  network_definition: 'Summary scope Gantt only; no independent predecessor network or CPM calculation',
  special_cost_definition: 'Control/allowance window only; not cost loading, cash flow or payment timing'
});

const TBC_RULES = new Map([
  [22, 'Baseline ที่ตรึงไว้ไม่มีหมวดงานสถาปัตย์เฉพาะสำหรับโซนทางเข้า–ออกหลัก จึงยกเลิกการใช้ช่วงรวมทั้งโซนและรอทีมยืนยันช่วงเวลา'],
  [33, 'Baseline ที่ตรึงไว้ไม่มีหมวดงานสถาปัตย์เฉพาะสำหรับโซนศึกษาธรรมชาติ 3 จึงยกเลิกการใช้ช่วงรวมทั้งโซนและรอทีมยืนยันช่วงเวลา'],
  [64, 'Baseline ที่ตรึงไว้ไม่มีหมวดงานระบบปรับอากาศและระบายอากาศเฉพาะสำหรับโซนทางเข้า–ออกหลัก จึงไม่สมมติช่วงเวลาแทนทีม'],
  [74, 'Baseline ที่ตรึงไว้ไม่มีหมวดงานตกแต่งภายในเฉพาะสำหรับโซนทางเข้า–ออกหลัก จึงไม่ใช้ช่วงรวมทั้งโซน'],
  [83, 'Baseline ที่ตรึงไว้ไม่มีหมวดงานตกแต่งภายในเฉพาะสำหรับโซนศึกษาธรรมชาติ 3 จึงไม่ใช้ช่วงรวมทั้งโซน'],
  [108, 'ยกเลิกการจับคู่กับ “อาคารห้องนิรันดร์ พื้นที่ A” เพราะไม่ใช่หลักฐานยืนยันว่าเป็นห้องปั๊มและถังเก็บน้ำ; รอแบบ/BOQ/ทีมงานยืนยัน Package และช่วงเวลา']
]);

const STRONG_PHYSICAL_LEVELS = new Set(['AREA_AND_WORK_EXACT', 'ZONE_EQUIPMENT_SCOPE_MATCH']);
const hasTiming = row => Number.isInteger(row.start_day) && Number.isInteger(row.finish_day);
const criticalExposure = row => row.computed_critical === 'Y'
  ? 'CONTAINS_ZERO_FLOAT_DETAIL'
  : 'NONE';

function correctRow(legacy) {
  const base = {
    ...legacy,
    baseline_version: TEAM_GANTT_REVISION.baseline_version,
    baseline_commit_sha: TEAM_GANTT_REVISION.baseline_commit_sha,
    source_register_commit_sha: TEAM_GANTT_REVISION.source_register_commit_sha,
    source_file_id: TEAM_GANTT_REVISION.source_file_id,
    work_effort_days: null,
    duration_basis: 'ELAPSED_SPAN_NOT_WORK_EFFORT',
    network_basis: 'SUMMARY_VIEW_NO_INDEPENDENT_CPM_NETWORK',
    elapsed_span_days: legacy.duration_days,
    timing_status: legacy.source_kind === 'SPECIAL_COST'
      ? 'CONTROL_ALLOWANCE_WINDOW'
      : 'MAPPED_ELAPSED_SPAN',
    mapping_status: legacy.source_kind === 'SPECIAL_COST' ? 'CONTROL_WINDOW' : 'CONFIRMED',
    critical_exposure: criticalExposure(legacy),
    critical_exposure_note: legacy.computed_critical === 'Y'
      ? 'มีอย่างน้อยหนึ่งกิจกรรมรายละเอียดที่อ้างอิงอยู่บนเส้น Total Float = 0; ไม่ได้หมายความว่า Summary bar ทั้งช่วงเป็น Critical Path'
      : 'ไม่พบกิจกรรมรายละเอียดที่อ้างอิงซึ่งมี Total Float = 0',
    source_issue_original: legacy.source_issue || '',
    source_resolution_status: legacy.source_row === 127
      ? 'RESOLVED_DISPLAY_NORMALIZATION'
      : 'CLEAN'
  };

  if (legacy.source_kind === 'SPECIAL_COST') {
    return Object.freeze({
      ...base,
      duration_basis: 'CONTROL_WINDOW_ELAPSED_SPAN_NOT_COST_LOADING',
      timing_basis: 'CONTROL_WINDOW_FROM_PINNED_BASELINE',
      timing_source: `Pinned detailed baseline ${TEAM_GANTT_REVISION.baseline_version} @ ${TEAM_GANTT_REVISION.baseline_commit_sha}; Excel supplies cost headings only`,
      mapping_note: `${legacy.mapping_note} ช่วงนี้เป็นเพียงช่วงควบคุม/ช่วงที่ค่าใช้จ่ายอาจเกิดขึ้น ไม่ใช่ Cash Flow หรือ Payment Schedule`
    });
  }

  if (TBC_RULES.has(legacy.source_row)) {
    return Object.freeze({
      ...base,
      start_day: null,
      finish_day: null,
      duration_days: null,
      elapsed_span_days: null,
      matched_activity_ids: [],
      matched_activity_count: 0,
      source_timing_count: 0,
      assumption_timing_count: 0,
      computed_critical: 'N',
      critical_exposure: 'NOT_ASSESSED_TBC',
      critical_exposure_note: 'ยังไม่ประเมินจนกว่าทีมจะยืนยัน Package และช่วงเวลา',
      timing_status: 'TBC_TEAM_CONFIRMATION',
      mapping_status: 'TBC',
      timing_basis: 'NOT_ASSIGNED',
      duration_basis: 'TBC',
      match_level: 'TIMING_TBC',
      mapping_note: TBC_RULES.get(legacy.source_row),
      timing_source: 'Excel does not provide timing; no bar is assigned until team confirmation',
      superseded_mapping: {
        match_level: legacy.match_level,
        start_day: legacy.start_day,
        finish_day: legacy.finish_day,
        matched_activity_ids: [...legacy.matched_activity_ids],
        rejection_reason: TBC_RULES.get(legacy.source_row)
      }
    });
  }

  if (legacy.source_row === 127) {
    return Object.freeze({
      ...base,
      source_issue: '',
      source_resolution_status: 'RESOLVED_DISPLAY_NORMALIZATION',
      mapping_note: `${legacy.mapping_note} ข้อความแสดงผลแก้เป็น “โซน Drop-off” โดยเก็บข้อความ Excel เดิมและเหตุผลไว้ใน Source Register`,
      normalization_note: `${legacy.normalization_note} สถานะ v0.9.1: แก้คำแสดงผลแล้วและคง Audit Trail`
    });
  }

  return Object.freeze({
    ...base,
    timing_basis: 'DERIVED_FROM_PINNED_BASELINE',
    timing_source: `Pinned detailed baseline ${TEAM_GANTT_REVISION.baseline_version} @ ${TEAM_GANTT_REVISION.baseline_commit_sha}; Excel supplies scope labels only`
  });
}

export const teamGanttRows = Object.freeze(legacyTeamGanttRows.map(correctRow));

function timedRows(rows) {
  return rows.filter(hasTiming);
}

export function spanOfTeamRows(rows) {
  const timed = timedRows(rows);
  if (!timed.length) {
    return {
      start_day: null,
      finish_day: null,
      elapsed_span_days: null,
      confirmed_timing_rows: 0,
      tbc_rows: rows.filter(row => row.timing_status === 'TBC_TEAM_CONFIRMATION').length
    };
  }
  const start = Math.min(...timed.map(row => row.start_day));
  const finish = Math.max(...timed.map(row => row.finish_day));
  return {
    start_day: start,
    finish_day: finish,
    elapsed_span_days: finish - start + 1,
    confirmed_timing_rows: timed.length,
    tbc_rows: rows.filter(row => row.timing_status === 'TBC_TEAM_CONFIRMATION').length
  };
}

const confirmed = teamGanttRows.filter(hasTiming);
const physical = teamGanttRows.filter(row => row.source_kind === 'PHYSICAL_SCOPE');
const special = teamGanttRows.filter(row => row.source_kind === 'SPECIAL_COST');
const tbc = teamGanttRows.filter(row => row.timing_status === 'TBC_TEAM_CONFIRMATION');
const weakPhysical = physical.filter(row =>
  row.timing_status !== 'TBC_TEAM_CONFIRMATION'
  && !STRONG_PHYSICAL_LEVELS.has(row.match_level)
);

export const teamGanttStats = Object.freeze({
  version: TEAM_GANTT_REVISION.version,
  source_file: TEAM_GANTT_REVISION.source_file,
  source_rows: teamGanttRows.length,
  physical_activities: physical.length,
  special_cost_activities: special.length,
  works: new Set(teamGanttRows.map(row => row.work_code)).size,
  zones: new Set(teamGanttRows.map(row => row.zone_code)).size,
  confirmed_timing_rows: confirmed.length,
  tbc_timing_rows: tbc.length,
  control_window_rows: special.length,
  exact_area_work_matches: physical.filter(row => row.match_level === 'AREA_AND_WORK_EXACT').length,
  explicit_scope_matches: physical.filter(row => STRONG_PHYSICAL_LEVELS.has(row.match_level)).length,
  weak_mapping_rows: weakPhysical.length,
  resolved_source_issues: teamGanttRows.filter(row => row.source_resolution_status === 'RESOLVED_DISPLAY_NORMALIZATION').length,
  unresolved_source_issues: teamGanttRows.filter(row => row.source_issue).length,
  critical_exposure_rows: teamGanttRows.filter(row => row.critical_exposure === 'CONTAINS_ZERO_FLOAT_DETAIL').length,
  start_day: Math.min(...confirmed.map(row => row.start_day)),
  finish_day: Math.max(...confirmed.map(row => row.finish_day)),
  tbc_source_rows: tbc.map(row => row.source_row)
});

export function buildTeamGanttHierarchy(rows = teamGanttRows) {
  const workMap = new Map();
  for (const row of rows) {
    if (!workMap.has(row.work_code)) {
      workMap.set(row.work_code, {
        work_code: row.work_code,
        work_name: row.work_name,
        source_row: row.work_code === 'W10'
          ? 140
          : TEAM_WORK_SECTIONS.find(work => work.work_code === row.work_code)?.source_row,
        rows: [],
        zones: []
      });
    }
    workMap.get(row.work_code).rows.push(row);
  }

  const works = [...workMap.values()].sort((a, b) =>
    Number(a.work_code.slice(1)) - Number(b.work_code.slice(1))
  );
  const zoneRank = { A: 1, B: 2, C: 3, D: 4, PROJECT: 5 };

  for (const work of works) {
    const zoneMap = new Map();
    for (const row of work.rows) {
      if (!zoneMap.has(row.zone_code)) {
        zoneMap.set(row.zone_code, {
          zone_code: row.zone_code,
          zone_name: row.zone_name,
          rows: []
        });
      }
      zoneMap.get(row.zone_code).rows.push(row);
    }
    work.zones = [...zoneMap.values()].sort((a, b) =>
      (zoneRank[a.zone_code] || 99) - (zoneRank[b.zone_code] || 99)
      || thaiCollator.compare(a.zone_name, b.zone_name)
    );
    for (const zone of work.zones) {
      zone.rows.sort((a, b) => a.source_row - b.source_row || thaiCollator.compare(a.activity_name, b.activity_name));
      Object.assign(zone, spanOfTeamRows(zone.rows));
    }
    Object.assign(work, spanOfTeamRows(work.rows));
  }
  return works;
}

export function teamGanttCSV(rows = teamGanttRows) {
  const headers = [
    'team_activity_id','wbs','work_code','work_name','zone_code','zone_name','activity_name',
    'source_label','source_row','source_kind','source_resolution_status','normalization_note',
    'mapping_status','match_level','mapping_note','timing_status','start_day','finish_day',
    'elapsed_span_days','duration_basis','timing_basis','timing_source','baseline_version',
    'baseline_commit_sha','source_register_commit_sha','matched_activity_count','matched_activity_ids',
    'critical_exposure','critical_exposure_note','network_basis'
  ];
  const quote = value => `"${String(value ?? '').replaceAll('"', '""')}"`;
  return [headers.join(','), ...rows.map(row => headers.map(header => {
    const value = header === 'matched_activity_ids' ? row.matched_activity_ids.join(';') : row[header];
    return quote(value);
  }).join(','))].join('\n');
}
