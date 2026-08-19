import { addTask, fs, ss } from './schedule-core.js';

export function buildPlans09to16() {
  // ------------------------------------------------------------------
  // PLAN 09 — Traffic
  // ------------------------------------------------------------------
  addTask({id:'P09-TRF-001',wbs:'09.1.1',plan:9,discipline:'Traffic',name:'Route survey / route register: width, grade, curves, bridge/culvert, loading, blind spots and sensitive areas',startDay:1,finishDay:35,responsible:'Traffic Manager + Engineer',deliverable:'Approved route survey / route register',basis:'SOURCE',source:'Plan 9 §1'});
  addTask({id:'P09-TRF-002',wbs:'09.1.2',plan:9,discipline:'Traffic',name:'Traffic management plan: gates, waiting, loading, pedestrian routes and emergency routes',startDay:25,finishDay:60,predecessors:[ss('P09-TRF-001',24)],responsible:'Traffic + Site + HSE',deliverable:'Controlled traffic management plan',basis:'SOURCE',source:'Plan 9 §§1-2'});
  addTask({id:'P09-TRF-003',wbs:'09.1.3',plan:9,discipline:'Traffic',name:'Delivery booking / call-forward / gate-control workflow setup',startDay:45,finishDay:75,predecessors:[ss('P09-TRF-002',19)],responsible:'Logistics / Traffic',deliverable:'Booking and call-forward workflow',basis:'DERIVED',source:'Plan 9 §2'});
  for (const [zone,s,e] of [['A',160,940],['B',480,920],['C',480,940],['D',280,1060]]) {
    addTask({id:`P09-TRF-${zone}`,wbs:`09.2.${zone}`,plan:9,zone,area:`Area ${zone}`,discipline:'Traffic',name:`Delivery / route / public-road / emergency-route control — Area ${zone}`,startDay:s,finishDay:e,predecessors:[fs('P09-TRF-002'),fs('P09-TRF-003')],responsible:'Traffic + Logistics + HSE',deliverable:'Delivery / route inspection / complaint records',basis:'DERIVED',source:'Plan 9 §§2-6'});
  }
  addTask({id:'P09-TRF-REST',wbs:'09.3.1',plan:9,discipline:'Traffic',name:'Remove temporary traffic controls / repair route damage / restore access',startDay:1080,finishDay:1170,predecessors:[ss('P09-TRF-D',799)],responsible:'Traffic + Environmental + Owner Interface',deliverable:'Route restoration acceptance',basis:'DERIVED',source:'Plan 9 §§5-6'});

  // ------------------------------------------------------------------
  // PLAN 10 — Environment
  // ------------------------------------------------------------------
  addTask({id:'P10-ENV-001',wbs:'10.1.1',plan:10,discipline:'Environment',name:'Develop activity-aspect-impact register and significance assessment',startDay:1,finishDay:30,responsible:'Environmental Manager',deliverable:'Aspect-impact register',basis:'SOURCE',source:'Plan 10 §§1-1.1'});
  addTask({id:'P10-ENV-002',wbs:'10.1.2',plan:10,discipline:'Environment',name:'Environmental baseline / monitoring points / methods / criteria setup',startDay:20,finishDay:60,predecessors:[ss('P10-ENV-001',19)],responsible:'Environmental Team',deliverable:'Baseline and monitoring plan',basis:'SOURCE',source:'Plan 10 §3'});
  addTask({id:'P10-ENV-003',wbs:'10.1.3',plan:10,discipline:'Environment',name:'Install initial boundary, erosion/sediment, drainage, spill and waste controls',startDay:45,finishDay:90,predecessors:[ss('P10-ENV-002',24)],responsible:'Environmental + Site Team',deliverable:'Environmental controls ready',basis:'DERIVED',source:'Plan 10 §2'});
  for (const [zone,s,e] of [['A',160,920],['B',480,920],['C',480,940],['D',280,1060]]) {
    addTask({id:`P10-ENV-${zone}-MON`,wbs:`10.2.${zone}.1`,plan:10,zone,area:`Area ${zone}`,discipline:'Environment',name:`Environmental inspections / monitoring / abnormal-event response — Area ${zone}`,startDay:s,finishDay:e,predecessors:[fs('P10-ENV-003')],responsible:'Environmental Team',deliverable:'Monitoring / corrective action / reinspection records',basis:'DERIVED',source:'Plan 10 §§2-3'});
    const rs=Math.max(1,s-15);
    addTask({id:`P10-ENV-${zone}-REL`,wbs:`10.2.${zone}.2`,plan:10,zone,area:`Area ${zone}`,discipline:'Environment',name:`Environmental readiness gate — Area ${zone}`,startDay:rs,finishDay:rs+9,predecessors:[fs('P10-ENV-003')],responsible:'Environmental Manager',deliverable:'Environmental release',basis:'DERIVED',source:'Plan 10 §2.1'});
  }
  addTask({id:'P10-ENV-WASTE',wbs:'10.3.1',plan:10,discipline:'Environment',name:'Waste segregation / storage area / manifest system operation',startDay:61,finishDay:1140,predecessors:[ss('P10-ENV-003',15)],responsible:'Environmental + Logistics',deliverable:'Waste register / manifests / inspections',basis:'SOURCE',source:'Plan 10 §4'});
  addTask({id:'P10-ENV-REST',wbs:'10.3.2',plan:10,discipline:'Environment',name:'Project-wide temporary works removal and environmental restoration verification',startDay:1000,finishDay:1160,predecessors:[ss('P10-ENV-WASTE',938)],responsible:'Environmental + Site + Landscape',deliverable:'Restoration acceptance',basis:'DERIVED',source:'Plan 10 §§2,4-5'});

  // ------------------------------------------------------------------
  // PLAN 11 — CDE / EDMS
  // ------------------------------------------------------------------
  addTask({id:'P11-CDE-001',wbs:'11.1.1',plan:11,discipline:'Document Control',name:'Define document coding / metadata / workflow requirements',startDay:1,finishDay:20,responsible:'Document Control Manager',deliverable:'CDE/EDMS requirements register',basis:'SOURCE',source:'Plan 11 §§1-3'});
  addTask({id:'P11-CDE-002',wbs:'11.1.2',plan:11,discipline:'Document Control',name:'Configure CDE / EDMS roles, registers and transmittal workflows',startDay:15,finishDay:45,predecessors:[ss('P11-CDE-001',14)],responsible:'Document Control + IT',deliverable:'Configured controlled workspace',basis:'DERIVED',source:'Plan 11 §§1-3'});
  addTask({id:'P11-CDE-003',wbs:'11.1.3',plan:11,discipline:'Document Control',name:'Test revision, approval, supersession and audit-trail workflow',startDay:40,finishDay:60,predecessors:[fs('P11-CDE-002')],responsible:'Document Control + Discipline Reviewers',deliverable:'Workflow test record',basis:'DERIVED',source:'Plan 11 §§2-4'});
  addTask({id:'P11-CDE-004',wbs:'11.1.4',plan:11,discipline:'Document Control',name:'CDE / EDMS go-live gate',startDay:61,milestone:true,critical:true,predecessors:[fs('P11-CDE-003')],responsible:'Project Manager / Document Control',deliverable:'Approved CDE go-live',basis:'DERIVED',source:'Plan 11'});
  for (const [code,name,s,e,zone] of [
    ['PRE','Preconstruction document-control cycle',61,180,'ALL'],
    ['ZA','Area A document-control cycle',181,840,'A'],
    ['ZBC','Areas B/C document-control cycle',301,900,'B/C'],
    ['ZD','Area D controlled-document cycle',301,1040,'D'],
    ['CO','Closeout / handover document-control cycle',901,1200,'ALL']
  ]) addTask({id:`P11-CDE-${code}`,wbs:`11.2.${code}`,plan:11,zone,discipline:'Document Control',name,startDay:s,finishDay:e,predecessors:[fs('P11-CDE-004')],responsible:'Document Control',deliverable:'Controlled records / audit trail',basis:'DERIVED',source:'Plan 11 §§5-8'});

  // ------------------------------------------------------------------
  // PLAN 12 — Progress Control
  // ------------------------------------------------------------------
  addTask({id:'P12-PRG-001',wbs:'12.1.1',plan:12,discipline:'Project Controls',name:'Establish WBS / activity coding / progress-measurement rules',startDay:1,finishDay:30,responsible:'Project Controls',deliverable:'WBS dictionary / measurement rules',basis:'SOURCE',source:'Plan 12 §§1-3'});
  addTask({id:'P12-PRG-002',wbs:'12.1.2',plan:12,discipline:'Project Controls',name:'Develop proposal baseline schedule and logic register',startDay:20,finishDay:75,predecessors:[ss('P12-PRG-001',19)],responsible:'Planner / Project Controls',deliverable:'Baseline schedule v0.1',basis:'DERIVED',source:'Plan 12 §3'});
  addTask({id:'P12-PRG-003',wbs:'12.1.3',plan:12,discipline:'Project Controls',name:'Validate before / during / after evidence matrix',startDay:45,finishDay:75,predecessors:[fs('P12-PRG-001')],responsible:'Project Controls + QA/QC',deliverable:'Progress evidence matrix',basis:'SOURCE',source:'Plan 12 §§1-2'});
  addTask({id:'P12-PRG-004',wbs:'12.1.4',plan:12,discipline:'Project Controls',name:'Baseline approval milestone',startDay:90,milestone:true,critical:true,predecessors:[fs('P12-PRG-002'),fs('P12-PRG-003')],responsible:'Project Manager / Planner',deliverable:'Approved baseline',basis:'DERIVED',source:'Plan 12 §3'});
  for (const [code,name,s,e,zone] of [
    ['PRE','Daily / weekly / monthly progress cycle — preliminaries',91,180,'ALL'],
    ['ZA','Progress control — Area A',181,840,'A'],
    ['ZBC','Progress control — Areas B/C',301,900,'B/C'],
    ['ZD','Progress control — Area D / sensitive works',301,1040,'D'],
    ['CO','Progress / closeout reconciliation',901,1200,'ALL']
  ]) addTask({id:`P12-PRG-${code}`,wbs:`12.2.${code}`,plan:12,zone,discipline:'Project Controls',name,startDay:s,finishDay:e,predecessors:[fs('P12-PRG-004')],responsible:'Project Controls',deliverable:'Daily/weekly/monthly updates / 3-week lookahead / variance logs',basis:'DERIVED',source:'Plan 12 §§3-8'});

  // ------------------------------------------------------------------
  // PLAN 13 — BIM / Digital Twin
  // ------------------------------------------------------------------
  addTask({id:'P13-BIM-001',wbs:'13.1.1',plan:13,discipline:'BIM',name:'BIM readiness assessment: people, software, hardware, CDE and exchange formats',startDay:1,finishDay:25,responsible:'BIM / Information Manager',deliverable:'BIM readiness assessment',basis:'SOURCE',source:'Plan 13 §1'});
  addTask({id:'P13-BIM-002',wbs:'13.1.2',plan:13,discipline:'BIM',name:'Develop BIM Execution Plan (BEP), naming/classification and responsibilities',startDay:15,finishDay:50,predecessors:[ss('P13-BIM-001',14)],responsible:'BIM Manager',deliverable:'BEP / responsibility matrix',basis:'SOURCE',source:'Plan 13 §§1,3'});
  addTask({id:'P13-BIM-003',wbs:'13.1.3',plan:13,discipline:'BIM',name:'Develop MIDP/TIDP and model-delivery schedule',startDay:35,finishDay:60,predecessors:[ss('P13-BIM-002',19)],responsible:'BIM Manager + Discipline Coordinators',deliverable:'MIDP / TIDP',basis:'DERIVED',source:'Plan 13 §§1,3'});
  addTask({id:'P13-BIM-004',wbs:'13.1.4',plan:13,discipline:'BIM',name:'BIM environment test / model exchange / federation trial',startDay:50,finishDay:75,predecessors:[ss('P13-BIM-003',14),fs('P11-CDE-004')],responsible:'BIM + IT',deliverable:'BIM readiness gate record',basis:'SOURCE',source:'Plan 13 §1.1.2'});
  addTask({id:'P13-BIM-005',wbs:'13.1.5',plan:13,discipline:'BIM',name:'BIM production release milestone',startDay:76,milestone:true,predecessors:[fs('P13-BIM-004')],responsible:'BIM Manager',deliverable:'BIM process approved for use',basis:'DERIVED',source:'Plan 13'});
  for (const [zone,s,e] of [['A',76,840],['B',301,900],['C',301,900],['D',301,1040]]) {
    addTask({id:`P13-BIM-${zone}-COORD`,wbs:`13.2.${zone}.1`,plan:13,zone,area:`Area ${zone}`,discipline:'BIM',name:`Federated-model coordination / clash and constructability cycles — Area ${zone}`,startDay:s,finishDay:e,predecessors:[fs('P13-BIM-005')],responsible:'BIM Coordinator + disciplines',deliverable:'Federated model / clash register / issue closures',basis:'DERIVED',source:'Plan 13 §§2-3'});
    addTask({id:`P13-BIM-${zone}-4D`,wbs:`13.2.${zone}.2`,plan:13,zone,area:`Area ${zone}`,discipline:'4D/5D',name:`4D schedule / 5D BOQ mapping and reconciliation — Area ${zone}`,startDay:Math.max(s,90),finishDay:e,predecessors:[fs('P12-PRG-004'),fs('P13-BIM-005')],responsible:'BIM 4D/5D + Project Controls + QS',deliverable:'4D/5D mapping register',basis:'DERIVED',source:'Plan 13 §2'});
  }
  addTask({id:'P13-BIM-ASB',wbs:'13.3.1',plan:13,discipline:'As-built BIM',name:'Progressive field verification and as-built BIM updates',startDay:600,finishDay:1140,predecessors:[fs('P13-BIM-005')],responsible:'BIM + Survey + QA/QC',deliverable:'Verified as-built BIM',basis:'DERIVED',source:'Plan 13 §3'});
  addTask({id:'P13-BIM-AIM',wbs:'13.4.1',plan:13,discipline:'Digital Twin',name:'Asset Information Model / Digital Twin data mapping and validation',startDay:900,finishDay:1170,predecessors:[ss('P13-BIM-ASB',299)],responsible:'BIM + Asset + IT',deliverable:'AIM / Digital Twin readiness dataset',basis:'DERIVED',source:'Plan 13 §4'});
  addTask({id:'P13-BIM-HO',wbs:'13.4.2',plan:13,discipline:'Digital Twin',name:'BIM / AIM / Digital Twin handover milestone',startDay:1180,milestone:true,critical:true,predecessors:[fs('P13-BIM-AIM')],responsible:'BIM / Information Manager',deliverable:'Accepted BIM/AIM handover package',basis:'DERIVED',source:'Plan 13 §§3-4'});

  // ------------------------------------------------------------------
  // PLAN 14 — Application / AI
  // ------------------------------------------------------------------
  addTask({id:'P14-AI-001',wbs:'14.1.1',plan:14,discipline:'Application/AI',name:'Requirements, use-case, process, data and acceptance-criteria survey',startDay:1,finishDay:35,responsible:'Product / AI / Process Owners',deliverable:'Use-case and requirements register',basis:'SOURCE',source:'Plan 14 §9'});
  addTask({id:'P14-AI-002',wbs:'14.1.2',plan:14,discipline:'Application/AI',name:'System architecture, data-flow, UX, API and security design',startDay:25,finishDay:60,predecessors:[ss('P14-AI-001',24)],responsible:'Solution / Data / Security / UX',deliverable:'Approved design package',basis:'SOURCE',source:'Plan 14 §9'});
  addTask({id:'P14-AI-003',wbs:'14.1.3',plan:14,discipline:'Application/AI',name:'Configure/develop forms, workflows, integrations and AI services',startDay:50,finishDay:110,predecessors:[ss('P14-AI-002',24),fs('P11-CDE-004')],responsible:'Development / Configuration Team',deliverable:'Configured application build',basis:'SOURCE',source:'Plan 14 §§6,9'});
  addTask({id:'P14-AI-004',wbs:'14.1.4',plan:14,discipline:'Application/AI',name:'Unit / integration / offline / security / recovery / AI validation testing',startDay:95,finishDay:130,predecessors:[ss('P14-AI-003',44)],responsible:'QA + Users + Security',deliverable:'Test and AI evaluation records',basis:'SOURCE',source:'Plan 14 §9'});
  addTask({id:'P14-AI-005',wbs:'14.1.5',plan:14,zone:'A',area:'Pilot area',discipline:'Application/AI',name:'Controlled pilot with approved field use cases',startDay:131,finishDay:160,predecessors:[fs('P14-AI-004')],responsible:'Project + Product + AI Owners',deliverable:'Pilot result / readiness decision',basis:'SOURCE',source:'Plan 14 §9'});
  addTask({id:'P14-AI-006',wbs:'14.1.6',plan:14,discipline:'Application/AI',name:'UAT / go-live approval / training / migration',startDay:155,finishDay:180,predecessors:[ss('P14-AI-005',24)],responsible:'IT + Document Control + Users',deliverable:'Go-live approval / training records',basis:'SOURCE',source:'Plan 14 §9'});
  addTask({id:'P14-AI-007',wbs:'14.1.7',plan:14,discipline:'Application/AI',name:'Application / AI production use with mandatory human review',startDay:181,finishDay:1140,predecessors:[fs('P14-AI-006')],responsible:'Application/AI Owners + Discipline Reviewers',deliverable:'Controlled inspection / report records',basis:'DERIVED',source:'Plan 14 §§1-8'});
  addTask({id:'P14-AI-008',wbs:'14.1.8',plan:14,discipline:'Application/AI',name:'Performance, false-positive/false-negative, drift, security and user monitoring',startDay:181,finishDay:1140,predecessors:[fs('P14-AI-006')],responsible:'AI / Data / Security Owners',deliverable:'Performance / incident / change register',basis:'SOURCE',source:'Plan 14 §§2-3,7-9'});
  addTask({id:'P14-AI-009',wbs:'14.1.9',plan:14,discipline:'Application/AI',name:'System / data / model registry / configuration / export handover',startDay:1100,finishDay:1190,predecessors:[ss('P14-AI-007',919)],responsible:'Project + IT + Employer',deliverable:'System handover / export / archive',basis:'SOURCE',source:'Plan 14 §9'});

  // ------------------------------------------------------------------
  // PLAN 15 — Carbon Footprint
  // ------------------------------------------------------------------
  addTask({id:'P15-CAR-001',wbs:'15.1.1',plan:15,discipline:'Carbon',name:'Approve carbon accounting objective / organizational and operational boundaries',startDay:1,finishDay:30,responsible:'Carbon / Environmental Lead',deliverable:'Approved carbon boundary / method',basis:'SOURCE',source:'Plan 15 §§1-2'});
  addTask({id:'P15-CAR-002',wbs:'15.1.2',plan:15,discipline:'Carbon',name:'Create source register, data plan and emission-factor / GWP / conversion register',startDay:20,finishDay:60,predecessors:[ss('P15-CAR-001',19)],responsible:'Carbon Lead + Data Owners',deliverable:'Source / EF / data-quality registers',basis:'SOURCE',source:'Plan 15 §§2-3,5'});
  addTask({id:'P15-CAR-003',wbs:'15.1.3',plan:15,discipline:'Carbon',name:'Screen significant sources and define reduction-measure register',startDay:50,finishDay:90,predecessors:[ss('P15-CAR-002',29)],responsible:'Carbon + Engineering + Procurement',deliverable:'Significant-source / reduction register',basis:'DERIVED',source:'Plan 15 §§2,4'});
  for (const [code,name,s,e,zone] of [
    ['PRE','Preliminaries carbon activity-data collection / validation',61,180,'ALL'],
    ['A','Area A fuel / material / energy / transport / waste data collection',181,840,'A'],
    ['BC','Areas B/C carbon data collection / reconciliation',500,920,'B/C'],
    ['D','Area D / near-water / restoration carbon data collection',301,1060,'D']
  ]) addTask({id:`P15-CAR-${code}`,wbs:`15.2.${code}`,plan:15,zone,discipline:'Carbon',name,startDay:s,finishDay:e,predecessors:[fs('P15-CAR-002')],responsible:'Carbon Lead + Package Data Owners',deliverable:'Validated activity-data dataset',basis:'DERIVED',source:'Plan 15 §§4.1-5'});
  addTask({id:'P15-CAR-REP',wbs:'15.3.1',plan:15,discipline:'Carbon',name:'Periodic calculation / QA / reduction-action / management-reporting cycle',startDay:91,finishDay:1140,predecessors:[fs('P15-CAR-003')],responsible:'Carbon Lead + QA Reviewer',deliverable:'Periodic carbon inventory / dashboard / action register',basis:'DERIVED',source:'Plan 15 §§3-4'});
  addTask({id:'P15-CAR-FIN',wbs:'15.3.2',plan:15,area:'Closeout',discipline:'Carbon',name:'Close missing data / factors / actions, verification, final carbon report and archive',startDay:1080,finishDay:1185,predecessors:[ss('P15-CAR-REP',988)],responsible:'Carbon Lead + Reviewer',deliverable:'Final carbon footprint report / archive / data dictionary',basis:'SOURCE',source:'Plan 15 §4.1'});

  // ------------------------------------------------------------------
  // PLAN 16 — World Heritage Protection
  // ------------------------------------------------------------------
  addTask({id:'P16-HER-001',wbs:'16.1.1',plan:16,discipline:'Heritage',name:'Compile approved project boundary / sensitive-area / water / vegetation / wildlife / fire-risk data',startDay:1,finishDay:45,responsible:'Survey + Environmental + Forestry/Wildlife Specialists',deliverable:'Controlled heritage / sensitive-area register',basis:'SOURCE',source:'Plan 16 §§1-2'});
  addTask({id:'P16-HER-002',wbs:'16.1.2',plan:16,discipline:'Heritage',name:'Baseline field verification and before-condition record',startDay:30,finishDay:75,predecessors:[ss('P16-HER-001',29)],responsible:'Survey + Environmental + Heritage Team',deliverable:'Approved baseline / photographs / coordinates',basis:'SOURCE',source:'Plan 16 §1'});
  addTask({id:'P16-HER-003',wbs:'16.1.3',plan:16,discipline:'Heritage',name:'No-go zones / access controls / stop-work-restart protocol setup',startDay:60,finishDay:90,predecessors:[ss('P16-HER-002',29)],responsible:'Project + HSE + Environmental',deliverable:'Controlled boundary / permit protocol',basis:'DERIVED',source:'Plan 16 §§1,3'});
  for (const [zone,s,e] of [['A',160,900],['B',480,920],['C',480,940],['D',280,1060]]) addTask({id:`P16-HER-${zone}-MON`,wbs:`16.2.${zone}.1`,plan:16,zone,area:`Area ${zone}`,discipline:'Heritage',name:`Heritage / ecological monitoring and stop-work controls — Area ${zone}`,startDay:s,finishDay:e,predecessors:[fs('P16-HER-003')],responsible:'Environmental / Forestry / Wildlife Specialist',deliverable:'Inspection / monitoring / incident / corrective-action records',basis:'DERIVED',source:'Plan 16 §§2-3'});
  addTask({id:'P16-HER-D-PERMIT',wbs:'16.2.D.2',plan:16,zone:'D',area:'Area D',discipline:'Heritage',name:'Area D sensitive-workfront permit / method / route / monitoring readiness',startDay:291,finishDay:300,predecessors:[fs('P16-HER-003')],responsible:'Environmental + HSE + Engineering + Authorized Signatory',deliverable:'Area D permit / workfront release',basis:'DERIVED',source:'Plan 16 §3.1'});
  addTask({id:'P16-HER-REST',wbs:'16.3.1',plan:16,zone:'D',area:'Area D',discipline:'Heritage',name:'Final rehabilitation / invasive-species / drainage / vegetation acceptance',startDay:1000,finishDay:1140,predecessors:[ss('P16-HER-D-MON',719)],responsible:'Environmental / Forestry / Landscape',deliverable:'Heritage restoration acceptance dossier',basis:'DERIVED',source:'Plan 16 §§3-4'});
}
