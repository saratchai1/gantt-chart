import {
  teamGanttRows,
  teamGanttStats,
  buildTeamGanttHierarchy,
  teamGanttCSV
} from './src/build-team-gantt-220869.js';
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
const strongPhysicalMatchLevels = new Set(['AREA_AND_WORK_EXACT','ZONE_EQUIPMENT_SCOPE_MATCH']);
let pxDay = Number(els.zoom.value);

const esc = value => String(value ?? '').replace(/[&<>"']/g, character => ({
  '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'
}[character]));
const nfmt = value => new Intl.NumberFormat('th-TH').format(value);

function mappingLabel(level) {
  const labels = {
    AREA_AND_WORK_EXACT: 'ตรงโซนย่อยและหมวดงาน',
    ZONE_EQUIPMENT_SCOPE_MATCH: 'ตรงขอบเขตครุภัณฑ์ระดับโซน',
    AREA_ALL_WORK_FALLBACK: 'ใช้ช่วงรวมโซนย่อย',
    ZONE_WORK_FALLBACK: 'ใช้หมวดงานระดับโซน',
    ZONE_ALL_WORK_FALLBACK: 'ใช้ช่วงรวมโซนหลัก',
    CONTROL_STREAM_MATCH: 'จับคู่กระบวนการควบคุม',
    PROJECT_CONTROL_FALLBACK: 'ใช้ช่วงควบคุมโครงการ'
  };
  return labels[level] || level;
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
    if (els.criticalOnly.checked && row.computed_critical !== 'Y') return false;
    if (query) {
      const haystack = [
        row.team_activity_id,row.wbs,row.work_name,row.zone_name,row.activity_name,row.source_label,
        row.source_row,row.mapping_key,row.match_level,row.mapping_note,row.source_issue,
        row.normalization_note,row.matched_activity_ids.join(' ')
      ].join(' ').toLowerCase();
      if (!haystack.includes(query)) return false;
    }
    return true;
  });
}

