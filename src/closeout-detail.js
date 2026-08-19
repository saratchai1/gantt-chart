import { addTask, fs } from './schedule-core.js';

// Detailed proposal breakdown of the source CP-08 D1081–D1200 envelope.
// The source states the envelope and final deliverable categories; exact internal
// day splits below are proposal planning assumptions and are marked accordingly.
export function buildCloseoutDetail() {
  addTask({
    id:'P01-CO-D493',wbs:'01.6.02.1',plan:1,area:'Closeout',discipline:'Closeout / Site',
    name:'Final cleaning, demobilization interface and site handover inspection package',
    startDay:1081,finishDay:1110,predecessors:[fs('P01-CO-001')],critical:true,
    responsible:'Project + Site + Environmental + HSE',installmentStart:493,installmentEnd:493,
    deliverable:'Final cleaning / site handover inspection evidence',basis:'DERIVED',timingBasis:'ASSUMPTION',
    source:'Plan 1 CP-08 + Plan 2 installment 493',notes:'Exact internal CP-08 split is a proposal planning allowance.'
  });
  addTask({
    id:'P01-CO-D494',wbs:'01.6.02.2',plan:1,area:'Closeout',discipline:'As-built / BIM',
    name:'Final As-Built Drawings / As-Built BIM verification and controlled issue',
    startDay:1110,finishDay:1140,predecessors:[fs('P02-M493')],critical:true,
    responsible:'Engineering + Survey + BIM + Document Control',installmentStart:494,installmentEnd:494,
    deliverable:'Verified / controlled As-Built package',basis:'DERIVED',timingBasis:'ASSUMPTION',
    source:'Plan 1 CP-08 + Plan 2 installment 494 + Plan 13',notes:'Final verification follows progressive as-built capture completed earlier.'
  });
  addTask({
    id:'P01-CO-D495',wbs:'01.6.02.3',plan:1,area:'Closeout',discipline:'Commissioning',
    name:'Final electrical / mechanical test-report reconciliation and acceptance package',
    startDay:1140,finishDay:1160,predecessors:[fs('P02-M494')],critical:true,
    responsible:'Commissioning + QA/QC + Engineering',installmentStart:495,installmentEnd:495,
    deliverable:'Final electrical / mechanical test-report package',basis:'DERIVED',timingBasis:'ASSUMPTION',
    source:'Plan 1 CP-08 + Plan 2 installment 495',notes:'Physical testing occurs progressively; this is final report reconciliation.'
  });
  addTask({
    id:'P01-CO-D496',wbs:'01.6.02.4',plan:1,area:'Closeout',discipline:'O&M / Training',
    name:'O&M manuals, warranties, spares, operating data and training closeout',
    startDay:1160,finishDay:1180,predecessors:[fs('P02-M495')],critical:true,
    responsible:'Engineering + Vendors + Document Control',installmentStart:496,installmentEnd:496,
    deliverable:'Accepted O&M / warranty / training package',basis:'DERIVED',timingBasis:'ASSUMPTION',
    source:'Plan 1 CP-08 + Plan 2 installment 496',notes:'Exact internal CP-08 split is a proposal planning allowance.'
  });
  addTask({
    id:'P01-CO-D497',wbs:'01.6.02.5',plan:1,area:'Closeout',discipline:'Asset / Commercial',
    name:'Asset register, serial/location data and value-by-item final reconciliation',
    startDay:1180,finishDay:1195,predecessors:[fs('P02-M496')],critical:true,
    responsible:'Asset Team + BIM + QS + Document Control',installmentStart:497,installmentEnd:497,
    deliverable:'Accepted asset / value-by-item register',basis:'DERIVED',timingBasis:'ASSUMPTION',
    source:'Plan 1 CP-08 + Plan 2 installment 497 + Plan 13',notes:'Exact internal CP-08 split is a proposal planning allowance.'
  });
  addTask({
    id:'P01-CO-ACC',wbs:'01.6.02.6',plan:1,area:'Closeout',discipline:'Acceptance',
    name:'Final joint inspection, outstanding-evidence clearance and acceptance processing',
    startDay:1195,finishDay:1200,predecessors:[fs('P02-M497'),fs('P01-CO-005')],critical:true,
    responsible:'Employer + Project Manager + Consultant / Control Team',installmentStart:497,installmentEnd:497,
    deliverable:'Final joint inspection / acceptance record',basis:'DERIVED',timingBasis:'ASSUMPTION',
    source:'Plan 1 CP-08 / D1200 final handover requirement',notes:'Completes the CP-08 envelope to the contractual D1200 milestone.'
  });
}
