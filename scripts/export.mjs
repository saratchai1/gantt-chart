import fs from 'node:fs';
import { masterSchedule, masterCSV, scheduleStats, validation, cpm } from '../src/build-schedule.js';

const csvEscape=value=>{
  const s=value==null?'':String(value);
  return /[",\n]/.test(s)?`"${s.replaceAll('"','""')}"`:s;
};
const toCsv=(rows,fields)=>'\ufeff'+[fields.join(','),...rows.map(r=>fields.map(f=>csvEscape(r[f])).join(','))].join('\n');

fs.mkdirSync('data', { recursive: true });
fs.writeFileSync('data/master-schedule.csv', masterCSV());
fs.writeFileSync('data/master-schedule.json', JSON.stringify(masterSchedule, null, 2));
fs.writeFileSync('data/schedule-stats.json', JSON.stringify(scheduleStats, null, 2));
fs.writeFileSync('data/cpm-report.json', JSON.stringify(cpm, null, 2));
fs.writeFileSync('data/validation-report.json', JSON.stringify({ stats:scheduleStats, ...validation }, null, 2));

const provisional=masterSchedule.filter(r=>r.scope_applicability==='WHERE_APPLICABLE').map(r=>({
  ...r,
  review_status:'OPEN',
  reviewer:'',
  confirmed_scope_reference:'',
  resolution_action:'CONFIRM / DELETE / REPLACE',
  resolution_note:''
}));
const provisionalFields=[
  'activity_id','wbs','plan_no','zone','building_area','discipline','activity_name','start_day','finish_day',
  'predecessor','relationship','lag_days','responsible_party','deliverable_evidence','basis_type','timing_basis',
  'scope_applicability','scope_note','source_reference','review_status','reviewer','confirmed_scope_reference',
  'resolution_action','resolution_note','notes'
];
fs.writeFileSync('data/provisional-scope-register.csv',toCsv(provisional,provisionalFields));
fs.writeFileSync('data/provisional-scope-register.json',JSON.stringify(provisional,null,2));

const documentGates=masterSchedule.filter(r=>r.plan_no==='11' && r.discipline==='Controlled Document / Engineering Gate').map(r=>({
  ...r,review_status:'OPEN',approved_document_reference:'',actual_release_date:'',review_note:''
}));
const documentFields=[
  'activity_id','wbs','zone','building_area','activity_name','start_day','predecessor','relationship','lag_days',
  'deliverable_evidence','timing_basis','source_reference','review_status','approved_document_reference','actual_release_date','review_note','notes'
];
fs.writeFileSync('data/package-document-release-register.csv',toCsv(documentGates,documentFields));

const testPacks=masterSchedule.filter(r=>r.plan_no==='01' && /-(?:ETST|PTST|HTST|ITST|KTST|WTST|CTST)$/.test(r.activity_id)).map(r=>({
  ...r,review_status:'OPEN',confirmed_equipment_system_reference:'',approved_test_procedure:'',resolution_note:''
}));
const testFields=[
  'activity_id','wbs','zone','building_area','discipline','activity_name','start_day','finish_day','predecessor','relationship',
  'deliverable_evidence','scope_applicability','scope_note','source_reference','review_status','confirmed_equipment_system_reference',
  'approved_test_procedure','resolution_note','notes'
];
fs.writeFileSync('data/system-test-pack-register.csv',toCsv(testPacks,testFields));

console.log(`Exported ${masterSchedule.length} activities.`);
console.log(`Computed critical activities: ${scheduleStats.computedCritical}`);
console.log(`Activities connected to final milestone: ${scheduleStats.connectedToFinal}`);
console.log(`Provisional scope register: ${provisional.length} review rows.`);
console.log(`Package document release register: ${documentGates.length} review rows.`);
console.log(`System test pack register: ${testPacks.length} review rows.`);
console.log(`Validation: ${validation.status}`);
