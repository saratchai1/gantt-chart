export function validateStructure(rows) {
  const errors = [];
  const ids = new Set();
  for (const r of rows) {
    if (!r.activity_id) errors.push('Row without activity_id');
    else if (ids.has(r.activity_id)) errors.push(`Duplicate activity_id: ${r.activity_id}`);
    else ids.add(r.activity_id);
    if (!Number.isInteger(r.start_day) || !Number.isInteger(r.finish_day)) errors.push(`${r.activity_id}: non-integer day`);
    if (r.start_day < 1 || r.finish_day > 1200 || r.finish_day < r.start_day) errors.push(`${r.activity_id}: invalid day range ${r.start_day}-${r.finish_day}`);
    if (r.milestone === 'Y' && (r.start_day !== r.finish_day || r.duration_days !== 0)) errors.push(`${r.activity_id}: invalid milestone duration`);
    if (r.milestone !== 'Y' && r.duration_days !== r.finish_day - r.start_day + 1) errors.push(`${r.activity_id}: duration mismatch`);
  }
  for (const r of rows) {
    for (const p of r.predecessors || []) if (!ids.has(p.id)) errors.push(`${r.activity_id}: missing predecessor ${p.id}`);
  }
  return errors;
}

export function detectCycles(rows) {
  const ids = new Set(rows.map(r => r.activity_id));
  const predMap = new Map(rows.map(r => [r.activity_id, (r.predecessors || []).map(p => p.id).filter(id => ids.has(id))]));
  const state = new Map();
  const stack = [];
  const cycles = [];
  function visit(id) {
    const s = state.get(id) || 0;
    if (s === 1) {
      const i = stack.indexOf(id);
      cycles.push([...stack.slice(i), id]);
      return;
    }
    if (s === 2) return;
    state.set(id, 1); stack.push(id);
    for (const p of predMap.get(id) || []) visit(p);
    stack.pop(); state.set(id, 2);
  }
  for (const id of ids) visit(id);
  const uniq = new Map(cycles.map(c => [c.join('>'), c]));
  return [...uniq.values()];
}

export function validateTemporalLogic(rows) {
  const byId = new Map(rows.map(r => [r.activity_id, r]));
  const warnings = [];
  for (const r of rows) {
    for (const p of r.predecessors || []) {
      const pr = byId.get(p.id);
      if (!pr) continue;
      const lag = Number(p.lagDays || 0);
      let ok = true, expected = '';
      if (p.relationship === 'FS') {
        const minStart = pr.finish_day + lag + 1;
        ok = r.start_day >= minStart;
        expected = `start>=D${minStart}`;
      } else if (p.relationship === 'SS') {
        const minStart = pr.start_day + lag;
        ok = r.start_day >= minStart;
        expected = `start>=D${minStart}`;
      } else if (p.relationship === 'FF') {
        const minFinish = pr.finish_day + lag;
        ok = r.finish_day >= minFinish;
        expected = `finish>=D${minFinish}`;
      } else if (p.relationship === 'SF') {
        const minFinish = pr.start_day + lag;
        ok = r.finish_day >= minFinish;
        expected = `finish>=D${minFinish}`;
      }
      if (!ok) warnings.push({
        successor:r.activity_id,
        predecessor:p.id,
        relationship:p.relationship,
        lag_days:lag,
        predecessor_window:`D${pr.start_day}-D${pr.finish_day}`,
        successor_window:`D${r.start_day}-D${r.finish_day}`,
        expected
      });
    }
  }
  return warnings;
}

export function criticalCandidateSummary(rows) {
  return rows.filter(r => r.critical === 'Y').map(r => ({
    activity_id:r.activity_id,wbs:r.wbs,plan_no:r.plan_no,activity_name:r.activity_name,
    start_day:r.start_day,finish_day:r.finish_day,predecessor:r.predecessor
  }));
}

export function validationReport(rows) {
  const structureErrors = validateStructure(rows);
  const cycles = detectCycles(rows);
  const temporalWarnings = validateTemporalLogic(rows);
  return {
    generated_at:new Date().toISOString(),
    total_activities:rows.length,
    structure_errors:structureErrors,
    dependency_cycles:cycles,
    temporal_logic_warnings:temporalWarnings,
    critical_candidates:criticalCandidateSummary(rows),
    status: structureErrors.length || cycles.length ? 'FAIL' : temporalWarnings.length ? 'PASS_WITH_TEMPORAL_WARNINGS' : 'PASS'
  };
}
