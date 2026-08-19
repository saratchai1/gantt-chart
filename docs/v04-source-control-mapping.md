# Activity-level Control Mapping — Baseline refinement v0.4

This note records the source basis for the activity-level gates added after baseline v0.2. The gates refine the existing 1,200-day programme; they do not replace the physical WBS or use the benchmark PDF as a timing source.

## Plan 8 — HSE / JSEA / Permit to Work

Plan 8 requires JSEA and Permit to Work to be readiness checks before high-risk activities and when methods/conditions change. It explicitly identifies excavation, work at height, lifting, electrical isolation/LOTO, hot work, confined space and near-water work as controlled risk categories.

The schedule therefore adds explicit derived gates where the existing physical scope clearly supports the risk category:

- building excavation and external earthwork → excavation / earthwork JSEA + PTW gate
- building roof work → work-at-height / scaffold / fall-rescue readiness gate
- building precommissioning → electrical isolation / LOTO / test-before-touch readiness gate
- raw-water pontoon lifting → lift-plan / certified-team / exclusion-zone / emergency-readiness gate
- raw-water pontoon installation → near-water weather / rescue / evacuation readiness gate

No confined-space or hot-work gate is added merely because such work is common in construction; those controls are only to be added where the approved project method confirms the activity actually occurs.

## Plan 7 — QA/QC Hold Point

Plan 7 defines Hold Points as points where the next step may not proceed until authorized, especially for concealed work, critical work, or work difficult to correct later.

The building template therefore includes an explicit **above-ceiling concealed-services Hold Point** before ceiling closure. Electrical, plumbing/fire, HVAC, ICT and general MEP first-fix activities enter this gate as rolling-workfront SS inputs. This preserves realistic zone-by-zone construction instead of falsely requiring every first-fix trade to finish across the entire building before any ceiling can close.

The existing foundation pre-pour Hold Point remains unchanged.

## Plan 10 — Environmental readiness

Plan 10 requires boundaries, drainage/sediment controls, spill/waste controls, monitoring equipment and responsible persons to be ready before mobilization and impact-generating work. Building excavation and external earthwork therefore receive a localized environmental-control readiness gate in addition to the area-level environmental release.

The gate does not invent environmental criteria or thresholds. Acceptance criteria remain those in the approved project documents, permits, baseline data and authorized monitoring plan.

## Plan 9 — special movement / lifting route

Plan 9 requires heavy/special movements and lifting-related deliveries to use verified route, turning/bearing/unloading conditions, traffic authorization, booking/call-forward control and appropriate signalers. The raw-water pontoon lifting workfront therefore has a dedicated traffic / special-movement readiness gate.

## Area D / heritage interface

Area-D task-level gates reuse the existing approved-boundary / heritage-sensitive workfront permit logic. No buffer distance, wildlife exclusion distance, water setback or new route has been invented. The schedule continues to rely on approved project-specific coordinates and restrictions.

## Timing provenance

All detailed task-control gate dates are aligned to the current proposal workfront start and therefore use:

`timing_basis = ASSUMPTION`

The control requirement is source-derived, while the exact detailed project day is a scheduling allowance to be replaced/confirmed when the approved Method Statements, ITPs, JSEAs, permits, working calendar and workfront sequence are available.
