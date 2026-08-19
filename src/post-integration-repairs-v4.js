function refresh(row){
  if(!row)return;
  row.duration_days=row.milestone==='Y'?0:row.finish_day-row.start_day+1;
  row.predecessor=(row.predecessors||[]).map(p=>p.id).join(';');
  row.relationship=(row.predecessors||[]).map(p=>p.relationship).join(';');
  row.lag_days=(row.predecessors||[]).map(p=>p.lagDays||0).join(';');
}

function removePred(row,id){
  if(!row)return;
  row.predecessors=(row.predecessors||[]).filter(p=>p.id!==id);
  refresh(row);
}

function addPred(row,pred){
  if(!row)return;
  const i=(row.predecessors||[]).findIndex(p=>p.id===pred.id);
  if(i>=0) row.predecessors[i]=pred;
  else row.predecessors.push(pred);
  refresh(row);
}

export function applyPostIntegrationRepairsV4(rows){
  const byId=new Map(rows.map(r=>[r.activity_id,r]));

  // The project-wide waste-control operation intentionally continues through
  // D1140, later than the D1110 environmental-restoration verification bar.
  // It therefore cannot be an FF predecessor of P10-ENV-REST. Instead its
  // completion is reconciled at the broader final restoration/demobilization
  // acceptance window, which finishes later and already aggregates Plans 3/5/9/10/16.
  const envRest=byId.get('P10-ENV-REST');
  removePred(envRest,'P10-ENV-WASTE');
  const projectRest=byId.get('P01-CO-004');
  addPred(projectRest,{id:'P10-ENV-WASTE',relationship:'FF',lagDays:0});
  if(projectRest){
    const text='V4 repair: project-wide waste-control records continue beyond the environmental restoration verification bar and close at final restoration/demobilization acceptance.';
    if(!String(projectRest.notes||'').includes(text)) projectRest.notes=`${projectRest.notes?projectRest.notes+' | ':''}${text}`;
  }

  for(const row of rows) refresh(row);
  return rows;
}
