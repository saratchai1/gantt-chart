// Central post-build normalization layer.
// Proposal-level assumptions are centralized here so they can be reviewed and
// replaced later without mixing them with source-derived WBS construction logic.

function refresh(row) {
  row.duration_days = row.milestone === 'Y' ? 0 : row.finish_day - row.start_day + 1;
  row.predecessor = row.predecessors.map(p => p.id).join(';');
  row.relationship = row.predecessors.map(p => p.relationship).join(';');
  row.lag_days = row.predecessors.map(p => p.lagDays || 0).join(';');
}

function setWindow(row, start, finish = start) {
  row.start_day = start;
  row.finish_day = row.milestone === 'Y' ? start : finish;
  refresh(row);
}

function replacePred(row, oldId, newId) {
  row.predecessors = row.predecessors.map(p => p.id === oldId ? { ...p, id: newId } : p);
  refresh(row);
}

function setRelationship(row, predecessorId, relationship, lagDays = 0) {
  row.predecessors = row.predecessors.map(p => p.id === predecessorId ? { id:p.id, relationship, lagDays } : p);
  refresh(row);
}

function groupPrefix(id) {
  const m=id.match(/^(P01-(?:A23|A24|A25|A26|A29|B31|B32|C41|C42A|C42B|C42C|C43))-/);
  return m?.[1] || null;
}

