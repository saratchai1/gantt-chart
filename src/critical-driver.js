// Proposal driving-chain normalization.
// This does not claim the detailed lags are TOR-stated. It selects a logically
// plausible driving sequence within the current proposal bar placement and sets
// those links tight (zero edge slack) so the CPM analysis can expose a complete
// traceable path from NTP through the critical Area-A systems, source CP-05 / CP-06
// convergence, CP-07 integration and CP-08 closeout to the D1200 milestone.

function refresh(row){
  row.duration_days=row.milestone==='Y'?0:row.finish_day-row.start_day+1;
  row.predecessor=(row.predecessors||[]).map(p=>p.id).join(';');
  row.relationship=(row.predecessors||[]).map(p=>p.relationship).join(';');
  row.lag_days=(row.predecessors||[]).map(p=>p.lagDays||0).join(';');
}

function setWindow(row,start,finish=start){
  if(!row)return;
  row.start_day=start; row.finish_day=row.milestone==='Y'?start:finish; refresh(row);
}

function setTightLink(byId,predId,succId,relationship='FS'){
  const pred=byId.get(predId), succ=byId.get(succId);
  if(!pred||!succ)return;
  let lag=0;
  if(relationship==='FS'){
    const dayStep=pred.milestone==='Y'||succ.milestone==='Y'?0:1;
    lag=succ.start_day-pred.finish_day-dayStep;
  }else if(relationship==='SS') lag=succ.start_day-pred.start_day;
  else if(relationship==='FF') lag=succ.finish_day-pred.finish_day;
  else if(relationship==='SF') lag=succ.finish_day-pred.start_day;
  if(lag<0) throw new Error(`Cannot tighten ${predId} ${relationship} ${succId}; negative lag ${lag}`);
  const link={id:predId,relationship,lagDays:lag};
  const i=(succ.predecessors||[]).findIndex(p=>p.id===predId);
  if(i>=0) succ.predecessors[i]=link; else succ.predecessors.push(link);
  succ.notes=`${succ.notes ? succ.notes+' | ' : ''}Driving link ${predId} ${relationship}${lag?`+${lag}d`:''} is proposal/source-window CPM logic; it is not a source-stated leaf-activity lag unless noted separately.`;
  refresh(succ);
}

export function applyProposalDrivingChain(rows){
  const byId=new Map(rows.map(r=>[r.activity_id,r]));

  // Make the final Area-A commissioning/punch sequence continuous.
  const comm=byId.get('P01-A23-COMM');
  const snag=byId.get('P01-A23-SNAG');
  const corr=byId.get('P01-A23-CORR');
  const ho=byId.get('P01-A23-HO');
  if(comm&&snag&&corr&&ho){
    setWindow(snag,comm.finish_day+1,Math.max(comm.finish_day+1,ho.start_day-4));
    setWindow(corr,snag.finish_day+1,ho.start_day);
  }

  // Source start + enabling chain, detailed Area-A driver, source CP-window
  // convergence, and the detailed CP-08 closeout chain.
  const chain=[
    ['P01-PRE-NTP','P01-PRE-TEMP','FS'],
    ['P01-PRE-TEMP','P01-PRE-REL','FS'],
    ['P01-PRE-REL','P01-A23-REL','FS'],
    ['P01-A23-REL','P01-A23-SUR','FS'],

    // Detailed Area-A learning-centre driver inside CP-04 / CP-05.
    ['P01-A23-SUR','P01-A23-EXC','SS'],
    ['P01-A23-EXC','P01-A23-BLI','SS'],
    ['P01-A23-BLI','P01-A23-RBF','FS'],
    ['P01-A23-RBF','P01-A23-HOLD','FS'],
    ['P01-A23-HOLD','P01-A23-FND','FS'],
    ['P01-A23-FND','P01-A23-GB','SS'],
    ['P01-A23-GB','P01-A23-FRM','SS'],
    ['P01-A23-FRM','P01-A23-MEP1','SS'],
    ['P01-A23-MEP1','P01-A23-ELE1','SS'],
    ['P01-A23-ELE1','P01-A23-ICT1','SS'],
    ['P01-A23-ICT1','P01-A23-ICT2','FS'],
    ['P01-A23-ICT2','P01-A23-PRECOM','SS'],
    ['P01-A23-PRECOM','P01-A23-FUNC','FS'],
    ['P01-A23-FUNC','P01-A23-COMM','FS'],
    ['P01-A23-COMM','P01-A23-SNAG','FS'],
    ['P01-A23-SNAG','P01-A23-CORR','FS'],
    ['P01-A23-CORR','P01-A23-HO','FS'],

    // Explicit source control boundaries. CP-05 finishes D840. CP-06 finishes
    // D960 and overlaps CP-07, therefore an FF relationship preserves the
    // source D841-D1080 CP-07 window instead of falsely forcing CP-07 to start
    // only after every CP-06 workfront is globally complete.
    ['P01-A23-HO','P01-CP05-GATE','FS'],
    ['P01-D53-HO','P01-CP06-GATE','FS'],
    ['P01-CP05-GATE','P01-CO-001','FS'],
    ['P01-CP06-GATE','P01-CO-001','FF'],
    ['P01-D54-HO','P01-CO-001','FF'],

    // Detailed CP-08 closeout chain.
    ['P01-CO-001','P01-CO-D493','FS'],
    ['P01-CO-D493','P02-M493','FS'],
    ['P02-M493','P01-CO-D494','FS'],
    ['P01-CO-D494','P02-M494','FS'],
    ['P02-M494','P01-CO-D495','FS'],
    ['P01-CO-D495','P02-M495','FS'],
    ['P02-M495','P01-CO-D496','FS'],
    ['P01-CO-D496','P02-M496','FS'],
    ['P02-M496','P01-CO-D497','FS'],
    ['P01-CO-D497','P02-M497','FS'],
    ['P02-M497','P01-CO-ACC','FS'],
    ['P01-CO-ACC','P01-CO-006','FS']
  ];
  for(const [p,s,r] of chain) setTightLink(byId,p,s,r);

  return rows;
}
