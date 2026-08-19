function refresh(row) {
  row.duration_days = row.milestone === 'Y' ? 0 : row.finish_day - row.start_day + 1;
  row.predecessor = row.predecessors.map(p => p.id).join(';');
  row.relationship = row.predecessors.map(p => p.relationship).join(';');
  row.lag_days = row.predecessors.map(p => p.lagDays || 0).join(';');
}

function setWindow(row, start, finish = start) {
  if (!row) return;
  row.start_day = start;
  row.finish_day = row.milestone === 'Y' ? start : finish;
  refresh(row);
}

function setRel(row, predId, relationship, lagDays = 0) {
  if (!row) return;
  row.predecessors = row.predecessors.map(p => p.id === predId ? { id:p.id, relationship, lagDays } : p);
  refresh(row);
}

export function applyFinalLogicRepairs(rows) {
  const byId = new Map(rows.map(r => [r.activity_id, r]));

  // Irrigation establishment follows the start of planting rather than
  // beginning before planting. Preserve each existing planned finish.
  for (const prefix of ['P01-A21','P01-A22','P01-A27','P01-A28','P01-B33','P01-B34','P01-D51','P01-D52','P01-D53','P01-D54']) {
    const irr=byId.get(`${prefix}-IRR`), soft=byId.get(`${prefix}-SOFT`);
    if (irr && soft && irr.start_day < soft.start_day) setWindow(irr, soft.start_day, irr.finish_day);
  }

  // Area-D nature-zone utilities may not start before the special material
  // release used by this proposal baseline.
  const d51Util=byId.get('P01-D51-UTIL'), dRelease=byId.get('P06-D-10');
  if (d51Util && dRelease && d51Util.start_day < dRelease.start_day) setWindow(d51Util, dRelease.start_day, d51Util.finish_day);

  // Building-specific specialist interfaces: some install progressively with
  // MEP first fix; end-stage functional tests are kept after pre-commissioning.
  setRel(byId.get('P01-A24-EX01'),'P01-A24-MEP1','SS',42);
  setWindow(byId.get('P01-A24-EX03'),738,755);

  setWindow(byId.get('P01-A25-EX02'),778,792);

  setRel(byId.get('P01-A26-EX01'),'P01-A26-MEP1','SS',56);
  setWindow(byId.get('P01-A26-EX03'),770,785);

  setWindow(byId.get('P01-C43-EX01'),851,856);

  // Project closeout starts before the final Area-D package finishes, but it
  // must not finish before that package handover. FF expresses that interface.
  setRel(byId.get('P01-CO-001'),'P01-D53-HO','FF',0);

  // Cross-system workflows can be developed/tested while their platform is
  // being configured, provided they finish after the CDE go-live gate.
  setRel(byId.get('P02-COM-003'),'P11-CDE-004','FF',0);
  setRel(byId.get('P11-CDE-003'),'P11-CDE-002','SS',25);
  setRel(byId.get('P13-BIM-004'),'P11-CDE-004','FF',0);
  setRel(byId.get('P14-AI-003'),'P11-CDE-004','FF',0);

  for (const row of rows) refresh(row);
  return rows;
}
