import { masterSchedule, scheduleStats, localizationStats, validation, masterCSV, cpm } from './src/build-schedule.js';
import { downloadText } from './src/schedule-core.js';
import {
  buildWebHierarchy,
  compareZones,
  subzoneName,
  workCategoryName,
  zoneDisplayLabel
} from './src/web-hierarchy.js';

const planNames = {
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

const ids = [
  'metrics', 'search', 'planFilter', 'zoneFilter', 'disciplineFilter', 'basisFilter',
  'timingFilter', 'scopeFilter', 'criticalOnly', 'networkOnly', 'linkMode', 'zoom',
  'resetFilters', 'timelineHead', 'leftGrid', 'timelineGrid', 'drawer', 'drawerContent',
  'drawerClose', 'exportCsv', 'exportJson'
];
const els = Object.fromEntries(ids.map(id => [id, document.getElementById(id)]));
let pxDay = Number(els.zoom.value);

const collapsed = {
  plan: new Set(),
  zone: new Set(),
  subzone: new Set(),
  work: new Set()
};
const scheduleById = new Map(masterSchedule.map(row => [row.activity_id, row]));
const SVGNS = 'http://www.w3.org/2000/svg';
const esc = value => String(value ?? '').replace(/[&<>"']/g, character => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;'
}[character]));
const nfmt = value => new Intl.NumberFormat('th-TH').format(value);
const through = row => row.network_from_start === 'Y' && row.network_to_final === 'Y';

function initFilters() {
  for (const plan of Object.keys(planNames)) {
    const option = document.createElement('option');
    option.value = plan;
    option.textContent = `${plan} — ${planNames[plan]}`;
    els.planFilter.append(option);
  }

  const zones = [...new Set(masterSchedule.map(row => row.zone).filter(Boolean))].sort(compareZones);
  for (const zone of zones) {
    const option = document.createElement('option');
    option.value = zone;
    option.textContent = zoneDisplayLabel(zone);
    els.zoneFilter.append(option);
  }

  const categories = [...new Set(masterSchedule.map(workCategoryName).filter(Boolean))]
    .sort((a, b) => a.localeCompare(b, 'th'));
  for (const category of categories) {
    const option = document.createElement('option');
    option.value = category;
    option.textContent = category;
    els.disciplineFilter.append(option);
  }
}