export function normalizeSchedule(rows) {
  const byId = new Map(rows.map(r => [r.activity_id, r]));

  // ------------------------------------------------------------------
  // Area D heritage release must occur BEFORE the integrated D workfront
  // release (D281–300), not concurrently with it.
  // ------------------------------------------------------------------
  const heritagePermit = byId.get('P16-HER-D-PERMIT');
  if (heritagePermit) setWindow(heritagePermit, 270, 280);

  // ------------------------------------------------------------------
  // Procurement proposal allowances.
  // Source documents define the workflow but do not prescribe these detailed
  // vendor lead times. They remain ASSUMPTION until vendor-confirmed dates exist.
  // ------------------------------------------------------------------
  const familyWindows = {
    STR: {
      '01':[31,51], '02':[46,75], '03':[90,90], '04':[60,105], '05':[110,110],
      '06':[111,180], '07':[156,180], '08':[181,195], '09':[196,209], '10':[210,210]
    },
    ARC: {
      '01':[60,80], '02':[75,135], '03':[150,150], '04':[120,165], '05':[170,170],
      '06':[171,300], '07':[276,300], '08':[301,315], '09':[316,329], '10':[330,330]
    },
    MEP: {
      '01':[60,80], '02':[75,135], '03':[150,150], '04':[120,175], '05':[180,180],
      '06':[181,360], '07':[336,360], '08':[361,375], '09':[376,399], '10':[400,400]
    },
    ICT: {
      '01':[100,120], '02':[115,205], '03':[220,220], '04':[190,245], '05':[250,250],
      '06':[251,450], '07':[426,450], '08':[451,470], '09':[471,499], '10':[500,500]
    },
    LAND: {
      '01':[140,160], '02':[155,205], '03':[220,220], '04':[190,235], '05':[240,240],
      '06':[241,280], '07':[256,280], '08':[281,289], '09':[290,299], '10':[300,300]
    },
    D: {
      '01':[180,200], '02':[195,245], '03':[260,260], '04':[230,275], '05':[280,280],
      '06':[281,360], '07':[336,360], '08':[361,375], '09':[376,399], '10':[400,400]
    }
  };

  for (const [family, steps] of Object.entries(familyWindows)) {
    for (const [step, [s,e]] of Object.entries(steps)) {
      const row = byId.get(`P06-${family}-${step}`);
      if (!row) continue;
      setWindow(row, s, e);
      if (row.basis_type !== 'SOURCE') row.basis_type = 'ASSUMPTION';
      row.notes = `${row.notes ? row.notes + ' | ' : ''}Proposal planning allowance; replace with approved/vendor-confirmed dates.`;
    }
  }

  // ------------------------------------------------------------------
  // External works use standard civil/utility material releases rather than
  // the long-lead building-equipment release. Area-D packages use the special
  // low-impact material chain. Softscape remains linked to landscape material.
  // ------------------------------------------------------------------
  for (const row of rows) {
    if (!row.activity_id.startsWith('P01-')) continue;
    const isExternal = /-(A21|A22|A27|A28|B33|B34|D51|D52|D53|D54)-/.test(row.activity_id);
    if (!isExternal) continue;
    const isAreaD = row.activity_id.includes('-D5');
    if (row.activity_id.endsWith('-UTIL')) replacePred(row, 'P06-MEP-10', isAreaD ? 'P06-D-10' : 'P06-STR-10');
    if (row.activity_id.endsWith('-PAVE')) replacePred(row, isAreaD ? 'P06-D-10' : 'P06-LAND-10', isAreaD ? 'P06-D-10' : 'P06-STR-10');
  }

  // ------------------------------------------------------------------
  // Integrated site-release windows.
  // ------------------------------------------------------------------
  const aRel = byId.get('P03-SITE-A-REL');
  if (aRel) setWindow(aRel, 165, 180);
  const dRel = byId.get('P03-SITE-D-REL');
  if (dRel) setWindow(dRel, 281, 300);
  const mainRel = byId.get('P01-PRE-REL');
  if (mainRel) setWindow(mainRel, 181, 181);

  // ------------------------------------------------------------------
  // Building-package logic repairs.
  // The physical generator deliberately creates staggered proposal windows.
  // Relationships below express rolling-workfront logic rather than falsely
  // requiring an entire predecessor trade to finish across the whole building.
  // ------------------------------------------------------------------
  const buildingGroups = new Map();
  for (const row of rows) {
    const prefix=groupPrefix(row.activity_id);
    if (!prefix) continue;
    if (!buildingGroups.has(prefix)) buildingGroups.set(prefix, []);
    buildingGroups.get(prefix).push(row);
  }

  for (const [prefix, group] of buildingGroups) {
    const get=suffix=>byId.get(`${prefix}-${suffix}`);
    const rel=get('REL'), ho=get('HO');
    if (!rel || !ho) continue;
    const S=rel.start_day, F=ho.finish_day, span=Math.max(20,F-S);

    // Rolling zones: survey→excavation, excavation→blinding, partitions→finishes.
    if (get('EXC')) setRelationship(get('EXC'), `${prefix}-SUR`, 'SS', Math.max(1,Math.round(span*0.03)));
    if (get('BLI')) setRelationship(get('BLI'), `${prefix}-EXC`, 'SS', Math.max(1,Math.round(span*0.07)));
    if (get('WFIN')) setRelationship(get('WFIN'), `${prefix}-PART`, 'SS', Math.max(1,Math.round(span*0.13)));

    // Commissioning is kept sequential at the system-completion end of each package.
    const pre=get('PRECOM'), func=get('FUNC'), comm=get('COMM'), snag=get('SNAG'), corr=get('CORR'), asb=get('ASB');
    if (pre && func && comm && snag && corr) {
      const preEnd=Math.min(F-14, Math.max(pre.finish_day, S+Math.round(span*0.93)));
      if (pre.finish_day < preEnd) setWindow(pre, pre.start_day, preEnd);
      const funcStart=pre.finish_day+1;
      const funcEnd=Math.min(F-9, Math.max(funcStart, S+Math.round(span*0.96)));
      setWindow(func, funcStart, funcEnd);
      const commStart=func.finish_day+1;
      const commEnd=Math.min(F-5, Math.max(commStart, S+Math.round(span*0.98)));
      setWindow(comm, commStart, commEnd);
      setWindow(snag, Math.max(comm.start_day, F-9), Math.min(F-4, Math.max(comm.start_day,F-4)));
      setRelationship(snag, `${prefix}-COMM`, 'SS', 0);
      setWindow(corr, Math.min(F-3,snag.finish_day+1), F-1);
      if (asb) setWindow(asb, asb.start_day, Math.min(F-1,Math.max(asb.start_day,asb.finish_day)));
    }
  }

  // ------------------------------------------------------------------
  // External / landscape rolling-workfront relationships.
  // ------------------------------------------------------------------
  for (const row of rows) {
    const m=row.activity_id.match(/^(P01-(?:A21|A22|A27|A28|B33|B34|D51|D52|D53|D54))-(.+)$/);
    if (!m) continue;
    const [,,suffix]=m;
    const prefix=m[1];
    if (suffix==='EW') setRelationship(row, `${prefix}-CTRL`, 'SS', 0);
    if (suffix==='PAVE') setRelationship(row, `${prefix}-BASE`, 'SS', 0);
    if (suffix==='SOFT') setRelationship(row, `${prefix}-SOIL`, 'SS', 0);
    if (suffix==='MON') setRelationship(row, `${prefix}-CTRL`, 'SS', 0);
    if (suffix==='FIN') setRelationship(row, `${prefix}-REST`, 'SS', 0);
  }

  // ------------------------------------------------------------------
  // Raw-water pontoon rolling-workfront + end-testing sequence.
  // ------------------------------------------------------------------
  const pontoonRepairs = [
    ['P01-D55-ACC','P01-D55-RES','SS'],
    ['P01-D55-PONT','P01-D55-LIFT','SS']
  ];
  for (const [succ,pred,relType] of pontoonRepairs) if(byId.get(succ)) setRelationship(byId.get(succ),pred,relType,0);
  const pontPre=byId.get('P01-D55-PRE'), pontFunc=byId.get('P01-D55-FUNC'), pontHo=byId.get('P01-D55-HO');
  if (pontPre && pontFunc && pontHo) {
    const ele=byId.get('P01-D55-ELE');
    if (ele && pontPre.start_day <= ele.finish_day) setWindow(pontPre, ele.finish_day+1, Math.max(ele.finish_day+8,pontPre.finish_day));
    if (pontFunc.start_day <= pontPre.finish_day) setWindow(pontFunc, pontPre.finish_day+1, Math.min(pontHo.start_day-4,Math.max(pontPre.finish_day+8,pontFunc.finish_day)));
  }

  for (const row of rows) refresh(row);
  return rows;
}
