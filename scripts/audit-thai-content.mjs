import { masterSchedule, scheduleStats, localizationStats, validation } from '../src/build-schedule.js';

const THAI_RE=/[\u0E00-\u0E7F]/;
const LATIN_TOKEN_RE=/[A-Za-z][A-Za-z0-9&./+\-]*/g;
const allowedLatin=new Set([
  'A','B','C','D','X','Y','Z','CP','NTP','WBS','BOQ','IFC','BIM','AIM','MEP','HVAC','ICT','AV','CCTV','AI',
  'QA','QC','HSE','PTW','LOTO','JSEA','CDE','EDMS','MIDP','TIDP','FAT','MIR','NCR','UAT','API','UX','QR',
  'GWP','O&M','4D','5D','IP','ITP','MS','TF','SS','FS','FF','SF','TOR'
]);
const normalizeToken=t=>String(t).toUpperCase().replace(/^[^A-Z0-9]+|[^A-Z0-9&]+$/g,'');
const latinTokens=text=>(String(text||'').match(LATIN_TOKEN_RE)||[]);
const unexpectedLatin=text=>latinTokens(text).filter(t=>{
  const n=normalizeToken(t);
  if(!n)return false;
  if(allowedLatin.has(n))return false;
  if(/^D\d+$/.test(n)||/^M\d+$/.test(n)||/^CP\d+$/.test(n))return false;
  return true;
});

const plan01=masterSchedule.filter(r=>r.plan_no==='01');
const buildingPrefixes=[
  'P01-A23','P01-A24','P01-A25','P01-A26','P01-A29',
  'P01-B31','P01-B32','P01-C41','P01-C42A','P01-C42B','P01-C42C','P01-C43'
];
const byId=new Map(masterSchedule.map(r=>[r.activity_id,r]));

const suffix=id=>id.split('-').at(-1);
const prefixOf=id=>{
  for(const p of buildingPrefixes)if(id.startsWith(`${p}-`))return p;
  return '';
};

const expectedCategory={
  SUR:'งานโครงสร้าง',EXC:'งานโครงสร้าง',BLI:'งานโครงสร้าง',RBF:'งานโครงสร้าง',FMF:'งานโครงสร้าง',HOLD:'งานโครงสร้าง',
  FND:'งานโครงสร้าง',GB:'งานโครงสร้าง',FRM:'งานโครงสร้าง',ROOF:'งานโครงสร้าง',
  ENV:'สถาปัตย์',EWALL:'สถาปัตย์',PART:'สถาปัตย์',WFIN:'สถาปัตย์',DRW:'สถาปัตย์',CEIL:'สถาปัตย์',
  FLR:'สถาปัตย์',PNT:'สถาปัตย์',SAN:'สถาปัตย์',FURN:'สถาปัตย์',
  MEP1:'งานระบบประกอบอาคาร',ELE1:'งานระบบไฟฟ้าและสื่อสาร',ELE2:'งานระบบไฟฟ้าและสื่อสาร',
  PLB1:'งานระบบสุขาภิบาลและป้องกันอัคคีภัย',HV1:'งานระบบปรับอากาศและระบายอากาศ',HV2:'งานระบบปรับอากาศและระบายอากาศ',
  ICT1:'งานระบบพิเศษ',ICT2:'งานระบบพิเศษ',EXT:'งานภูมิทัศน์และงานภายนอก',
  PRECOM:'งานทดสอบและเดินระบบ',FUNC:'งานทดสอบและเดินระบบ',COMM:'งานทดสอบและเดินระบบ',
  SNAG:'งานตรวจสอบและแก้ไขข้อบกพร่อง',CORR:'งานตรวจสอบและแก้ไขข้อบกพร่อง',
  ASB:'งานแบบก่อสร้างจริงและส่งมอบ',HO:'งานส่งมอบ'
};

const keywordChecks={
  SUR:['ปักผัง'],EXC:['ขุด'],BLI:['คอนกรีตหยาบ'],RBF:['เหล็กเสริม'],FMF:['แบบหล่อ'],HOLD:['ตรวจ'],FND:['ฐานราก'],
  GB:['คานคอดิน'],FRM:['เสา','คาน','พื้น'],ROOF:['หลังคา'],ENV:['หลังคา'],EWALL:['ผนังภายนอก'],PART:['ผนังภายใน'],
  WFIN:['ผนัง'],DRW:['ประตู','หน้าต่าง'],CEIL:['ฝ้า'],FLR:['พื้น'],PNT:['สี'],SAN:['สุขภัณฑ์'],FURN:['เฟอร์นิเจอร์']
};

const categoryErrors=[];
const keywordErrors=[];
for(const r of plan01){
  const p=prefixOf(r.activity_id); if(!p)continue;
  const s=suffix(r.activity_id);
  if(expectedCategory[s]&&r.work_category_th!==expectedCategory[s])categoryErrors.push({id:r.activity_id,expected:expectedCategory[s],actual:r.work_category_th,name:r.activity_name});
  if(keywordChecks[s]){
    const missing=keywordChecks[s].filter(k=>!String(r.activity_name).includes(k));
    if(missing.length)keywordErrors.push({id:r.activity_id,missing,name:r.activity_name});
  }
}

const requiredBuildingCategories=['งานโครงสร้าง','สถาปัตย์','งานระบบไฟฟ้าและสื่อสาร','งานระบบสุขาภิบาลและป้องกันอัคคีภัย','งานทดสอบและเดินระบบ','งานส่งมอบ'];
const buildingCategoryGaps=[];
for(const p of buildingPrefixes){
  const rows=plan01.filter(r=>r.activity_id.startsWith(`${p}-`));
  const cats=new Set(rows.map(r=>r.work_category_th));
  const missing=requiredBuildingCategories.filter(c=>!cats.has(c));
  if(missing.length)buildingCategoryGaps.push({prefix:p,area:rows[0]?.building_area,missing});
}

