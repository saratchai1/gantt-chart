import {
  TEAM_GANTT_REVISION,
  teamGanttRows,
  teamGanttStats,
  buildTeamGanttHierarchy,
  spanOfTeamRows,
  teamGanttCSV
} from './src/build-team-gantt-220869-v091.js';
import { TEAM_SOURCE_METADATA } from './src/team-activity-source-220869.js';
import { downloadText } from './src/schedule-core.js';

const ids = [
  'metrics','search','workFilter','zoneFilter','mappingFilter','criticalOnly','resetFilters',
  'zoom','timelineHead','leftGrid','timelineGrid','drawer','drawerContent','drawerClose',
  'exportCsv','exportJson'
];
const els = Object.fromEntries(ids.map(id => [id, document.getElementById(id)]));
const collapsedWorks = new Set();
const collapsedZones = new Set();
const rowById = new Map(teamGanttRows.map(row => [row.team_activity_id, row]));
let pxDay = Number(els.zoom.value);

const esc = value => String(value ?? '').replace(/[&<>"']/g, character => ({
  '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'
}[character]));
const nfmt = value => new Intl.NumberFormat('th-TH').format(value);
const hasTiming = row => Number.isInteger(row.start_day) && Number.isInteger(row.finish_day);

function mappingLabel(level) {
  const labels = {
    AREA_AND_WORK_EXACT: 'ตรงโซนย่อยและหมวดงาน',
    ZONE_EQUIPMENT_SCOPE_MATCH: 'ตรงขอบเขตครุภัณฑ์ระดับโซน',
    TIMING_TBC: 'รอทีมยืนยัน Package และช่วงเวลา',
    CONTROL_STREAM_MATCH: 'ช่วงควบคุม/ช่วงที่ค่าใช้จ่ายอาจเกิดขึ้น',
    PROJECT_CONTROL_FALLBACK: 'ช่วงควบคุมโครงการ'
  };
  return labels[level] || level;
}

function timingLabel(row) {
  if (row.timing_status === 'TBC_TEAM_CONFIRMATION') return 'TBC — รอทีมยืนยันเวลา';
  if (row.timing_status === 'CONTROL_ALLOWANCE_WINDOW') return `ช่วงควบคุม ${nfmt(row.elapsed_span_days)} วันครอบคลุม`;
  return `${nfmt(row.elapsed_span_days)} วันครอบคลุม`;
}

function dayLabel(row) {
  return hasTiming(row) ? `D${row.start_day}–D${row.finish_day}` : 'TBC';
}

function initFilters() {
  const works = [...new Map(teamGanttRows.map(row => [row.work_code, row.work_name])).entries()]
    .sort(([a], [b]) => Number(a.slice(1)) - Number(b.slice(1)));
  for (const [code, label] of works) {
    const option = document.createElement('option');
    option.value = code;
    option.textContent = `${code} — ${label}`;
    els.workFilter.append(option);
  }
  const zoneLabels = { A:'Zone A', B:'Zone B', C:'Zone C', D:'Zone D', PROJECT:'ทั้งโครงการ' };
  for (const code of ['A','B','C','D','PROJECT']) {
    if (!teamGanttRows.some(row => row.zone_code === code)) continue;
    const option = document.createElement('option');
    option.value = code;
    option.textContent = `${code === 'PROJECT' ? '' : code + ' — '}${zoneLabels[code]}`;
    els.zoneFilter.append(option);
  }
}

function filteredRows() {
  const query = els.search.value.trim().toLowerCase();
  return teamGanttRows.filter(row => {
    if (els.workFilter.value && row.work_code !== els.workFilter.value) return false;
    if (els.zoneFilter.value && row.zone_code !== els.zoneFilter.value) return false;
    if (els.mappingFilter.value && row.match_level !== els.mappingFilter.value) return false;
    if (els.criticalOnly.checked && row.critical_exposure !== 'CONTAINS_ZERO_FLOAT_DETAIL') return false;
    if (query) {
      const haystack = [
        row.team_activity_id,row.wbs,row.work_name,row.zone_name,row.activity_name,row.source_label,
        row.source_row,row.mapping_key,row.match_level,row.mapping_note,row.source_issue_original,
        row.normalization_note,row.timing_status,row.mapping_status,row.baseline_commit_sha,
        row.matched_activity_ids.join(' ')
      ].join(' ').toLowerCase();
      if (!haystack.includes(query)) return false;
    }
    return true;
  });
}

