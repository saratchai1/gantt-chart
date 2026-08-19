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

function rollingSS(pred,day){
  return ss(pred.activity_id,Math.max(0,day-pred.start_day));
}

/**
 * Activity-level control gates derived directly from Plans 7, 8, 9 and 10.
 *
 * The source plans require JSEA/PTW before high-risk work, environmental
 * readiness before impact-generating work, and Hold/Witness/Review controls
 * before concealed work is closed. The physical generator already has the
 * construction bars; this layer inserts explicit zero-duration control gates
 * immediately before those bars without inventing a new physical work package.
 *
 * Exact gate days are aligned to the current proposal workfront start and are
 * therefore timing assumptions, not TOR-stated dates.
 */
export function applyTaskControlGatesV4(rows){
  const byId=new Map(rows.map(r=>[r.activity_id,r]));
  let qaSeq=0,hseSeq=0,envSeq=0,trfSeq=0;

  const registerGate=({id,wbs,plan,zone,area,discipline,name,day,preds,responsible,deliverable,source,notes})=>{
    if(byId.has(id)) return byId.get(id);
    addTask({
      id,wbs,plan,zone,area,discipline,name,startDay:day,milestone:true,
      predecessors:preds,responsible,deliverable,basis:'DERIVED',timingBasis:'ASSUMPTION',source,notes
    });
    const row=rows[rows.length-1];
    byId.set(id,row);
    return row;
  };

  const buildingPrefixes=[
    'P01-A23','P01-A24','P01-A25','P01-A26','P01-A29',
    'P01-B31','P01-B32','P01-C41','P01-C42A','P01-C42B','P01-C42C','P01-C43'
  ];
  const externalPrefixes=['P01-A21','P01-A22','P01-A27','P01-A28','P01-B33','P01-B34','P01-D51','P01-D52','P01-D53','P01-D54'];

  // ------------------------------------------------------------------
  // Plan 8 — excavation / earthwork JSEA + PTW readiness.
  // Plan 8 §1.2 specifically identifies excavation hazards and minimum permit,
  // ground/water/access/barricade/spoil/plant controls. Each physical earthwork
  // start therefore receives a dedicated activity-level permit gate.
  // ------------------------------------------------------------------
  for(const [prefix,suffix] of [
    ...buildingPrefixes.map(p=>[p,'EXC']),
    ...externalPrefixes.map(p=>[p,'EW'])
  ]){
    const target=byId.get(`${prefix}-${suffix}`), rel=byId.get(`${prefix}-REL`);
    if(!target||!rel)continue;
    const token=prefix.replace('P01-','');
    const zone=target.zone;
    const id=`P08-${token}-EARTH-PTW`;
    const gate=registerGate({
      id,wbs:`08.4.${++hseSeq}`,plan:8,zone,area:target.building_area,discipline:'HSE / PTW',
      name:`Excavation / earthwork JSEA and permit-to-work readiness — ${target.building_area}`,
      day:target.start_day,preds:[fs(rel.activity_id),fs(`P08-HSE-${zone}-REL`)],
      responsible:'HSE + Area Supervisor + Excavation / Civil Supervisor',
      deliverable:'Approved JSEA / excavation PTW / access-barricade-ground-water readiness record',
      source:'Plan 8 §§1.1–1.2 — JSEA/PTW before excavation and high-risk work',
      notes:'Gate day follows the current proposal earthwork workfront start. Exact day is not source-stated.'
    });
    addPred(target,fs(gate.activity_id));
    addNote(target,'Activity-level Plan-8 excavation/JSEA/PTW gate added in v0.4 refinement.');
  }

  // ------------------------------------------------------------------
  // Plan 10 — localized environmental readiness before earthwork.
  // Plan 10 requires boundary, drainage, sediment, spill/waste controls and
  // responsible monitoring to be ready before impact-generating activities.
  // ------------------------------------------------------------------
  for(const [prefix,suffix] of [
    ...buildingPrefixes.map(p=>[p,'EXC']),
    ...externalPrefixes.map(p=>[p,'EW'])
  ]){
    const target=byId.get(`${prefix}-${suffix}`), rel=byId.get(`${prefix}-REL`);
    if(!target||!rel)continue;
    const token=prefix.replace('P01-','');
    const zone=target.zone;
    const id=`P10-${token}-EARTH-ENV`;
    const gate=registerGate({
      id,wbs:`10.4.${++envSeq}`,plan:10,zone,area:target.building_area,discipline:'Environment / Workfront Gate',
      name:`Earthwork environmental-control readiness — ${target.building_area}`,
      day:target.start_day,preds:[fs(rel.activity_id),fs(`P10-ENV-${zone}-REL`)],
      responsible:'Environmental Manager + Area Supervisor',
      deliverable:'Verified boundary / drainage / sediment / spill / waste controls for earthwork start',
      source:'Plan 10 §§2–2.1 — controls ready before mobilization and earthwork',
      notes:'Local workfront verification derived from the Plan-10 readiness requirement; exact gate day follows proposal earthwork start.'
    });
    addPred(target,fs(gate.activity_id));
    addNote(target,'Activity-level Plan-10 environmental earthwork-release gate added in v0.4 refinement.');
  }

  // ------------------------------------------------------------------
  // Plan 8 — work-at-height readiness before roof work.
  // The gate represents scaffold/anchor/fall-protection/exclusion/rescue
  // readiness at the rolling roof workfront, not completion of the whole frame.
  // ------------------------------------------------------------------
  for(const prefix of buildingPrefixes){
    const roof=byId.get(`${prefix}-ROOF`), frame=byId.get(`${prefix}-FRM`), rel=byId.get(`${prefix}-REL`);
    if(!roof||!frame||!rel)continue;
    const token=prefix.replace('P01-',''), zone=roof.zone;
    const gate=registerGate({
      id:`P08-${token}-WAH`,wbs:`08.4.${++hseSeq}`,plan:8,zone,area:roof.building_area,discipline:'HSE / Work at Height',
      name:`Work-at-height / scaffold / fall-rescue readiness — ${roof.building_area}`,
      day:roof.start_day,preds:[fs(rel.activity_id),fs(`P08-HSE-${zone}-REL`),rollingSS(frame,roof.start_day)],
      responsible:'HSE + Area Supervisor + Competent Scaffold / Work-at-Height Person',
      deliverable:'Scaffold/working-platform/anchor/fall-protection/exclusion/rescue readiness record',
      source:'Plan 8 §§1.2,2 — work-at-height controls and rescue readiness',
      notes:'Rolling-workfront SS lag is a proposal scheduling allowance; it does not claim whole-frame completion before roof work.'
    });
    addPred(roof,fs(gate.activity_id));
    addNote(roof,'Plan-8 work-at-height readiness gate added before roof work.');
  }

  // ------------------------------------------------------------------
  // Plan 7 — above-ceiling concealed-work Hold Point.
  // The source requires Hold Points for work that will be concealed or difficult
  // to correct later. The first-fix trades are represented as rolling SS inputs
  // to the inspection gate, then ceiling closure is FS from the gate.
  // ------------------------------------------------------------------
  for(const prefix of buildingPrefixes){
    const ceil=byId.get(`${prefix}-CEIL`), rel=byId.get(`${prefix}-REL`);
    if(!ceil||!rel)continue;
    const token=prefix.replace('P01-',''), zone=ceil.zone;
    const firstFix=['MEP1','ELE1','PLB1','HV1','ICT1'].map(s=>byId.get(`${prefix}-${s}`)).filter(Boolean);
    const preds=[fs(rel.activity_id),fs(`P07-QA-${zone}-PREP`),...firstFix.map(r=>rollingSS(r,ceil.start_day))];
    const gate=registerGate({
      id:`P07-${token}-CEIL-HOLD`,wbs:`07.4.${++qaSeq}`,plan:7,zone,area:ceil.building_area,discipline:'QA/QC Hold Point',
      name:`Above-ceiling concealed-services Hold Point / closure release — ${ceil.building_area}`,
      day:ceil.start_day,preds,
      responsible:'QA/QC + MEP/Electrical/HVAC/ICT Inspectors + Area Engineer',
      deliverable:'Approved above-ceiling inspection / concealed-services release before closure',
      source:'Plan 7 §§1.1,3–6 — Hold Point before concealed work is closed',
      notes:'First-fix SS lags represent progressive zone release, not a claim that all first-fix work in the whole building is complete.'
    });
    addPred(ceil,fs(gate.activity_id));
    addNote(ceil,'Plan-7 above-ceiling Hold Point added as an explicit predecessor to closure.');
  }

  // ------------------------------------------------------------------
  // Plan 8 — electrical isolation / LOTO readiness before precommissioning.
  // Precommissioning is progressive by system; therefore the electrical second
  // fix enters the gate as a rolling SS condition rather than a false global FS.
  // ------------------------------------------------------------------
  for(const prefix of buildingPrefixes){
    const pre=byId.get(`${prefix}-PRECOM`), ele2=byId.get(`${prefix}-ELE2`), rel=byId.get(`${prefix}-REL`);
    if(!pre||!rel)continue;
    const token=prefix.replace('P01-',''), zone=pre.zone;
    const preds=[fs(rel.activity_id),fs(`P08-HSE-${zone}-REL`)];
    if(ele2) preds.push(rollingSS(ele2,pre.start_day));
    const gate=registerGate({
      id:`P08-${token}-LOTO`,wbs:`08.4.${++hseSeq}`,plan:8,zone,area:pre.building_area,discipline:'HSE / LOTO',
      name:`Electrical isolation / LOTO / test-before-touch readiness for precommissioning — ${pre.building_area}`,
      day:pre.start_day,preds,
      responsible:'Authorized Electrical Person + HSE + Commissioning Lead',
      deliverable:'LOTO / isolation / authorization / test-before-touch permit record',
      source:'Plan 8 §1.2 — electrical isolation, lock/tag and test-before-touch controls',
      notes:'Gate is applied per progressive commissioning workfront; exact day follows the proposal precommissioning start.'
    });
    addPred(pre,fs(gate.activity_id));
    addNote(pre,'Plan-8 LOTO/electrical-isolation readiness gate added before precommissioning.');
  }

  // ------------------------------------------------------------------
  // Area D / raw-water pontoon — special lifting, traffic and near-water gates.
  // These are explicitly supported by Plans 8, 9 and 16 and avoid treating the
  // pontoon work as a generic building package.
  // ------------------------------------------------------------------
  const lift=byId.get('P01-D55-LIFT'), access=byId.get('P01-D55-ACC');
  if(lift&&access){
    const hseGate=registerGate({
      id:'P08-D55-LIFT-PTW',wbs:`08.4.${++hseSeq}`,plan:8,zone:'D',area:lift.building_area,discipline:'HSE / Lifting',
      name:'Raw-water pontoon lifting-plan / exclusion-zone / emergency-readiness permit gate',
      day:lift.start_day,preds:[fs('P08-HSE-D-REL'),fs(access.activity_id)],
      responsible:'Lifting Supervisor + Rigger/Signaler + HSE + Crane/Plant Responsible Person',
      deliverable:'Approved lift plan / certified team / ground-support / exclusion / rescue readiness record',
      source:'Plan 8 §§1.2,2 — lifting controls, exclusion zone and emergency readiness',
      notes:'Specific to the raw-water pontoon lifting workfront; exact gate day follows the proposal lift start.'
    });
    addPred(lift,fs(hseGate.activity_id));

    const trafficGate=registerGate({
      id:'P09-D55-LIFT-ROUTE',wbs:`09.4.${++trfSeq}`,plan:9,zone:'D',area:lift.building_area,discipline:'Traffic / Special Movement',
      name:'Special movement / lifting-route and unloading-area readiness — raw-water pontoon',
      day:lift.start_day,preds:[fs('P09-TRF-002'),fs('P09-TRF-003'),fs('P05-PLT-002')],
      responsible:'Traffic Manager + Logistics + Lifting Supervisor + Plant Manager',
      deliverable:'Verified special route / turning / bearing / unloading / signaler / booking readiness',
      source:'Plan 9 §§1–2.1 — special/heavy movement requires route survey, traffic approval and lift-specific readiness',
      notes:'Exact gate day follows the proposal lifting workfront; source controls the process, not this detailed date.'
    });
    addPred(lift,fs(trafficGate.activity_id));
    addNote(lift,'Plans 8/9 special lifting and route-readiness gates added for the pontoon workfront.');
  }

  const pont=byId.get('P01-D55-PONT'), rescue=byId.get('P01-D55-RES');
  if(pont&&rescue){
    const gate=registerGate({
      id:'P08-D55-WATER-PTW',wbs:`08.4.${++hseSeq}`,plan:8,zone:'D',area:pont.building_area,discipline:'HSE / Near Water',
      name:'Near-water weather / water-condition / rescue / evacuation readiness gate — raw-water pontoon',
      day:pont.start_day,preds:[fs(rescue.activity_id),fs('P08-HSE-D-REL'),fs('P10-ENV-D-REL'),fs('P16-HER-D-PERMIT')],
      responsible:'HSE + Near-water Watcher + Environmental/Heritage Team + Area Supervisor',
      deliverable:'Water/weather check / life-saving equipment / watcher / communication / evacuation readiness permit',
      source:'Plan 8 §§1.2,2–4 + Plan 16 §§3–3.2 — near-water and sensitive-area work readiness',
      notes:'No buffer distance or water restriction has been invented; the gate uses only approved project-specific boundaries and conditions.'
    });
    addPred(pont,fs(gate.activity_id));
    addNote(pont,'Near-water HSE/environment/heritage readiness gate added before pontoon installation.');
  }

  for(const row of rows) refresh(row);
  return rows;
}
