import { masterSchedule, scheduleStats, localizationStats, validation, masterCSV, cpm } from './src/build-schedule.js';
import { downloadText } from './src/schedule-core.js';

const planNames={
  '01':'แผนการดำเนินการโครงการ','02':'แผนงบประมาณก่อสร้าง','03':'แผนการจัดการสถานที่ก่อสร้าง','04':'แผนอัตรากำลัง','05':'แผนการใช้เครื่องจักรกล','06':'แผนการจัดหาวัสดุ','07':'แผนควบคุมคุณภาพ','08':'แผนความปลอดภัยและอาชีวอนามัย','09':'แผนจราจร','10':'แผนลดและป้องกันผลกระทบสิ่งแวดล้อม','11':'แผนบริหารจัดการเอกสารโครงการ','12':'แผนบริหารและติดตามความก้าวหน้า','13':'แผนการใช้แบบจำลองข้อมูลอาคาร','14':'แผนการใช้โปรแกรมประยุกต์และปัญญาประดิษฐ์','15':'แผนประเมินคาร์บอนฟุตพริ้นท์','16':'แผนป้องกันผลกระทบต่อแหล่งมรดกโลก'
};
const els=Object.fromEntries(['metrics','search','planFilter','zoneFilter','disciplineFilter','basisFilter','timingFilter','scopeFilter','criticalOnly','networkOnly','linkMode','zoom','resetFilters','timelineHead','leftGrid','timelineGrid','drawer','drawerContent','drawerClose','exportCsv','exportJson'].map(id=>[id,document.getElementById(id)]));
let pxDay=Number(els.zoom.value);
const collapsedPlans=new Set(),collapsedAreas=new Set(),collapsedDisciplines=new Set();
const scheduleById=new Map(masterSchedule.map(r=>[r.activity_id,r]));
const SVGNS='http://www.w3.org/2000/svg';
const esc=s=>String(s??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[ch]));
const nfmt=n=>new Intl.NumberFormat('th-TH').format(n);
const through=r=>r.network_from_start==='Y'&&r.network_to_final==='Y';

function initFilters(){
  for(const p of Object.keys(planNames)){const o=document.createElement('option');o.value=p;o.textContent=`${p} — ${planNames[p]}`;els.planFilter.append(o);}
  for(const z of [...new Set(masterSchedule.map(r=>r.zone).filter(Boolean))].sort()){const o=document.createElement('option');o.value=z;o.textContent=z;els.zoneFilter.append(o);}
  for(const d of [...new Set(masterSchedule.map(r=>r.work_category_th||r.discipline).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'th'))){const o=document.createElement('option');o.value=d;o.textContent=d;els.disciplineFilter.append(o);}
}

function renderMetrics(filteredCount=masterSchedule.length){
  const sourceActivity=masterSchedule.filter(r=>r.basis_type==='SOURCE').length;
  const sourceTiming=masterSchedule.filter(r=>r.timing_basis==='SOURCE').length;
  const assumedTiming=masterSchedule.filter(r=>r.timing_basis==='ASSUMPTION').length;
  const provisional=masterSchedule.filter(r=>r.scope_applicability==='WHERE_APPLICABLE').length;
  const networkErrors=validation.network_integrity_errors?.length||0;
  const hard=validation.structure_errors.length+validation.dependency_cycles.length+networkErrors;
  const pc=validation.network_coverage?.plan01_physical_through;
  const pfrom=validation.network_coverage?.plan01_physical_from_start;
  const pto=validation.network_coverage?.plan01_physical_to_final;
  const hc=validation.network_coverage?.plan01_handovers_through;
  const metrics=[
    ['กิจกรรม',nfmt(masterSchedule.length),`แสดง ${nfmt(filteredCount)} รายการ`,''],
    ['จุดควบคุม',nfmt(scheduleStats.milestones),'กิจกรรมระยะเวลา 0 วัน',''],
    ['กิจกรรมวิกฤต',nfmt(scheduleStats.computedCritical),`${nfmt(scheduleStats.connectedToFinal)} กิจกรรมเชื่อมถึง D1200`,''],
    ['Network งานก่อสร้าง',pc?`${pc.coverage_pct}%`:'—',pc?`${nfmt(pc.connected)}/${nfmt(pc.total)} กิจกรรม · ส่งมอบ ${hc?.coverage_pct??'—'}% · NTP ${pfrom?.coverage_pct??'—'}% / D1200 ${pto?.coverage_pct??'—'}%`:'ไม่มีข้อมูล Network สองทิศทาง',pc?.coverage_pct===100?'ok':'warn'],
    ['ขอบเขตรอยืนยัน',nfmt(provisional),'WHERE_APPLICABLE · ตรวจ IFC / BOQ / Equipment Schedule',provisional?'scopewarn':'ok'],
    ['ชื่อกิจกรรมภาษาไทย',`${nfmt(localizationStats.thai_primary)}/${nfmt(localizationStats.total)}`,`${nfmt(localizationStats.review_required)} รายการรอทบทวน`,localizationStats.review_required?'warn':'ok'],
    ['เวลาจากต้นทาง',nfmt(sourceTiming),`${nfmt(assumedTiming)} รายการใช้ช่วงเวลาสมมติฐาน · SOURCE activities ${nfmt(sourceActivity)}`,'timing'],
    ['ผลตรวจ',hard?'FAIL':validation.temporal_logic_warnings.length?'ADVISORY':'PASS',`${validation.temporal_logic_warnings.length} temporal · ${networkErrors} network integrity`,hard?'warn':'ok']
  ];
  els.metrics.innerHTML=metrics.map(([k,v,s,c])=>`<div class="metric ${c}"><div class="k">${esc(k)}</div><div class="v">${esc(v)}</div><div class="s">${esc(s)}</div></div>`).join('');
}