function renderMetrics(rows, hierarchy) {
  const tbc = rows.filter(row => row.timing_status === 'TBC_TEAM_CONFIRMATION').length;
  const control = rows.filter(row => row.timing_status === 'CONTROL_ALLOWANCE_WINDOW').length;
  const confirmedPhysical = rows.filter(row => row.source_kind === 'PHYSICAL_SCOPE' && row.timing_status === 'MAPPED_ELAPSED_SPAN').length;
  const exposure = rows.filter(row => row.critical_exposure === 'CONTAINS_ZERO_FLOAT_DETAIL').length;
  const resolved = rows.filter(row => row.source_resolution_status === 'RESOLVED_DISPLAY_NORMALIZATION').length;
  const metrics = [
    ['กิจกรรมจาก Excel', nfmt(teamGanttStats.source_rows), `แสดง ${nfmt(rows.length)} รายการ`, ''],
    ['หมวดงาน', nfmt(hierarchy.length), '9 หมวดงานก่อสร้าง + 1 หมวดค่าใช้จ่ายพิเศษ', ''],
    ['จับคู่ช่วงเวลาแล้ว', nfmt(confirmedPhysical), 'ช่วงครอบคลุมจาก Baseline ที่ตรึง Commit', 'ok'],
    ['รอยืนยันเวลา', nfmt(tbc), 'ไม่มีแถบเวลาเพื่อป้องกันการแสดงข้อมูลที่ยังไม่ยืนยัน', tbc ? 'warn' : 'ok'],
    ['ช่วงควบคุมค่าใช้จ่าย', nfmt(control), 'ไม่ใช่ Cash Flow หรือ Payment Schedule', 'control'],
    ['เกี่ยวข้องกับ Critical Path', nfmt(exposure), 'มีอย่างน้อยหนึ่งกิจกรรมรายละเอียด Float = 0', 'critical'],
    ['แก้คำแสดงผลแล้ว', nfmt(resolved), 'เก็บข้อความ Excel เดิมไว้ใน Audit Trail', 'ok']
  ];
  els.metrics.innerHTML = metrics.map(([key,value,detail,className]) => (
    `<article class="metric ${className}"><div class="metric-key">${esc(key)}</div><div class="metric-value">${esc(value)}</div><div class="metric-detail">${esc(detail)}</div></article>`
  )).join('');
}

function makeTimelineHeader() {
  const width = 1200 * pxDay;
  els.timelineHead.style.width = `${width}px`;
  els.timelineHead.style.minWidth = `${width}px`;
  els.timelineGrid.style.width = `${width}px`;
  els.timelineGrid.style.minWidth = `${width}px`;
  els.timelineHead.innerHTML = '';
  for (let month = 1; month <= 40; month += 1) {
    const start = (month - 1) * 30 + 1;
    const finish = month * 30;
    const cell = document.createElement('div');
    cell.className = 'month-cell';
    cell.style.width = `${30 * pxDay}px`;
    cell.style.flexBasis = `${30 * pxDay}px`;
    cell.innerHTML = `<b>เดือน ${month}</b><span>D${start}–D${finish}</span>`;
    els.timelineHead.append(cell);
  }
  els.timelineGrid.style.backgroundSize = `${30 * pxDay}px 100%`;
}