function renderMetrics(filteredCount = masterSchedule.length, hierarchyStats = null) {
  const sourceActivity = masterSchedule.filter(row => row.basis_type === 'SOURCE').length;
  const sourceTiming = masterSchedule.filter(row => row.timing_basis === 'SOURCE').length;
  const assumedTiming = masterSchedule.filter(row => row.timing_basis === 'ASSUMPTION').length;
  const provisional = masterSchedule.filter(row => row.scope_applicability === 'WHERE_APPLICABLE').length;
  const networkErrors = validation.network_integrity_errors?.length || 0;
  const hardErrors = validation.structure_errors.length + validation.dependency_cycles.length + networkErrors;
  const physicalCoverage = validation.network_coverage?.plan01_physical_through;
  const physicalFrom = validation.network_coverage?.plan01_physical_from_start;
  const physicalTo = validation.network_coverage?.plan01_physical_to_final;
  const handoverCoverage = validation.network_coverage?.plan01_handovers_through;
  const hierarchySummary = hierarchyStats
    ? `${nfmt(hierarchyStats.main_zones)} โซนหลัก · ${nfmt(hierarchyStats.subzones)} โซนย่อย · ${nfmt(hierarchyStats.works)} งาน`
    : 'โซนหลัก → โซนย่อย → งาน → กิจกรรม';

  const metrics = [
    ['กิจกรรม', nfmt(masterSchedule.length), `แสดง ${nfmt(filteredCount)} รายการ`, ''],
    ['โครงสร้าง WBS', hierarchyStats ? nfmt(hierarchyStats.works) : '—', hierarchySummary, 'hierarchy'],
    ['จุดควบคุม', nfmt(scheduleStats.milestones), 'กิจกรรมระยะเวลา 0 วัน', ''],
    ['กิจกรรมวิกฤต', nfmt(scheduleStats.computedCritical), `${nfmt(scheduleStats.connectedToFinal)} กิจกรรมเชื่อมถึง D1200`, ''],
    ['Network งานก่อสร้าง', physicalCoverage ? `${physicalCoverage.coverage_pct}%` : '—', physicalCoverage ? `${nfmt(physicalCoverage.connected)}/${nfmt(physicalCoverage.total)} กิจกรรม · ส่งมอบ ${handoverCoverage?.coverage_pct ?? '—'}% · NTP ${physicalFrom?.coverage_pct ?? '—'}% / D1200 ${physicalTo?.coverage_pct ?? '—'}%` : 'ไม่มีข้อมูล Network สองทิศทาง', physicalCoverage?.coverage_pct === 100 ? 'ok' : 'warn'],
    ['ขอบเขตรอยืนยัน', nfmt(provisional), 'WHERE_APPLICABLE · ตรวจ IFC / BOQ / Equipment Schedule', provisional ? 'scopewarn' : 'ok'],
    ['ชื่อกิจกรรมภาษาไทย', `${nfmt(localizationStats.thai_primary)}/${nfmt(localizationStats.total)}`, `${nfmt(localizationStats.review_required)} รายการรอทบทวน`, localizationStats.review_required ? 'warn' : 'ok'],
    ['ผลตรวจ', hardErrors ? 'FAIL' : validation.temporal_logic_warnings.length ? 'ADVISORY' : 'PASS', `${validation.temporal_logic_warnings.length} temporal · ${networkErrors} network integrity · เวลา SRC ${nfmt(sourceTiming)} / ASM ${nfmt(assumedTiming)} · SOURCE ${nfmt(sourceActivity)}`, hardErrors ? 'warn' : 'ok']
  ];

  els.metrics.innerHTML = metrics.map(([key, value, detail, className]) => (
    `<div class="metric ${className}"><div class="k">${esc(key)}</div><div class="v">${esc(value)}</div><div class="s">${esc(detail)}</div></div>`
  )).join('');
}

function filteredRows() {
  const query = els.search.value.trim().toLowerCase();
  return masterSchedule.filter(row => {
    if (els.planFilter.value && row.plan_no !== els.planFilter.value) return false;
    if (els.zoneFilter.value && row.zone !== els.zoneFilter.value) return false;
    if (els.disciplineFilter.value && workCategoryName(row) !== els.disciplineFilter.value) return false;
    if (els.basisFilter.value && row.basis_type !== els.basisFilter.value) return false;
    if (els.timingFilter.value && row.timing_basis !== els.timingFilter.value) return false;
    if (els.scopeFilter.value && row.scope_applicability !== els.scopeFilter.value) return false;
    if (els.criticalOnly.checked && row.computed_critical !== 'Y') return false;
    if (els.networkOnly.checked && !through(row)) return false;

    if (query) {
      const searchable = [
        row.activity_id, row.wbs, row.activity_name, row.activity_name_th, row.activity_name_en,
        row.zone, zoneDisplayLabel(row.zone), subzoneName(row), row.building_area_en,
        row.discipline, row.discipline_th, row.discipline_en, workCategoryName(row),
        row.responsible_party, row.deliverable_evidence, row.source_reference, row.basis_type,
        row.timing_basis, row.scope_applicability, row.scope_note, row.translation_status,
        row.computed_total_float_days, row.network_from_start, row.network_to_final
      ].join(' ').toLowerCase();
      if (!searchable.includes(query)) return false;
    }
    return true;
  });
}

function makeTimelineHeader() {
  const width = 1200 * pxDay;
  els.timelineHead.style.width = `${width}px`;
  els.timelineHead.style.minWidth = `${width}px`;
  els.timelineHead.innerHTML = '';
  for (let month = 1; month <= 40; month += 1) {
    const start = (month - 1) * 30 + 1;
    const finish = month * 30;
    const cell = document.createElement('div');
    cell.className = 'month-cell';
    cell.style.flex = `0 0 ${30 * pxDay}px`;
    cell.style.width = `${30 * pxDay}px`;
    cell.innerHTML = `<b>เดือน ${month}</b><span>D${start}–${finish}</span>`;
    els.timelineHead.append(cell);
  }
  els.timelineGrid.style.width = `${width}px`;
  els.timelineGrid.style.minWidth = `${width}px`;
  els.timelineGrid.style.backgroundImage = 'linear-gradient(to right,#e2e7ee 1px,transparent 1px)';
  els.timelineGrid.style.backgroundSize = `${30 * pxDay}px 100%`;
}

