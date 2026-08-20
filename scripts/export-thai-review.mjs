import fs from 'node:fs';
import { masterSchedule, localizationStats } from '../src/build-schedule.js';

const esc=value=>{
  const s=value==null?'':String(value);
  return /[",\n]/.test(s)?`"${s.replaceAll('"','""')}"`:s;
};
const toCsv=(rows,fields)=>'\ufeff'+[fields.join(','),...rows.map(r=>fields.map(f=>esc(r[f])).join(','))].join('\n');

fs.mkdirSync('data',{recursive:true});

const categoryOrder=[
  'งานอำนวยการและเตรียมการ','จุดควบคุมกรอบเวลาหลัก','งานบริหารและจุดควบคุม',
  'งานสำรวจและปักผัง','งานโครงสร้าง','งานโครงสร้างและงานโยธา','สถาปัตย์',
  'งานระบบประกอบอาคาร','งานระบบไฟฟ้าและสื่อสาร','งานระบบสุขาภิบาลและป้องกันอัคคีภัย',
  'งานระบบปรับอากาศและระบายอากาศ','งานระบบพิเศษ','งานระบบครัว','งานระบบผลิตน้ำ',
  'งานครุภัณฑ์','งานตกแต่งภายในและนิทรรศการ','งานภูมิทัศน์และงานภายนอก','งานภูมิทัศน์',
  'งานระบบระบายน้ำ','งานระบบภายนอก','งานสิ่งแวดล้อมและฟื้นฟู','งานทดสอบและเดินระบบ',
  'งานตรวจสอบและแก้ไขข้อบกพร่อง','งานแบบก่อสร้างจริงและส่งมอบ','งานคู่มือและการฝึกอบรม',
  'งานทะเบียนทรัพย์สิน','งานส่งมอบ','งานปิดโครงการและส่งมอบ'
];
const categoryRank=new Map(categoryOrder.map((x,i)=>[x,i]));
const rank=x=>categoryRank.has(x)?categoryRank.get(x):999;

const plan01=masterSchedule.filter(r=>r.plan_no==='01').map(r=>({
  activity_id:r.activity_id,
  wbs:r.wbs,
  zone:r.zone,
  building_area_th:r.building_area_th||r.building_area,
  building_area_en:r.building_area_en,
  work_category_th:r.work_category_th,
  discipline_th:r.discipline_th,
  discipline_en:r.discipline_en,
  activity_name_th:r.activity_name_th||r.activity_name,
  activity_name_en:r.activity_name_en,
  duration_days:r.duration_days,
  start_day:r.start_day,
  finish_day:r.finish_day,
  milestone:r.milestone,
  computed_critical:r.computed_critical,
  scope_applicability:r.scope_applicability,
  translation_status:r.translation_status,
  source_reference:r.source_reference
})).sort((a,b)=>{
  const z=String(a.zone).localeCompare(String(b.zone),'en');if(z)return z;
  const area=String(a.building_area_th).localeCompare(String(b.building_area_th),'th');if(area)return area;
  const cat=rank(a.work_category_th)-rank(b.work_category_th);if(cat)return cat;
  return String(a.wbs).localeCompare(String(b.wbs),'en',{numeric:true});
});

const plan01Fields=[
  'activity_id','wbs','zone','building_area_th','building_area_en','work_category_th','discipline_th','discipline_en',
  'activity_name_th','activity_name_en','duration_days','start_day','finish_day','milestone','computed_critical',
  'scope_applicability','translation_status','source_reference'
];
fs.writeFileSync('data/plan01-thai-activity-alignment-register.csv',toCsv(plan01,plan01Fields));
fs.writeFileSync('data/plan01-thai-activity-alignment-register.json',JSON.stringify(plan01,null,2));

const groups=new Map();
for(const r of masterSchedule){
  const category=r.work_category_th||r.discipline;
  const key=[r.plan_no,r.zone,r.building_area,category].join('||');
  if(!groups.has(key))groups.set(key,{
    plan_no:r.plan_no,zone:r.zone,building_area:r.building_area,building_area_en:r.building_area_en,
    work_category_th:category,total_activities:0,milestones:0,zero_float:0,provisional_scope:0,
    start_day:r.start_day,finish_day:r.finish_day,activity_ids:[],sample_activity_names:[]
  });
  const g=groups.get(key);
  g.total_activities++;
  if(r.milestone==='Y')g.milestones++;
  if(r.computed_critical==='Y')g.zero_float++;
  if(r.scope_applicability==='WHERE_APPLICABLE')g.provisional_scope++;
  g.start_day=Math.min(g.start_day,r.start_day);
  g.finish_day=Math.max(g.finish_day,r.finish_day);
  g.activity_ids.push(r.activity_id);
  if(g.sample_activity_names.length<4)g.sample_activity_names.push(r.activity_name);
}
const categorySummary=[...groups.values()].map(g=>({
  ...g,
  activity_ids:g.activity_ids.join(';'),
  sample_activity_names:g.sample_activity_names.join(' | ')
})).sort((a,b)=>Number(a.plan_no)-Number(b.plan_no)||String(a.zone).localeCompare(String(b.zone),'en')||String(a.building_area).localeCompare(String(b.building_area),'th')||rank(a.work_category_th)-rank(b.work_category_th)||String(a.work_category_th).localeCompare(String(b.work_category_th),'th'));

const summaryFields=[
  'plan_no','zone','building_area','building_area_en','work_category_th','total_activities','milestones','zero_float',
  'provisional_scope','start_day','finish_day','sample_activity_names','activity_ids'
];
fs.writeFileSync('data/thai-work-category-summary.csv',toCsv(categorySummary,summaryFields));
fs.writeFileSync('data/thai-work-category-summary.json',JSON.stringify({
  localization:localizationStats,
  category_order:categoryOrder,
  groups:categorySummary
},null,2));

console.log(`Plan 01 Thai alignment register: ${plan01.length} activities.`);
console.log(`Thai work-category summary: ${categorySummary.length} plan/zone/area/category groups.`);
console.log(`Plan 01 categories: ${[...new Set(plan01.map(r=>r.work_category_th))].sort((a,b)=>rank(a)-rank(b)||a.localeCompare(b,'th')).join(' | ')}`);