function filteredRows(){
  const q=els.search.value.trim().toLowerCase();
  return masterSchedule.filter(r=>{
    if(els.planFilter.value&&r.plan_no!==els.planFilter.value)return false;
    if(els.zoneFilter.value&&r.zone!==els.zoneFilter.value)return false;
    if(els.disciplineFilter.value&&(r.work_category_th||r.discipline)!==els.disciplineFilter.value)return false;
    if(els.basisFilter.value&&r.basis_type!==els.basisFilter.value)return false;
    if(els.timingFilter.value&&r.timing_basis!==els.timingFilter.value)return false;
    if(els.scopeFilter.value&&r.scope_applicability!==els.scopeFilter.value)return false;
    if(els.criticalOnly.checked&&r.computed_critical!=='Y')return false;
    if(els.networkOnly.checked&&!through(r))return false;
    if(q){const hay=[r.activity_id,r.wbs,r.activity_name,r.activity_name_th,r.activity_name_en,r.building_area,r.building_area_th,r.building_area_en,r.discipline,r.discipline_th,r.discipline_en,r.work_category_th,r.responsible_party,r.deliverable_evidence,r.source_reference,r.basis_type,r.timing_basis,r.scope_applicability,r.scope_note,r.translation_status,r.computed_total_float_days,r.network_from_start,r.network_to_final].join(' ').toLowerCase();if(!hay.includes(q))return false;}
    return true;
  });
}

function span(rows){return rows.length?[Math.min(...rows.map(r=>r.start_day)),Math.max(...rows.map(r=>r.finish_day))]:[1,1];}
function makeTimelineHeader(){
  const width=1200*pxDay;els.timelineHead.style.width=`${width}px`;els.timelineHead.style.minWidth=`${width}px`;els.timelineHead.innerHTML='';
  for(let m=1;m<=40;m++){const s=(m-1)*30+1,e=m*30,c=document.createElement('div');c.className='month-cell';c.style.flex=`0 0 ${30*pxDay}px`;c.style.width=`${30*pxDay}px`;c.innerHTML=`<b>เดือน ${m}</b><span>D${s}–${e}</span>`;els.timelineHead.append(c);}
  els.timelineGrid.style.width=`${width}px`;els.timelineGrid.style.minWidth=`${width}px`;els.timelineGrid.style.backgroundImage='linear-gradient(to right,#e2e7ee 1px,transparent 1px)';els.timelineGrid.style.backgroundSize=`${30*pxDay}px 100%`;
}
function basisChip(r){const c=(r.basis_type||'DERIVED').toLowerCase();return `<b class="basis ${c} row-chip">${esc(r.basis_type)}</b>`;}
function timingChip(r){const src=r.timing_basis==='SOURCE';return `<b class="timing-chip ${src?'source':'assumption'}">${src?'T:SRC':'T:ASM'}</b>`;}
function scopeChip(r){
  const map={SOURCE_REQUIRED:['source-required','SCOPE:SRC'],DERIVED_FROM_SCOPE:['derived-scope','SCOPE:DRV'],WHERE_APPLICABLE:['provisional','SCOPE:PROV'],CONTROL_STREAM:['control','SCOPE:CTL']};
  const [cls,label]=map[r.scope_applicability]||['unknown','SCOPE:?'];
  return `<b class="scope-chip ${cls}">${label}</b>`;
}
function networkChip(r){
  if(through(r))return '<b class="network-chip connected">NTP→D1200</b>';
  if(r.network_from_start!=='Y'&&r.network_to_final==='Y')return '<b class="network-chip disconnected">ไม่เชื่อมจาก NTP</b>';
  if(r.network_from_start==='Y'&&r.network_to_final!=='Y')return '<b class="network-chip disconnected">ไม่เชื่อมถึง D1200</b>';
  return '<b class="network-chip disconnected">NETWORK ISLAND</b>';
}

