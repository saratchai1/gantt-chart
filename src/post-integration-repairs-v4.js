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

function addNote(row,text){
  if(!row||!text)return;
  if(!String(row.notes||'').includes(text)) row.notes=`${row.notes?row.notes+' | ':''}${text}`;
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
  addNote(projectRest,'V4 repair: project-wide waste-control records continue beyond the environmental restoration verification bar and close at final restoration/demobilization acceptance.');

  // Plan 7 calibration / laboratory / sample-control setup is an enabling
  // quality-control prerequisite, not a stand-alone bar. Connect it to every
  // Area Method Statement / ITP readiness package so its downstream value is
  // explicit before field inspection/testing starts.
  for(const zone of ['A','B','C','D']){
    const prep=byId.get(`P07-QA-${zone}-PREP`);
    if(prep) addPred(prep,{id:'P07-QA-003',relationship:'FS',lagDays:0});
  }
  addNote(byId.get('P07-QA-003'),'V4 integration: calibration/laboratory/test-record setup feeds each Area QA readiness package before inspection/testing cycles commence.');

  // Plan 15 preliminary activity-data collection starts before the periodic
  // calculation/reporting cycle and continues into that cycle. SS captures the
  // intended overlap without pretending the complete prelim dataset must finish
  // before the first carbon calculation/reporting review can begin.
  const carbonPre=byId.get('P15-CAR-PRE'),carbonRep=byId.get('P15-CAR-REP');
  if(carbonPre&&carbonRep){
    addPred(carbonRep,{id:carbonPre.activity_id,relationship:'SS',lagDays:0});
    addNote(carbonRep,'V4 integration: preliminaries carbon activity-data collection is an overlapping input to the periodic calculation/QA/reporting cycle.');
  }

  for(const row of rows) refresh(row);
  return rows;
}
