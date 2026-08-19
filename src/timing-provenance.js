function refreshPred(row) {
  row.predecessor = (row.predecessors || []).map(p => p.id).join(';');
  row.relationship = (row.predecessors || []).map(p => p.relationship).join(';');
  row.lag_days = (row.predecessors || []).map(p => p.lagDays || 0).join(';');
}

function replacePred(row, oldId, newPred) {
  if (!row) return;
  row.predecessors = (row.predecessors || []).map(p => p.id === oldId ? newPred : p);
  refreshPred(row);
}

function addPred(row, pred) {
  if (!row) return;
  if (!(row.predecessors || []).some(p => p.id === pred.id)) row.predecessors.push(pred);
  refreshPred(row);
}

export function applyTimingProvenance(rows) {
  const byId = new Map(rows.map(r => [r.activity_id, r]));

  // Default: the activity/control requirement may be source-derived, but its
  // exact detailed bar placement is a proposal planning assumption unless the
  // source explicitly provides that day/window.
  for (const row of rows) row.timing_basis = 'ASSUMPTION';

  const explicitSourceTiming = new Set([
    'P01-PRE-NTP',       // D1 is the defined relative commencement point
    'P01-PRE-SUR',       // CP-01 D1–90
    'P01-PRE-TEMP',      // CP-02 D31–180
    'P01-PRE-DES',       // CP-03 D31–270
    'P01-CO-001',        // CP-07 D841–1080
    'P01-CO-006',        // contractual D1200 completion
    'P02-M01',           // D30
    'P02-M02',           // D60
    'P02-M03',           // D90
    'P02-M24'            // D180
  ]);
  for (const id of explicitSourceTiming) if (byId.has(id)) byId.get(id).timing_basis = 'SOURCE';

  // The source specifies the deliverables for installments 493–497 and that
  // the final group is completed by D1200, but does not provide separate exact
  // due days for each item in the supplied plan. Keep the activity requirement
  // as SOURCE while making the exact proposal day transparent as ASSUMPTION.
  for (const id of ['P02-M493','P02-M494','P02-M495','P02-M496','P02-M497']) {
    const row=byId.get(id); if(!row) continue;
    row.timing_basis='ASSUMPTION';
    row.notes=`${row.notes ? row.notes+' | ' : ''}Deliverable is source-stated; exact proposal day is not stated separately in the source and is sequenced here only to complete by D1200.`;
  }

  // Final commercial gates should require completed evidence, not merely a
  // simultaneous-start relationship with the evidence-producing process.
  replacePred(byId.get('P02-M494'),'P13-BIM-ASB',{id:'P13-BIM-ASB',relationship:'FS',lagDays:0});
  replacePred(byId.get('P02-M495'),'P07-QA-COMM',{id:'P07-QA-COMM',relationship:'FS',lagDays:0});
  replacePred(byId.get('P02-M496'),'P11-CDE-CO',{id:'P01-CO-003',relationship:'FS',lagDays:0});
  addPred(byId.get('P02-M497'),{id:'P01-CO-003',relationship:'FS',lagDays:0});

  // CP-08 defines the overall D1081–1200 closeout envelope, but the split
  // between commissioning and documentation below is our derived sequencing.
  for (const id of ['P01-CO-002','P01-CO-003','P01-CO-004','P01-CO-005']) {
    const row=byId.get(id); if(row) row.timing_basis='ASSUMPTION';
  }

  // Strengthen one connected network: every physical Area A/B/C/D package
  // release is downstream of the main-works readiness milestone in addition to
  // its local Site/HSE/Environment/QA gates.
  for (const row of rows) {
    if (row.plan_no !== '01' || !row.activity_id.endsWith('-REL')) continue;
    if (!/^P01-(?:A|B|C|D)/.test(row.activity_id)) continue;
    addPred(row,{id:'P01-PRE-REL',relationship:'FS',lagDays:0});
  }

  return rows;
}
