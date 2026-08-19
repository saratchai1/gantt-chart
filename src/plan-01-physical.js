import { addTask, fs, ss, fracDay } from './schedule-core.js';
import { procurementRelease } from './plans-02-08.js';

const releaseGate = { A:'P03-SITE-A-REL', B:'P03-SITE-B-REL', C:'P03-SITE-C-REL', D:'P03-SITE-D-REL' };
const qualityPrep = { A:'P07-QA-A-PREP', B:'P07-QA-B-PREP', C:'P07-QA-C-PREP', D:'P07-QA-D-PREP' };

function packagePreds(zone) {
  const p=[fs(releaseGate[zone]),fs(qualityPrep[zone]),fs(`P08-HSE-${zone}-REL`),fs(`P10-ENV-${zone}-REL`)];
  if(zone==='D') p.push(fs('P16-HER-D-PERMIT'));
  return p;
}

function addBuildingPackage({prefix,wbsBase,zone,area,start,finish,installmentStart,installmentEnd,criticalChain=false,extras=[]}) {
  const d=f=>fracDay(start,finish,f);
  const ids={};
  const A=(code,sub,discipline,name,f1,f2,preds=[],milestone=false,critical=false,deliverable='')=>{
    const id=`${prefix}-${code}`;
    ids[code]=id;
    addTask({
      id,wbs:`${wbsBase}.${sub}`,plan:1,zone,area,discipline,name,startDay:d(f1),finishDay:d(f2),predecessors:preds,
      milestone,critical:critical || (criticalChain && ['REL','EXC','FND','FRM','ROOF','ENV','MEP1','WFIN','PRECOM','COMM','CORR','HO'].includes(code)),
      responsible:`${discipline} Team`,installmentStart,installmentEnd,deliverable,
      basis:milestone?'DERIVED':'ASSUMPTION',source:`Plan 1 work package ${wbsBase}; detailed activity split derived from Plans 3–8, 13`
    });
    return id;
  };

  const rel=A('REL','01','Integration','Package workfront physical-start milestone',0,0,packagePreds(zone),true,true,'Workfront released');
  const sur=A('SUR','02','Survey','Survey / setting out / level control',0,0.035,[fs(rel)],false,false,'Survey / setting-out record');
  const exc=A('EXC','03','Civil','Excavation / formation / dewatering as required',0.03,0.12,[fs(sur)],false,false,'Excavation inspection');
  const bli=A('BLI','04','Civil','Blinding / foundation preparation',0.105,0.15,[fs(exc)],false,false,'Foundation-preparation inspection');
  const rbf=A('RBF','05','Structure','Foundation reinforcement',0.155,0.205,[fs(bli),fs(procurementRelease.STR)],false,false,'Rebar inspection');
  const fmf=A('FMF','06','Structure','Foundation formwork / embedded-item coordination',0.16,0.21,[fs(bli)],false,false,'Formwork / embedded-item inspection');
  const hold=A('HOLD','07','QA/QC','Pre-pour hold point — foundation',0.21,0.21,[fs(rbf),fs(fmf)],true,criticalChain,'Approved pre-pour inspection');
  const fnd=A('FND','08','Structure','Foundation concrete / curing / test samples',0.21,0.265,[fs(hold)],false,false,'Concrete pour / curing / test-sample record');
  const gb=A('GB','09','Structure','Ground beams / slab-on-ground / underground-service coordination',0.245,0.355,[ss(fnd,Math.max(1,Math.round((finish-start)*0.02)))],false,false,'Ground structure accepted');
  const frm=A('FRM','10','Structure','Superstructure frame / columns / beams / slabs',0.32,0.51,[ss(gb,Math.max(1,Math.round((finish-start)*0.04)))],false,false,'Structural inspections / tests');
  const roof=A('ROOF','11','Structure','Roof structure',0.455,0.57,[ss(frm,Math.max(1,Math.round((finish-start)*0.07)))],false,false,'Roof structure accepted');
  const env=A('ENV','12','Architecture','Roof covering / waterproofing / external envelope',0.535,0.65,[ss(roof,Math.max(1,Math.round((finish-start)*0.03))),fs(procurementRelease.ARC)],false,false,'Weather-tight envelope');
  const ewall=A('EWALL','13','Architecture','External walls / façade / openings',0.47,0.66,[ss(frm,Math.max(1,Math.round((finish-start)*0.08))),fs(procurementRelease.ARC)],false,false,'External-wall inspection');
  const part=A('PART','14','Architecture','Internal partitions / backing / wet-area preparation',0.515,0.69,[ss(frm,Math.max(1,Math.round((finish-start)*0.10)))],false,false,'Partition inspection');
  const mep1=A('MEP1','15','MEP','MEP first fix / sleeves / containment / piping',0.49,0.715,[ss(frm,Math.max(1,Math.round((finish-start)*0.08)))],false,false,'MEP first-fix inspection');
  const ele1=A('ELE1','16','Electrical','Electrical conduits / trays / cabling first fix',0.50,0.705,[ss(mep1)],false,false,'Electrical first-fix inspection');
  const plb1=A('PLB1','17','Plumbing/Fire','Plumbing / drainage / fire first fix',0.50,0.705,[ss(mep1)],false,false,'Plumbing / fire first-fix inspection');
  const hv1=A('HV1','18','HVAC','HVAC ducts / piping / supports first fix',0.515,0.72,[ss(mep1)],false,false,'HVAC first-fix inspection');
  const ict1=A('ICT1','19','ICT/AV/Security','ICT / CCTV / network / AV containment first fix',0.56,0.735,[ss(ele1)],false,false,'ICT containment inspection');
  const wall=A('WFIN','20','Architecture','Internal wall finishes / wet-area waterproofing / tiling',0.65,0.795,[fs(part),ss(mep1,Math.max(0,Math.round((finish-start)*0.03)))],false,false,'Wall finish / waterproofing tests');
  const door=A('DRW','21','Architecture','Doors / windows / glazing / hardware',0.655,0.815,[ss(ewall),fs(procurementRelease.ARC)],false,false,'Door / window inspection');
  const ceil=A('CEIL','22','Architecture','Ceiling framing / above-ceiling inspection / closure',0.72,0.845,[ss(mep1,Math.max(0,Math.round((finish-start)*0.10)))],false,false,'Above-ceiling hold point / ceiling inspection');
  const floor=A('FLR','23','Architecture','Floor finishes',0.715,0.85,[ss(wall)],false,false,'Floor-finish inspection');
  const paint=A('PNT','24','Architecture','Painting / final architectural finishes',0.79,0.90,[ss(wall,Math.max(0,Math.round((finish-start)*0.04))),ss(ceil)],false,false,'Finish inspection');
  const san=A('SAN','25','Plumbing/Fire','Sanitary fixtures / plumbing second fix',0.805,0.91,[fs(plb1),ss(wall)],false,false,'Fixture / pressure / leak tests');
  const ele2=A('ELE2','26','Electrical','Panels / devices / lighting / electrical second fix',0.805,0.915,[fs(ele1),ss(ceil),fs(procurementRelease.MEP)],false,false,'Electrical inspection / test');
  const hv2=A('HV2','27','HVAC','HVAC equipment / controls / second fix',0.81,0.925,[fs(hv1),fs(procurementRelease.MEP)],false,false,'HVAC installation / test');
  const ict2=A('ICT2','28','ICT/AV/Security','ICT / CCTV / network / AV / access-control equipment installation',0.825,0.935,[fs(ict1),fs(procurementRelease.ICT)],false,false,'ICT / AV / security installation test');
  const furn=A('FURN','29','Architecture','Fixed furniture / built-in / equipment interfaces',0.825,0.935,[ss(paint)],false,false,'Furniture / equipment inspection');
  const ext=A('EXT','30','External Works','External utility tie-ins / immediate hardscape / drainage connections',0.72,0.91,[fs(gb)],false,false,'External works / tie-in tests');
  const precom=A('PRECOM','31','Commissioning','Pre-commissioning: flushing / cleaning / megger / point-to-point / rotation checks',0.90,0.95,[ss(san),ss(ele2),ss(hv2),ss(ict2)],false,false,'Pre-commissioning records');
  const func=A('FUNC','32','Commissioning','Functional testing by system',0.94,0.972,[fs(precom)],false,false,'Functional-test reports');
  const comm=A('COMM','33','Commissioning','Integrated commissioning / interface testing',0.965,0.986,[fs(func)],false,false,'Integrated commissioning report');
  const snag=A('SNAG','34','QA/QC','Snag / punch inspection',0.968,0.986,[ss(comm)],false,false,'Punch list');
  const corr=A('CORR','35','Construction','Defect / snag correction and reinspection',0.982,0.996,[fs(snag)],false,false,'Closed punch / NCR evidence');
  const asb=A('ASB','36','BIM/As-built','As-built survey / redline / asset-data capture',0.90,0.996,[fs(frm)],false,false,'Verified as-built / asset data');

  let i=0;
  for(const extra of extras) {
    i++;
    const [name,discipline,f1,f2,predCode='ENV']=extra;
    A(`EX${String(i).padStart(2,'0')}`,`37.${String(i).padStart(2,'0')}`,discipline,name,f1,f2,[fs(ids[predCode] || env)],false,false,`${name} inspection / test`);
  }

  const ho=A('HO','99','Handover','Area / building handover milestone',1,1,[fs(corr),fs(asb),fs(comm)],true,true,'Accepted work package');
  return {release:rel,frame:frm,roof,firstFix:mep1,commission:comm,handover:ho};
}