function leftTask(r){
  const div=document.createElement('div');div.className=`lrow ${r.computed_critical==='Y'?'critical-task':''} ${through(r)?'':'network-disconnected'} ${r.scope_applicability==='WHERE_APPLICABLE'?'scope-provisional-row':''}`;div.dataset.id=r.activity_id;
  const fl=r.computed_total_float_days===''?'':` · TF ${r.computed_total_float_days}d`;
  div.innerHTML=`<div class="cell">${esc(r.wbs)}</div><div class="cell name"><div><div class="title">${esc(r.activity_name)} ${basisChip(r)} ${timingChip(r)} ${scopeChip(r)} ${networkChip(r)}</div><div class="sub">${esc(r.activity_id)} · ${esc(r.building_area)} · ${esc(r.work_category_th||r.discipline)}${esc(fl)}</div></div></div><div class="cell">${r.milestone==='Y'?'MS':esc(r.duration_days+'d')}</div><div class="cell">D${r.start_day}–${r.finish_day}</div>`;return div;
}
function timeTask(r){
  const div=document.createElement('div');div.className=`trow ${through(r)?'':'network-disconnected'}`;div.dataset.id=r.activity_id;
  const x=(r.start_day-1)*pxDay,timing=r.timing_basis==='SOURCE'?'timing-source':'',crit=r.computed_critical==='Y'?'critical':'',net=through(r)?'':'disconnected',scope=r.scope_applicability==='WHERE_APPLICABLE'?'scope-provisional':'';
  const status=`NTP:${r.network_from_start} · D1200:${r.network_to_final} · Scope:${r.scope_applicability}`;
  if(r.milestone==='Y'){const m=document.createElement('div');m.className=`milestone-mark ${crit} ${timing} ${net} ${scope}`;m.style.left=`${Math.max(0,x-6)}px`;m.title=`${r.activity_id} · D${r.start_day} · TF:${r.computed_total_float_days||0} · ${status} · Timing:${r.timing_basis} · ${r.activity_name}`;div.append(m);}else{const b=document.createElement('div');b.className=`bar ${r.basis_type.toLowerCase()} ${crit} ${timing} ${net} ${scope}`;b.style.left=`${x}px`;b.style.width=`${Math.max(3,r.duration_days*pxDay)}px`;b.title=`${r.activity_id} · D${r.start_day}–D${r.finish_day} · TF:${r.computed_total_float_days===''?'n/a':r.computed_total_float_days} · ${status} · Timing:${r.timing_basis} · ${r.activity_name}`;div.append(b);}return div;
}

