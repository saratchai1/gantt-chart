# Scheduling Assumptions / Constraints — Baseline v0.7

เอกสารนี้แยก **source constraint**, **proposal scheduling assumption** และ **scope applicability** เพื่อไม่ให้ความละเอียดของ Gantt ถูกตีความว่าเป็นข้อกำหนดที่ source ระบุทั้งหมด

## A. Source constraints ที่ห้ามเปลี่ยนโดยไม่มีข้อมูลใหม่

1. Project duration = **1,200 days**
2. Installment structure = **497 installments**
3. Main bands:
   - 1–24 Preliminaries / enabling
   - 25–317 Area A
   - 318–348 Area B
   - 349–383 Area C
   - 384–492 Area D
   - 493–497 Closeout
4. Source CP windows:
   - CP-01 D1–90
   - CP-02 D31–180
   - CP-03 D31–270
   - CP-04 D181–600
   - CP-05 D421–840
   - CP-06 D301–960
   - CP-07 D841–1080
   - CP-08 D1081–1200
5. Final handover includes cleaning/restoration, as-built, system tests, O&M, asset data and controlled-document handover.
6. Area D requires approved heritage / environment / HSE controls before work.
7. Quality/evidence acceptance is required; physical quantity alone is insufficient.
8. Plan 8 requires JSEA / PTW for applicable high-risk work; Plan 7 requires inspection/testing/Hold Points where applicable; Plan 10 requires environmental readiness; Plan 9 requires controlled special/heavy movements.
9. Approved drawings / Method Statements / ITPs / controlled revisions must be available before relevant workfronts.
10. Source windows overlap and must not be forced into a false global FS chain.

## B. Proposal timing assumptions

### B1. Calendar

- Schedule uses relative `D1–D1200`.
- Detailed elapsed durations remain proposal allowances until an approved working calendar / holidays / weather calendars are applied.

### B2. Detailed activity durations

Excavation, structure, MEP, finish, testing, document-gate and control-gate durations/dates are not fully stated by Plans 1–16. Exact leaf timing is `timing_basis=ASSUMPTION` unless an explicit source day/window exists.

### B3. Benchmark usage

Benchmark is used only for WBS / activity granularity. No benchmark start/finish/duration/predecessor is imported.

### B4. Relationships

- `FS` — true release/completion gate
- `SS` — rolling workfront / active support stream
- `FF` — concurrent stream/test allowed, but successor cannot finish early
- `SF` — supported by engine but avoided unless specifically justified

Detailed lags are planning allowances unless explicitly source-stated.

### B5. CP convergence

- `P01-CP05-GATE` D840 and `P01-CP06-GATE` D960 use source boundary timing.
- Detailed membership in these gates is proposal integration logic.
- CP-06 controls CP-07 finish because the source windows overlap.

## C. Task-level control assumptions

### C1. HSE

Task gates are created only where current scope clearly supports the risk category:

- excavation / earthwork JSEA + PTW
- work-at-height readiness before roof work
- LOTO / electrical isolation before precommissioning
- D55 lifting readiness
- D55 near-water readiness

**Hot-work and confined-space task gates are not fabricated** until approved methodology confirms the activity exists.

### C2. Quality

- Foundation pre-pour Hold Point is explicit.
- Above-ceiling concealed-services Hold Point is a derived application of Plan-7 concealed-work control.
- Calibration/lab/sample setup feeds Area QA readiness.

### C3. Environment

Localized environmental readiness before earthwork represents boundary, drainage/sediment, spill/waste and monitoring readiness. No unapproved threshold, discharge limit or permit criterion is invented.

### C4. Traffic / D55

Special-movement/lifting-route gate is derived from route survey, bearing/turning/unloading, booking/call-forward and signaler requirements. Exact gate day is assumed.

## D. Package document-release assumptions

`STR-DOC`, `ARC-DOC`, `MEP-DOC`, `TST-DOC`, `CIV-DOC`, `UTIL-DOC`, `LAND-DOC` and D55 document gates are zero-duration proposal milestones aligned to current workfront starts.

The **requirement** for approved controlled documents is source-derived; the **exact package release day** is assumed until an approved submittal / shop-drawing / Method Statement / ITP programme exists.

## E. Package test assumptions

System test packs are used to make commissioning logic sufficiently detailed:

`PRECOM → parallel test packs → FUNC completion → COMM`

