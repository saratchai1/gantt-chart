function refreshPred(row) {
  row.predecessor = (row.predecessors || []).map(p => p.id).join(';');
  row.relationship = (row.predecessors || []).map(p => p.relationship).join(';');
  row.lag_days = (row.predecessors || []).map(p => p.lagDays || 0).join(';');
}

function setWindow(row,start,finish=start){
  if(!row)return;
  row.start_day=start;
  row.finish_day=row.milestone==='Y'?start:finish;
  row.duration_days=row.milestone==='Y'?0:finish-start+1;
}

function replacePred(row, oldId, newPred) {
  if (!row) return;
  row.predecessors = (row.predecessors || []).map(p => p.id === oldId ? newPred : p);
  refreshPred(row);
}

function removePred(row,id){
  if(!row)return;
  row.predecessors=(row.predecessors||[]).filter(p=>p.id!==id);
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

  // ------------------------------------------------------------------
  // Final closeout sequence. Source states the ordered deliverable categories
  // for installments 493–497 and the D1081–D1200 CP-08 envelope, but not the
  // separate exact day of each final installment. Exact dates below are thus
  // proposal assumptions and are explicitly tagged as such.
  // ------------------------------------------------------------------
  const finalMilestones={
    'P02-M493':1110,
    'P02-M494':1140,
    'P02-M495':1160,
    'P02-M496':1180,
    'P02-M497':1195
  };
  for(const [id,day] of Object.entries(finalMilestones)){
    const row=byId.get(id); if(!row)continue;
    setWindow(row,day,day);
    row.timing_basis='ASSUMPTION';
    row.notes=`${row.notes ? row.notes+' | ' : ''}Deliverable is source-stated; exact proposal day is not stated separately in the source. Date is an internal split of the source CP-08 D1081–D1200 envelope.`;
  }

  // Make final site restoration complete with installment 493 rather than
  // continuing behind the contractual closeout sequence.
  setWindow(byId.get('P03-SITE-DEMOB'),1050,1110);
  setWindow(byId.get('P10-ENV-REST'),1000,1110);
  setWindow(byId.get('P16-HER-REST'),1000,1110);
  addPred(byId.get('P01-CO-D493'),{id:'P03-SITE-DEMOB',relationship:'FF',lagDays:0});
  addPred(byId.get('P01-CO-D493'),{id:'P10-ENV-REST',relationship:'FF',lagDays:0});
  addPred(byId.get('P01-CO-D493'),{id:'P16-HER-REST',relationship:'FF',lagDays:0});

  // Commercial milestones are gates after the detailed evidence-producing
  // closeout activities, and each next final package starts from the prior gate.
  for(const [milestone,detail] of [
    ['P02-M493','P01-CO-D493'],['P02-M494','P01-CO-D494'],['P02-M495','P01-CO-D495'],
    ['P02-M496','P01-CO-D496'],['P02-M497','P01-CO-D497']
  ]){
    const m=byId.get(milestone); if(!m)continue;
    m.predecessors=[{id:detail,relationship:'FS',lagDays:0}];
    refreshPred(m);
  }

  // Final handover readiness occurs after the last asset package and all other
  // required cross-plan evidence. Acceptance processing consumes D1195–D1200.
  addPred(byId.get('P01-CO-005'),{id:'P01-CO-D497',relationship:'FS',lagDays:0});
  addPred(byId.get('P01-CO-006'),{id:'P01-CO-ACC',relationship:'FS',lagDays:0});

  // CP-08 high-level parallel control bars remain planning overlays rather than
  // source-exact internal splits.
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

  // Make the Area-A critical building handover the transition into CP-07.
  // One project-day lag represents D840 milestone -> D841 source CP-07 start.
  const co1=byId.get('P01-CO-001');
  if(co1){
    removePred(co1,'P01-A23-HO');
    addPred(co1,{id:'P01-A23-HO',relationship:'FS',lagDays:1});
  }

  return rows;
}
