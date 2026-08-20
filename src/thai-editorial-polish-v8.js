const REPLACEMENTS=[
  [/Toolbox Meeting/gi,'การประชุมชี้แจงก่อนเริ่มงาน'],
  [/Audit Trail/gi,'ประวัติการตรวจสอบย้อนหลัง'],
  [/Digital Twin/gi,'แบบจำลองดิจิทัลของสินทรัพย์'],
  [/Metadata/gi,'ข้อมูลกำกับเอกสาร'],
  [/Workflow/gi,'ขั้นตอนการทำงาน'],
  [/Offline/gi,'ขณะไม่เชื่อมต่อเครือข่าย'],
  [/\bLogic\b/gi,'ตรรกะความสัมพันธ์']
];

export const FORBIDDEN_VISIBLE_ENGLISH_TERMS=[
  'Toolbox Meeting','Audit Trail','Digital Twin','Metadata','Workflow','Offline','Logic'
];

function polish(value){
  let text=String(value??'');
  for(const [pattern,replacement] of REPLACEMENTS)text=text.replace(pattern,replacement);
  return text.replace(/\s{2,}/g,' ').trim();
}

/**
 * Editorial language pass for visible Thai schedule fields.
 *
 * Technical codes and accepted abbreviations (BIM, CDE/EDMS, MIDP/TIDP,
 * 4D/5D, CP-05, X-Y-Z, B/C) remain unchanged. Original English audit fields
 * are retained, so this pass affects presentation only and cannot change IDs,
 * dates, dependencies or CPM logic.
 */
export function applyThaiEditorialPolishV8(rows){
  for(const row of rows){
    row.activity_name=polish(row.activity_name);
    row.activity_name_th=polish(row.activity_name_th||row.activity_name);
    row.building_area=polish(row.building_area);
    row.building_area_th=polish(row.building_area_th||row.building_area);
    row.work_category_th=polish(row.work_category_th);
    row.discipline_th=polish(row.discipline_th);
    // discipline is a visible grouping field after Thai category alignment.
    row.discipline=polish(row.discipline);
  }
  return rows;
}

export function thaiEditorialIssues(rows){
  const issues=[];
  for(const row of rows){
    const text=[row.activity_name,row.building_area,row.work_category_th,row.discipline].join(' | ');
    const found=FORBIDDEN_VISIBLE_ENGLISH_TERMS.filter(term=>text.toLowerCase().includes(term.toLowerCase()));
    if(found.length)issues.push({activity_id:row.activity_id,found,activity_name:row.activity_name});
  }
  return issues;
}