They remain proposal assumptions pending IFC / BOQ / equipment schedule / final commissioning matrix.

When the supplied package description is broad, the row is marked `WHERE_APPLICABLE` rather than asserting that the system definitely exists.

## F. Scope applicability — v0.7

Scope applicability is independent of `basis_type` and `timing_basis`:

- `SOURCE_REQUIRED` — source-established Plan-01 framework/control
- `DERIVED_FROM_SCOPE` — detailed decomposition reasonably supported by package scope
- `WHERE_APPLICABLE` — proposal coordination row requiring scope confirmation
- `CONTROL_STREAM` — Plans 02–16 control/evidence activity

Current validation identifies **64 WHERE_APPLICABLE rows**.

These rows must be checked against:

- IFC drawings
- BOQ
- equipment schedules
- approved shop drawings
- Method Statements / ITPs
- testing & commissioning matrix

If absent from approved scope, delete or replace the row before contract baseline approval. Zero float or downstream connectivity does **not** make provisional scope confirmed scope.

## G. Physical-network integrity

- Every Plan-01 physical activity must have complete NTP ancestry and downstream D1200 connectivity.
- Parallel finish / furniture / specialist / test branches must feed package completion as applicable.
- Missing either side is a validation failure.

## H. Supporting-plan / LOE interpretation

Recurring controls are not automatically critical. Supporting streams are connected where they feed readiness or required closeout evidence.

`P04-WF-DEMOB` remains an intentional terminal LOE activity at D1200 and is not force-connected for cosmetic 100% network coverage.

## I. Installments

- Do not assume 497 equal durations.
- Explicit D30 / D60 / D90 / D180 points are retained.
- Dates for installments 4–23 are not fabricated.
- Final 493–497 categories are source-stated; separate exact internal days are assumptions where the source does not give them.

## J. Procurement

Procurement workflow is source-derived, but detailed vendor lead times remain assumptions until confirmed. Installation release follows the applicable approval / production / delivery / MIR / test / quarantine process.

## K. Resources / productivity

The baseline is not yet fully resource-loaded because complete BOQ quantity × productivity × crew data is not available for every activity. It does not claim a final manpower histogram.

## L. Area D / heritage

No buffer distance, wildlife restriction distance, water setback, no-go boundary or alternate route is invented. Use approved project-specific coordinates/restrictions only.

## M. CPM interpretation

- `critical=Y` = source-window / proposal critical-chain candidate
- `computed_critical=Y` = zero accumulated float under current proposal network

Proposal float is not approved contract float until calendar, durations, vendor dates, productivity, document dates, scope and approved methods are confirmed.

## N. Validation rules

1. Unique ID
2. Valid D1–D1200 range
3. Milestone duration = 0
4. Every predecessor exists
5. No dependency cycles
6. Temporal relationships feasible
7. Every row has valid `scope_applicability`
8. Concealed work has an applicable quality gate
9. Controlled installation has applicable procurement/document release logic
10. Area-D sensitive work has applicable environment/HSE/heritage logic
11. Every Plan-01 physical row is complete NTP→D1200 network-connected
12. Final acceptance is downstream of required commissioning / quality / BIM / O&M / asset / archive / restoration / carbon / commercial / progress closeout

## O. Latest validated snapshot

Baseline v0.7:

- 1,066 activities / 258 milestones
- 1,066 / 1,066 reachable from NTP
- 1,064 / 1,066 complete NTP→D1200
- Plan-01 physical 683 / 683
- Plan-01 handovers 23 / 23
- 60 computed zero-float
- scope: 7 SOURCE_REQUIRED / 617 DERIVED_FROM_SCOPE / 64 WHERE_APPLICABLE / 378 CONTROL_STREAM
- 0 structure errors / 0 cycles / 0 network-integrity / 0 temporal warnings
- PASS

## P. Items to replace / confirm for contract baseline

- actual NTP / approved calendar / weather calendars
- full BOQ quantity / cost mapping
- IFC / shop-drawing / document-submittal schedule
- vendor-confirmed lead times
- production rates / crew compositions
- exact installment due dates not source-stated
- approved environmental / heritage coordinates and restrictions
- approved Method Statements / ITPs / JSEAs / permits
- final equipment schedule / commissioning matrix
- resolution of every `WHERE_APPLICABLE` row
- approved detailed workfront / area-handover sequence
