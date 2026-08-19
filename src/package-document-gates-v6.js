import { addTask, fs, ss } from './schedule-core.js';

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

function activeAt(row,day){
  if(!row)return null;
  if(day < row.start_day) return null;
  if(day > row.finish_day) return fs(row.activity_id);
  return ss(row.activity_id,Math.max(0,day-row.start_day));
}

/**
 * Plan 7 states that approved drawings, Method Statements, ITPs, checklists and
 * calibration/readiness documents must exist before work; Plan 11 controls the
 * approved/revision status; Plan 13 coordinates models/constructability. This
 * layer makes those requirements visible at package/disciplines rather than
 * relying only on one Area-wide readiness bar.
 *
 * Exact release days follow the current proposal workfront starts and remain
 * timing assumptions. The gates do not claim that a source document specifies
 * those exact days.
 */
export function applyPackageDocumentGatesV6(rows){
  const byId=new Map(rows.map(r=>[r.activity_id,r]));
  let seq=0;

  const makeGate=({id,zone,area,name,day,targets,source,deliverable,extraPreds=[]})=>{
    if(byId.has(id)) return byId.get(id);
    const preds=[fs('P11-CDE-004')];
    const qa=byId.get(`P07-QA-${zone}-PREP`);
    if(qa) preds.push(fs(qa.activity_id));
    const bim=byId.get(`P13-BIM-${zone}-COORD`);
    const bimLink=activeAt(bim,day); if(bimLink) preds.push(bimLink);
    const design=byId.get('P01-PRE-DES');
    const designLink=activeAt(design,day); if(designLink) preds.push(designLink);
    for(const p of extraPreds) if(p) preds.push(p);

    addTask({
      id,wbs:`11.4.${String(++seq).padStart(3,'0')}`,plan:11,zone,area,
      discipline:'Controlled Document / Engineering Gate',name,startDay:day,milestone:true,
      predecessors:preds,responsible:'Document Control + Engineering + QA/QC + BIM/Information Management',
      deliverable,basis:'DERIVED',timingBasis:'ASSUMPTION',source,
      notes:'V6 package-level controlled-document release. Requirement is source-derived; exact gate day is aligned to the current proposal workfront and must be confirmed against approved document schedules.'
    });
    const gate=rows[rows.length-1]; byId.set(id,gate);
    for(const targetId of targets){
      const target=byId.get(targetId); if(!target)continue;
      addPred(target,fs(gate.activity_id));
      addNote(target,`V6 controlled-document release predecessor: ${gate.activity_id}.`);
    }
    return gate;
  };

  const buildingPrefixes=[
    'P01-A23','P01-A24','P01-A25','P01-A26','P01-A29',
    'P01-B31','P01-B32','P01-C41','P01-C42A','P01-C42B','P01-C42C','P01-C43'
  ];

  for(const prefix of buildingPrefixes){
    const rel=byId.get(`${prefix}-REL`); if(!rel)continue;
    const zone=rel.zone,area=rel.building_area,token=prefix.replace('P01-','');

    const rbf=byId.get(`${prefix}-RBF`),fmf=byId.get(`${prefix}-FMF`);
    const strTargets=[rbf,fmf].filter(Boolean);
    if(strTargets.length){
      const day=Math.min(...strTargets.map(r=>r.start_day));
      makeGate({
        id:`P11-${token}-STR-DOC`,zone,area,day,
        name:`Approved structural drawings / Method Statement / ITP release — ${area}`,
        targets:strTargets.map(r=>r.activity_id),
        deliverable:'Controlled approved structural drawing / Method Statement / ITP / checklist release record',
        source:'Plans 1 CP-03/CP-04 + Plan 7 §§1–2,5 + Plan 11 controlled-document workflow + Plan 13 coordination'
      });
    }

    const archTargets=['ENV','EWALL','PART'].map(s=>byId.get(`${prefix}-${s}`)).filter(Boolean);
    if(archTargets.length){
      const day=Math.min(...archTargets.map(r=>r.start_day));
      makeGate({
        id:`P11-${token}-ARC-DOC`,zone,area,day,
        name:`Approved architectural / envelope coordination document release — ${area}`,
        targets:archTargets.map(r=>r.activity_id),
        deliverable:'Controlled approved architectural/envelope drawings, interfaces, Method Statement and ITP release record',
        source:'Plan 1 package scope + Plan 7 §§1–2,5 + Plan 11 + Plan 13 coordination/constructability'
      });
    }

    const mepTargets=['MEP1','ELE1','PLB1','HV1','ICT1'].map(s=>byId.get(`${prefix}-${s}`)).filter(Boolean);
    if(mepTargets.length){
      const day=Math.min(...mepTargets.map(r=>r.start_day));
      makeGate({
        id:`P11-${token}-MEP-DOC`,zone,area,day,
        name:`Coordinated building-services / sleeves / first-fix document release — ${area}`,
        targets:mepTargets.map(r=>r.activity_id),
        deliverable:'Approved coordinated MEP/ICT drawings / sleeves-penetration interfaces / Method Statement / ITP release',
        source:'Plan 1 permanent-utility coordination + Plan 7 §§1–2,5 + Plan 11 + Plan 13 clash/constructability coordination'
      });
    }

    const pre=byId.get(`${prefix}-PRECOM`);
    if(pre){
      makeGate({
        id:`P11-${token}-TST-DOC`,zone,area,day:pre.start_day,
        name:`Approved precommissioning / test procedure / acceptance-form release — ${area}`,
        targets:[pre.activity_id],
        deliverable:'Controlled approved precommissioning procedures / test sheets / acceptance criteria / responsibilities',
        source:'Plan 1 testing/commissioning requirements + Plan 7 testing evidence + Plan 11 controlled workflow'
      });
    }
  }

  const externalPrefixes=['P01-A21','P01-A22','P01-A27','P01-A28','P01-B33','P01-B34','P01-D51','P01-D52','P01-D53','P01-D54'];
  for(const prefix of externalPrefixes){
    const rel=byId.get(`${prefix}-REL`); if(!rel)continue;
    const zone=rel.zone,area=rel.building_area,token=prefix.replace('P01-','');
    const civilTargets=['EW','DRN','BASE'].map(s=>byId.get(`${prefix}-${s}`)).filter(Boolean);
    if(civilTargets.length){
      const day=Math.min(...civilTargets.map(r=>r.start_day));
      makeGate({
        id:`P11-${token}-CIV-DOC`,zone,area,day,
        name:`Approved external civil / drainage Method Statement / ITP release — ${area}`,
        targets:civilTargets.map(r=>r.activity_id),
        deliverable:'Controlled approved earthwork/drainage/base Method Statement / ITP / inspection checklist',
        source:'Plan 1 external-work scope + Plan 7 §§1–2,5 + Plan 10 activity controls + Plan 11 document status'
      });
    }

    const utilTargets=['UTIL','ELE'].map(s=>byId.get(`${prefix}-${s}`)).filter(Boolean);
    if(utilTargets.length){
      const day=Math.min(...utilTargets.map(r=>r.start_day));
      makeGate({
        id:`P11-${token}-UTIL-DOC`,zone,area,day,
        name:`Approved external utility / electrical coordination release — ${area}`,
        targets:utilTargets.map(r=>r.activity_id),
        deliverable:'Controlled approved utility/electrical route, interface, Method Statement and ITP release',
        source:'Plan 1 external-system coordination + Plan 7 + Plan 11 + Plan 13 where applicable'
      });
    }

    const landTargets=['PAVE','SOIL','SOFT','IRR'].map(s=>byId.get(`${prefix}-${s}`)).filter(Boolean);
    if(landTargets.length){
      const day=Math.min(...landTargets.map(r=>r.start_day));
      makeGate({
        id:`P11-${token}-LAND-DOC`,zone,area,day,
        name:`Approved hardscape / landscape / rehabilitation document release — ${area}`,
        targets:landTargets.map(r=>r.activity_id),
        deliverable:'Approved landscape/hardscape/irrigation/rehabilitation method, material and inspection-document release',
        source:'Plan 1 landscape/external scope + Plans 7,10,11 and Plan 16 for Area D'
      });
    }
  }

  // Raw-water pontoon has a distinct marine/near-water scope rather than the
  // generic building/external templates.
  const d55Targets=['FAB','LIFT','PONT'].map(s=>byId.get(`P01-D55-${s}`)).filter(Boolean);
  if(d55Targets.length){
    const day=Math.min(...d55Targets.map(r=>r.start_day));
    makeGate({
      id:'P11-D55-MAR-DOC',zone:'D',area:'แพสูบน้ำดิบ',day,
      name:'Approved pontoon fabrication / lifting / near-water installation document release',
      targets:d55Targets.map(r=>r.activity_id),
      deliverable:'Controlled fabrication / lifting / installation Method Statements, drawings, ITP and interface release',
      source:'Plan 1 package 5.5 + Plans 7,8,9,11,13,16',
      extraPreds:[fs('P16-HER-D-PERMIT')]
    });
  }
  const d55Pre=byId.get('P01-D55-PRE');
  if(d55Pre){
    makeGate({
      id:'P11-D55-TST-DOC',zone:'D',area:'แพสูบน้ำดิบ',day:d55Pre.start_day,
      name:'Approved raw-water pump precommissioning / functional-test procedure release',
      targets:[d55Pre.activity_id],
      deliverable:'Approved pump/piping/electrical/control precommissioning and functional-test procedures / records',
      source:'Plan 1 package 5.5 testing + Plans 7,11,16',
      extraPreds:[fs('P16-HER-D-PERMIT')]
    });
  }

  for(const row of rows) refresh(row);
  return rows;
}