function groupRows({type,key,label,rows,collapsed}){
  const [s,e]=span(rows),className=type==='plan'?'plan-row':type==='area'?'area-row':'discipline-row';
  const l=document.createElement('div');l.className=className;l.dataset.toggleKey=key;l.dataset.toggleType=type;
  const connected=rows.filter(through).length,prefix=type==='discipline'?'↳ ':'';
  l.innerHTML=`<div class="cell"><span class="toggle">${collapsed?'▸':'▾'}</span>${type==='plan'?esc(key.replace('plan-','')):''}</div><div class="cell">${prefix}${esc(label)}</div><div class="cell" title="${connected}/${rows.length} เชื่อมครบ NTP→D1200">${rows.length}</div><div class="cell">D${s}–${e}</div>`;
  const t=document.createElement('div');t.className=`tgroup ${type}`;t.dataset.toggleKey=key;t.dataset.toggleType=type;const b=document.createElement('div');b.className='summary-bar';b.style.left=`${(s-1)*pxDay}px`;b.style.width=`${Math.max(3,(e-s+1)*pxDay)}px`;t.append(b);return[l,t];
}
function svgMarker(defs,id,fill){const m=document.createElementNS(SVGNS,'marker');m.setAttribute('id',id);m.setAttribute('viewBox','0 0 8 8');m.setAttribute('refX','7');m.setAttribute('refY','4');m.setAttribute('markerWidth','6');m.setAttribute('markerHeight','6');m.setAttribute('orient','auto-start-reverse');const p=document.createElementNS(SVGNS,'path');p.setAttribute('d','M0 0 L8 4 L0 8 z');p.setAttribute('fill',fill);m.append(p);defs.append(m);}
function renderDependencyLinks(){
  els.timelineGrid.querySelector('.dependency-overlay')?.remove();const mode=els.linkMode?.value||'off';if(mode==='off')return;
  const taskEls=[...els.timelineGrid.querySelectorAll('.trow[data-id]')];if(!taskEls.length)return;const visible=new Map(taskEls.map(el=>[el.dataset.id,el])),width=1200*pxDay,height=Math.max(1,els.timelineGrid.scrollHeight),svg=document.createElementNS(SVGNS,'svg');svg.setAttribute('class','dependency-overlay');svg.setAttribute('width',String(width));svg.setAttribute('height',String(height));svg.setAttribute('viewBox',`0 0 ${width} ${height}`);
  const defs=document.createElementNS(SVGNS,'defs');svgMarker(defs,'arrow-normal','#718096');svgMarker(defs,'arrow-driving','#b42318');svg.append(defs);
  for(const succEl of taskEls){const succ=scheduleById.get(succEl.dataset.id);if(!succ)continue;for(const link of succ.predecessors||[]){const pred=scheduleById.get(link.id),predEl=visible.get(link.id);if(!pred||!predEl)continue;const driving=pred.driving_successor===succ.activity_id&&through(pred)&&through(succ);if(mode==='driving'&&!driving)continue;const rel=link.relationship||'FS',predUsesStart=rel==='SS'||rel==='SF',succUsesFinish=rel==='FF'||rel==='SF',x1=(predUsesStart?pred.start_day-1:pred.finish_day)*pxDay,x2=(succUsesFinish?succ.finish_day:succ.start_day-1)*pxDay,y1=predEl.offsetTop+predEl.offsetHeight/2,y2=succEl.offsetTop+succEl.offsetHeight/2,bend=driving?9:6,routeX=x2>=x1+bend*2?x1+bend:Math.max(x1,x2)+bend*2,poly=document.createElementNS(SVGNS,'polyline');poly.setAttribute('points',`${x1},${y1} ${routeX},${y1} ${routeX},${y2} ${x2},${y2}`);poly.setAttribute('class',`dependency-link ${driving?'driving':'normal'}`);poly.setAttribute('marker-end',`url(#${driving?'arrow-driving':'arrow-normal'})`);const title=document.createElementNS(SVGNS,'title');title.textContent=`${pred.activity_id} ${rel}${link.lagDays?` +${link.lagDays}d`:''} → ${succ.activity_id}`;poly.append(title);svg.append(poly);}}
  els.timelineGrid.prepend(svg);
}