function addExternalPackage({prefix,wbsBase,zone,area,start,finish,installmentStart,installmentEnd,nature=false,criticalChain=false}) {
  const d=f=>fracDay(start,finish,f);
  const ids={};
  const A=(code,sub,discipline,name,f1,f2,preds=[],milestone=false,critical=false,deliverable='')=>{
    const id=`${prefix}-${code}`; ids[code]=id;
    addTask({id,wbs:`${wbsBase}.${sub}`,plan:1,zone,area,discipline,name,startDay:d(f1),finishDay:d(f2),predecessors:preds,milestone,
      critical:critical || (criticalChain && ['REL','EW','DRN','PAVE','SOFT','REST','HO'].includes(code)),responsible:`${discipline} Team`,installmentStart,installmentEnd,deliverable,
      basis:milestone?'DERIVED':'ASSUMPTION',source:`Plan 1 work package ${wbsBase}; detailed activity split derived from Plans 3,5,7-10,16`});
    return id;
  };
  const preds=packagePreds(zone);
  const rel=A('REL','01','Integration','Package workfront physical-start milestone',0,0,preds,true,true,'Workfront released');
  const sur=A('SUR','02','Survey','Survey / setting out / before-condition record',0,0.06,[fs(rel)],false,false,'Survey / before-condition record');
  const ctrl=A('CTRL','03','Environment/HSE','Install local boundary / erosion / drainage / safety controls',0.03,0.12,[ss(sur)],false,false,'Controls verified');
  const ew=A('EW','04','Civil','Earthwork / grading / localized formation',0.08,0.28,[fs(ctrl)],false,false,'Earthwork inspection');
  const dr=A('DRN','05','Drainage','Drainage / erosion / culvert / water-control works',0.15,0.42,[ss(ew,Math.max(1,Math.round((finish-start)*0.05)))],false,false,'Drainage inspection / test');
  const util=A('UTIL','06','Utilities','External utilities / ducts / irrigation mains',0.22,0.52,[ss(ew,Math.max(1,Math.round((finish-start)*0.08))),fs(procurementRelease.MEP)],false,false,'Utility inspection / test');
  const base=A('BASE','07','Civil','Subbase / base / walkway or road foundation',0.30,0.56,[ss(dr)],false,false,'Base-course test / inspection');
  const matRelease=nature?procurementRelease.D:procurementRelease.LAND;
  const pave=A('PAVE','08','Hardscape','Paving / trail / kerb / hardscape / structural external elements',0.48,0.72,[fs(base),fs(matRelease)],false,false,'Hardscape inspection');
  const ele=A('ELE','09','Electrical','External lighting / electrical / controls / signage power',0.50,0.76,[ss(util)],false,false,'Electrical test');
  const furn=A('FURN','10','Landscape','Site furniture / signage / learning-point equipment',0.65,0.84,[ss(pave)],false,false,'Furniture / signage inspection');
  const soil=A('SOIL','11','Landscape','Topsoil / planting-soil preparation / planting pits',0.58,0.78,[fs(ew)],false,false,'Landscape substrate inspection');
  const soft=A('SOFT','12','Landscape','Softscape / planting / turf / rehabilitation planting',0.72,0.90,[fs(soil),fs(matRelease)],false,false,'Planting inspection');
  const irr=A('IRR','13','Landscape','Irrigation / watering / establishment controls',0.70,0.94,[fs(util),ss(soft)],false,false,'Irrigation test / establishment record');
  const mon=A('MON','14','Environment','Environmental / wildlife / erosion monitoring during works',0.05,0.96,[fs(ctrl)],false,false,'Monitoring records');
  const rest=A('REST','15','Restoration','Final grading / removal of temporary controls / rehabilitation',0.88,0.98,[ss(soft),fs(pave)],false,false,'After-condition / restoration record');
  const fin=A('FIN','16','QA/QC','Final inspection / defect correction',0.96,0.996,[fs(rest),fs(ele),ss(irr)],false,false,'Accepted inspection / closed defects');
  const ho=A('HO','99','Handover','Area handover milestone',1,1,[fs(fin)],true,true,'Accepted external-work package');
  return {release:rel,handover:ho};
}

