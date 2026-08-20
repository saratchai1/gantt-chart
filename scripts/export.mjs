import fs from 'node:fs';
import { masterSchedule, masterCSV, scheduleStats, localizationStats, validation, cpm } from '../src/build-schedule.js';

const csvEscape=value=>{
  const s=value==null?'':String(value);
  return /[",\n]/.test(s)?`"${s.replaceAll('"','""')}"`:s;
};
const toCsv=(rows,fields)=>'\ufeff'+[fields.join(','),...rows.map(r=>fields.map(f=>csvEscape(r[f])).join(','))].join('\n');
const reviewPriority=r=>{
  const tf=r.computed_total_float_days===''?null:Number(r.computed_total_float_days);
  if(r.computed_critical==='Y'||tf===0)return 'P1_ZERO_FLOAT';
  if(tf!=null&&tf<=30)return 'P1_LOW_FLOAT';
  if(tf!=null&&tf<=90)return 'P2_MEDIUM_FLOAT';
  return 'P3_STANDARD';
};
const networkImpact=r=>r.computed_critical==='Y'?'ZERO_FLOAT':r.network_to_final==='Y'?'CONNECTED_NONCRITICAL':'NO_D1200_PATH';

fs.mkdirSync('data', { recursive: true });
fs.writeFileSync('data/master-schedule.csv', masterCSV());
fs.writeFileSync('data/master-schedule.json', JSON.stringify(masterSchedule, null, 2));
fs.writeFileSync('data/schedule-stats.json', JSON.stringify(scheduleStats, null, 2));
fs.writeFileSync('data/localization-stats.json', JSON.stringify(localizationStats, null, 2));
fs.writeFileSync('data/cpm-report.json', JSON.stringify(cpm, null, 2));
fs.writeFileSync('data/validation-report.json', JSON.stringify({ stats:scheduleStats, localization:localizationStats, ...validation }, null, 2));

const translationReview=masterSchedule.filter(r=>r.translation_status==='REVIEW_REQUIRED').map(r=>({
  activity_id:r.activity_id,wbs:r.wbs,plan_no:r.plan_no,zone:r.zone,
  building_area:r.building_area,building_area_en:r.building_area_en,
  work_category_th:r.work_category_th,discipline_en:r.discipline_en,
  activity_name_th:r.activity_name_th,activity_name_en:r.activity_name_en,
  translation_status:r.translation_status,translation_note:r.translation_note,
  reviewer:'',approved_thai_activity_name:'',approved_thai_work_category:'',resolution_note:''
}));
const translationReviewFields=[
  'activity_id','wbs','plan_no','zone','building_area','building_area_en','work_category_th','discipline_en',
  'activity_name_th','activity_name_en','translation_status','translation_note','reviewer',
  'approved_thai_activity_name','approved_thai_work_category','resolution_note'
];
fs.writeFileSync('data/thai-translation-review-register.csv',toCsv(translationReview,translationReviewFields));
fs.writeFileSync('data/thai-translation-review-register.json',JSON.stringify(translationReview,null,2));

const provisional=masterSchedule.filter(r=>r.scope_applicability==='WHERE_APPLICABLE').map(r=>({
  ...r,
  review_priority:reviewPriority(r),
  network_impact:networkImpact(r),
  review_priority_basis:'Proposal review heuristic from computed float/network impact; not a source-stated priority',
  review_status:'OPEN',
  reviewer:'',
  confirmed_scope_reference:'',
  resolution_action:'CONFIRM / DELETE / REPLACE',
  resolution_note:''
}));
const provisionalFields=[
  'activity_id','wbs','plan_no','zone','building_area','building_area_en','work_category_th','discipline_en',
  'activity_name','activity_name_en','start_day','finish_day',
  'computed_critical','computed_total_float_days','network_from_start','network_to_final','review_priority','network_impact','review_priority_basis',
  'predecessor','relationship','lag_days','responsible_party','deliverable_evidence','basis_type','timing_basis',
  'scope_applicability','scope_note','source_reference','review_status','reviewer','confirmed_scope_reference',
  'resolution_action','resolution_note','notes'
];
fs.writeFileSync('data/provisional-scope-register.csv',toCsv(provisional,provisionalFields));
fs.writeFileSync('data/provisional-scope-register.json',JSON.stringify(provisional,null,2));

const summaryMap=new Map();
for(const r of provisional){
  const key=`${r.building_area}||${r.work_category_th||r.discipline}`;
  if(!summaryMap.has(key)) summaryMap.set(key,{building_area:r.building_area,work_category_th:r.work_category_th||r.discipline,total_rows:0,p1_rows:0,zero_float_rows:0,min_total_float_days:'',activity_ids:[]});
  const s=summaryMap.get(key);s.total_rows++;s.activity_ids.push(r.activity_id);
  if(String(r.review_priority).startsWith('P1'))s.p1_rows++;
  if(r.computed_critical==='Y')s.zero_float_rows++;
  if(r.computed_total_float_days!==''){
    const tf=Number(r.computed_total_float_days);
    if(s.min_total_float_days===''||tf<s.min_total_float_days)s.min_total_float_days=tf;
  }
}
const provisionalSummary=[...summaryMap.values()].sort((a,b)=>b.p1_rows-a.p1_rows||b.zero_float_rows-a.zero_float_rows||b.total_rows-a.total_rows||a.building_area.localeCompare(b.building_area,'th'));
fs.writeFileSync('data/provisional-scope-summary.json',JSON.stringify({
  generated_from:'master-schedule',
  priority_rule:'P1 zero/<=30d float; P2 <=90d float; P3 otherwise. Review heuristic only; not source-stated.',
  total_provisional_rows:provisional.length,
  p1_rows:provisional.filter(r=>String(r.review_priority).startsWith('P1')).length,
  zero_float_rows:provisional.filter(r=>r.computed_critical==='Y').length,
  groups:provisionalSummary
},null,2));
fs.writeFileSync('data/provisional-scope-summary.csv',toCsv(provisionalSummary,['building_area','work_category_th','total_rows','p1_rows','zero_float_rows','min_total_float_days','activity_ids']));

const documentGates=masterSchedule.filter(r=>r.plan_no==='11' && r.discipline_en==='Controlled Document / Engineering Gate').map(r=>({
  ...r,review_status:'OPEN',approved_document_reference:'',actual_release_date:'',review_note:''
}));
const documentFields=[
  'activity_id','wbs','zone','building_area','building_area_en','activity_name','activity_name_en','start_day','predecessor','relationship','lag_days',
  'deliverable_evidence','timing_basis','source_reference','review_status','approved_document_reference','actual_release_date','review_note','notes'
];
fs.writeFileSync('data/package-document-release-register.csv',toCsv(documentGates,documentFields));

const testPacks=masterSchedule.filter(r=>r.plan_no==='01' && /-(?:ETST|PTST|HTST|ITST|KTST|WTST|CTST)$/.test(r.activity_id)).map(r=>({
  ...r,review_priority:reviewPriority(r),network_impact:networkImpact(r),review_status:'OPEN',confirmed_equipment_system_reference:'',approved_test_procedure:'',resolution_note:''
}));
const testFields=[
  'activity_id','wbs','zone','building_area','building_area_en','work_category_th','discipline_en','activity_name','activity_name_en',
  'start_day','finish_day','computed_critical','computed_total_float_days','review_priority','network_impact','predecessor','relationship',
  'deliverable_evidence','scope_applicability','scope_note','source_reference','review_status','confirmed_equipment_system_reference',
  'approved_test_procedure','resolution_note','notes'
];
fs.writeFileSync('data/system-test-pack-register.csv',toCsv(testPacks,testFields));

console.log(`Exported ${masterSchedule.length} activities.`);
console.log(`Thai primary activity names: ${localizationStats.thai_primary}/${localizationStats.total}.`);
console.log(`Thai translation review register: ${translationReview.length} rows; Plan 01 review=${localizationStats.plan01_review_required}.`);
console.log(`Computed critical activities: ${scheduleStats.computedCritical}`);
console.log(`Activities connected to final milestone: ${scheduleStats.connectedToFinal}`);
console.log(`Provisional scope register: ${provisional.length} review rows; P1=${provisional.filter(r=>String(r.review_priority).startsWith('P1')).length}; zero-float=${provisional.filter(r=>r.computed_critical==='Y').length}.`);
console.log(`Provisional scope summary: ${provisionalSummary.length} area/work-category groups.`);
console.log(`Package document release register: ${documentGates.length} review rows.`);
console.log(`System test pack register: ${testPacks.length} review rows.`);
console.log(`Validation: ${validation.status}`);
