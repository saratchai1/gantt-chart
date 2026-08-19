// Logic-driven float analysis over the proposal baseline network.
// The detailed bar positions are planning dates; this module calculates how much
// each predecessor can slip within the current logic/date arrangement before it
// affects the final D1200 acceptance milestone.

function edgeSlack(pred, succ, link) {
  const lag = Number(link.lagDays || 0);
  switch (link.relationship || 'FS') {
    case 'FS': {
      const dayStep = pred.milestone === 'Y' || succ.milestone === 'Y' ? 0 : 1;
      return succ.start_day - (pred.finish_day + lag + dayStep);
    }
    case 'SS': return succ.start_day - (pred.start_day + lag);
    case 'FF': return succ.finish_day - (pred.finish_day + lag);
    case 'SF': return succ.finish_day - (pred.start_day + lag);
    default: return Number.POSITIVE_INFINITY;
  }
}

function topoSort(rows) {
  const byId = new Map(rows.map(r => [r.activity_id, r]));
  const indegree = new Map(rows.map(r => [r.activity_id, 0]));
  const successors = new Map(rows.map(r => [r.activity_id, []]));
  for (const succ of rows) {
    for (const link of succ.predecessors || []) {
      if (!byId.has(link.id)) continue;
      indegree.set(succ.activity_id, (indegree.get(succ.activity_id) || 0) + 1);
      successors.get(link.id).push({ succId: succ.activity_id, link });
    }
  }
  const q = rows.filter(r => indegree.get(r.activity_id) === 0).map(r => r.activity_id);
  const order = [];
  for (let i=0;i<q.length;i++) {
    const id=q[i]; order.push(id);
    for (const edge of successors.get(id) || []) {
      const n=(indegree.get(edge.succId) || 0)-1;
      indegree.set(edge.succId,n);
      if(n===0) q.push(edge.succId);
    }
  }
  return { byId, successors, order, acyclic: order.length === rows.length };
}

export function applyCpmAnalysis(rows, finalMilestoneId = 'P01-CO-006') {
  const { byId, successors, order, acyclic } = topoSort(rows);
  if (!acyclic || !byId.has(finalMilestoneId)) {
    for (const r of rows) {
      r.network_to_final = 'N';
      r.computed_free_float_days = '';
      r.computed_total_float_days = '';
      r.computed_critical = 'N';
    }
    return rows;
  }

  // Minimum immediate edge gap = free float in the current scheduled network.
  for (const r of rows) {
    const outs=successors.get(r.activity_id) || [];
    if (!outs.length) r.computed_free_float_days = '';
    else r.computed_free_float_days = Math.min(...outs.map(({succId,link}) => edgeSlack(r,byId.get(succId),link)));
  }

  // Reverse dynamic program to final acceptance. For a node with multiple
  // downstream branches, the tightest path governs its total float.
  const floatToFinal = new Map([[finalMilestoneId,0]]);
  const nextDriving = new Map();
  for (let i=order.length-1;i>=0;i--) {
    const id=order[i];
    if (id===finalMilestoneId) continue;
    const pred=byId.get(id);
    let best=Number.POSITIVE_INFINITY, bestSucc=null;
    for (const {succId,link} of successors.get(id) || []) {
      if (!floatToFinal.has(succId)) continue;
      const s=byId.get(succId);
      const candidate=edgeSlack(pred,s,link)+floatToFinal.get(succId);
      if(candidate < best){best=candidate;bestSucc=succId;}
    }
    if(Number.isFinite(best)){
      floatToFinal.set(id,best);
      nextDriving.set(id,bestSucc);
    }
  }

  for (const r of rows) {
    const tf=floatToFinal.get(r.activity_id);
    r.network_to_final = tf == null ? 'N' : 'Y';
    r.computed_total_float_days = tf == null ? '' : tf;
    r.computed_critical = tf === 0 ? 'Y' : 'N';
    r.driving_successor = nextDriving.get(r.activity_id) || '';
  }

  // Explicit final milestone.
  const final=byId.get(finalMilestoneId);
  final.network_to_final='Y';
  final.computed_total_float_days=0;
  final.computed_critical='Y';

  return rows;
}

export function computedCriticalPath(rows, finalMilestoneId='P01-CO-006') {
  const critical=rows.filter(r=>r.computed_critical==='Y');
  // Return a deterministic tight chain by following a zero-float node's
  // driving successor. There may be multiple parallel zero-float branches;
  // those remain visible via computed_critical=Y on each row.
  const byId=new Map(rows.map(r=>[r.activity_id,r]));
  const predecessorsOfFinal=new Set();
  let start=critical
    .filter(r=>r.activity_id!==finalMilestoneId)
    .sort((a,b)=>a.start_day-b.start_day || a.activity_id.localeCompare(b.activity_id))[0];
  const path=[]; const seen=new Set();
  while(start && !seen.has(start.activity_id)){
    path.push(start.activity_id); seen.add(start.activity_id);
    if(start.activity_id===finalMilestoneId) break;
    start=byId.get(start.driving_successor);
  }
  if(path.at(-1)!==finalMilestoneId && byId.has(finalMilestoneId)) predecessorsOfFinal.add(finalMilestoneId);
  return { zero_float_activities:critical.map(r=>r.activity_id), representative_path:path };
}
