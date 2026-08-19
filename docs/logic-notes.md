# Integrated Schedule Logic Notes — Baseline v0.7

## 1. Network objective

Schedule นี้ใช้ **Plan 01 เป็น physical-delivery backbone** และนำ Plans 02–16 เข้ามาเป็น readiness gate, active control, inspection/evidence process และ closeout requirement ของงานจริง ไม่วางเป็น Gantt 16 ชุดที่แยกจากกัน

`NTP → Project/Area Readiness → Package Document Release → Task-level HSE/Environment/QA Gates → Physical Work → Precommissioning → System Test Packs → Integrated Commissioning → Handover → CP Convergence → Closeout → D1200`

## 2. Source windows retained

- CP-01 D1–90 — survey / benchmark / initial approval
- CP-02 D31–180 — temporary site systems / workfront readiness
- CP-03 D31–270 — detailed design / approvals / long-lead procurement
- CP-04 D181–600 — foundations / main structure Area A
- CP-05 D421–840 — architecture / MEP Area A
- CP-06 D301–960 — Areas B/C/D + external systems
- CP-07 D841–1080 — landscape / detail completion / integration
- CP-08 D1081–1200 — commissioning / as-built / O&M / handover

`P01-CP05-GATE` D840 and `P01-CP06-GATE` D960 are audit milestones using source boundary timing. CP-06 overlaps CP-07, so CP-06 controls CP-07 finish rather than creating a false global FS relationship.

## 3. Area workfront readiness

Area release can require:

- temporary utilities / access / logistics
- workforce competency and active coverage
- plant-personnel competency and active plant support
- QA Method Statement / ITP readiness and inspection stream
- HSE / JSEA / PTW and active monitoring
- traffic / route / booking controls
- environmental readiness and monitoring
- CDE / controlled-document readiness
- Area-D heritage / sensitive-workfront permit and monitoring

Long-running control streams use SS where they need to be **active** at workfront opening rather than falsely complete before work starts.

## 4. Task-level control gates

### Earthwork

Building `EXC` and external `EW` receive:

1. excavation / earthwork JSEA + PTW readiness;
2. localized environmental-control readiness;
3. active earthwork plant-support interface;
4. package civil/structural controlled-document release where applicable.

### Structure / concealed work

- Foundation reinforcement/formwork is downstream of structural document release.
- Foundation concrete is downstream of the pre-pour Hold Point.
- Roof work is downstream of work-at-height/scaffold/fall-rescue readiness.
- Ceiling closure is downstream of an above-ceiling concealed-services Hold Point.

### Building services / testing

- MEP/electrical/plumbing/HVAC/ICT first fix is downstream of a package MEP/document release.
- Precommissioning is downstream of a test-document release and applicable LOTO gate.
- Principal system test packs run after precommissioning and must finish before the package functional-test window can close.
- Integrated commissioning follows package functional-test completion.

### Raw-water pontoon

D55 includes distinct:

- fabrication/lifting/installation document release;
- lift plan / competent team / exclusion / rescue readiness;
- heavy/special movement route / bearing / unloading / signaler readiness;
- near-water weather / rescue / evacuation readiness;
- Area-D environment / heritage controls;
- pump/piping/electrical/control precommissioning and test-document release.

No buffer distance, wildlife exclusion distance, water setback or route is invented.

## 5. Relationship convention

Use **FS** for true release/completion gates, **SS** for rolling workfronts or active controls, and **FF** where concurrent activity is permitted but completion cannot occur before the underlying stream/test finishes.

Typical rolling logic:

- Survey → excavation
- Excavation → blinding
- Ground structure → frame
- Frame → roof/envelope/MEP first fix
- MEP first fix → concealed-work inspection / closure
- Precommissioning → parallel system tests

True gates include:

- Material approval → PO
- Hold Point → concrete/closure
- Controlled document release → physical workfront
- Functional-test completion → integrated commissioning
- Punch/correction → handover

## 6. Procurement

`Requirement → Submittal → Approval → Vendor alignment → PO → Production/Fabrication → FAT/Source Inspection → Delivery → MIR/Test/Quarantine Clearance → Released for Installation`