function basisChip(row) {
  const className = (row.basis_type || 'DERIVED').toLowerCase();
  return `<b class="basis ${className} row-chip">${esc(row.basis_type)}</b>`;
}

function timingChip(row) {
  const source = row.timing_basis === 'SOURCE';
  return `<b class="timing-chip ${source ? 'source' : 'assumption'}">${source ? 'T:SRC' : 'T:ASM'}</b>`;
}

function scopeChip(row) {
  const map = {
    SOURCE_REQUIRED: ['source-required', 'SCOPE:SRC'],
    DERIVED_FROM_SCOPE: ['derived-scope', 'SCOPE:DRV'],
    WHERE_APPLICABLE: ['provisional', 'SCOPE:PROV'],
    CONTROL_STREAM: ['control', 'SCOPE:CTL']
  };
  const [className, label] = map[row.scope_applicability] || ['unknown', 'SCOPE:?'];
  return `<b class="scope-chip ${className}">${label}</b>`;
}

function networkChip(row) {
  if (through(row)) return '<b class="network-chip connected">NTP→D1200</b>';
  if (row.network_from_start !== 'Y' && row.network_to_final === 'Y') return '<b class="network-chip disconnected">ไม่เชื่อมจาก NTP</b>';
  if (row.network_from_start === 'Y' && row.network_to_final !== 'Y') return '<b class="network-chip disconnected">ไม่เชื่อมถึง D1200</b>';
  return '<b class="network-chip disconnected">NETWORK ISLAND</b>';
}

function leftTask(row) {
  const element = document.createElement('div');
  element.className = `lrow task-row ${row.computed_critical === 'Y' ? 'critical-task' : ''} ${through(row) ? '' : 'network-disconnected'} ${row.scope_applicability === 'WHERE_APPLICABLE' ? 'scope-provisional-row' : ''}`;
  element.dataset.id = row.activity_id;
  const float = row.computed_total_float_days === '' ? '' : ` · TF ${row.computed_total_float_days} วัน`;
  const duration = row.milestone === 'Y' ? 'จุด' : `${row.duration_days} วัน`;
  element.innerHTML = [
    `<div class="cell">${esc(row.wbs)}</div>`,
    `<div class="cell name"><div><div class="title">${esc(row.activity_name)} ${basisChip(row)} ${timingChip(row)} ${scopeChip(row)} ${networkChip(row)}</div><div class="sub">${esc(row.activity_id)} · ${esc(subzoneName(row))} · ${esc(workCategoryName(row))}${esc(float)}</div></div></div>`,
    `<div class="cell">${esc(duration)}</div>`,
    `<div class="cell">D${row.start_day}–${row.finish_day}</div>`
  ].join('');
  return element;
}

function timeTask(row) {
  const element = document.createElement('div');
  element.className = `trow ${through(row) ? '' : 'network-disconnected'}`;
  element.dataset.id = row.activity_id;
  const x = (row.start_day - 1) * pxDay;
  const timing = row.timing_basis === 'SOURCE' ? 'timing-source' : '';
  const critical = row.computed_critical === 'Y' ? 'critical' : '';
  const network = through(row) ? '' : 'disconnected';
  const scope = row.scope_applicability === 'WHERE_APPLICABLE' ? 'scope-provisional' : '';
  const status = `NTP:${row.network_from_start} · D1200:${row.network_to_final} · Scope:${row.scope_applicability}`;

  if (row.milestone === 'Y') {
    const mark = document.createElement('div');
    mark.className = `milestone-mark ${critical} ${timing} ${network} ${scope}`;
    mark.style.left = `${Math.max(0, x - 6)}px`;
    mark.title = `${row.activity_id} · D${row.start_day} · TF:${row.computed_total_float_days || 0} · ${status} · Timing:${row.timing_basis} · ${row.activity_name}`;
    element.append(mark);
  } else {
    const bar = document.createElement('div');
    bar.className = `bar ${(row.basis_type || 'DERIVED').toLowerCase()} ${critical} ${timing} ${network} ${scope}`;
    bar.style.left = `${x}px`;
    bar.style.width = `${Math.max(3, row.duration_days * pxDay)}px`;
    bar.title = `${row.activity_id} · D${row.start_day}–D${row.finish_day} · TF:${row.computed_total_float_days === '' ? 'n/a' : row.computed_total_float_days} · ${status} · Timing:${row.timing_basis} · ${row.activity_name}`;
    element.append(bar);
  }
  return element;
}

