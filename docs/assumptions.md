# Scheduling Assumptions / Constraints — Baseline v0.5

เอกสารนี้แยก **สิ่งที่ source ระบุจริง** ออกจาก **planning assumption** ที่จำเป็นต่อ detailed CPM/Gantt เพื่อให้ตรวจย้อนกลับได้ว่าอะไรเป็นข้อกำหนดจากแผนที่ 1–16 และอะไรเป็น proposal scheduling logic

## A. Source constraints ที่ห้ามเปลี่ยนโดยไม่มีข้อมูลใหม่

1. Project duration = **1,200 days**
2. Installment structure = **497 installments**
3. Main installment bands:
   - 1–24 Preliminaries / enabling
   - 25–317 Area A
   - 318–348 Area B
   - 349–383 Area C
   - 384–492 Area D
   - 493–497 Closeout
4. Source critical-control windows:
   - CP-01 D1–90
   - CP-02 D31–180
   - CP-03 D31–270
   - CP-04 D181–600
   - CP-05 D421–840
   - CP-06 D301–960
   - CP-07 D841–1080
   - CP-08 D1081–1200
5. Final handover sequence covers cleaning/restoration, as-built, system tests, O&M, asset register and controlled document handover.
6. Area D is a sensitive workfront requiring approved heritage / environment / HSE controls before work.
7. Quality acceptance and evidence completeness are conditions of completion/progress/payment; physical quantity alone is insufficient.
8. Source windows overlap; the schedule must not force all project control windows into one global FS chain where that contradicts the source timing.
9. Plan 8 requires JSEA / PTW readiness for applicable high-risk work; Plan 7 requires Hold Points / inspection / testing where work is concealed/critical or requires acceptance; Plan 10 requires environmental controls before impact-generating work; Plan 9 requires verified controls for special/heavy movements.
10. Plan 1 identifies principal package scopes such as building services, kitchen systems, electrical-communications, water-production systems, sanitary systems, waste-management systems, tent-house services and pumping systems, but does not provide a complete equipment-by-equipment commissioning schedule.

## B. Planning assumptions used in v0.5

### B1. Calendar

- Uses relative project days `D1–D1200` because an approved absolute baseline start/calendar is not yet embedded in this proposal schedule.
- Detailed durations are proposal elapsed-day allowances until mapped to approved working calendars / holidays / weather constraints.

### B2. Detailed durations and leaf placement

Detailed excavation, structure, MEP, finish, testing and task-control durations/days are not fully stated by Plans 1–16. They are `timing_basis=ASSUMPTION` unless an exact source day/window is available.

They are developed to preserve the 1,200-day / CP-window framework, model rolling workfronts and expose procurement / quality / HSE / environment / commissioning constraints. They must not be described as TOR-stated durations.

### B3. Benchmark usage

- Benchmark is used only to calibrate WBS / activity-breakdown depth.
- Benchmark start/finish, duration and predecessor logic are not schedule inputs.

### B4. Relationship logic

- `FS` — true completion/release gate.
- `SS` — concurrent/rolling workfront or active support stream.
- `FF` — concurrent control/test/closeout that may run in parallel but cannot finish before the underlying stream.
- `SF` — engine-supported but avoided unless a specific justified interface exists.
- Lag may represent staggered fronts, curing/review allowances, source-window convergence or proposal lead-time placement.

### B5. CP-05 / CP-06 / CP-07 convergence

- `P01-CP05-GATE` D840 and `P01-CP06-GATE` D960 are derived network records using source boundary timing.
- CP-07 starts after CP-05.
- CP-06 overlaps CP-07 and therefore controls CP-07 finish rather than creating a false global FS delay.
- Package membership in these gates is proposal integration logic pending approved detailed baseline confirmation.

### B6. Activity-level Plan-8 controls

Source-derived task gates are created only where current physical scope clearly supports the risk category:

- excavation / earthwork JSEA + PTW
- work-at-height / scaffold / fall-rescue readiness for roof work
- electrical isolation / LOTO / test-before-touch for precommissioning
- lifting readiness for raw-water pontoon work
- near-water rescue / evacuation readiness for pontoon installation

Exact gate day follows the proposal workfront and is an assumption.

**No hot-work or confined-space task gate is fabricated** until approved methodology confirms that work in the corresponding package.

### B7. Plan-7 Hold Points

- Foundation pre-pour Hold Point remains explicit.
- Above-ceiling concealed-services Hold Point precedes ceiling closure.
- First-fix trades feed the concealed-work gate using progressive SS logic.
- Calibration/lab/sample-control setup feeds Area QA readiness before inspection/testing cycles.

### B8. Plan-10 environmental gates

- Local environmental readiness is added before building excavation/external earthwork.
- The gate represents verified boundary, drainage/sediment, spill/waste and monitoring readiness.
- No measurement threshold, discharge criterion or permit value is invented; actual acceptance comes from approved project/permit/baseline data.

### B9. Plan-9 special movement

Raw-water pontoon lifting uses a dedicated traffic/special-movement readiness gate. Detailed gate day is a proposal assumption; source supports the process requirements, not that exact day.

### B10. v0.5 package-specific system test packs

v0.5 expands the existing package-level functional-testing period into parallel system test packs where Plan 1 gives a principal system scope.

Rules:

