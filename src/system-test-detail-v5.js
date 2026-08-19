import { addTask, fs, ff } from './schedule-core.js';

function refresh(row){
  if(!row)return;
  row.duration_days=row.milestone==='Y'?0:row.finish_day-row.start_day+1;
  row.predecessor=(row.predecessors||[]).map(p=>p.id).join(';');
  row.relationship=(row.predecessors||[]).map(p=>p.relationship).join(';');
  row.lag_days=(row.predecessors||[]).map(p=>p.lagDays||0).join(';');
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

/**
 * Expand the generic building functional-testing window into package-specific
 * parallel test packs. Plan 1 identifies the package's principal systems while
 * Plan 7 requires inspection/testing evidence before acceptance. Exact detailed
 * test durations are proposal allowances; the source does not provide separate
 * leaf-level test dates.
 */
export function applySystemTestDetailV5(rows){
  const byId=new Map(rows.map(r=>[r.activity_id,r]));

  const profiles={
    'P01-A23':[
      ['ETST','Electrical','Electrical insulation / continuity / protection / device functional test pack'],
      ['PTST','Plumbing/Fire','Plumbing / drainage / fire-service pressure, leak and functional test pack'],
      ['HTST','HVAC','HVAC equipment / controls / air-water functional test pack'],
      ['ITST','ICT/AV/Security','ICT / CCTV / network / AV / access-control point-to-point and functional test pack']
    ],
    'P01-A24':[
      ['ETST','Electrical','Electrical distribution / device / kitchen-equipment supply functional test pack'],
      ['PTST','Plumbing/Fire','Water / drainage / grease-drain / sanitary leak and functional test pack'],
      ['HTST','HVAC/Kitchen Ventilation','Kitchen exhaust / make-up-air / ventilation functional test pack'],
      ['KTST','Kitchen Equipment','Kitchen equipment interface / hygiene-related operational test pack']
    ],
    'P01-A25':[
      ['ETST','Electrical','Electrical distribution / lighting / protection functional test pack'],
      ['ITST','ICT/AV/Security','Conference AV / sound / communications / control-system functional test pack']
    ],
    'P01-A26':[
      ['WTST','Process Water','Water-production / pump / tank / valve / flushing / process functional test pack'],
      ['CTST','Electrical/Controls','Power / instrumentation / control-panel / sensor functional test pack']
    ],
    'P01-A29':[
      ['ETST','Electrical','Electrical / lighting / protection functional test pack'],
      ['PTST','Plumbing/Fire','Building-services plumbing / drainage functional test pack where applicable']
    ],
    'P01-B31':[
      ['PTST','Plumbing/Sanitary','Sanitary / water / drainage pressure, leak and discharge functional test pack'],
      ['ETST','Electrical','Electrical / lighting / protection functional test pack where applicable']
    ],
    'P01-B32':[
      ['WTST','Waste-System Interface','Waste-handling / drainage / washdown / environmental-control interface test pack where applicable'],
      ['ETST','Electrical','Electrical / lighting / equipment-supply functional test pack where applicable']
    ],
    'P01-C41':[
      ['ETST','Electrical','Electrical / lighting / protection functional test pack'],
      ['PTST','Plumbing/Fire','Plumbing / drainage / fire-service functional test pack where applicable'],
      ['ITST','ICT/Communications','Communications / access / operational interface test pack where applicable']
    ],
    'P01-C42A':[
      ['ETST','Electrical','Tent-house electrical / lighting / protection functional test pack'],
      ['PTST','Plumbing/Sanitary','Tent-house water / sanitary / drainage functional test pack where applicable']
    ],
    'P01-C42B':[
      ['ETST','Electrical','Tent-house electrical / lighting / protection functional test pack'],
      ['PTST','Plumbing/Sanitary','Tent-house water / sanitary / drainage functional test pack where applicable']
    ],
    'P01-C42C':[
      ['ETST','Electrical','Tent-house electrical / lighting / protection functional test pack'],
      ['PTST','Plumbing/Sanitary','Tent-house water / sanitary / drainage functional test pack where applicable']
    ],
    'P01-C43':[
      ['PTST','Process Pumping','Pump / piping / valve / flow / operational functional test pack'],
      ['CTST','Electrical/Controls','Pump power / protection / controls / instrumentation functional test pack']
    ]
  };

  let seq=0;
  for(const [prefix,tests] of Object.entries(profiles)){
    const pre=byId.get(`${prefix}-PRECOM`),func=byId.get(`${prefix}-FUNC`),comm=byId.get(`${prefix}-COMM`);
    if(!pre||!func||!comm) continue;
    const area=func.building_area,zone=func.zone;
    const added=[];
    for(const [code,discipline,name] of tests){
      const id=`${prefix}-${code}`;
      if(byId.has(id)){added.push(id);continue;}
      addTask({
        id,wbs:`${func.wbs}.T${String(++seq).padStart(2,'0')}`,plan:1,zone,area,discipline,
        name,startDay:func.start_day,finishDay:func.finish_day,predecessors:[fs(pre.activity_id)],
        responsible:`${discipline} + Commissioning + QA/QC`,
        installmentStart:func.installment_start,installmentEnd:func.installment_end,
        deliverable:`Approved ${name.toLowerCase()} / test evidence`,
        basis:'ASSUMPTION',timingBasis:'ASSUMPTION',
        source:`Plan 1 package ${prefix.replace('P01-','')} principal scope + Plan 7 testing/acceptance requirements`,
        notes:'V5 detailed test-pack split. System content follows the package principal scope stated by Plan 1; exact detailed test duration/date is a proposal allowance and “where applicable” scope requires final IFC/BOQ confirmation.'
      });
      const row=rows[rows.length-1]; byId.set(id,row); added.push(id);
    }

    // Keep FUNC as the package-level functional-test coordination/acceptance
    // window. Individual test packs must finish no later than this window.
    for(const id of added) addPred(func,ff(id,0));
    addNote(func,`V5 functional-test coordination window receives ${added.length} package-specific system test packs before integrated commissioning.`);
  }

  for(const row of rows) refresh(row);
  return rows;
}