function addPontoonPackage() {
  const prefix='P01-D55', wbs='01.5.5', zone='D', area='แพสูบน้ำดิบ', start=820, finish=1030, is=492, ie=492;
  const d=f=>fracDay(start,finish,f);
  const A=(code,sub,disc,name,f1,f2,preds=[],milestone=false,critical=false,deliverable='')=>{
    const id=`${prefix}-${code}`;
    addTask({id,wbs:`${wbs}.${sub}`,plan:1,zone,area,discipline:disc,name,startDay:d(f1),finishDay:d(f2),predecessors:preds,milestone,critical,responsible:`${disc} Team`,installmentStart:is,installmentEnd:ie,deliverable,basis:milestone?'DERIVED':'ASSUMPTION',source:'Plan 1 work package 5.5 + Plans 5,7,8,10,16'});
    return id;
  };
  const rel=A('REL','01','Integration','Near-water workfront release milestone',0,0,packagePreds('D'),true,true,'Near-water workfront released');
  const bef=A('BEF','02','Survey/Environment','Before-condition / water / access / weather verification',0,0.08,[fs(rel)],false,false,'Before-condition / water record');
  const res=A('RES','03','HSE','Rescue equipment / life-saving / watcher / communication readiness',0.02,0.10,[ss(bef)],false,false,'Near-water rescue readiness');
  const acc=A('ACC','04','Marine/Civil','Controlled access / lifting pad / temporary handling setup',0.08,0.22,[fs(res)],false,false,'Access / lifting setup inspection');
  const fab=A('FAB','05','Marine/Civil','Pontoon / floating-structure fabrication and preassembly',0.05,0.38,[fs(procurementRelease.D)],false,false,'Fabrication / inspection records');
  const lift=A('LIFT','06','Lifting','Lift plan / crane setup / exclusion zone / trial lift',0.30,0.42,[fs(acc),ss(fab)],false,false,'Approved lift plan / setup');
  const pont=A('PONT','07','Marine/Civil','Pontoon / floating-structure installation',0.40,0.64,[fs(lift),fs(fab)],false,true,'Pontoon installation inspection');
  const pipe=A('PIPE','08','Process MEP','Raw-water piping / valves / supports installation',0.54,0.78,[ss(pont),fs(procurementRelease.MEP)],false,true,'Piping inspection / pressure test');
  const pump=A('PUMP','09','Process MEP','Raw-water pump installation / alignment',0.60,0.80,[ss(pont),fs(procurementRelease.MEP)],false,true,'Pump alignment / installation record');
  const ele=A('ELE','10','Electrical/Controls','Power / controls / protection / instrumentation installation',0.68,0.86,[fs(procurementRelease.MEP),ss(pump)],false,false,'Electrical / control inspection');
  const pre=A('PRE','11','Commissioning','Pre-commissioning / megger / rotation / flushing / point checks',0.84,0.91,[fs(pipe),fs(pump),fs(ele)],false,true,'Pre-commissioning record');
  const fun=A('FUNC','12','Commissioning','Raw-water pump functional / flow / control test',0.90,0.96,[fs(pre)],false,true,'Functional test report');
  const after=A('AFT','13','Environment','After-condition / spill / water / area-restoration inspection',0.92,0.98,[ss(fun)],false,false,'After-condition / restoration record');
  const ho=A('HO','99','Handover','แพสูบน้ำดิบ handover milestone',1,1,[fs(fun),fs(after)],true,true,'Accepted raw-water pontoon system');
  return {handover:ho};
}