- detailed test rows are `basis_type=ASSUMPTION` and `timing_basis=ASSUMPTION`;
- system test packs are FS from package `PRECOM`;
- test packs run within the package `FUNC` window;
- `FUNC` receives FF links from the test packs so it cannot finish before them;
- `COMM` remains downstream of `FUNC`;
- the test rows do not change the source CP-08 window;
- package profiles use Plan-1 principal scope rather than copying the benchmark.

Examples:

- A23: electrical, plumbing/fire, HVAC, ICT/AV/security
- A24: electrical, water/drainage/grease, kitchen ventilation, kitchen equipment
- A25: electrical and AV/communications (conservative because those are specifically highlighted by Plan 1)
- A26: process water and electrical/controls/instrumentation
- B31: sanitary/drainage and applicable electrical
- B32: waste/drainage/environmental interface and applicable electrical
- C42 clusters: electrical and applicable water/sanitary/drainage
- C43: pumping and electrical/controls

When a system is only inferred from a broad building-services phrase, the activity name must use **where applicable** and the row must be confirmed or removed against IFC / BOQ / equipment schedule / approved commissioning matrix before contract baseline approval.

### B11. Physical-network integrity

- Every Plan-01 Area A/B/C/D physical activity must have complete predecessor ancestry to NTP and a downstream path to D1200.
- Parallel envelope / finish / furniture / external / specialist / system-test branches feed package completion.
- External packages close site furniture/signage and monitoring evidence before handover.
- Missing either side of a Plan-01 physical network is a validation failure.

### B12. Supporting-plan / level-of-effort interpretation

- Recurring control/monitoring activities are not automatically critical.
- Area control streams may enter workfront readiness using SS to show they are active when work begins.
- Where a support stream produces required closeout evidence, it is connected to an appropriate reconciliation/restoration/handover node.
- `P04-WF-DEMOB` is intentionally allowed to terminate as a level-of-effort activity at D1200 because it represents progressive manpower demobilization after area acceptance/handover. It is not force-connected simply to make overall connectivity read 100%.

### B13. Installment mapping

- Do not assume equal duration across 497 installments.
- Explicit D30 / D60 / D90 / D180 control points are retained.
- Explicit early points feed main readiness without fabricating exact dates for installments 4–23.
- Final 493–497 source deliverables remain inside CP-08; exact separate internal days remain assumptions where the source does not state them.

### B14. Procurement lead time

- Source-defined procurement workflow is modeled, but detailed vendor lead time is an assumption until confirmed.
- Installation release represents approval, production, delivery, MIR/test/quarantine clearance appropriate to the material family.

### B15. Quantity / productivity / manpower

- Source describes workforce planning methodology but the schedule does not yet have complete BOQ quantity × productivity × crew data for all activities.
- Current baseline is not fully resource-loaded and does not claim a final manpower histogram.
- `resource_group` / `responsible_party` fields remain available for later resource loading.

### B16. Area D / heritage

- No buffer distance, wildlife restriction distance, water setback, no-go boundary or alternate route is invented.
- Uses approved boundary / sensitive-area / no-go / route information only.
- Late Area-D landscape and raw-water-pontoon work converge through CP-07 rather than being forced to D960 without leaf-level source support.

### B17. Application / AI

- AI assists inspection/report workflows but does not approve quality/payment automatically.
- Human review remains mandatory.
- Digital system/configuration/data handover is included in final controlled-information closeout.

### B18. CPM interpretation

- `critical=Y` = source-window / proposal critical-chain candidate.
- `computed_critical=Y` = zero accumulated float under current proposal predecessor/bar placement.
- Float is not approved contract float until calendar, durations, constraints, vendor dates and approved methods are confirmed.

## C. Quality rules for generated schedule

1. Unique activity ID for every row.
2. Valid D1–D1200 ranges.
3. Milestone duration = 0.
4. Every predecessor must exist.
5. No dependency cycles.
6. Stored relationships must be temporally feasible.
7. Concealed work must have an appropriate inspection/Hold Point where supported by source/process.
8. Installation requiring controlled procurement must have the applicable material-release predecessor.
9. Area-D sensitive work uses heritage/environment/HSE readiness logic.
10. Final acceptance is downstream of final commissioning, quality, as-built/BIM, O&M, asset, archive, restoration, carbon and commercial/progress closeout streams.
11. Every Plan-01 physical row must be complete NTP→D1200 network-connected.
12. `basis_type` and `timing_basis` remain separate.
13. Task-control gates derived from source requirements must not imply invented source dates.
14. Package-specific test packs must not imply an unconfirmed system definitely exists; use “where applicable” when the source is broad.
15. Do not create project-specific restrictions absent from approved source evidence.

## D. Latest validation snapshot

Baseline v0.5 CI result:

- 986 activities / 178 milestones
- 986 / 986 reachable from NTP
- 983 / 986 connected to D1200
- Plan-01 physical 683 / 683 complete NTP→D1200
- Plan-01 handovers 23 / 23 complete NTP→D1200
- 55 computed zero-float activities
- 0 structure errors
- 0 cycles
- 0 network-integrity errors
- 0 temporal warnings
- PASS

## E. Items to replace when project data becomes available

- approved project calendar / actual NTP date
- complete BOQ quantity / cost mapping
- vendor-confirmed lead times
- final IFC / shop-drawing issue schedule
- actual productivity rates / crew compositions
- exact installment due dates not explicitly stated
- approved environmental / heritage coordinates and restrictions
- approved Method Statements / ITPs / JSEAs / permits
- final equipment schedule and testing & commissioning matrix
- approved detailed workfront / area handover sequence