const groupPresentation = {
  plan: { className: 'plan-row', badge: 'แผน' },
  zone: { className: 'zone-row', badge: 'โซนหลัก' },
  subzone: { className: 'subzone-row', badge: 'โซนย่อย' },
  work: { className: 'work-row', badge: 'งาน' }
};

function groupRows(group, isCollapsed) {
  const presentation = groupPresentation[group.type];
  const left = document.createElement('div');
  const zoneTone = group.type === 'zone' ? (group.main_zone ? 'main-zone' : 'support-zone') : '';
  left.className = `${presentation.className} ${zoneTone}`;
  left.dataset.toggleKey = group.key;
  left.dataset.toggleType = group.type;
  left.dataset.hierarchyLevel = group.type;
  const connected = group.rows.filter(through).length;
  const firstColumn = group.type === 'plan'
    ? group.plan_no
    : group.type === 'zone'
      ? group.display_code
      : group.type === 'subzone'
        ? 'ย่อย'
        : 'งาน';
  left.innerHTML = [
    `<div class="cell hierarchy-code"><span class="toggle">${isCollapsed ? '▸' : '▾'}</span>${esc(firstColumn)}</div>`,
    `<div class="cell hierarchy-name"><span class="hierarchy-badge ${group.type}">${presentation.badge}</span><span class="hierarchy-label">${esc(group.label)}</span></div>`,
    `<div class="cell" title="${connected}/${group.rows.length} เชื่อมครบ NTP→D1200">${group.rows.length}</div>`,
    `<div class="cell">D${group.start_day}–${group.finish_day}</div>`
  ].join('');

  const timeline = document.createElement('div');
  timeline.className = `tgroup ${group.type} ${zoneTone}`;
  timeline.dataset.toggleKey = group.key;
  timeline.dataset.toggleType = group.type;
  timeline.dataset.hierarchyLevel = group.type;
  const summary = document.createElement('div');
  summary.className = 'summary-bar';
  summary.style.left = `${(group.start_day - 1) * pxDay}px`;
  summary.style.width = `${Math.max(3, (group.finish_day - group.start_day + 1) * pxDay)}px`;
  timeline.append(summary);
  return [left, timeline];
}

function appendGroup(group) {
  const isCollapsed = collapsed[group.type].has(group.key);
  const [left, timeline] = groupRows(group, isCollapsed);
  els.leftGrid.append(left);
  els.timelineGrid.append(timeline);
  return isCollapsed;
}

function svgMarker(defs, id, fill) {
  const marker = document.createElementNS(SVGNS, 'marker');
  marker.setAttribute('id', id);
  marker.setAttribute('viewBox', '0 0 8 8');
  marker.setAttribute('refX', '7');
  marker.setAttribute('refY', '4');
  marker.setAttribute('markerWidth', '6');
  marker.setAttribute('markerHeight', '6');
  marker.setAttribute('orient', 'auto-start-reverse');
  const path = document.createElementNS(SVGNS, 'path');
  path.setAttribute('d', 'M0 0 L8 4 L0 8 z');
  path.setAttribute('fill', fill);
  marker.append(path);
  defs.append(marker);
}