export function buildPlan01Physical() {
  // ---------------------------------------------------------------
  // Preliminaries / source control windows
  // ---------------------------------------------------------------
  addTask({id:'P01-PRE-NTP',wbs:'01.1.01',plan:1,area:'Preliminaries',discipline:'Project',name:'Notice to Proceed / project-start milestone',startDay:1,milestone:true,critical:true,responsible:'Employer / Project Manager',installmentStart:1,installmentEnd:1,deliverable:'NTP / commencement record',basis:'SOURCE',source:'Plan 1'});
  addTask({id:'P01-PRE-SUR',wbs:'01.1.02',plan:1,area:'Preliminaries',discipline:'Survey',name:'Project control survey / X-Y-Z benchmarks / existing-condition record',startDay:1,finishDay:90,predecessors:[fs('P01-PRE-NTP')],critical:true,responsible:'Survey Team',installmentStart:1,installmentEnd:3,deliverable:'Survey / benchmark / baseline records',basis:'DERIVED',source:'Plan 1 CP-01'});
  addTask({id:'P01-PRE-TEMP',wbs:'01.1.03',plan:1,area:'Preliminaries',discipline:'Temporary Works',name:'Field office / temporary utilities / fence / access / safety controls',startDay:31,finishDay:180,predecessors:[fs('P01-PRE-NTP',30)],critical:true,responsible:'Site Team',installmentStart:1,installmentEnd:24,deliverable:'Temporary systems / workfront-ready facilities',basis:'SOURCE',source:'Plan 1 CP-02'});
  addTask({id:'P01-PRE-DES',wbs:'01.1.04',plan:1,area:'Preliminaries',discipline:'Design/Procurement',name:'Detailed design / approvals / long-lead procurement control window',startDay:31,finishDay:270,predecessors:[fs('P01-PRE-NTP',30)],critical:true,responsible:'Engineering + Procurement',installmentStart:1,installmentEnd:24,deliverable:'Approved drawings / submittals / long-lead release',basis:'SOURCE',source:'Plan 1 CP-03'});
  addTask({id:'P01-PRE-REL',wbs:'01.1.05',plan:1,area:'Preliminaries',discipline:'Milestone',name:'Main construction readiness milestone',startDay:180,milestone:true,critical:true,predecessors:[fs('P01-PRE-TEMP'),fs('P12-PRG-004'),fs('P03-SITE-A-REL')],responsible:'Project Manager',installmentStart:24,installmentEnd:24,deliverable:'Main works released',basis:'DERIVED',source:'Plan 1'});

  const physical={};
  // Area A
  physical.A21=addExternalPackage({prefix:'P01-A21',wbsBase:'01.2.1',zone:'A',area:'โซนทางเข้า–ออกหลัก',start:181,finish:400,installmentStart:25,installmentEnd:39});
  physical.A22=addExternalPackage({prefix:'P01-A22',wbsBase:'01.2.2',zone:'A',area:'จุดรับส่งผู้โดยสาร',start:220,finish:440,installmentStart:40,installmentEnd:52});
  physical.A23=addBuildingPackage({prefix:'P01-A23',wbsBase:'01.2.3',zone:'A',area:'อาคารศูนย์การเรียนรู้ทางธรรมชาติ',start:181,finish:840,installmentStart:53,installmentEnd:170,criticalChain:true,extras:[
    ['Exhibition fit-out / interpretive installations','Exhibition',0.74,0.92,'ENV'],
    ['Exhibition content / AV integration','ICT/AV/Security',0.80,0.94,'ICT1'],
    ['Ticketing / control-room interfaces where applicable','ICT/AV/Security',0.82,0.94,'ICT1']
  ]});
  physical.A24=addBuildingPackage({prefix:'P01-A24',wbsBase:'01.2.4',zone:'A',area:'อาคารร้านอาหารและร้านกาแฟ',start:300,finish:760,installmentStart:171,installmentEnd:205,extras:[
    ['Kitchen exhaust / make-up-air / grease-drain interfaces','MEP',0.58,0.84,'MEP1'],
    ['Kitchen equipment installation','Kitchen Equipment',0.80,0.93,'ENV'],
    ['Kitchen functional / hygiene interface testing','Commissioning',0.92,0.97,'PRECOM']
  ]});
  physical.A25=addBuildingPackage({prefix:'P01-A25',wbsBase:'01.2.5',zone:'A',area:'อาคารประชุมและอเนกประสงค์',start:330,finish:800,installmentStart:206,installmentEnd:253,extras:[
    ['Conference AV / sound / control-system installation','ICT/AV/Security',0.78,0.93,'ICT1'],
    ['Room acoustic / AV functional test','Commissioning',0.92,0.97,'PRECOM']
  ]});
  physical.A26=addBuildingPackage({prefix:'P01-A26',wbsBase:'01.2.6',zone:'A',area:'อาคารผลิตน้ำประปา',start:360,finish:790,installmentStart:254,installmentEnd:261,extras:[
    ['Process pumps / tanks / valves installation','Process MEP',0.62,0.88,'MEP1'],
    ['Instrumentation / control panels / sensors','Controls',0.72,0.91,'ELE1'],
    ['Water flushing / process functional test','Commissioning',0.90,0.98,'PRECOM']
  ]});
  physical.A27=addExternalPackage({prefix:'P01-A27',wbsBase:'01.2.7',zone:'A',area:'สนามหญ้าอเนกประสงค์',start:520,finish:820,installmentStart:262,installmentEnd:277});
  physical.A28=addExternalPackage({prefix:'P01-A28',wbsBase:'01.2.8',zone:'A',area:'ผังบริเวณและภูมิทัศน์ พื้นที่ A',start:650,finish:980,installmentStart:278,installmentEnd:310,criticalChain:true});
  physical.A29=addBuildingPackage({prefix:'P01-A29',wbsBase:'01.2.9',zone:'A',area:'อาคารห้องนิรันดร์ พื้นที่ A',start:620,finish:840,installmentStart:311,installmentEnd:317});

  // Area B
  physical.B31=addBuildingPackage({prefix:'P01-B31',wbsBase:'01.3.1',zone:'B',area:'อาคารห้องน้ำ พื้นที่ B',start:500,finish:760,installmentStart:318,installmentEnd:327});
  physical.B32=addBuildingPackage({prefix:'P01-B32',wbsBase:'01.3.2',zone:'B',area:'อาคารขยะ พื้นที่ B',start:520,finish:730,installmentStart:328,installmentEnd:333});
  physical.B33=addExternalPackage({prefix:'P01-B33',wbsBase:'01.3.3',zone:'B',area:'ลานจอดรถ พื้นที่ B',start:500,finish:830,installmentStart:334,installmentEnd:345});
  physical.B34=addExternalPackage({prefix:'P01-B34',wbsBase:'01.3.4',zone:'B',area:'ผังบริเวณและภูมิทัศน์ พื้นที่ B',start:720,finish:900,installmentStart:346,installmentEnd:348});

  // Area C
  physical.C41=addBuildingPackage({prefix:'P01-C41',wbsBase:'01.4.1',zone:'C',area:'อาคารต้อนรับ พื้นที่ C',start:520,finish:800,installmentStart:349,installmentEnd:361});
  // Production clusters expose realistic overlap instead of one summary bar
  physical.C42A=addBuildingPackage({prefix:'P01-C42A',wbsBase:'01.4.2.1',zone:'C',area:'บ้านเต็นท์ Cluster 1',start:520,finish:780,installmentStart:362,installmentEnd:380});
  physical.C42B=addBuildingPackage({prefix:'P01-C42B',wbsBase:'01.4.2.2',zone:'C',area:'บ้านเต็นท์ Cluster 2',start:570,finish:830,installmentStart:362,installmentEnd:380});
  physical.C42C=addBuildingPackage({prefix:'P01-C42C',wbsBase:'01.4.2.3',zone:'C',area:'บ้านเต็นท์ Cluster 3',start:620,finish:880,installmentStart:362,installmentEnd:380});
  physical.C43=addBuildingPackage({prefix:'P01-C43',wbsBase:'01.4.3',zone:'C',area:'อาคารห้องปั๊ม พื้นที่ C',start:650,finish:860,installmentStart:381,installmentEnd:383,extras:[
    ['Pump / piping / control functional run','Commissioning',0.85,0.98,'PRECOM']
  ]});

  // Area D — low-impact workfronts
  physical.D51=addExternalPackage({prefix:'P01-D51',wbsBase:'01.5.1',zone:'D',area:'พื้นที่ศึกษาธรรมชาติ 1',start:301,finish:620,installmentStart:384,installmentEnd:409,nature:true});
  physical.D52=addExternalPackage({prefix:'P01-D52',wbsBase:'01.5.2',zone:'D',area:'พื้นที่ศึกษาธรรมชาติ 2',start:430,finish:780,installmentStart:410,installmentEnd:449,nature:true});
  physical.D53=addExternalPackage({prefix:'P01-D53',wbsBase:'01.5.3',zone:'D',area:'พื้นที่ศึกษาธรรมชาติ 3',start:600,finish:960,installmentStart:450,installmentEnd:480,nature:true,criticalChain:true});
  physical.D54=addExternalPackage({prefix:'P01-D54',wbsBase:'01.5.4',zone:'D',area:'ผังบริเวณและภูมิทัศน์ พื้นที่ D',start:760,finish:1080,installmentStart:481,installmentEnd:491,nature:true,criticalChain:true});
  physical.D55=addPontoonPackage();

  // ---------------------------------------------------------------
  // Integrated closeout — Plan 1 CP-07 / CP-08 narrative
  // ---------------------------------------------------------------
  addTask({id:'P01-CO-001',wbs:'01.6.01',plan:1,area:'Closeout',discipline:'Integration',name:'Landscape / external systems / punch integration control window',startDay:841,finishDay:1080,predecessors:[ss(physical.A23.handover),ss(physical.D53.handover)],critical:true,responsible:'Project / Area Teams',installmentStart:481,installmentEnd:492,deliverable:'Integrated closeout / punch control',basis:'SOURCE',source:'Plan 1 CP-07'});
  addTask({id:'P01-CO-002',wbs:'01.6.02',plan:1,area:'Closeout',discipline:'Commissioning',name:'Integrated system testing / commissioning closeout',startDay:1081,finishDay:1140,predecessors:[fs('P01-CO-001')],critical:true,responsible:'Commissioning Manager',installmentStart:493,installmentEnd:495,deliverable:'Integrated commissioning dossier',basis:'SOURCE',source:'Plan 1 CP-08'});
  addTask({id:'P01-CO-003',wbs:'01.6.03',plan:1,area:'Closeout',discipline:'As-built/Documentation',name:'Final as-built / O&M / warranties / training / asset reconciliation',startDay:1081,finishDay:1190,predecessors:[fs('P01-CO-001')],critical:true,responsible:'Engineering + BIM + Document Control + Asset Team',installmentStart:494,installmentEnd:497,deliverable:'As-built / O&M / asset handover package',basis:'SOURCE',source:'Plan 1 CP-08'});
  addTask({id:'P01-CO-004',wbs:'01.6.04',plan:1,area:'Closeout',discipline:'Restoration',name:'Final demobilization / environmental / heritage restoration acceptance',startDay:1081,finishDay:1170,predecessors:[fs('P01-CO-001')],critical:true,responsible:'Site + Environmental + Heritage Team',installmentStart:493,installmentEnd:497,deliverable:'Restoration / demobilization acceptance',basis:'DERIVED',source:'Plans 1,3,10,16'});
  addTask({id:'P01-CO-005',wbs:'01.6.05',plan:1,area:'Closeout',discipline:'Integration',name:'Final handover readiness gate',startDay:1195,milestone:true,critical:true,predecessors:[fs('P01-CO-002'),fs('P01-CO-003'),fs('P01-CO-004'),fs('P15-CAR-FIN'),fs('P13-BIM-HO'),fs('P07-QA-COMM')],responsible:'Project Manager',installmentStart:497,installmentEnd:497,deliverable:'Final handover readiness certificate',basis:'DERIVED',source:'Plans 1,2,7,13,15,16'});
  addTask({id:'P01-CO-006',wbs:'01.6.06',plan:1,area:'Closeout',discipline:'Milestone',name:'Project final acceptance / Day 1200 milestone',startDay:1200,milestone:true,critical:true,predecessors:[fs('P01-CO-005'),fs('P02-M497')],responsible:'Employer / Project Manager',installmentStart:497,installmentEnd:497,deliverable:'Final acceptance',basis:'SOURCE',source:'Plan 1 — 1,200-day requirement'});
}
