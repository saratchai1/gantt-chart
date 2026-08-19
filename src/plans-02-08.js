import { addTask, fs, ss } from './schedule-core.js';

export const procurementRelease = {};

export function buildPlans02to08() {
  // ------------------------------------------------------------------
  // PLAN 03 — Site management / workfront gates
  // ------------------------------------------------------------------
  addTask({id:'P03-SITE-001',wbs:'03.1.1',plan:3,discipline:'Site Management',name:'Survey-based site logistics / access / temporary-facility layout',startDay:1,finishDay:30,responsible:'Site / Logistics Manager + Survey',deliverable:'Controlled site logistics plan',basis:'SOURCE',source:'Plan 3 §1'});
  addTask({id:'P03-SITE-002',wbs:'03.1.2',plan:3,discipline:'Site Management',name:'Site office / welfare / first aid / coordination-centre setup',startDay:20,finishDay:60,predecessors:[ss('P03-SITE-001',19)],responsible:'Site Manager',deliverable:'Approved site office / welfare facilities',basis:'DERIVED',source:'Plan 3 §1.1'});
  addTask({id:'P03-SITE-003',wbs:'03.1.3',plan:3,discipline:'Temporary Utilities',name:'Temporary power / water / sanitation / drainage / firefighting / communications',startDay:25,finishDay:90,predecessors:[ss('P03-SITE-001',24)],responsible:'Site + MEP + HSE',deliverable:'Temporary utilities test / release',basis:'DERIVED',source:'Plan 3 §2'});
  addTask({id:'P03-SITE-004',wbs:'03.1.4',plan:3,discipline:'Site Logistics',name:'Warehouse / material quarantine / plant yard / controlled fuel-maintenance area setup',startDay:40,finishDay:90,predecessors:[ss('P03-SITE-001',39)],responsible:'Logistics + Material + Plant + HSE',deliverable:'Logistics areas ready',basis:'DERIVED',source:'Plan 3 §§1.2,3'});
  addTask({id:'P03-SITE-005',wbs:'03.1.5',plan:3,discipline:'Site Logistics',name:'Pedestrian / vehicle separation, emergency routes, assembly points and signage',startDay:40,finishDay:90,predecessors:[ss('P03-SITE-001',39)],responsible:'Site + Traffic + HSE',deliverable:'Access / emergency-route inspection',basis:'DERIVED',source:'Plan 3 §§1,4'});

  for (const [zone,s,instS,instE,end] of [
    ['A',181,25,317,950],['B',500,318,348,920],['C',520,349,383,940],['D',301,384,492,1060]
  ]) {
    const preds=[fs('P03-SITE-003'),fs('P03-SITE-005'),fs(`P08-HSE-${zone}-REL`),fs(`P10-ENV-${zone}-REL`)];
    if(zone==='D') preds.push(fs('P16-HER-D-PERMIT'));
    addTask({id:`P03-SITE-${zone}-REL`,wbs:`03.2.${zone}.1`,plan:3,zone,area:`Area ${zone}`,discipline:'Site Management',name:`Integrated workfront readiness / release — Area ${zone}`,startDay:s-10,finishDay:s-1,predecessors:preds,responsible:'Project Engineer + Site/HSE/Environmental/QA',installmentStart:instS,installmentEnd:instE,deliverable:'Workfront release record',basis:'DERIVED',source:'Plan 3 §§1-4'});
    addTask({id:`P03-SITE-${zone}-OPS`,wbs:`03.2.${zone}.2`,plan:3,zone,area:`Area ${zone}`,discipline:'Site Management',name:`Site logistics operation / layout change control — Area ${zone}`,startDay:s,finishDay:end,predecessors:[fs(`P03-SITE-${zone}-REL`)],responsible:'Site / Logistics Manager',deliverable:'Layout revisions / daily inspections',basis:'DERIVED',source:'Plan 3'});
  }
  addTask({id:'P03-SITE-DEMOB',wbs:'03.3.1',plan:3,discipline:'Site Management',name:'Temporary facilities / utilities demobilization and site restoration',startDay:1050,finishDay:1180,predecessors:[ss('P03-SITE-D-OPS',748)],responsible:'Site + Environmental + HSE',deliverable:'Demobilization / restoration acceptance',basis:'DERIVED',source:'Plan 3 §§1-4'});

  // ------------------------------------------------------------------
  // PLAN 04 — Workforce
  // ------------------------------------------------------------------
  addTask({id:'P04-WF-001',wbs:'04.1.1',plan:4,discipline:'Workforce',name:'Mobilize project management / engineering / survey / HSE / document-control core team',startDay:1,finishDay:15,responsible:'Project Manager + HR',deliverable:'Core personnel register',basis:'SOURCE',source:'Plan 4 §1.2'});
  addTask({id:'P04-WF-002',wbs:'04.1.2',plan:4,discipline:'Workforce',name:'Personnel competency / license / authorization / training matrix',startDay:5,finishDay:30,predecessors:[ss('P04-WF-001',4)],responsible:'HR + Discipline Leads + HSE',deliverable:'Competency matrix',basis:'SOURCE',source:'Plan 4 §§1-2'});
  addTask({id:'P04-WF-003',wbs:'04.1.3',plan:4,discipline:'Workforce',name:'Mobilize survey / temporary-works / site-support crews',startDay:20,finishDay:90,predecessors:[ss('P04-WF-002',14)],responsible:'Project Engineer',deliverable:'Prelim manpower mobilization',basis:'DERIVED',source:'Plan 4 §1.2'});
  addTask({id:'P04-WF-A',wbs:'04.2.A',plan:4,zone:'A',area:'Area A',discipline:'Workforce',name:'Area A civil / structure / architecture / MEP / landscape / QA / HSE / BIM manpower ramp-up and balancing',startDay:160,finishDay:900,predecessors:[fs('P04-WF-002')],responsible:'Project Controls + Discipline Leads',deliverable:'Area A manpower plan / actual / forecast',basis:'DERIVED',source:'Plan 4 §1.2'});
  addTask({id:'P04-WF-BC',wbs:'04.2.BC',plan:4,zone:'B/C',area:'Areas B/C',discipline:'Workforce',name:'Transfer / mobilize teams from Area A to Areas B/C with skill continuity',startDay:480,finishDay:920,predecessors:[ss('P04-WF-A',319)],responsible:'Project Manager + Discipline Leads',deliverable:'B/C manpower transfer plan',basis:'DERIVED',source:'Plan 4 §1.2'});
  addTask({id:'P04-WF-D',wbs:'04.2.D',plan:4,zone:'D',area:'Area D',discipline:'Workforce',name:'Area D low-impact crews + forestry / environment / wildlife / HSE specialist coverage',startDay:280,finishDay:1060,predecessors:[fs('P04-WF-002')],responsible:'Project + Conservation/HSE Leads',deliverable:'Area D specialist manpower coverage',basis:'DERIVED',source:'Plan 4 §1.2'});
  addTask({id:'P04-WF-CO',wbs:'04.3.1',plan:4,area:'Closeout',discipline:'Workforce',name:'Transition to commissioning / BIM / as-built / document / asset / defect-closeout team',startDay:900,finishDay:1180,predecessors:[ss('P04-WF-A',739)],responsible:'Project Manager + Project Controls',deliverable:'Closeout manpower plan',basis:'DERIVED',source:'Plan 4 §1.2'});
  addTask({id:'P04-WF-DEMOB',wbs:'04.3.2',plan:4,area:'Closeout',discipline:'Workforce',name:'Progressive manpower demobilization after acceptance / area handover',startDay:1080,finishDay:1200,predecessors:[ss('P04-WF-CO',179)],responsible:'Project Manager + HR',deliverable:'Demobilization records',basis:'DERIVED',source:'Plan 4 §1.2'});
  addTask({id:'P04-WF-REVIEW',wbs:'04.4.1',plan:4,discipline:'Workforce',name:'Daily / weekly / monthly manpower, hours, productivity, quality and HSE review cycle',startDay:31,finishDay:1180,predecessors:[fs('P04-WF-002')],responsible:'Project Controls + Supervisors',deliverable:'Manpower / productivity reviews',basis:'SOURCE',source:'Plan 4 §4'});

  // ------------------------------------------------------------------
  // PLAN 05 — Plant / Mechanical
  // ------------------------------------------------------------------
  addTask({id:'P05-PLT-001',wbs:'05.1.1',plan:5,discipline:'Plant',name:'Plant/equipment register, selection rules and mobilization-permit process',startDay:1,finishDay:45,responsible:'Plant Manager',deliverable:'Plant register / mobilization procedure',basis:'SOURCE',source:'Plan 5 §§1-2'});
  addTask({id:'P05-PLT-002',wbs:'05.1.2',plan:5,discipline:'Plant',name:'Operator / signaler / rigger / maintenance competency mapping',startDay:20,finishDay:50,predecessors:[ss('P05-PLT-001',19),ss('P04-WF-002',14)],responsible:'Plant + HSE + HR',deliverable:'Plant-personnel matrix',basis:'SOURCE',source:'Plan 5 §2'});
  for (const [code,name,s,e,zone] of [
    ['EARTH','Earthwork / road plant mobilization and operations',150,820,'ALL'],
    ['STR','Concrete / crane / lifting plant operations',170,850,'ALL'],
    ['MEP','MEP access / testing-equipment operations',400,1040,'ALL'],
    ['LAND','Landscape / low-ground-pressure plant operations',600,1080,'ALL'],
    ['D','Area D restricted plant operations',300,1040,'D']
  ]) {
    const preds=[fs('P05-PLT-001'),fs('P05-PLT-002'),fs('P09-TRF-002')];
    if(code==='D') preds.push(fs('P16-HER-D-PERMIT'));
    addTask({id:`P05-PLT-${code}`,wbs:`05.2.${code}`,plan:5,zone,area:zone==='D'?'Area D':'Project-wide',discipline:'Plant',name,startDay:s,finishDay:e,predecessors:preds,responsible:'Plant Manager + HSE + Operators',deliverable:'Pre-use / maintenance / breakdown / recovery records',basis:'DERIVED',source:'Plan 5 §§1-4'});
  }
  addTask({id:'P05-PLT-DEMOB',wbs:'05.3.1',plan:5,area:'Closeout',discipline:'Plant',name:'Plant cleaning / leak check / demobilization / service-area restoration',startDay:1050,finishDay:1170,predecessors:[ss('P05-PLT-LAND',449),ss('P05-PLT-D',749)],responsible:'Plant + Environmental',deliverable:'Plant demobilization / area restoration',basis:'DERIVED',source:'Plan 5 §4'});

  // ------------------------------------------------------------------
  // PLAN 06 — Procurement / Material
  // ------------------------------------------------------------------
  const families={
    STR:['Civil / structural materials',31,100,120,240,270,'ALL'],
    ARC:['Architectural / envelope / finish materials',90,180,210,420,470,'ALL'],
    MEP:['MEP major equipment / panels / pumps / valves / controls',60,160,190,480,540,'ALL'],
    ICT:['ICT / AV / CCTV / network / smart systems',150,260,290,560,620,'ALL'],
    LAND:['Landscape / irrigation / external furniture materials',360,480,510,760,820,'ALL'],
    D:['Area D low-impact / trail / near-water special materials',300,430,460,730,790,'D']
  };
  let fi=0;
  for(const [code,v] of Object.entries(families)) {
    fi++;
    const [label,s,approval,po,production,release,zone]=v;
    const base=`P06-${code}`;
    addTask({id:`${base}-01`,wbs:`06.${fi}.1`,plan:6,zone,area:label,discipline:'Procurement',name:`Define requirements / quantities / technical data — ${label}`,startDay:s,finishDay:s+20,responsible:'Engineering + Material Control',deliverable:'Material requirement package',basis:'DERIVED',source:'Plan 6 §1.1'});
    addTask({id:`${base}-02`,wbs:`06.${fi}.2`,plan:6,zone,area:label,discipline:'Procurement',name:`Material submittal / sample / source / test-plan submission — ${label}`,startDay:s+15,finishDay:approval-15,predecessors:[ss(`${base}-01`,14)],responsible:'Procurement + Engineering + QA/QC',deliverable:'Material submittal',basis:'DERIVED',source:'Plan 6 §§1-2'});
    addTask({id:`${base}-03`,wbs:`06.${fi}.3`,plan:6,zone,area:label,discipline:'Procurement',name:`Material approval gate — ${label}`,startDay:approval,milestone:true,predecessors:[fs(`${base}-02`)],responsible:'Engineer / Architect / QAQC',deliverable:'Approved material submittal',basis:'DERIVED',source:'Plan 6 §§1-2'});
    addTask({id:`${base}-04`,wbs:`06.${fi}.4`,plan:6,zone,area:label,discipline:'Procurement',name:`Vendor qualification / commercial alignment — ${label}`,startDay:Math.max(s+10,approval-30),finishDay:po-5,predecessors:[fs(`${base}-01`)],responsible:'Procurement',deliverable:'Approved vendor / commercial recommendation',basis:'DERIVED',source:'Plan 6 §1.1'});
    addTask({id:`${base}-05`,wbs:`06.${fi}.5`,plan:6,zone,area:label,discipline:'Procurement',name:`PO / subcontract award — ${label}`,startDay:po,milestone:true,predecessors:[fs(`${base}-03`),fs(`${base}-04`)],responsible:'Procurement Manager',deliverable:'Purchase order / subcontract',basis:'ASSUMPTION',source:'Plan 6 workflow'});
    addTask({id:`${base}-06`,wbs:`06.${fi}.6`,plan:6,zone,area:label,discipline:'Procurement',name:`Production / fabrication / expediting — ${label}`,startDay:po+1,finishDay:production,predecessors:[fs(`${base}-05`)],responsible:'Vendor + Procurement',deliverable:'Production / expediting status',basis:'ASSUMPTION',source:'Plan 6 §§1.1-1.2'});
    addTask({id:`${base}-07`,wbs:`06.${fi}.7`,plan:6,zone,area:label,discipline:'Procurement',name:`FAT / source inspection / certification where required — ${label}`,startDay:Math.max(po+10,production-25),finishDay:production,predecessors:[ss(`${base}-06`)],responsible:'QA/QC + Engineering + Vendor',deliverable:'FAT / source inspection / certificates',basis:'DERIVED',source:'Plan 6 §§1-2'});
    addTask({id:`${base}-08`,wbs:`06.${fi}.8`,plan:6,zone,area:label,discipline:'Procurement',name:`Delivery booking / transport / site receipt — ${label}`,startDay:production+1,finishDay:Math.min(release-15,production+30),predecessors:[fs(`${base}-07`),fs('P09-TRF-003')],responsible:'Logistics + Material Control',deliverable:'Delivery / receipt records',basis:'ASSUMPTION',source:'Plan 6 §1.1'});
    addTask({id:`${base}-09`,wbs:`06.${fi}.9`,plan:6,zone,area:label,discipline:'Procurement',name:`MIR / testing / quarantine clearance — ${label}`,startDay:Math.min(release-14,production+31),finishDay:release-1,predecessors:[fs(`${base}-08`)],responsible:'QA/QC + Material Control',deliverable:'MIR / test / quarantine release',basis:'DERIVED',source:'Plan 6 §2'});
    procurementRelease[code]=`${base}-10`;
    addTask({id:`${base}-10`,wbs:`06.${fi}.10`,plan:6,zone,area:label,discipline:'Procurement',name:`Released for installation — ${label}`,startDay:release,milestone:true,predecessors:[fs(`${base}-09`)],responsible:'QA/QC + Engineering',deliverable:'Installation release / QR traceability',basis:'DERIVED',source:'Plan 6 §§2-3'});
  }

  // ------------------------------------------------------------------
  // PLAN 07 — Quality
  // ------------------------------------------------------------------
  addTask({id:'P07-QA-001',wbs:'07.1.1',plan:7,discipline:'QA/QC',name:'Project Quality Plan / quality objectives / responsibilities',startDay:1,finishDay:30,responsible:'QA/QC Manager',deliverable:'Approved PQP',basis:'SOURCE',source:'Plan 7 §1'});
  addTask({id:'P07-QA-002',wbs:'07.1.2',plan:7,discipline:'QA/QC',name:'ITP framework, hold / witness / review / surveillance coding',startDay:20,finishDay:45,predecessors:[ss('P07-QA-001',19)],responsible:'QA/QC Manager + Disciplines',deliverable:'ITP framework',basis:'SOURCE',source:'Plan 7 §§1-1.1'});
  addTask({id:'P07-QA-003',wbs:'07.1.3',plan:7,discipline:'QA/QC',name:'Calibration / laboratory / test-record / sample chain-of-custody setup',startDay:30,finishDay:60,predecessors:[ss('P07-QA-001',29)],responsible:'QA/QC + Lab + Survey',deliverable:'Calibration / lab registers',basis:'DERIVED',source:'Plan 7 §§1-2'});
  for(const [zone,s,e] of [['A',160,920],['B',480,920],['C',480,940],['D',280,1060]]) {
    addTask({id:`P07-QA-${zone}-PREP`,wbs:`07.2.${zone}.1`,plan:7,zone,area:`Area ${zone}`,discipline:'QA/QC',name:`Method Statements / ITPs / checklists / samples readiness — Area ${zone}`,startDay:s-15,finishDay:s-5,predecessors:[fs('P07-QA-002')],responsible:'Discipline Engineers + QA/QC',deliverable:'Approved MS / ITP / checklists',basis:'DERIVED',source:'Plan 7 §§1-3'});
    addTask({id:`P07-QA-${zone}-MON`,wbs:`07.2.${zone}.2`,plan:7,zone,area:`Area ${zone}`,discipline:'QA/QC',name:`Inspection / testing / NCR / reinspection / quality-dossier cycle — Area ${zone}`,startDay:s,finishDay:e,predecessors:[fs(`P07-QA-${zone}-PREP`)],responsible:'QA/QC + Discipline Inspectors',deliverable:'Inspection / test / NCR / closure records',basis:'DERIVED',source:'Plan 7 §§1-6'});
  }
  addTask({id:'P07-QA-COMM',wbs:'07.3.1',plan:7,area:'Closeout',discipline:'QA/QC',name:'Integrated testing / punch / NCR closure / final quality dossier',startDay:900,finishDay:1180,predecessors:[ss('P07-QA-A-MON',739)],responsible:'QA/QC + Commissioning Team',deliverable:'Final quality dossier',basis:'DERIVED',source:'Plan 7 §§1,6'});

  // ------------------------------------------------------------------
  // PLAN 08 — HSE
  // ------------------------------------------------------------------
  addTask({id:'P08-HSE-001',wbs:'08.1.1',plan:8,discipline:'HSE',name:'Project HSE plan / risk register / emergency structure',startDay:1,finishDay:30,responsible:'HSE Manager',deliverable:'Approved HSE plan / risk register',basis:'SOURCE',source:'Plan 8 §1'});
  addTask({id:'P08-HSE-002',wbs:'08.1.2',plan:8,discipline:'HSE',name:'Induction / competency / toolbox / stop-work process setup',startDay:15,finishDay:45,predecessors:[ss('P08-HSE-001',14)],responsible:'HSE + Supervisors',deliverable:'Induction / toolbox system',basis:'DERIVED',source:'Plan 8 §§1,4-5'});
  addTask({id:'P08-HSE-003',wbs:'08.1.3',plan:8,discipline:'HSE',name:'Permit-to-work system: excavation, height, lifting, LOTO, hot work, confined space and near water',startDay:30,finishDay:60,predecessors:[ss('P08-HSE-001',29)],responsible:'HSE + Authorized Persons',deliverable:'PTW forms / authorization matrix',basis:'SOURCE',source:'Plan 8 §1.2'});
  addTask({id:'P08-HSE-004',wbs:'08.1.4',plan:8,discipline:'HSE',name:'Emergency equipment / rescue / communication readiness and initial drill',startDay:45,finishDay:75,predecessors:[ss('P08-HSE-002',29)],responsible:'HSE + Emergency Team',deliverable:'Emergency drill / readiness record',basis:'DERIVED',source:'Plan 8 §§3-5'});
  for(const [zone,s,e] of [['A',160,920],['B',480,920],['C',480,940],['D',280,1060]]) {
    addTask({id:`P08-HSE-${zone}-MON`,wbs:`08.2.${zone}.1`,plan:8,zone,area:`Area ${zone}`,discipline:'HSE',name:`Pre-shift / shift / high-risk / weekly / monthly HSE controls — Area ${zone}`,startDay:s,finishDay:e,predecessors:[fs('P08-HSE-003'),fs('P08-HSE-004')],responsible:'HSE + Supervisors',deliverable:'JSEA / PTW / inspection / toolbox / incident records',basis:'DERIVED',source:'Plan 8 §4'});
    addTask({id:`P08-HSE-${zone}-REL`,wbs:`08.2.${zone}.2`,plan:8,zone,area:`Area ${zone}`,discipline:'HSE',name:`HSE / JSEA / PTW workfront readiness gate — Area ${zone}`,startDay:s-12,finishDay:s-5,predecessors:[fs('P08-HSE-003')],responsible:'HSE + Area Supervisor',deliverable:'HSE workfront release',basis:'DERIVED',source:'Plan 8 §§1-2'});
  }
  addTask({id:'P08-HSE-DRILLS',wbs:'08.3.1',plan:8,discipline:'HSE',name:'Periodic emergency drills: fire/wildfire, injury, spill, flood/near-water and evacuation',startDay:181,finishDay:1080,predecessors:[fs('P08-HSE-004')],responsible:'HSE + Emergency Team',deliverable:'Drill reports / lessons learned',basis:'DERIVED',source:'Plan 8 §§3-5'});

  // ------------------------------------------------------------------
  // PLAN 02 — Commercial / Payment
  // ------------------------------------------------------------------
  addTask({id:'P02-COM-001',wbs:'02.1.1',plan:2,discipline:'Commercial',name:'Set up installment register 1–497 / WBS / BOQ / activity / evidence mapping',startDay:1,finishDay:35,responsible:'QS + Project Controls + Document Control',deliverable:'Installment control register',basis:'SOURCE',source:'Plan 2 §1.1'});
  addTask({id:'P02-COM-002',wbs:'02.1.2',plan:2,discipline:'Commercial',name:'Baseline budget / cash-flow / commitment-control setup',startDay:20,finishDay:60,predecessors:[ss('P02-COM-001',19)],responsible:'QS + Finance',deliverable:'Budget baseline / cash-flow / S-curve',basis:'SOURCE',source:'Plan 2 §1.4'});
  addTask({id:'P02-COM-003',wbs:'02.1.3',plan:2,discipline:'Commercial',name:'Payment-readiness checklist: physical + quality + document evidence',startDay:45,finishDay:75,predecessors:[ss('P02-COM-001',44),fs('P07-QA-001'),fs('P11-CDE-004')],responsible:'QS + QA/QC + Document Control',deliverable:'Payment-readiness checklist',basis:'DERIVED',source:'Plan 2 §§1.4,3'});
  addTask({id:'P02-M01',wbs:'02.2.1',plan:2,area:'Installment 1',discipline:'Commercial',name:'Installment 1 evidence gate: key personnel + field-office evidence + draft site layout',startDay:30,milestone:true,critical:true,predecessors:[fs('P04-WF-001'),ss('P03-SITE-001')],responsible:'Project Manager + QS',installmentStart:1,installmentEnd:1,deliverable:'Installment 1 payment package',basis:'SOURCE',source:'Plan 2 §1.2'});
  addTask({id:'P02-M02',wbs:'02.2.2',plan:2,area:'Installment 2',discipline:'Commercial',name:'Installment 2 survey X/Y/Z benchmark evidence gate',startDay:60,milestone:true,predecessors:[fs('P03-SITE-001')],responsible:'Survey + QS',installmentStart:2,installmentEnd:2,deliverable:'Survey / benchmark package',basis:'SOURCE',source:'Plan 2 §1.2'});
  addTask({id:'P02-M03',wbs:'02.2.3',plan:2,area:'Installment 3',discipline:'Commercial',name:'Installment 3 detailed site-layout drawing evidence gate',startDay:90,milestone:true,predecessors:[fs('P03-SITE-001')],responsible:'Engineering + QS',installmentStart:3,installmentEnd:3,deliverable:'Detailed site-layout payment package',basis:'SOURCE',source:'Plan 2 §1.2'});
  addTask({id:'P02-M24',wbs:'02.2.24',plan:2,area:'Installment 24',discipline:'Commercial',name:'Installment 24 removal / relocation / enabling-work completion gate',startDay:180,milestone:true,critical:true,predecessors:[fs('P03-SITE-003')],responsible:'Project + QS',installmentStart:24,installmentEnd:24,deliverable:'Installment 24 payment package',basis:'SOURCE',source:'Plan 2 §1.2'});
  for(const [zone,name,s,e] of [['A','Area A progress measurement / payment-certification cycle',181,920],['B','Area B progress measurement / payment-certification cycle',500,940],['C','Area C progress measurement / payment-certification cycle',520,960],['D','Area D progress measurement / payment-certification cycle',301,1080]]) addTask({id:`P02-COM-${zone}`,wbs:`02.3.${zone}`,plan:2,zone,area:`Area ${zone}`,discipline:'Commercial',name,startDay:s,finishDay:e,predecessors:[fs('P02-COM-003')],responsible:'QS + Project Controls + QA/QC + Document Control',deliverable:'Measured / accepted / certified quantity and payment records',basis:'DERIVED',source:'Plan 2 §§1-8'});
  addTask({id:'P02-COM-FTC',wbs:'02.4.1',plan:2,discipline:'Commercial',name:'Forecast-to-complete / cost / cash-flow / commitment reconciliation cycle',startDay:61,finishDay:1180,predecessors:[fs('P02-COM-002')],responsible:'QS + Finance + Project Controls',deliverable:'FTC / cost / cash-flow report',basis:'DERIVED',source:'Plan 2 §1.4'});
  addTask({id:'P02-M493',wbs:'02.5.493',plan:2,area:'Installment 493',discipline:'Commercial',name:'Final cleaning / site-handover payment gate',startDay:1150,milestone:true,critical:true,predecessors:[ss('P03-SITE-DEMOB',99),ss('P10-ENV-REST',149)],responsible:'Project + QS',installmentStart:493,installmentEnd:493,deliverable:'Installment 493 package',basis:'SOURCE',source:'Plan 2 §1.3'});
  addTask({id:'P02-M494',wbs:'02.5.494',plan:2,area:'Installment 494',discipline:'Commercial',name:'As-built drawing / BIM payment gate',startDay:1170,milestone:true,critical:true,predecessors:[ss('P13-BIM-ASB',569)],responsible:'BIM / Engineering + QS',installmentStart:494,installmentEnd:494,deliverable:'Installment 494 package',basis:'SOURCE',source:'Plan 2 §1.3'});
  addTask({id:'P02-M495',wbs:'02.5.495',plan:2,area:'Installment 495',discipline:'Commercial',name:'Electrical / mechanical test-report payment gate',startDay:1180,milestone:true,critical:true,predecessors:[ss('P07-QA-COMM',279)],responsible:'Commissioning + QS',installmentStart:495,installmentEnd:495,deliverable:'Installment 495 package',basis:'SOURCE',source:'Plan 2 §1.3'});
  addTask({id:'P02-M496',wbs:'02.5.496',plan:2,area:'Installment 496',discipline:'Commercial',name:'O&M manual / warranty payment gate',startDay:1190,milestone:true,critical:true,predecessors:[ss('P11-CDE-CO',289)],responsible:'Engineering + Document Control + QS',installmentStart:496,installmentEnd:496,deliverable:'Installment 496 package',basis:'SOURCE',source:'Plan 2 §1.3'});
  addTask({id:'P02-M497',wbs:'02.5.497',plan:2,area:'Installment 497',discipline:'Commercial',name:'Asset register / value-by-item final payment gate',startDay:1198,milestone:true,critical:true,predecessors:[fs('P13-BIM-HO')],responsible:'Asset / QS / Project Manager',installmentStart:497,installmentEnd:497,deliverable:'Installment 497 package',basis:'SOURCE',source:'Plan 2 §1.3'});
}
