import { addTask, fs } from './schedule-core.js';

function refresh(row) {
  if (!row) return;
  row.duration_days = row.milestone === 'Y' ? 0 : row.finish_day - row.start_day + 1;
  row.predecessor = (row.predecessors || []).map(p => p.id).join(';');
  row.relationship = (row.predecessors || []).map(p => p.relationship).join(';');
  row.lag_days = (row.predecessors || []).map(p => p.lagDays || 0).join(';');
}

function addPred(row, pred) {
  if (!row) return;
  const existing = (row.predecessors || []).findIndex(p => p.id === pred.id);
  if (existing >= 0) row.predecessors[existing] = pred;
  else row.predecessors.push(pred);
  refresh(row);
}

function removePred(row, id) {
  if (!row) return;
  row.predecessors = (row.predecessors || []).filter(p => p.id !== id);
  refresh(row);
}

function addNote(row, text) {
  if (!row || !text) return;
  if (!String(row.notes || '').includes(text)) row.notes = `${row.notes ? row.notes + ' | ' : ''}${text}`;
}

/**
 * Integrate the already-built detailed packages into one project-completion
 * network. This layer deliberately does NOT regenerate the WBS or physical
 * bars. It adds source-window control gates and downstream completion links so
 * that the existing detailed work can be traced to the D1200 acceptance node.
 */