const unknownLatinRows=[];
const unknownTokenFreq=new Map();
for(const r of masterSchedule){
  const fields=[['activity',r.activity_name],['area',r.building_area],['category',r.work_category_th],['discipline',r.discipline]];
  const hits=[];
  for(const [field,text] of fields){
    for(const token of unexpectedLatin(text)){
      hits.push(`${field}:${token}`);
      const key=normalizeToken(token);unknownTokenFreq.set(key,(unknownTokenFreq.get(key)||0)+1);
    }
  }
  if(hits.length)unknownLatinRows.push({id:r.activity_id,plan:r.plan_no,area:r.building_area,name:r.activity_name,hits});
}

const namesWithoutThai=masterSchedule.filter(r=>!THAI_RE.test(String(r.activity_name||'')));
const areasWithoutThai=masterSchedule.filter(r=>!THAI_RE.test(String(r.building_area||'')));
const categoriesWithoutThai=masterSchedule.filter(r=>!THAI_RE.test(String(r.work_category_th||'')));

const duplicateGroups=[];
const dupMap=new Map();
for(const r of masterSchedule){
  const key=[r.plan_no,r.building_area,r.work_category_th,r.activity_name].join('||');
  if(!dupMap.has(key))dupMap.set(key,[]);
  dupMap.get(key).push(r.activity_id);
}
for(const [key,ids] of dupMap)if(ids.length>1)duplicateGroups.push({key,ids});

const longNames=masterSchedule.filter(r=>String(r.activity_name).length>110).sort((a,b)=>String(b.activity_name).length-String(a.activity_name).length);
const genericNames=masterSchedule.filter(r=>/^(กิจกรรม|งานตามแผน|ดำเนินงาน|งานดำเนินการ)(\s|$)/.test(String(r.activity_name||'')));
const untranslatedSeparators=masterSchedule.filter(r=>/\s[—–-]\s[A-Za-z]{3,}/.test(String(r.activity_name||'')));

console.log('THAI_CONTENT_AUDIT_BEGIN');
console.log(`schedule=${masterSchedule.length}; plan01=${plan01.length}; milestones=${scheduleStats.milestones}; validation=${validation.status}`);
console.log(`thai_activity_names=${localizationStats.thai_primary}/${masterSchedule.length}; review_required=${localizationStats.review_required}; plan01_review_required=${localizationStats.plan01_review_required}`);
console.log(`names_without_thai=${namesWithoutThai.length}; areas_without_thai=${areasWithoutThai.length}; categories_without_thai=${categoriesWithoutThai.length}`);
console.log(`category_mapping_errors=${categoryErrors.length}; keyword_alignment_errors=${keywordErrors.length}; building_category_gaps=${buildingCategoryGaps.length}`);
console.log(`rows_with_unexpected_latin=${unknownLatinRows.length}; untranslated_separator_rows=${untranslatedSeparators.length}; generic_names=${genericNames.length}; duplicate_visible_name_groups=${duplicateGroups.length}; names_over_110_chars=${longNames.length}`);

console.log('EXPECTED_CATEGORY_ERRORS');
for(const x of categoryErrors.slice(0,100))console.log(JSON.stringify(x));
console.log('BENCHMARK_KEYWORD_ERRORS');
for(const x of keywordErrors.slice(0,100))console.log(JSON.stringify(x));
console.log('BUILDING_CATEGORY_GAPS');
for(const x of buildingCategoryGaps)console.log(JSON.stringify(x));

console.log('TOP_UNEXPECTED_LATIN_TOKENS');
for(const [token,count] of [...unknownTokenFreq.entries()].sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0])).slice(0,80))console.log(`${token}=${count}`);
console.log('UNEXPECTED_LATIN_ROWS_SAMPLE');
for(const x of unknownLatinRows.slice(0,120))console.log(JSON.stringify(x));
console.log('UNTRANSLATED_SEPARATOR_ROWS_SAMPLE');
for(const r of untranslatedSeparators.slice(0,80))console.log(JSON.stringify({id:r.activity_id,plan:r.plan_no,name:r.activity_name}));
console.log('DUPLICATE_VISIBLE_NAME_GROUPS_SAMPLE');
for(const x of duplicateGroups.slice(0,50))console.log(JSON.stringify(x));
console.log('LONG_NAMES_SAMPLE');
for(const r of longNames.slice(0,40))console.log(JSON.stringify({id:r.activity_id,chars:String(r.activity_name).length,name:r.activity_name}));

console.log('A23_BENCHMARK_ALIGNMENT_SAMPLE');
for(const r of plan01.filter(r=>r.activity_id.startsWith('P01-A23-')).sort((a,b)=>String(a.wbs).localeCompare(String(b.wbs),'en',{numeric:true}))){
  console.log(JSON.stringify({id:r.activity_id,wbs:r.wbs,category:r.work_category_th,name:r.activity_name,duration:r.duration_days,start:r.start_day,finish:r.finish_day}));
}
console.log('THAI_CONTENT_AUDIT_END');

// Fail only on objective structural language/hierarchy defects. English leakage
// is reported for editorial review because approved acronyms and technical terms
// may remain intentionally.
if(namesWithoutThai.length||areasWithoutThai.length||categoriesWithoutThai.length||categoryErrors.length||keywordErrors.length||buildingCategoryGaps.length){
  process.exitCode=1;
}
