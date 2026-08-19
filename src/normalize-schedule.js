// Central post-build normalization layer.
// It exists so proposal-level assumptions can be reviewed and changed in one place
// without mixing them with source-derived WBS construction logic.

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

export function normalizeSchedule(rows) {
  const byId = new Map(rows.map(r => [r.activity_id, r]));

  // ------------------------------------------------------------------
  // Area D heritage release must occur BEFORE the integrated D workfront
  // release (D291–300), not concurrently with it.
  // ------------------------------------------------------------------
  const heritagePermit = byId.get('P16-HER-D-PERMIT');
  if (heritagePermit) setWindow(heritagePermit, 270, 280);

  // ------------------------------------------------------------------
  // Procurement proposal allowances.
  // The source defines the workflow but does not prescribe these detailed
  // lead times. These dates therefore remain ASSUMPTION and are deliberately
  // centralized here for later replacement by vendor-confirmed dates.
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
      if (row) {
        setWindow(row, s, e);
        row.basis_type = row.basis_type === 'SOURCE' ? 'SOURCE' : 'ASSUMPTION';
        row.notes = `${row.notes ? row.notes + ' | ' : ''}Proposal planning allowance; replace with approved/vendor-confirmed dates.`;
      }
    }
  }

  // ------------------------------------------------------------------
  // External works use ordinary civil/utility material releases rather than
  // the long-lead MEP equipment release. Softscape uses landscape release.
  // Area-D trail/landscape packages use the Area-D special-material release.
  // ------------------------------------------------------------------
  for (const row of rows) {
    if (!row.activity_id.startsWith('P01-')) continue;
    const isExternal = /-(A21|A22|A27|A28|B33|B34|D51|D52|D53|D54)-/.test(row.activity_id);
    if (!isExternal) continue;
    const isAreaD = row.activity_id.includes('-D5');
    if (row.activity_id.endsWith('-UTIL')) replacePred(row, 'P06-MEP-10', isAreaD ? 'P06-D-10' : 'P06-STR-10');
    if (row.activity_id.endsWith('-PAVE')) replacePred(row, isAreaD ? 'P06-D-10' : 'P06-LAND-10', isAreaD ? 'P06-D-10' : 'P06-STR-10');
    if (row.activity_id.endsWith('-SOFT')) replacePred(row, isAreaD ? 'P06-D-10' : 'P06-LAND-10', isAreaD ? 'P06-D-10' : 'P06-LAND-10');
  }

  // Early Area-A workfront is controlled by the source CP-02 / CP-03 windows.
  // Keep its integrated release before physical D181 start.
  const aRel = byId.get('P03-SITE-A-REL');
  if (aRel) setWindow(aRel, 165, 180);

  // Because Plan 03 is an integrated gate, make Area D release explicitly
  // follow the earlier heritage permit while retaining D301 physical start.
  const dRel = byId.get('P03-SITE-D-REL');
  if (dRel) setWindow(dRel, 281, 300);

  for (const row of rows) refresh(row);
  return rows;
}
