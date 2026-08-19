const VALID_SCOPE_APPLICABILITY=new Set(['SOURCE_REQUIRED','DERIVED_FROM_SCOPE','WHERE_APPLICABLE','CONTROL_STREAM']);

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
    if (!VALID_SCOPE_APPLICABILITY.has(r.scope_applicability)) errors.push(`${r.activity_id}: invalid/unclassified scope applicability ${r.scope_applicability || '(blank)'}`);
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
        const dayStep = pr.milestone === 'Y' || r.milestone === 'Y' ? 0 : 1;
        const minStart = pr.finish_day + lag + dayStep;
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

export function scopeApplicabilitySummary(rows){
  const byStatus={};
  for(const r of rows) byStatus[r.scope_applicability]=(byStatus[r.scope_applicability]||0)+1;
  const provisional=rows.filter(r=>r.scope_applicability==='WHERE_APPLICABLE').map(r=>({
    activity_id:r.activity_id,plan_no:r.plan_no,building_area:r.building_area,discipline:r.discipline,
    activity_name:r.activity_name,scope_note:r.scope_note
  }));
  return {by_status:byStatus,where_applicable:provisional};
}

function coverage(total, connected) {
  return { total, connected, coverage_pct:Number((100 * connected / Math.max(1,total)).toFixed(1)) };
}

export function networkCoverageSummary(rows) {
  const toFinal = rows.filter(r => r.network_to_final === 'Y');
  const fromStart = rows.filter(r => r.network_from_start === 'Y');
  const through = rows.filter(r => r.network_from_start === 'Y' && r.network_to_final === 'Y');
  const physical = rows.filter(r => r.plan_no === '01' && /^P01-(?:A|B|C|D)/.test(r.activity_id));
  const handovers = physical.filter(r => r.activity_id.endsWith('-HO'));

  const physicalFromStart = physical.filter(r => r.network_from_start === 'Y');
  const physicalToFinal = physical.filter(r => r.network_to_final === 'Y');
  const physicalThrough = physical.filter(r => r.network_from_start === 'Y' && r.network_to_final === 'Y');
  const handoverFromStart = handovers.filter(r => r.network_from_start === 'Y');
  const handoverToFinal = handovers.filter(r => r.network_to_final === 'Y');
  const handoverThrough = handovers.filter(r => r.network_from_start === 'Y' && r.network_to_final === 'Y');

  const unconnectedFromStartAll = rows.filter(r => r.network_from_start !== 'Y').map(r => r.activity_id);
  const unconnectedToFinalAll = rows.filter(r => r.network_to_final !== 'Y').map(r => r.activity_id);
  const unconnectedThroughAll = rows.filter(r => r.network_from_start !== 'Y' || r.network_to_final !== 'Y').map(r => r.activity_id);
  const unconnectedFromStartPhysical = physical.filter(r => r.network_from_start !== 'Y').map(r => r.activity_id);
  const unconnectedToFinalPhysical = physical.filter(r => r.network_to_final !== 'Y').map(r => r.activity_id);
  const unconnectedThroughPhysical = physical.filter(r => r.network_from_start !== 'Y' || r.network_to_final !== 'Y').map(r => r.activity_id);
  const unconnectedFromStartHandovers = handovers.filter(r => r.network_from_start !== 'Y').map(r => r.activity_id);
  const unconnectedToFinalHandovers = handovers.filter(r => r.network_to_final !== 'Y').map(r => r.activity_id);
  const unconnectedSupportToFinal = rows.filter(r => r.plan_no !== '01' && r.network_to_final !== 'Y').map(r => r.activity_id);

  const byPlan = {};
  for (const r of rows) {
    if (!byPlan[r.plan_no]) byPlan[r.plan_no] = { total:0, from_start:0, to_final:0, through:0 };
    const v=byPlan[r.plan_no]; v.total++;
    if (r.network_from_start === 'Y') v.from_start++;
    if (r.network_to_final === 'Y') v.to_final++;
    if (r.network_from_start === 'Y' && r.network_to_final === 'Y') v.through++;
  }
  for (const v of Object.values(byPlan)) {
    v.from_start_pct=Number((100*v.from_start/Math.max(1,v.total)).toFixed(1));
    v.to_final_pct=Number((100*v.to_final/Math.max(1,v.total)).toFixed(1));
    v.through_pct=Number((100*v.through/Math.max(1,v.total)).toFixed(1));
  }

  return {
    overall_from_start:coverage(rows.length,fromStart.length),
    overall_to_final:coverage(rows.length,toFinal.length),
    overall_through:coverage(rows.length,through.length),
    plan01_physical_from_start:coverage(physical.length,physicalFromStart.length),
    plan01_physical_to_final:coverage(physical.length,physicalToFinal.length),
    plan01_physical_through:coverage(physical.length,physicalThrough.length),
    plan01_handovers_from_start:coverage(handovers.length,handoverFromStart.length),
    plan01_handovers_to_final:coverage(handovers.length,handoverToFinal.length),
    plan01_handovers_through:coverage(handovers.length,handoverThrough.length),
    overall:coverage(rows.length,toFinal.length),
    plan01_physical:coverage(physical.length,physicalToFinal.length),
    plan01_handovers:coverage(handovers.length,handoverToFinal.length),
    unconnected_from_start_all:unconnectedFromStartAll,
    unconnected_to_final_all:unconnectedToFinalAll,
    unconnected_through_all:unconnectedThroughAll,
    unconnected_support_to_final:unconnectedSupportToFinal,
    unconnected_from_start_plan01_physical:unconnectedFromStartPhysical,
    unconnected_to_final_plan01_physical:unconnectedToFinalPhysical,
    unconnected_through_plan01_physical:unconnectedThroughPhysical,
    unconnected_from_start_plan01_handovers:unconnectedFromStartHandovers,
    unconnected_to_final_plan01_handovers:unconnectedToFinalHandovers,
    unconnected_plan01_physical:unconnectedToFinalPhysical,
    unconnected_plan01_handovers:unconnectedToFinalHandovers,
    by_plan:byPlan
  };
}

export function validationReport(rows) {
  const structureErrors = validateStructure(rows);
  const cycles = detectCycles(rows);
  const temporalWarnings = validateTemporalLogic(rows);
  const networkCoverage = networkCoverageSummary(rows);
  const scopeApplicability = scopeApplicabilitySummary(rows);
  const networkIntegrityErrors = [
    ...networkCoverage.unconnected_from_start_plan01_physical.map(id => `${id}: Plan-01 physical activity is not reachable from NTP/start milestone`),
    ...networkCoverage.unconnected_to_final_plan01_physical.map(id => `${id}: Plan-01 physical activity is not connected to final D1200 milestone`)
  ];
  return {
    generated_at:new Date().toISOString(),
    total_activities:rows.length,
    structure_errors:structureErrors,
    dependency_cycles:cycles,
    temporal_logic_warnings:temporalWarnings,
    network_coverage:networkCoverage,
    scope_applicability:scopeApplicability,
    network_integrity_errors:networkIntegrityErrors,
    critical_candidates:criticalCandidateSummary(rows),
    status: structureErrors.length || cycles.length || networkIntegrityErrors.length ? 'FAIL' : temporalWarnings.length ? 'PASS_WITH_TEMPORAL_WARNINGS' : 'PASS'
  };
}