function renderMetrics(rows, hierarchy) {
  const strong = rows.filter(row => row.source_kind === 'PHYSICAL_SCOPE' && strongPhysicalMatchLevels.has(row.match_level)).length;
  const fallback = rows.filter(row => row.source_kind === 'PHYSICAL_SCOPE' && !strongPhysicalMatchLevels.has(row.match_level)).length;
  const issues = rows.filter(row => row.source_issue).length;
  const critical = rows.filter(row => row.computed_critical === 'Y').length;
  const metrics = [
    ['กิจกรรมจาก Excel', nfmt(teamGanttStats.source_rows), `แสดง ${nfmt(rows.length)} รายการ`, ''],
    ['หมวดงาน', nfmt(hierarchy.length), '9 หมวดงานก่อสร้าง + 1 หมวดค่าใช้จ่ายพิเศษ', ''],
    ['จับคู่ขอบเขตชัดเจน', nfmt(strong), 'ตรงโซนย่อย/หมวดงาน หรือครุภัณฑ์ระดับโซน', 'ok'],
    ['ใช้ช่วงสำรอง', nfmt(fallback), 'Baseline เดิมไม่มีชื่อหรือการแตกหมวดตรงกับ Excel', fallback ? 'warn' : 'ok'],
    ['เกี่ยวข้องกับงานวิกฤต', nfmt(critical), 'มีอย่างน้อยหนึ่งกิจกรรม Baseline ที่ Float = 0', 'critical'],
    ['ข้อความต้นทางต้องตรวจ', nfmt(issues), 'คงข้อความ Excel เดิมและแสดงคำที่ใช้จับคู่แยกกัน', issues ? 'warn' : 'ok']
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

function groupSpan(rows) {
  return [Math.min(...rows.map(row => row.start_day)), Math.max(...rows.map(row => row.finish_day))];
}

function groupRows(type, key, label, rows, collapsed) {
  const [start, finish] = groupSpan(rows);
  const left = document.createElement('div');
  left.className = `group-row ${type}-row`;
  left.dataset.toggleType = type;
  left.dataset.toggleKey = key;
  const badge = type === 'work' ? 'งาน' : 'โซน';
  const code = type === 'work' ? key : key.split('|').at(-1);
  left.innerHTML = `
    <div class="cell code"><span class="toggle">${collapsed ? '▸' : '▾'}</span>${esc(code)}</div>
    <div class="cell name"><span class="level-badge">${badge}</span>${esc(label)}</div>
    <div class="cell duration">${nfmt(rows.length)} รายการ</div>
    <div class="cell days">D${start}–D${finish}</div>`;

  const time = document.createElement('div');
  time.className = `time-group ${type}`;
  time.dataset.toggleType = type;
  time.dataset.toggleKey = key;
  const bar = document.createElement('div');
  bar.className = 'summary-bar';
  bar.style.left = `${(start - 1) * pxDay}px`;
  bar.style.width = `${Math.max(3, (finish - start + 1) * pxDay)}px`;
  time.append(bar);
  return [left, time];
}

function activityRows(row) {
  const left = document.createElement('div');
  left.className = `activity-row ${row.computed_critical === 'Y' ? 'critical-row' : ''} ${row.source_issue ? 'source-issue-row' : ''}`;
  left.dataset.id = row.team_activity_id;
  const matchLabel = mappingLabel(row.match_level);
  left.innerHTML = `
    <div class="cell code">${esc(row.wbs)}</div>
    <div class="cell name">
      <div class="activity-title">${esc(row.activity_name)}${row.source_issue ? '<b class="issue-chip">ตรวจคำต้นทาง</b>' : ''}</div>
      <div class="activity-sub">แถว Excel ${row.source_row} · ${esc(row.team_activity_id)} · ${esc(matchLabel)} · อ้างอิง ${nfmt(row.matched_activity_count)} กิจกรรมเดิม</div>
    </div>
    <div class="cell duration">${nfmt(row.duration_days)} วัน</div>
    <div class="cell days">D${row.start_day}–D${row.finish_day}</div>`;

  const time = document.createElement('div');
  time.className = 'time-activity';
  time.dataset.id = row.team_activity_id;
  const bar = document.createElement('div');
  bar.className = `activity-bar ${row.computed_critical === 'Y' ? 'critical' : ''} ${row.source_issue ? 'source-issue' : ''}`;
  bar.style.left = `${(row.start_day - 1) * pxDay}px`;
  bar.style.width = `${Math.max(3, row.duration_days * pxDay)}px`;
  bar.title = `${row.activity_name} · D${row.start_day}–D${row.finish_day} · ${mappingLabel(row.match_level)} · อ้างอิง ${row.matched_activity_count} กิจกรรมเดิม`;
  time.append(bar);
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
  const issue = row.source_issue ? `
    <section class="detail-warning"><b>ข้อความต้นทางต้องตรวจ</b><br>
    ข้อความใน Excel: ${esc(row.source_label)}<br>
    ข้อความที่ใช้แสดง/จับคู่: ${esc(row.activity_name)}<br>
    ${esc(row.normalization_note)}</section>` : '';
  els.drawerContent.innerHTML = `
    <div class="drawer-eyebrow">${esc(row.work_name)} · ${esc(row.zone_code)}</div>
    <h2>${esc(row.activity_name)}</h2>
    <div class="drawer-id">${esc(row.team_activity_id)} · WBS ${esc(row.wbs)}</div>
    ${issue}
    <dl class="detail-grid">
      <dt>ไฟล์ต้นทาง</dt><dd>${esc(TEAM_SOURCE_METADATA.source_file)} · Sheet1</dd>
      <dt>แถว Excel</dt><dd>${row.source_row}</dd>
      <dt>ข้อความต้นทาง</dt><dd>${esc(row.source_label)}</dd>
      <dt>หมวดงาน</dt><dd>${esc(row.work_name)}</dd>
      <dt>โซนหลัก</dt><dd>${esc(row.zone_name)}</dd>
      <dt>ช่วงวัน Gantt</dt><dd>D${row.start_day}–D${row.finish_day} · ${nfmt(row.duration_days)} วัน</dd>
      <dt>ที่มาของเวลา</dt><dd>อนุมานจาก Existing Integrated Baseline v0.8.2 — Excel ไม่ได้ระบุวันหรือระยะเวลา</dd>
      <dt>ระดับการจับคู่</dt><dd>${esc(mappingLabel(row.match_level))} (${esc(row.match_level)})</dd>
      <dt>เหตุผลการจับคู่</dt><dd>${esc(row.mapping_note)}</dd>
      <dt>กิจกรรมเดิมที่อ้างอิง</dt><dd>${nfmt(row.matched_activity_count)} รายการ</dd>
      <dt>Activity ID เดิม</dt><dd class="mono">${row.matched_activity_ids.map(esc).join('<br>')}</dd>
      <dt>กิจกรรมวิกฤต</dt><dd>${row.computed_critical === 'Y' ? 'ใช่ — มีอย่างน้อยหนึ่งกิจกรรมเดิมที่ Total Float = 0' : 'ไม่ใช่'}</dd>
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

  const hover = (event, active) => {
    const row = event.target.closest('[data-id]');
    if (!row) return;
    document.querySelectorAll(`[data-id="${CSS.escape(row.dataset.id)}"]`).forEach(element => element.classList.toggle('hovered', active));
  };
  for (const grid of [els.leftGrid, els.timelineGrid]) {
    grid.addEventListener('mouseover', event => hover(event, true));
    grid.addEventListener('mouseout', event => hover(event, false));
  }

  for (const element of [els.search, els.workFilter, els.zoneFilter, els.mappingFilter, els.criticalOnly]) {
    element.addEventListener(element === els.search ? 'input' : 'change', render);
  }
  els.zoom.addEventListener('change', () => {
    pxDay = Number(els.zoom.value);
    document.documentElement.style.setProperty('--px-day', `${pxDay}px`);
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
  els.exportCsv.addEventListener('click', () => downloadText('team-gantt-220869.csv', `\uFEFF${teamGanttCSV()}`, 'text/csv;charset=utf-8'));
  els.exportJson.addEventListener('click', () => downloadText('team-gantt-220869.json', JSON.stringify({
    metadata: TEAM_SOURCE_METADATA,
    stats: teamGanttStats,
    activities: teamGanttRows
  }, null, 2), 'application/json;charset=utf-8'));
}

initFilters();
bindEvents();
render();