function renderDependencyLinks() {
  els.timelineGrid.querySelector('.dependency-overlay')?.remove();
  const mode = els.linkMode?.value || 'off';
  if (mode === 'off') return;

  const taskElements = [...els.timelineGrid.querySelectorAll('.trow[data-id]')];
  if (!taskElements.length) return;
  const visible = new Map(taskElements.map(element => [element.dataset.id, element]));
  const width = 1200 * pxDay;
  const height = Math.max(1, els.timelineGrid.scrollHeight);
  const svg = document.createElementNS(SVGNS, 'svg');
  svg.setAttribute('class', 'dependency-overlay');
  svg.setAttribute('width', String(width));
  svg.setAttribute('height', String(height));
  svg.setAttribute('viewBox', `0 0 ${width} ${height}`);

  const defs = document.createElementNS(SVGNS, 'defs');
  svgMarker(defs, 'arrow-normal', '#718096');
  svgMarker(defs, 'arrow-driving', '#b42318');
  svg.append(defs);

  for (const successorElement of taskElements) {
    const successor = scheduleById.get(successorElement.dataset.id);
    if (!successor) continue;
    for (const link of successor.predecessors || []) {
      const predecessor = scheduleById.get(link.id);
      const predecessorElement = visible.get(link.id);
      if (!predecessor || !predecessorElement) continue;
      const driving = predecessor.driving_successor === successor.activity_id && through(predecessor) && through(successor);
      if (mode === 'driving' && !driving) continue;

      const relationship = link.relationship || 'FS';
      const predecessorUsesStart = relationship === 'SS' || relationship === 'SF';
      const successorUsesFinish = relationship === 'FF' || relationship === 'SF';
      const x1 = (predecessorUsesStart ? predecessor.start_day - 1 : predecessor.finish_day) * pxDay;
      const x2 = (successorUsesFinish ? successor.finish_day : successor.start_day - 1) * pxDay;
      const y1 = predecessorElement.offsetTop + predecessorElement.offsetHeight / 2;
      const y2 = successorElement.offsetTop + successorElement.offsetHeight / 2;
      const bend = driving ? 9 : 6;
      const routeX = x2 >= x1 + bend * 2 ? x1 + bend : Math.max(x1, x2) + bend * 2;
      const polyline = document.createElementNS(SVGNS, 'polyline');
      polyline.setAttribute('points', `${x1},${y1} ${routeX},${y1} ${routeX},${y2} ${x2},${y2}`);
      polyline.setAttribute('class', `dependency-link ${driving ? 'driving' : 'normal'}`);
      polyline.setAttribute('marker-end', `url(#${driving ? 'arrow-driving' : 'arrow-normal'})`);
      const title = document.createElementNS(SVGNS, 'title');
      title.textContent = `${predecessor.activity_id} ${relationship}${link.lagDays ? ` +${link.lagDays} วัน` : ''} → ${successor.activity_id}`;
      polyline.append(title);
      svg.append(polyline);
    }
  }
  els.timelineGrid.prepend(svg);
}

function render() {
  const rows = filteredRows();
  const hierarchy = buildWebHierarchy(rows, planNames);
  renderMetrics(rows.length, hierarchy.stats);
  makeTimelineHeader();
  els.leftGrid.innerHTML = '';
  els.timelineGrid.innerHTML = '';

  if (!rows.length) {
    els.leftGrid.innerHTML = '<div class="empty">ไม่พบกิจกรรมตามตัวกรอง</div>';
    return;
  }

  for (const plan of hierarchy.plans) {
    if (appendGroup(plan)) continue;
    for (const zone of plan.zones) {
      if (appendGroup(zone)) continue;
      for (const subzone of zone.subzones) {
        if (appendGroup(subzone)) continue;
        for (const work of subzone.works) {
          if (appendGroup(work)) continue;
          for (const row of work.rows) {
            els.leftGrid.append(leftTask(row));
            els.timelineGrid.append(timeTask(row));
          }
        }
      }
    }
  }
  renderDependencyLinks();
}