function groupRows(type, key, label, rows, collapsed) {
  const group = spanOfTeamRows(rows);
  const left = document.createElement('div');
  left.className = `group-row ${type}-row`;
  left.dataset.toggleType = type;
  left.dataset.toggleKey = key;
  const badge = type === 'work' ? 'งาน' : 'โซน';
  const code = type === 'work' ? key : key.split('|').at(-1);
  const status = group.start_day === null
    ? `TBC ${group.tbc_rows} รายการ`
    : `D${group.start_day}–D${group.finish_day}${group.tbc_rows ? ` · TBC ${group.tbc_rows}` : ''}`;
  left.innerHTML = `
    <div class="cell code"><span class="toggle">${collapsed ? '▸' : '▾'}</span>${esc(code)}</div>
    <div class="cell name"><span class="level-badge">${badge}</span>${esc(label)}</div>
    <div class="cell duration">${nfmt(rows.length)} รายการ</div>
    <div class="cell days">${esc(status)}</div>`;

  const time = document.createElement('div');
  time.className = `time-group ${type}`;
  time.dataset.toggleType = type;
  time.dataset.toggleKey = key;
  if (group.start_day !== null) {
    const bar = document.createElement('div');
    bar.className = 'summary-bar';
    bar.style.left = `${(group.start_day - 1) * pxDay}px`;
    bar.style.width = `${Math.max(3, group.elapsed_span_days * pxDay)}px`;
    time.append(bar);
  }
  if (group.tbc_rows) {
    const note = document.createElement('span');
    note.className = 'group-tbc-note';
    note.textContent = `TBC ${group.tbc_rows}`;
    time.append(note);
  }
  return [left, time];
}

function activityRows(row) {
  const tbc = row.timing_status === 'TBC_TEAM_CONFIRMATION';
  const control = row.timing_status === 'CONTROL_ALLOWANCE_WINDOW';
  const criticalExposure = row.critical_exposure === 'CONTAINS_ZERO_FLOAT_DETAIL';
  const resolved = row.source_resolution_status === 'RESOLVED_DISPLAY_NORMALIZATION';
  const left = document.createElement('div');
  left.className = [
    'activity-row',
    tbc ? 'tbc-row' : '',
    control ? 'control-window-row' : '',
    criticalExposure ? 'critical-exposure-row' : '',
    resolved ? 'source-resolved-row' : ''
  ].filter(Boolean).join(' ');
  left.dataset.id = row.team_activity_id;
  const chips = [
    tbc ? '<b class="status-chip tbc">TBC เวลา</b>' : '',
    control ? '<b class="status-chip control">ช่วงควบคุม</b>' : '',
    criticalExposure ? '<b class="status-chip critical">มีงานย่อย Critical</b>' : '',
    resolved ? '<b class="status-chip resolved">แก้คำแสดงผลแล้ว</b>' : ''
  ].join('');
  left.innerHTML = `
    <div class="cell code">${esc(row.wbs)}</div>
    <div class="cell name">
      <div class="activity-title">${esc(row.activity_name)}${chips}</div>
      <div class="activity-sub">แถว Excel ${row.source_row} · ${esc(row.team_activity_id)} · ${esc(mappingLabel(row.match_level))}${hasTiming(row) ? ` · อ้างอิง ${nfmt(row.matched_activity_count)} กิจกรรมเดิม` : ''}</div>
    </div>
    <div class="cell duration">${esc(timingLabel(row))}</div>
    <div class="cell days">${esc(dayLabel(row))}</div>`;

  const time = document.createElement('div');
  time.className = `time-activity ${tbc ? 'tbc' : ''}`;
  time.dataset.id = row.team_activity_id;
  if (tbc) {
    const marker = document.createElement('div');
    marker.className = 'tbc-marker';
    marker.textContent = 'TBC — รอยืนยัน';
    marker.title = row.mapping_note;
    time.append(marker);
  } else {
    const bar = document.createElement('div');
    bar.className = `activity-bar ${control ? 'control-window' : ''} ${criticalExposure ? 'critical-exposure' : ''}`;
    bar.style.left = `${(row.start_day - 1) * pxDay}px`;
    bar.style.width = `${Math.max(3, row.elapsed_span_days * pxDay)}px`;
    bar.title = `${row.activity_name} · ${dayLabel(row)} · ${timingLabel(row)} · ${mappingLabel(row.match_level)}`;
    time.append(bar);
  }
  return [left, time];
}

