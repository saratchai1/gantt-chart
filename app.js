import { masterSchedule, scheduleStats, validation, masterCSV } from './src/build-schedule.js';
import { downloadText } from './src/schedule-core.js';

const planNames = {
  '01':'แผนการดำเนินการโครงการ / Physical Delivery',
  '02':'แผนงบประมาณ / Payment & Commercial',
  '03':'แผนการจัดการสถานที่ / Site Management',
  '04':'แผนอัตรากำลัง / Workforce',
  '05':'แผนการใช้เครื่องจักร / Plant',
  '06':'แผนการจัดหาวัสดุ / Procurement',
  '07':'แผนควบคุมคุณภาพ / QA/QC',
  '08':'แผนความปลอดภัย อาชีวอนามัย / HSE',
  '09':'แผนจราจร / Traffic',
  '10':'แผนสิ่งแวดล้อม / Environment',
  '11':'แผนบริหารเอกสารอัตโนมัติ / CDE-EDMS',
  '12':'แผนติดตามความก้าวหน้า / Project Controls',
  '13':'แผน BIM / Digital Twin',
  '14':'แผน Application / AI',
  '15':'แผน Carbon Footprint',
  '16':'แผนป้องกันผลกระทบต่อมรดกโลก / Heritage'
};

const els = Object.fromEntries([
  'metrics','search','planFilter','zoneFilter','disciplineFilter','basisFilter','criticalOnly','zoom','resetFilters',
  'timelineHead','leftGrid','timelineGrid','drawer','drawerContent','drawerClose','exportCsv','exportJson'
].map(id => [id, document.getElementById(id)]));

let pxDay = Number(els.zoom.value);
const collapsedPlans = new Set();
const collapsedAreas = new Set();

const esc = s => String(s ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[ch]));
const nfmt = n => new Intl.NumberFormat('en-US').format(n);

function initFilters() {
  for (const p of Object.keys(planNames)) {
    const opt = document.createElement('option'); opt.value=p; opt.textContent=`${p} — ${planNames[p]}`; els.planFilter.append(opt);
  }
  const zones=[...new Set(masterSchedule.map(r=>r.zone).filter(Boolean))].sort();
  for (const z of zones) { const o=document.createElement('option'); o.value=z; o.textContent=z; els.zoneFilter.append(o); }
  const discs=[...new Set(masterSchedule.map(r=>r.discipline).filter(Boolean))].sort((a,b)=>a.localeCompare(b));
  for (const d of discs) { const o=document.createElement('option'); o.value=d; o.textContent=d; els.disciplineFilter.append(o); }
}

function renderMetrics(filteredCount = masterSchedule.length) {
  const sourceCount = masterSchedule.filter(r=>r.basis_type==='SOURCE').length;
  const assumptionCount = masterSchedule.filter(r=>r.basis_type==='ASSUMPTION').length;
  const hard = validation.structure_errors.length + validation.dependency_cycles.length;
  const metrics=[
    ['Activities',nfmt(masterSchedule.length),`${nfmt(filteredCount)} shown`,''],
    ['Milestones',nfmt(scheduleStats.milestones),'zero-duration gates',''],
    ['Critical candidates',nfmt(scheduleStats.critical),'proposal baseline candidates',''],
    ['SOURCE rows',nfmt(sourceCount),'direct source constraints / activities',''],
    ['ASSUMPTION rows',nfmt(assumptionCount),'replace at contract baseline','warn'],
    ['Validation',hard ? 'FAIL' : 'PASS',`${validation.temporal_logic_warnings.length} temporal advisories`,hard?'warn':'ok']
  ];
  els.metrics.innerHTML=metrics.map(([k,v,s,c])=>`<div class="metric ${c}"><div class="k">${esc(k)}</div><div class="v">${esc(v)}</div><div class="s">${esc(s)}</div></div>`).join('');
}