Families: STR, ARC, MEP, ICT, LAND and Area-D special materials. Detailed lead times remain proposal assumptions until vendor confirmation.

## 7. Quality completion

งานจะไม่ถือว่าเสร็จจาก physical quantity อย่างเดียว โดย network มีอย่างน้อย:

- PQP / Method Statement / ITP readiness
- calibration/lab/sample-chain setup
- pre-pour Hold Point
- concealed-work Hold Point
- material release / inspection
- system test packs
- integrated commissioning
- punch/NCR correction and reinspection
- as-built / asset evidence

`Physical Complete ≠ Payment Ready` จนกว่าหลักฐานการตรวจรับครบ

## 8. Commercial / installments

497 installments are contractual references, not equal-duration time buckets. Explicit source points D30 / D60 / D90 / D180 are retained and feed main readiness. Installments 493–497 retain source-stated closeout deliverable categories inside D1200; exact separate internal days are proposal assumptions where not stated.

## 9. Package document-release logic

Building packages use, where applicable:

- `STR-DOC`
- `ARC-DOC`
- `MEP-DOC`
- `TST-DOC`

External packages use:

- `CIV-DOC`
- `UTIL-DOC`
- `LAND-DOC`

These gates combine CDE status, Area QA readiness, active/completed BIM coordination and CP-03 design-control status at the current proposal workfront date. Exact gate dates remain assumptions.

## 10. Supporting-plan / LOE closeout

Supporting streams converge to appropriate downstream evidence nodes:

- site operations → site demobilization
- workforce area/review streams → workforce closeout
- plant streams → plant demobilization
- QA monitoring → final QA dossier
- traffic controls → route restoration
- environment / waste → restoration closeout
- CDE cycles → CDE closeout
- progress cycles → final progress reconciliation
- BIM coordination / 4D-5D → as-built BIM
- AI monitoring → digital-system handover
- carbon data → periodic calculation → final carbon report
- heritage monitoring → heritage restoration
- commercial area cycles → forecast-to-complete reconciliation

`P04-WF-DEMOB` remains an intentional terminal LOE activity rather than a cosmetic final-acceptance predecessor.

## 11. Scope applicability — v0.7

Every row is classified separately from basis/timing:

- `SOURCE_REQUIRED`
- `DERIVED_FROM_SCOPE`
- `WHERE_APPLICABLE`
- `CONTROL_STREAM`

`WHERE_APPLICABLE` means the detailed trade/system is retained for proposal coordination but the current supplied package description does not firmly establish that exact system. It must be confirmed/deleted/replaced against IFC, BOQ, equipment schedules and approved commissioning data before contract baseline.

This prevents a generic template from silently becoming a claimed contractual scope item while preserving the detailed interfaces needed for proposal planning.

## 12. Network validation

Latest validated v0.7 result:

- 1,066 rows / 258 milestones
- 1,066 / 1,066 reachable from NTP
- 1,064 / 1,066 complete NTP→D1200
- Plan-01 physical 683 / 683 complete NTP→D1200
- Plan-01 handovers 23 / 23
- scope: 7 SOURCE_REQUIRED / 617 DERIVED_FROM_SCOPE / 64 WHERE_APPLICABLE / 378 CONTROL_STREAM
- 0 structure errors
- 0 cycles
- 0 network-integrity errors
- 0 temporal warnings
- PASS

Every Plan-01 physical row fails validation if either full NTP ancestry or downstream D1200 connectivity is missing.

## 13. Critical path

`critical=Y` = source-window / proposal candidate.

`computed_critical=Y` = zero accumulated float under the current proposal network.

v0.7 has **60 zero-float activities**. The deterministic representative chain remains **36 activities** from NTP through the Area-A Learning Centre, CP convergence and final 493–497 closeout to D1200. Parallel document/test/control branches may also be zero-float.

This remains proposal CPM until approved calendar, IFC/BOQ, vendor dates, productivity, Method Statements, ITPs, JSEAs, permits, scope applicability and final testing/interface data are confirmed.