function render() {
  const rows = filteredRows();
  const hierarchy = buildTeamGanttHierarchy(rows);
  renderMetrics(rows, hierarchy);
  makeTimelineHeader();
  els.leftGrid.innerHTML = '';
  els.timelineGrid.innerHTML = '';
  if (!rows.length) {
    els.leftGrid.innerHTML = '<div class="empty">ไม่พบกิจกรรมตามตัวกรอง</div>';
    return;
  }

  for (const work of hierarchy) {
    const workKey = work.work_code;
    const workCollapsed = collapsedWorks.has(workKey);
    const [workLeft, workTime] = groupRows('work', workKey, work.work_name, work.rows, workCollapsed);
    els.leftGrid.append(workLeft);
    els.timelineGrid.append(workTime);
    if (workCollapsed) continue;
    for (const zone of work.zones) {
      const zoneKey = `${workKey}|${zone.zone_code}`;
      const zoneCollapsed = collapsedZones.has(zoneKey);
      const zoneLabel = zone.zone_code === 'PROJECT' ? 'ทั้งโครงการ' : zone.zone_name;
      const [zoneLeft, zoneTime] = groupRows('zone', zoneKey, zoneLabel, zone.rows, zoneCollapsed);
      els.leftGrid.append(zoneLeft);
      els.timelineGrid.append(zoneTime);
      if (zoneCollapsed) continue;
      for (const row of zone.rows) {
        const [left, time] = activityRows(row);
        els.leftGrid.append(left);
        els.timelineGrid.append(time);
      }
    }
  }
}

function showDetail(id) {
  const row = rowById.get(id);
  if (!row) return;
  const originalSource = row.source_resolution_status === 'RESOLVED_DISPLAY_NORMALIZATION'
    ? `<section class="detail-info"><b>แก้คำแสดงผลพร้อม Audit Trail</b><br>ข้อความใน Excel: ${esc(row.source_label)}<br>ข้อความที่ใช้แสดงและจับคู่: ${esc(row.activity_name)}<br>${esc(row.normalization_note)}</section>`
    : '';
  const tbc = row.timing_status === 'TBC_TEAM_CONFIRMATION';
  const timeValue = tbc
    ? 'TBC — ยังไม่กำหนด Start/Finish และไม่มีแถบเวลา'
    : `${dayLabel(row)} · ${nfmt(row.elapsed_span_days)} วันครอบคลุม`;
  const mappedIds = row.matched_activity_ids.length
    ? row.matched_activity_ids.map(esc).join('<br>')
    : '— รอทีมยืนยัน Package/ช่วงเวลา';
  els.drawerContent.innerHTML = `
    <div class="drawer-eyebrow">${esc(row.work_name)} · ${esc(row.zone_code)}</div>
    <h2>${esc(row.activity_name)}</h2>
    <div class="drawer-id">${esc(row.team_activity_id)} · WBS ${esc(row.wbs)}</div>
    ${originalSource}
    <dl class="detail-grid">
      <dt>ไฟล์ต้นทาง</dt><dd>${esc(TEAM_SOURCE_METADATA.source_file)} · ${esc(TEAM_GANTT_REVISION.source_sheet)} · แถว ${row.source_row}</dd>
      <dt>ข้อความต้นทาง</dt><dd>${esc(row.source_label)}</dd>
      <dt>หมวดงาน</dt><dd>${esc(row.work_name)}</dd>
      <dt>โซนหลัก</dt><dd>${esc(row.zone_name)}</dd>
      <dt>สถานะเวลา</dt><dd>${esc(row.timing_status)}</dd>
      <dt>ช่วงเวลาครอบคลุม</dt><dd>${timeValue}</dd>
      <dt>ความหมายของช่วงเวลา</dt><dd>${tbc ? 'รอทีมยืนยัน' : row.source_kind === 'SPECIAL_COST' ? 'ช่วงควบคุม/ช่วงที่ค่าใช้จ่ายอาจเกิดขึ้น ไม่ใช่ Cost Loading, Cash Flow หรือ Payment Schedule' : 'Elapsed Span จาก Start แรกถึง Finish สุดท้ายของกิจกรรมรายละเอียดที่จับคู่ได้ ไม่ใช่ Work Effort'}</dd>
      <dt>Baseline ที่ตรึง</dt><dd>${esc(TEAM_GANTT_REVISION.baseline_version)} · Commit <span class="mono">${esc(TEAM_GANTT_REVISION.baseline_commit_sha)}</span></dd>
      <dt>Source Register ที่ตรึง</dt><dd>Commit <span class="mono">${esc(TEAM_GANTT_REVISION.source_register_commit_sha)}</span></dd>
      <dt>ระดับการจับคู่</dt><dd>${esc(mappingLabel(row.match_level))} (${esc(row.match_level)})</dd>
      <dt>เหตุผล/ข้อกำหนด</dt><dd>${esc(row.mapping_note)}</dd>
      <dt>กิจกรรมเดิมที่อ้างอิง</dt><dd>${nfmt(row.matched_activity_count)} รายการ</dd>
      <dt>Activity ID เดิม</dt><dd class="mono">${mappedIds}</dd>
      <dt>ความสัมพันธ์กับ Critical Path</dt><dd>${row.critical_exposure === 'CONTAINS_ZERO_FLOAT_DETAIL' ? 'มีอย่างน้อยหนึ่งกิจกรรมรายละเอียดที่ Total Float = 0; Summary bar ทั้งช่วงไม่ถือเป็น Critical Path ทั้งหมด' : row.critical_exposure === 'NOT_ASSESSED_TBC' ? 'ยังไม่ประเมินจนกว่าจะยืนยันเวลา' : 'ไม่พบกิจกรรมรายละเอียด Float = 0'}</dd>
      <dt>Network Logic</dt><dd>Summary Gantt นี้ไม่มี Predecessor Network หรือ CPM ของ 107 แถวแยกต่างหาก</dd>
    </dl>`;
  els.drawer.classList.add('open');
  els.drawer.setAttribute('aria-hidden', 'false');
}