function showDetail(id) {
  const row = scheduleById.get(id);
  if (!row) return;
  const predecessors = (row.predecessors || []).map(link => (
    `${link.id} [${link.relationship}${link.lagDays ? ` +${link.lagDays} วัน` : ''}]`
  )).join('<br>') || '—';
  const temporal = validation.temporal_logic_warnings.filter(warning => warning.successor === id);
  const representative = cpm.representative_path.includes(id)
    ? 'ใช่ — อยู่ใน Representative zero-float chain'
    : 'ไม่ใช่ / อาจอยู่ในกิ่ง zero-float ขนาน';
  const networkErrors = (validation.network_integrity_errors || []).filter(error => String(error).startsWith(`${id}:`));

  els.drawerContent.innerHTML = `
    <div class="eyebrow" style="color:#52708d">แผน ${esc(row.plan_no)} · ${esc(zoneDisplayLabel(row.zone))}</div>
    <h2>${esc(row.activity_name)}</h2>
    <div class="idline">${esc(row.activity_id)} · WBS ${esc(row.wbs)} ${basisChip(row)} ${timingChip(row)} ${scopeChip(row)} ${networkChip(row)}</div>
    <dl class="detail-grid">
      <dt>ชื่อภาษาอังกฤษเดิม</dt><dd>${esc(row.activity_name_en || '—')}</dd>
      <dt>โซนหลัก / พื้นที่ดำเนินงาน</dt><dd>${esc(zoneDisplayLabel(row.zone))}</dd>
      <dt>โซนย่อย / อาคาร–บริเวณ</dt><dd>${esc(subzoneName(row))}</dd>
      <dt>พื้นที่ภาษาอังกฤษเดิม</dt><dd>${esc(row.building_area_en || '—')}</dd>
      <dt>งาน / หมวดงาน</dt><dd>${esc(workCategoryName(row))}</dd>
      <dt>สาขางานเดิม</dt><dd>${esc(row.discipline_en || '—')}</dd>
      <dt>วันโครงการ</dt><dd>D${row.start_day}–D${row.finish_day} · ${row.duration_days}${row.milestone === 'Y' ? ' (จุดควบคุม)' : ' วัน'}</dd>
      <dt>ที่มาระยะเวลา</dt><dd>${esc(row.timing_basis)}${row.timing_basis === 'ASSUMPTION' ? ' — ช่วงเวลาระดับข้อเสนอ ไม่ใช่วันจากเอกสารต้นทาง' : ''}</dd>
      <dt>สถานะขอบเขต</dt><dd>${esc(row.scope_applicability)}</dd>
      <dt>หมายเหตุขอบเขต</dt><dd>${esc(row.scope_note || '—')}</dd>
      <dt>สถานะชื่อภาษาไทย</dt><dd>${esc(row.translation_status || '—')} · ${esc(row.translation_note || '—')}</dd>
      <dt>เชื่อมจาก NTP</dt><dd>${row.network_from_start === 'Y' ? 'เชื่อมครบ — สาย Predecessor ย้อนถึงวันเริ่มโครงการ' : 'ไม่เชื่อมครบ — ต้องตรวจสายงานต้นทาง'}</dd>
      <dt>เชื่อมถึง D1200</dt><dd>${row.network_to_final === 'Y' ? 'เชื่อมครบ — มีสายงานไปถึงการตรวจรับขั้นสุดท้าย' : 'ไม่เชื่อมครบ — อาจเป็น LOE/Control หรือ Logic gap'}</dd>
      <dt>กิจกรรมวิกฤต</dt><dd>${row.computed_critical === 'Y' ? 'ใช่ — Total Float = 0' : 'ไม่ใช่'} · Representative path: ${representative}</dd>
      <dt>Total Float</dt><dd>${row.computed_total_float_days === '' ? 'ไม่เชื่อมถึง Final Acceptance' : esc(`${row.computed_total_float_days} วัน`)}</dd>
      <dt>Free Float</dt><dd>${row.computed_free_float_days === '' ? '—' : esc(`${row.computed_free_float_days} วัน`)}</dd>
      <dt>Driving Successor</dt><dd class="pred">${esc(row.driving_successor || '—')}</dd>
      <dt>Candidate Flag</dt><dd>${row.critical === 'Y' ? 'ใช่ — Source window / Proposal candidate' : 'ไม่ใช่'}</dd>
      <dt>Predecessors</dt><dd class="pred">${predecessors}</dd>
      <dt>ผู้รับผิดชอบ</dt><dd>${esc(row.responsible_party || '—')}</dd>
      <dt>งวดงาน</dt><dd>${row.installment_start ? `${esc(row.installment_start)}–${esc(row.installment_end || row.installment_start)}` : '—'}</dd>
      <dt>ผลงานส่งมอบ / หลักฐาน</dt><dd>${esc(row.deliverable_evidence || '—')}</dd>
      <dt>ที่มากิจกรรม</dt><dd>${esc(row.basis_type)}</dd>
      <dt>เอกสารอ้างอิง</dt><dd>${esc(row.source_reference || '—')}</dd>
      <dt>หมายเหตุ</dt><dd>${esc(row.notes || '—')}</dd>
    </dl>
    ${temporal.length ? `<div class="validation-list"><b>Temporal Logic Advisory</b><br>${temporal.map(warning => `${esc(warning.predecessor)} ${esc(warning.relationship)} → ${esc(warning.successor)}; ${esc(warning.expected)}`).join('<br>')}</div>` : ''}
    ${networkErrors.length ? `<div class="validation-list network-error"><b>Network Integrity Error</b><br>${networkErrors.map(esc).join('<br>')}</div>` : ''}
  `;
  els.drawer.classList.add('open');
  els.drawer.setAttribute('aria-hidden', 'false');
}