export function applyNetworkIntegrationV3(rows) {
  const has = id => rows.some(r => r.activity_id === id);

  // ------------------------------------------------------------------
  // Source CP-05 / CP-06 boundary gates.
  // Plan 1 explicitly states the D421-D840 and D301-D960 control windows.
  // The milestones below are derived audit points at those stated window
  // finishes; their detailed package composition remains proposal logic.
  // ------------------------------------------------------------------
  if (!has('P01-CP05-GATE')) {
    addTask({
      id:'P01-CP05-GATE', wbs:'01.2.98', plan:1, zone:'A', area:'Area A', discipline:'CP Control',
      name:'CP-05 Area A architecture / MEP completion boundary gate',
      startDay:840, milestone:true, critical:true,
      predecessors:[
        fs('P01-A23-HO'), fs('P01-A24-HO'), fs('P01-A25-HO'),
        fs('P01-A26-HO'), fs('P01-A29-HO')
      ],
      responsible:'Project Manager + Area A Discipline Leads', installmentStart:53, installmentEnd:317,
      deliverable:'Area A building / MEP completion evidence for CP-05 transition',
      basis:'DERIVED', timingBasis:'SOURCE', source:'Plan 1 CP-05 — D421-D840',
      notes:'D840 boundary is source-stated. Package-to-gate composition is proposal integration logic.'
    });
  }

  if (!has('P01-CP06-GATE')) {
    addTask({
      id:'P01-CP06-GATE', wbs:'01.5.98', plan:1, zone:'B/C/D', area:'Areas B/C/D + External Systems', discipline:'CP Control',
      name:'CP-06 Areas B/C/D and external-systems completion boundary gate',
      startDay:960, milestone:true, critical:true,
      predecessors:[
        fs('P01-A21-HO'), fs('P01-A22-HO'), fs('P01-A27-HO'),
        fs('P01-B31-HO'), fs('P01-B32-HO'), fs('P01-B33-HO'), fs('P01-B34-HO'),
        fs('P01-C41-HO'), fs('P01-C42A-HO'), fs('P01-C42B-HO'), fs('P01-C42C-HO'), fs('P01-C43-HO'),
        fs('P01-D51-HO'), fs('P01-D52-HO'), fs('P01-D53-HO')
      ],
      responsible:'Project Manager + Area / Systems Leads', installmentStart:318, installmentEnd:480,
      deliverable:'Area B/C/D and external-systems completion evidence for CP-06 transition',
      basis:'DERIVED', timingBasis:'SOURCE', source:'Plan 1 CP-06 — D301-D960',
      notes:'D960 boundary is source-stated. The raw-water pontoon and late landscape integration remain within the overlapping CP-07 closeout window in this proposal baseline.'
    });
  }

  const byId = new Map(rows.map(r => [r.activity_id, r]));

  // ------------------------------------------------------------------
  // Package internal convergence.
  // The original detailed generator intentionally exposed parallel envelope,
  // finish, furniture, external-work and specialist branches. A professional
  // handover milestone must wait for those branches as well as commissioning /
  // punch / as-built. Adding the links here preserves every existing bar while
  // closing logic gaps that would otherwise leave completed work outside the
  // final CPM network.
  // ------------------------------------------------------------------
  const buildingPrefixes = [
    'P01-A23','P01-A24','P01-A25','P01-A26','P01-A29',
    'P01-B31','P01-B32','P01-C41','P01-C42A','P01-C42B','P01-C42C','P01-C43'
  ];
  for (const prefix of buildingPrefixes) {
    const ho = byId.get(`${prefix}-HO`);
    if (!ho) continue;
    for (const suffix of ['ENV','DRW','FLR','PNT','FURN','EXT']) {
      const id = `${prefix}-${suffix}`;
      if (byId.has(id)) addPred(ho, { id, relationship:'FS', lagDays:0 });
    }
    for (const row of rows) {
      if (row.activity_id.startsWith(`${prefix}-EX`)) addPred(ho, { id:row.activity_id, relationship:'FS', lagDays:0 });
    }
    addNote(ho, 'V3 package completion gate: envelope, architectural finish, furniture/external and specialist branches must be complete before package handover.');
  }

  const externalPrefixes = ['P01-A21','P01-A22','P01-A27','P01-A28','P01-B33','P01-B34','P01-D51','P01-D52','P01-D53','P01-D54'];
  for (const prefix of externalPrefixes) {
    const ho = byId.get(`${prefix}-HO`);
    if (!ho) continue;
    for (const suffix of ['FURN','MON']) {
      const id = `${prefix}-${suffix}`;
      if (byId.has(id)) addPred(ho, { id, relationship:'FS', lagDays:0 });
    }
    addNote(ho, 'V3 external-work completion gate: site furniture/signage and monitoring records close before area handover.');
  }

  // ------------------------------------------------------------------
  // CP-07 project-wide physical convergence.
  // ------------------------------------------------------------------
  const cp07 = byId.get('P01-CO-001');
  if (cp07) {
    // Replace the earlier direct A23/D53 summary links by explicit source
    // boundary gates. CP-07 starts after CP-05 and must finish 120 days after
    // the source CP-06 D960 boundary to retain the source D841-D1080 envelope.
    removePred(cp07, 'P01-A23-HO');
    removePred(cp07, 'P01-D53-HO');
    addPred(cp07, { id:'P01-CP05-GATE', relationship:'FS', lagDays:1 });
    addPred(cp07, { id:'P01-CP06-GATE', relationship:'FF', lagDays:120 });

    // FF links allow the CP-07 landscape / detail / integration window to run
    // concurrently but prohibit it from completing before any individual
    // physical package handover.
    const physicalHandovers = [
      'P01-A21-HO','P01-A22-HO','P01-A23-HO','P01-A24-HO','P01-A25-HO','P01-A26-HO','P01-A27-HO','P01-A28-HO','P01-A29-HO',
      'P01-B31-HO','P01-B32-HO','P01-B33-HO','P01-B34-HO',
      'P01-C41-HO','P01-C42A-HO','P01-C42B-HO','P01-C42C-HO','P01-C43-HO',
      'P01-D51-HO','P01-D52-HO','P01-D53-HO','P01-D54-HO','P01-D55-HO'
    ];
    for (const id of physicalHandovers) if (byId.has(id)) addPred(cp07, { id, relationship:'FF', lagDays:0 });
    addNote(cp07, 'V3 integration: all detailed Plan-01 physical package handovers converge on CP-07 completion; CP-05/CP-06 source-window gates control the source critical narrative.');
  }

  // ------------------------------------------------------------------
  // Closeout evidence convergence across Plans 3-16.
  // These are completion/FF interfaces because the closeout control windows
  // operate concurrently with the underlying demobilization and restoration.
  // ------------------------------------------------------------------
  const restoration = byId.get('P01-CO-004');
  for (const id of ['P03-SITE-DEMOB','P05-PLT-DEMOB','P09-TRF-REST','P10-ENV-REST','P16-HER-REST']) {
    if (byId.has(id)) addPred(restoration, { id, relationship:'FF', lagDays:0 });
  }
  addNote(restoration, 'Final restoration acceptance cannot finish before site, plant, traffic, environment and heritage restoration streams are complete.');

  const documentation = byId.get('P01-CO-003');
  if (byId.has('P14-AI-009')) addPred(documentation, { id:'P14-AI-009', relationship:'FF', lagDays:0 });
  addNote(documentation, 'Digital application/AI system-data export and handover is reconciled inside the final controlled information package.');

  const readiness = byId.get('P01-CO-005');
  if (byId.has('P14-AI-009')) addPred(readiness, { id:'P14-AI-009', relationship:'FS', lagDays:0 });
  if (byId.has('P02-COM-FTC')) addPred(readiness, { id:'P02-COM-FTC', relationship:'FS', lagDays:0 });
  addNote(readiness, 'Final readiness includes digital-system handover and final forecast/cost reconciliation in addition to QA, BIM, carbon and closeout evidence.');

  const finalAcceptance = byId.get('P01-CO-006');
  for (const id of ['P11-CDE-CO','P12-PRG-CO']) {
    if (byId.has(id)) addPred(finalAcceptance, { id, relationship:'FS', lagDays:0 });
  }
  addNote(finalAcceptance, 'D1200 acceptance is downstream of the controlled-document archive cycle and final progress/closeout reconciliation dataset.');

  for (const row of rows) refresh(row);
  return rows;
}
