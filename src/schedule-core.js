export const schedule = [];
const usedIds = new Set();

export function addTask({
  id, wbs, plan = 1, zone = 'ALL', area = 'Project-wide', discipline = 'General',
  name, startDay, finishDay = startDay, predecessors = [], milestone = false,
  critical = false, responsible = '', installmentStart = '', installmentEnd = '',
  deliverable = '', basis = 'DERIVED', timingBasis = 'ASSUMPTION', source = '', resourceGroup = '', notes = ''
}) {
  if (!id || usedIds.has(id)) throw new Error(`Duplicate/missing activity id: ${id}`);
  usedIds.add(id);
  if (milestone) finishDay = startDay;
  if (startDay < 1 || finishDay > 1200 || finishDay < startDay) {
    throw new Error(`Invalid day range for ${id}: ${startDay}-${finishDay}`);
  }
  const durationDays = milestone ? 0 : finishDay - startDay + 1;
  const pred = predecessors.map(p => typeof p === 'string' ? { id: p, relationship: 'FS', lagDays: 0 } : {
    id: p.id, relationship: p.relationship || 'FS', lagDays: p.lagDays || 0
  });
  const row = {
    activity_id: id,
    wbs,
    plan_no: String(plan).padStart(2, '0'),
    zone,
    building_area: area,
    discipline,
    activity_name: name,
    duration_days: durationDays,
    predecessors: pred,
    predecessor: pred.map(p => p.id).join(';'),
    relationship: pred.map(p => p.relationship).join(';'),
    lag_days: pred.map(p => p.lagDays).join(';'),
    start_day: startDay,
    finish_day: finishDay,
    milestone: milestone ? 'Y' : 'N',
    critical: critical ? 'Y' : 'N',
    responsible_party: responsible,
    installment_start: installmentStart,
    installment_end: installmentEnd,
    deliverable_evidence: deliverable,
    basis_type: basis,
    timing_basis: timingBasis,
    source_reference: source,
    resource_group: resourceGroup,
    notes,
    network_to_final: '',
    computed_free_float_days: '',
    computed_total_float_days: '',
    computed_critical: 'N',
    driving_successor: ''
  };
  schedule.push(row);
  return id;
}

export const fs = (id, lagDays = 0) => ({ id, relationship: 'FS', lagDays });
export const ss = (id, lagDays = 0) => ({ id, relationship: 'SS', lagDays });
export const ff = (id, lagDays = 0) => ({ id, relationship: 'FF', lagDays });

export function fracDay(start, finish, fraction) {
  return Math.round(start + (finish - start) * fraction);
}

export function sortSchedule(rows = schedule) {
  const wbsKey = wbs => String(wbs).split('.').map(x => /^\d+$/.test(x) ? [0, Number(x)] : [1, x]);
  const cmpKey = (a, b) => {
    const A = wbsKey(a.wbs), B = wbsKey(b.wbs), n = Math.max(A.length, B.length);
    for (let i = 0; i < n; i++) {
      if (!A[i]) return -1;
      if (!B[i]) return 1;
      if (A[i][0] !== B[i][0]) return A[i][0] - B[i][0];
      if (A[i][1] < B[i][1]) return -1;
      if (A[i][1] > B[i][1]) return 1;
    }
    return 0;
  };
  return [...rows].sort((a, b) => Number(a.plan_no) - Number(b.plan_no) || cmpKey(a, b) || a.start_day - b.start_day || a.activity_id.localeCompare(b.activity_id));
}

export function validateSchedule(rows = schedule) {
  const ids = new Set(rows.map(r => r.activity_id));
  const errors = [];
  for (const row of rows) {
    if (row.start_day < 1 || row.finish_day > 1200 || row.finish_day < row.start_day) {
      errors.push(`${row.activity_id}: invalid day range`);
    }
    if (row.milestone === 'Y' && row.duration_days !== 0) errors.push(`${row.activity_id}: milestone duration != 0`);
    for (const p of row.predecessors) if (!ids.has(p.id)) errors.push(`${row.activity_id}: missing predecessor ${p.id}`);
  }
  return errors;
}

export function stats(rows = schedule) {
  const byPlan = {};
  const byZone = {};
  const byBasis = {};
  const byTimingBasis = {};
  let milestones = 0, critical = 0, computedCritical = 0, connectedToFinal = 0;
  for (const r of rows) {
    byPlan[r.plan_no] = (byPlan[r.plan_no] || 0) + 1;
    byZone[r.zone] = (byZone[r.zone] || 0) + 1;
    byBasis[r.basis_type] = (byBasis[r.basis_type] || 0) + 1;
    byTimingBasis[r.timing_basis] = (byTimingBasis[r.timing_basis] || 0) + 1;
    if (r.milestone === 'Y') milestones++;
    if (r.critical === 'Y') critical++;
    if (r.computed_critical === 'Y') computedCritical++;
    if (r.network_to_final === 'Y') connectedToFinal++;
  }
  return { total: rows.length, milestones, critical, computedCritical, connectedToFinal, byPlan, byZone, byBasis, byTimingBasis };
}

export function toCSV(rows = schedule) {
  const fields = [
    'activity_id','wbs','plan_no','zone','building_area','discipline','activity_name','duration_days',
    'predecessor','relationship','lag_days','start_day','finish_day','milestone','critical','computed_critical',
    'computed_total_float_days','computed_free_float_days','network_to_final','driving_successor','responsible_party',
    'installment_start','installment_end','deliverable_evidence','basis_type','timing_basis','source_reference','resource_group','notes'
  ];
  const esc = value => {
    const s = value == null ? '' : String(value);
    return /[",\n]/.test(s) ? `"${s.replaceAll('"','""')}"` : s;
  };
  return '\ufeff' + [fields.join(','), ...rows.map(r => fields.map(f => esc(r[f])).join(','))].join('\n');
}

export function downloadText(filename, text, mime = 'text/plain;charset=utf-8') {
  const blob = new Blob([text], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