function render(){
  const rows=filteredRows();renderMetrics(rows.length);makeTimelineHeader();els.leftGrid.innerHTML='';els.timelineGrid.innerHTML='';if(!rows.length){els.leftGrid.innerHTML='<div class="empty">ไม่พบกิจกรรมตามตัวกรอง</div>';return;}
  const byPlan=new Map();for(const r of rows){if(!byPlan.has(r.plan_no))byPlan.set(r.plan_no,[]);byPlan.get(r.plan_no).push(r);}
  for(const [plan,planRows] of [...byPlan.entries()].sort((a,b)=>Number(a[0])-Number(b[0]))){const pkey=`plan-${plan}`,pcoll=collapsedPlans.has(pkey),[pl,pt]=groupRows({type:'plan',key:pkey,label:`แผน ${plan} — ${planNames[plan]||''}`,rows:planRows,collapsed:pcoll});els.leftGrid.append(pl);els.timelineGrid.append(pt);if(pcoll)continue;const byArea=new Map();for(const r of planRows){const a=r.building_area||'ทั้งโครงการ';if(!byArea.has(a))byArea.set(a,[]);byArea.get(a).push(r);}for(const [area,areaRows] of byArea){const akey=`${pkey}|${area}`,acoll=collapsedAreas.has(akey),[al,at]=groupRows({type:'area',key:akey,label:area,rows:areaRows,collapsed:acoll});els.leftGrid.append(al);els.timelineGrid.append(at);if(acoll)continue;const byDisc=new Map();for(const r of areaRows){const d=r.work_category_th||r.discipline||'งานทั่วไป';if(!byDisc.has(d))byDisc.set(d,[]);byDisc.get(d).push(r);}for(const [discipline,disciplineRows] of byDisc){const dkey=`${akey}|discipline:${discipline}`,dcoll=collapsedDisciplines.has(dkey),[dl,dt]=groupRows({type:'discipline',key:dkey,label:discipline,rows:disciplineRows,collapsed:dcoll});els.leftGrid.append(dl);els.timelineGrid.append(dt);if(dcoll)continue;for(const row of disciplineRows){els.leftGrid.append(leftTask(row));els.timelineGrid.append(timeTask(row));}}}}
  renderDependencyLinks();
}

function showDetail(id){
  const r=scheduleById.get(id);if(!r)return;const preds=(r.predecessors||[]).map(p=>`${p.id} [${p.relationship}${p.lagDays?` +${p.lagDays}d`:''}]`).join('<br>')||'—',temporal=validation.temporal_logic_warnings.filter(w=>w.successor===id),representative=cpm.representative_path.includes(id)?'ใช่ — อยู่ใน Representative zero-float chain':'ไม่ใช่ / อาจอยู่ในกิ่ง zero-float ขนาน',networkErrors=(validation.network_integrity_errors||[]).filter(x=>String(x).startsWith(`${id}:`));
  els.drawerContent.innerHTML=`<div class="eyebrow" style="color:#52708d">แผน ${esc(r.plan_no)} · ${esc(r.zone)}</div><h2>${esc(r.activity_name)}</h2><div class="idline">${esc(r.activity_id)} · WBS ${esc(r.wbs)} ${basisChip(r)} ${timingChip(r)} ${scopeChip(r)} ${networkChip(r)}</div><dl class="detail-grid">
  <dt>ชื่อภาษาอังกฤษเดิม</dt><dd>${esc(r.activity_name_en||'—')}</dd><dt>อาคาร / พื้นที่</dt><dd>${esc(r.building_area)}</dd><dt>พื้นที่ภาษาอังกฤษเดิม</dt><dd>${esc(r.building_area_en||'—')}</dd><dt>หมวดงาน</dt><dd>${esc(r.work_category_th||r.discipline)}</dd><dt>สาขางานเดิม</dt><dd>${esc(r.discipline_en||'—')}</dd><dt>วันโครงการ</dt><dd>D${r.start_day}–D${r.finish_day} · ${r.duration_days}${r.milestone==='Y'?' (จุดควบคุม)':' วัน'}</dd><dt>ที่มาระยะเวลา</dt><dd>${esc(r.timing_basis)}${r.timing_basis==='ASSUMPTION'?' — ช่วงเวลาระดับข้อเสนอ ไม่ใช่วันจากเอกสารต้นทาง':''}</dd><dt>สถานะขอบเขต</dt><dd>${esc(r.scope_applicability)}</dd><dt>หมายเหตุขอบเขต</dt><dd>${esc(r.scope_note||'—')}</dd><dt>สถานะชื่อภาษาไทย</dt><dd>${esc(r.translation_status||'—')} · ${esc(r.translation_note||'—')}</dd><dt>เชื่อมจาก NTP</dt><dd>${r.network_from_start==='Y'?'เชื่อมครบ — สาย Predecessor ย้อนถึงวันเริ่มโครงการ':'ไม่เชื่อมครบ — ต้องตรวจสายงานต้นทาง'}</dd><dt>เชื่อมถึง D1200</dt><dd>${r.network_to_final==='Y'?'เชื่อมครบ — มีสายงานไปถึงการตรวจรับขั้นสุดท้าย':'ไม่เชื่อมครบ — อาจเป็น LOE/Control หรือ Logic gap'}</dd><dt>กิจกรรมวิกฤต</dt><dd>${r.computed_critical==='Y'?'ใช่ — Total Float = 0':'ไม่ใช่'} · Representative path: ${representative}</dd><dt>Total Float</dt><dd>${r.computed_total_float_days===''?'ไม่เชื่อมถึง Final Acceptance':esc(r.computed_total_float_days+' วัน')}</dd><dt>Free Float</dt><dd>${r.computed_free_float_days===''?'—':esc(r.computed_free_float_days+' วัน')}</dd><dt>Driving Successor</dt><dd class="pred">${esc(r.driving_successor||'—')}</dd><dt>Candidate Flag</dt><dd>${r.critical==='Y'?'ใช่ — Source window / Proposal candidate':'ไม่ใช่'}</dd><dt>Predecessors</dt><dd class="pred">${preds}</dd><dt>ผู้รับผิดชอบ</dt><dd>${esc(r.responsible_party||'—')}</dd><dt>งวดงาน</dt><dd>${r.installment_start?`${esc(r.installment_start)}–${esc(r.installment_end||r.installment_start)}`:'—'}</dd><dt>ผลงานส่งมอบ / หลักฐาน</dt><dd>${esc(r.deliverable_evidence||'—')}</dd><dt>ที่มากิจกรรม</dt><dd>${esc(r.basis_type)}</dd><dt>เอกสารอ้างอิง</dt><dd>${esc(r.source_reference||'—')}</dd><dt>หมายเหตุ</dt><dd>${esc(r.notes||'—')}</dd></dl>${temporal.length?`<div class="validation-list"><b>Temporal Logic Advisory</b><br>${temporal.map(w=>`${esc(w.predecessor)} ${esc(w.relationship)} → ${esc(w.successor)}; ${esc(w.expected)}`).join('<br>')}</div>`:''}${networkErrors.length?`<div class="validation-list network-error"><b>Network Integrity Error</b><br>${networkErrors.map(esc).join('<br>')}</div>`:''}`;
  els.drawer.classList.add('open');els.drawer.setAttribute('aria-hidden','false');
}