function bindRowEvents() {
  const onClick = event => {
    const toggle = event.target.closest('[data-toggle-key]');
    if (toggle) {
      const { toggleKey, toggleType } = toggle.dataset;
      const set = collapsed[toggleType];
      if (set) {
        set.has(toggleKey) ? set.delete(toggleKey) : set.add(toggleKey);
        render();
      }
      return;
    }
    const row = event.target.closest('[data-id]');
    if (row) showDetail(row.dataset.id);
  };

  els.leftGrid.addEventListener('click', onClick);
  els.timelineGrid.addEventListener('click', onClick);
  const hover = (event, active) => {
    const row = event.target.closest('[data-id]');
    if (!row) return;
    document.querySelectorAll(`[data-id="${CSS.escape(row.dataset.id)}"]`)
      .forEach(element => element.classList.toggle('hovered', active));
  };
  els.leftGrid.addEventListener('mouseover', event => hover(event, true));
  els.leftGrid.addEventListener('mouseout', event => hover(event, false));
  els.timelineGrid.addEventListener('mouseover', event => hover(event, true));
  els.timelineGrid.addEventListener('mouseout', event => hover(event, false));
}

for (const element of [
  els.search, els.planFilter, els.zoneFilter, els.disciplineFilter, els.basisFilter,
  els.timingFilter, els.scopeFilter, els.criticalOnly, els.networkOnly
]) {
  element.addEventListener(element === els.search ? 'input' : 'change', render);
}

els.linkMode.addEventListener('change', renderDependencyLinks);
els.zoom.addEventListener('change', () => {
  pxDay = Number(els.zoom.value);
  document.documentElement.style.setProperty('--px-day', `${pxDay}px`);
  render();
});
els.resetFilters.addEventListener('click', () => {
  els.search.value = '';
  els.planFilter.value = '';
  els.zoneFilter.value = '';
  els.disciplineFilter.value = '';
  els.basisFilter.value = '';
  els.timingFilter.value = '';
  els.scopeFilter.value = '';
  els.criticalOnly.checked = false;
  els.networkOnly.checked = false;
  els.linkMode.value = 'driving';
  render();
});
els.drawerClose.addEventListener('click', () => {
  els.drawer.classList.remove('open');
  els.drawer.setAttribute('aria-hidden', 'true');
});
els.exportCsv.addEventListener('click', () => downloadText(
  'master-schedule-thai-v0.8.1.csv', masterCSV(), 'text/csv;charset=utf-8'
));
els.exportJson.addEventListener('click', () => downloadText(
  'master-schedule-thai-v0.8.1.json', JSON.stringify(masterSchedule, null, 2), 'application/json;charset=utf-8'
));

initFilters();
bindRowEvents();
render();