function filteredRows() {
  const q=els.search.value.trim().toLowerCase();
  return masterSchedule.filter(r=>{
    if (els.planFilter.value && r.plan_no!==els.planFilter.value) return false;
    if (els.zoneFilter.value && r.zone!==els.zoneFilter.value) return false;
    if (els.disciplineFilter.value && r.discipline!==els.disciplineFilter.value) return false;
    if (els.basisFilter.value && r.basis_type!==els.basisFilter.value) return false;
    if (els.criticalOnly.checked && r.critical!=='Y') return false;
    if (q) {
      const hay=[r.activity_id,r.wbs,r.activity_name,r.building_area,r.discipline,r.responsible_party,r.deliverable_evidence,r.source_reference].join(' ').toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
}

function span(rows) {
  if (!rows.length) return [1,1];
  return [Math.min(...rows.map(r=>r.start_day)),Math.max(...rows.map(r=>r.finish_day))];
}

function makeTimelineHeader() {
  const width=1200*pxDay;
  els.timelineHead.style.width=`${width}px`;
  els.timelineHead.style.minWidth=`${width}px`;
  els.timelineHead.innerHTML='';
  for(let m=1;m<=40;m++){
    const s=(m-1)*30+1,e=m*30;
    const c=document.createElement('div');
    c.className='month-cell'; c.style.flex=`0 0 ${30*pxDay}px`; c.style.width=`${30*pxDay}px`;
    c.innerHTML=`<b>M${m}</b><span>D${s}–${e}</span>`; els.timelineHead.append(c);
  }
  els.timelineGrid.style.width=`${width}px`; els.timelineGrid.style.minWidth=`${width}px`;
  els.timelineGrid.style.backgroundImage='linear-gradient(to right,#e2e7ee 1px,transparent 1px)';
  els.timelineGrid.style.backgroundSize=`${30*pxDay}px 100%`;
}

function basisChip(row){
  const c=row.basis_type.toLowerCase();
  return `<b class="basis ${c} row-chip">${esc(row.basis_type)}</b>`;
}

function leftTask(row) {
  const div=document.createElement('div');
  div.className=`lrow ${row.critical==='Y'?'critical-task':''}`;
  div.dataset.id=row.activity_id;
  div.innerHTML=`
    <div class="cell">${esc(row.wbs)}</div>
    <div class="cell name"><div><div class="title">${esc(row.activity_name)} ${basisChip(row)}</div><div class="sub">${esc(row.activity_id)} · ${esc(row.building_area)} · ${esc(row.discipline)}</div></div></div>
    <div class="cell">${row.milestone==='Y'?'MS':esc(row.duration_days+'d')}</div>
    <div class="cell">D${row.start_day}–${row.finish_day}</div>`;
  return div;
}

function timeTask(row) {
  const div=document.createElement('div'); div.className='trow'; div.dataset.id=row.activity_id;
  const x=(row.start_day-1)*pxDay;
  if(row.milestone==='Y'){
    const m=document.createElement('div'); m.className=`milestone-mark ${row.critical==='Y'?'critical':''}`; m.style.left=`${Math.max(0,x-6)}px`; m.title=`${row.activity_id} · D${row.start_day} · ${row.activity_name}`; div.append(m);
  } else {
    const bar=document.createElement('div'); bar.className=`bar ${row.basis_type.toLowerCase()} ${row.critical==='Y'?'critical':''}`;
    bar.style.left=`${x}px`; bar.style.width=`${Math.max(3,row.duration_days*pxDay)}px`;
    bar.title=`${row.activity_id} · D${row.start_day}–D${row.finish_day} · ${row.activity_name}`; div.append(bar);
  }
  return div;
}

function groupRows({type,key,label,rows,collapsed}) {
  const [s,e]=span(rows);
  const l=document.createElement('div'); l.className=type==='plan'?'plan-row':'area-row'; l.dataset.toggleKey=key; l.dataset.toggleType=type;
  l.innerHTML=`<div class="cell"><span class="toggle">${collapsed?'▸':'▾'}</span>${type==='plan'?esc(key.replace('plan-','')):''}</div><div class="cell">${esc(label)}</div><div class="cell">${rows.length}</div><div class="cell">D${s}–${e}</div>`;
  const t=document.createElement('div'); t.className=`tgroup ${type==='area'?'area':''}`; t.dataset.toggleKey=key; t.dataset.toggleType=type;
  const bar=document.createElement('div'); bar.className='summary-bar'; bar.style.left=`${(s-1)*pxDay}px`; bar.style.width=`${Math.max(3,(e-s+1)*pxDay)}px`; t.append(bar);
  return [l,t];
}

function render() {
  const rows=filteredRows(); renderMetrics(rows.length); makeTimelineHeader();
  els.leftGrid.innerHTML=''; els.timelineGrid.innerHTML='';
  if(!rows.length){ els.leftGrid.innerHTML='<div class="empty">ไม่พบกิจกรรมตามตัวกรอง</div>'; return; }
  const byPlan=new Map();
  for(const r of rows){ if(!byPlan.has(r.plan_no)) byPlan.set(r.plan_no,[]); byPlan.get(r.plan_no).push(r); }
  for(const [plan,planRows] of [...byPlan.entries()].sort((a,b)=>Number(a[0])-Number(b[0]))) {
    const pkey=`plan-${plan}`, pcoll=collapsedPlans.has(pkey);
    const [pl,pt]=groupRows({type:'plan',key:pkey,label:`Plan ${plan} — ${planNames[plan] || ''}`,rows:planRows,collapsed:pcoll}); els.leftGrid.append(pl); els.timelineGrid.append(pt);
    if(pcoll) continue;
    const byArea=new Map();
    for(const r of planRows){ const a=r.building_area || 'Project-wide'; if(!byArea.has(a)) byArea.set(a,[]); byArea.get(a).push(r); }
    for(const [area,areaRows] of byArea) {
      const akey=`${pkey}|${area}`, acoll=collapsedAreas.has(akey);
      const [al,at]=groupRows({type:'area',key:akey,label:area,rows:areaRows,collapsed:acoll}); els.leftGrid.append(al); els.timelineGrid.append(at);
      if(acoll) continue;
      for(const row of areaRows) { els.leftGrid.append(leftTask(row)); els.timelineGrid.append(timeTask(row)); }
    }
  }
}

function showDetail(id) {
  const r=masterSchedule.find(x=>x.activity_id===id); if(!r) return;
  const preds=(r.predecessors||[]).map(p=>`${p.id} [${p.relationship}${p.lagDays?` +${p.lagDays}d`:''}]`).join('<br>') || '—';
  const temporal=validation.temporal_logic_warnings.filter(w=>w.successor===id);
  els.drawerContent.innerHTML=`
    <div class="eyebrow" style="color:#52708d">PLAN ${esc(r.plan_no)} · ${esc(r.zone)}</div>
    <h2>${esc(r.activity_name)}</h2>
    <div class="idline">${esc(r.activity_id)} · WBS ${esc(r.wbs)} ${basisChip(r)}</div>
    <dl class="detail-grid">
      <dt>Building / Area</dt><dd>${esc(r.building_area)}</dd>
      <dt>Discipline</dt><dd>${esc(r.discipline)}</dd>
      <dt>Project days</dt><dd>D${r.start_day}–D${r.finish_day} · ${r.duration_days}${r.milestone==='Y'?' (milestone)':' days'}</dd>
      <dt>Critical</dt><dd>${r.critical==='Y'?'YES — proposal critical candidate':'No'}</dd>
      <dt>Predecessors</dt><dd class="pred">${preds}</dd>
      <dt>Responsible</dt><dd>${esc(r.responsible_party || '—')}</dd>
      <dt>Installments</dt><dd>${r.installment_start?`${esc(r.installment_start)}–${esc(r.installment_end || r.installment_start)}`:'—'}</dd>
      <dt>Deliverable / evidence</dt><dd>${esc(r.deliverable_evidence || '—')}</dd>
      <dt>Basis</dt><dd>${esc(r.basis_type)}</dd>
      <dt>Source reference</dt><dd>${esc(r.source_reference || '—')}</dd>
      <dt>Notes</dt><dd>${esc(r.notes || '—')}</dd>
    </dl>
    ${temporal.length?`<div class="validation-list"><b>Temporal logic advisory</b><br>${temporal.map(w=>`${esc(w.predecessor)} ${esc(w.relationship)} → ${esc(w.successor)}; ${esc(w.expected)}`).join('<br>')}</div>`:''}`;
  els.drawer.classList.add('open'); els.drawer.setAttribute('aria-hidden','false');
}

function bindRowEvents() {
  const onClick=e=>{
    const toggle=e.target.closest('[data-toggle-key]');
    if(toggle){
      const {toggleKey,toggleType}=toggle.dataset;
      const set=toggleType==='plan'?collapsedPlans:collapsedAreas;
      set.has(toggleKey)?set.delete(toggleKey):set.add(toggleKey); render(); return;
    }
    const row=e.target.closest('[data-id]'); if(row) showDetail(row.dataset.id);
  };
  els.leftGrid.addEventListener('click',onClick); els.timelineGrid.addEventListener('click',onClick);
  const hover=(e,on)=>{const row=e.target.closest('[data-id]'); if(!row)return; document.querySelectorAll(`[data-id="${CSS.escape(row.dataset.id)}"]`).forEach(x=>x.classList.toggle('hovered',on));};
  els.leftGrid.addEventListener('mouseover',e=>hover(e,true)); els.leftGrid.addEventListener('mouseout',e=>hover(e,false));
  els.timelineGrid.addEventListener('mouseover',e=>hover(e,true)); els.timelineGrid.addEventListener('mouseout',e=>hover(e,false));
}

for(const el of [els.search,els.planFilter,els.zoneFilter,els.disciplineFilter,els.basisFilter,els.criticalOnly]) el.addEventListener(el===els.search?'input':'change',render);
els.zoom.addEventListener('change',()=>{pxDay=Number(els.zoom.value); document.documentElement.style.setProperty('--px-day',`${pxDay}px`); render();});
els.resetFilters.addEventListener('click',()=>{els.search.value='';els.planFilter.value='';els.zoneFilter.value='';els.disciplineFilter.value='';els.basisFilter.value='';els.criticalOnly.checked=false;render();});
els.drawerClose.addEventListener('click',()=>{els.drawer.classList.remove('open');els.drawer.setAttribute('aria-hidden','true');});
els.exportCsv.addEventListener('click',()=>downloadText('master-schedule.csv',masterCSV(),'text/csv;charset=utf-8'));
els.exportJson.addEventListener('click',()=>downloadText('master-schedule.json',JSON.stringify(masterSchedule,null,2),'application/json;charset=utf-8'));

initFilters(); bindRowEvents(); render();