function bindEvents() {
  const clickHandler = event => {
    const toggle = event.target.closest('[data-toggle-key]');
    if (toggle) {
      const set = toggle.dataset.toggleType === 'work' ? collapsedWorks : collapsedZones;
      const key = toggle.dataset.toggleKey;
      set.has(key) ? set.delete(key) : set.add(key);
      render();
      return;
    }
    const row = event.target.closest('[data-id]');
    if (row) showDetail(row.dataset.id);
  };
  els.leftGrid.addEventListener('click', clickHandler);
  els.timelineGrid.addEventListener('click', clickHandler);
  const hover = (event, on) => {
    const row = event.target.closest('[data-id]');
    if (!row) return;
    document.querySelectorAll(`[data-id="${CSS.escape(row.dataset.id)}"]`).forEach(element => element.classList.toggle('hovered', on));
  };
  for (const grid of [els.leftGrid, els.timelineGrid]) {
    grid.addEventListener('mouseover', event => hover(event, true));
    grid.addEventListener('mouseout', event => hover(event, false));
  }
  for (const element of [els.search,els.workFilter,els.zoneFilter,els.mappingFilter,els.criticalOnly]) {
    element.addEventListener(element === els.search ? 'input' : 'change', render);
  }
  els.zoom.addEventListener('change', () => {
    pxDay = Number(els.zoom.value);
    render();
  });
  els.resetFilters.addEventListener('click', () => {
    els.search.value = '';
    els.workFilter.value = '';
    els.zoneFilter.value = '';
    els.mappingFilter.value = '';
    els.criticalOnly.checked = false;
    render();
  });
  els.drawerClose.addEventListener('click', () => {
    els.drawer.classList.remove('open');
    els.drawer.setAttribute('aria-hidden', 'true');
  });
  els.exportCsv.addEventListener('click', () => downloadText(
    'team-gantt-220869-v0.9.1.csv', `\uFEFF${teamGanttCSV()}`, 'text/csv;charset=utf-8'
  ));
  els.exportJson.addEventListener('click', () => downloadText(
    'team-gantt-220869-v0.9.1.json', JSON.stringify({ revision: TEAM_GANTT_REVISION, stats: teamGanttStats, activities: teamGanttRows }, null, 2), 'application/json;charset=utf-8'
  ));
}

initFilters();
bindEvents();
render();