function bindRowEvents(){
  const onClick=e=>{const toggle=e.target.closest('[data-toggle-key]');if(toggle){const {toggleKey,toggleType}=toggle.dataset,set=toggleType==='plan'?collapsedPlans:toggleType==='area'?collapsedAreas:collapsedDisciplines;set.has(toggleKey)?set.delete(toggleKey):set.add(toggleKey);render();return;}const row=e.target.closest('[data-id]');if(row)showDetail(row.dataset.id);};
  els.leftGrid.addEventListener('click',onClick);els.timelineGrid.addEventListener('click',onClick);const hover=(e,on)=>{const row=e.target.closest('[data-id]');if(!row)return;document.querySelectorAll(`[data-id="${CSS.escape(row.dataset.id)}"]`).forEach(x=>x.classList.toggle('hovered',on));};els.leftGrid.addEventListener('mouseover',e=>hover(e,true));els.leftGrid.addEventListener('mouseout',e=>hover(e,false));els.timelineGrid.addEventListener('mouseover',e=>hover(e,true));els.timelineGrid.addEventListener('mouseout',e=>hover(e,false));
}
for(const el of [els.search,els.planFilter,els.zoneFilter,els.disciplineFilter,els.basisFilter,els.timingFilter,els.scopeFilter,els.criticalOnly,els.networkOnly])el.addEventListener(el===els.search?'input':'change',render);
els.linkMode.addEventListener('change',renderDependencyLinks);els.zoom.addEventListener('change',()=>{pxDay=Number(els.zoom.value);document.documentElement.style.setProperty('--px-day',`${pxDay}px`);render();});els.resetFilters.addEventListener('click',()=>{els.search.value='';els.planFilter.value='';els.zoneFilter.value='';els.disciplineFilter.value='';els.basisFilter.value='';els.timingFilter.value='';els.scopeFilter.value='';els.criticalOnly.checked=false;els.networkOnly.checked=false;els.linkMode.value='driving';render();});els.drawerClose.addEventListener('click',()=>{els.drawer.classList.remove('open');els.drawer.setAttribute('aria-hidden','true');});els.exportCsv.addEventListener('click',()=>downloadText('master-schedule-thai-v0.8.csv',masterCSV(),'text/csv;charset=utf-8'));els.exportJson.addEventListener('click',()=>downloadText('master-schedule-thai-v0.8.json',JSON.stringify(masterSchedule,null,2),'application/json;charset=utf-8'));
initFilters();bindRowEvents();render();
