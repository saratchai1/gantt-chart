const SOURCE_REQUIRED='SOURCE_REQUIRED';
const DERIVED_SCOPE='DERIVED_FROM_SCOPE';
const WHERE_APPLICABLE='WHERE_APPLICABLE';
const CONTROL_STREAM='CONTROL_STREAM';

function set(row,status,note){
  if(!row)return;
  row.scope_applicability=status;
  row.scope_note=note;
}

function byPrefix(rows,prefix){
  return rows.filter(r=>r.activity_id.startsWith(`${prefix}-`));
}

function markSuffixes(byId,prefix,suffixes,note){
  for(const suffix of suffixes){
    const row=byId.get(`${prefix}-${suffix}`);
    if(row) set(row,WHERE_APPLICABLE,note);
  }
}

/**
 * Separate schedule-detail provenance from package-scope applicability.
 *
 * basis_type answers "where did this schedulable activity concept come from?"
 * while scope_applicability answers "how firmly is this particular trade/system
 * supported by the current supplied package description?".
 *
 * This module does not delete proposal activities. It flags generic-template
 * trades that need IFC/BOQ/equipment-schedule confirmation so detail is retained
 * without silently turning a planning allowance into a claimed contractual scope.
 */
export function applyScopeApplicabilityV7(rows){
  const byId=new Map(rows.map(r=>[r.activity_id,r]));

  // Controls / enabling / evidence workstreams from Plans 02-16.
  for(const row of rows){
    if(row.plan_no!=='01'){
      set(row,CONTROL_STREAM,'Control, enabling, monitoring, document, commercial or evidence stream integrated from Plans 02–16.');
      continue;
    }

    // Explicit Plan-01 source framework/control rows versus detailed physical
    // decomposition. basis_type remains the authoritative source/derived flag.
    if(row.basis_type==='SOURCE'){
      set(row,SOURCE_REQUIRED,'Plan-01 project/package control requirement or source-stated control window/deliverable.');
    } else {
      set(row,DERIVED_SCOPE,'Detailed schedulable decomposition of the Plan-01 package scope; exact leaf activity/timing is not individually source-stated.');
    }
  }

  const provisionalNote='Proposal coordination allowance retained for completeness; confirm against IFC drawings, BOQ, equipment schedules, approved shop drawings and the commissioning matrix. Delete or replace before contract baseline if the system is not in approved scope.';

  // A24 Restaurant / Cafe: Plan 1 principal description emphasizes structure,
  // architecture and kitchen systems. Generic full-building service trades are
  // kept for proposal coordination but are not claimed as explicitly confirmed.
  markSuffixes(byId,'P01-A24',['MEP1','ELE1','PLB1','HV1','ICT1','SAN','ELE2','HV2','ICT2'],provisionalNote);

  // A25 Meeting / Multipurpose: electrical / communications are principal Plan-1
  // systems. Generic plumbing/HVAC layers remain provisional.
  markSuffixes(byId,'P01-A25',['MEP1','PLB1','HV1','SAN','HV2'],provisionalNote);

  // A26 Water Production: process water and electrical/control interfaces are
  // principal. Generic HVAC/ICT/sanitary fixture layers are provisional.
  markSuffixes(byId,'P01-A26',['HV1','ICT1','SAN','HV2','ICT2'],provisionalNote);

  // B31 Toilet: sanitary is principal; HVAC/ICT and generic electrical scope are
  // retained only pending the approved building-services design.
  markSuffixes(byId,'P01-B31',['HV1','ICT1','HV2','ICT2','ELE1','ELE2'],provisionalNote);

  // B32 Waste Building: Plan 1 emphasizes building, waste-management system and
  // environmental measures. Generic building-service template trades require
  // design/BOQ confirmation.
  markSuffixes(byId,'P01-B32',['MEP1','ELE1','PLB1','HV1','ICT1','SAN','ELE2','HV2','ICT2'],provisionalNote);

  // C43 Pump Building: pumping and electrical/control are principal; generic HVAC,
  // ICT and sanitary fixture trades are provisional.
  markSuffixes(byId,'P01-C43',['HV1','ICT1','SAN','HV2','ICT2'],provisionalNote);

  // External packages where the supplied Plan-1 principal description does not
  // explicitly establish permanent external utility/electrical content.
  for(const prefix of ['P01-A21','P01-A22','P01-B34','P01-D51','P01-D52','P01-D53','P01-D54']){
    markSuffixes(byId,prefix,['UTIL','ELE'],provisionalNote);
  }
  markSuffixes(byId,'P01-A27',['ELE'],provisionalNote);

  // v0.5 test activities already use "where applicable" wording where package
  // scope is broad. Reflect that wording in a machine-readable field.
  for(const row of rows){
    if(row.plan_no==='01' && /where applicable/i.test(row.activity_name)){
      set(row,WHERE_APPLICABLE,provisionalNote);
    }
  }

  // Specialist extras directly created from Plan-1 principal package descriptions
  // remain detailed derivatives rather than provisional generic trades.
  for(const prefix of ['P01-A24','P01-A25','P01-A26','P01-C43']){
    for(const row of byPrefix(rows,prefix)){
      if(/-EX\d+$/.test(row.activity_id) && row.scope_applicability!==WHERE_APPLICABLE){
        set(row,DERIVED_SCOPE,'Specialist proposal activity derived from the principal package scope stated in Plan 1; exact detailed duration/timing remains a planning assumption.');
      }
    }
  }

  return rows;
}

export const scopeApplicabilityValues={SOURCE_REQUIRED,DERIVED_SCOPE,WHERE_APPLICABLE,CONTROL_STREAM};
