# Integrated Master Gantt — โครงการพัฒนาแหล่งท่องเที่ยวห้วยขาแข้ง

Repository นี้พัฒนา **Integrated Master Schedule** จากแผนที่ 1–16 ของข้อเสนอ โดยใช้ไฟล์ `26.08.17 แผนงานก่อสร้างห้วยขาแข้ง หลัก.pdf` เป็น benchmark เฉพาะ **ระดับความละเอียดของ WBS / Activity Breakdown** เท่านั้น ไม่คัดลอกวัน ระยะเวลา หรือ predecessor logic ของตัวอย่างมาใช้เป็นฐาน

## Baseline v0.7 — validated proposal network

Latest validated schedule logic:

- Project duration: **1,200 project days**
- Contract installment structure: **497 installments**
- Detailed activities / gates: **1,066 rows**
- Milestones / gates: **258**
- Computed zero-float activities: **60**
- Reachable from NTP: **1,066 / 1,066 = 100%**
- Complete NTP→D1200 network: **1,064 / 1,066 = 99.8%**
- Plan-01 physical NTP→D1200: **683 / 683 = 100%**
- Plan-01 handovers NTP→D1200: **23 / 23 = 100%**
- Structural errors / dependency cycles / network-integrity errors / temporal warnings: **0 / 0 / 0 / 0**
- Validation status: **PASS**

Scope-applicability audit:

- `SOURCE_REQUIRED` = **7**
- `DERIVED_FROM_SCOPE` = **617**
- `WHERE_APPLICABLE` = **64**
- `CONTROL_STREAM` = **378**

The 64 `WHERE_APPLICABLE` rows are intentionally retained for proposal coordination but are explicitly flagged for confirmation against IFC drawings, BOQ, equipment schedules, approved shop drawings and the commissioning matrix. If a system is absent from approved scope, the row is to be removed or replaced before contract-baseline approval.

The only non-Plan-01 terminal intentionally left without a downstream D1200 successor path is `P04-WF-DEMOB`, representing progressive manpower demobilization after area acceptance / handover.

> `basis_type`, `timing_basis` and `scope_applicability` answer different questions and are kept separate. A detailed activity can be a valid proposal scheduling assumption while still being marked provisional in scope.

## Source framework retained

Work-package bands:

- 1–24 — preliminaries / enabling
- 25–317 — Area A
- 318–348 — Area B
- 349–383 — Area C
- 384–492 — Area D
- 493–497 — closeout / handover

Critical-control windows:

- CP-01 D1–90
- CP-02 D31–180
- CP-03 D31–270
- CP-04 D181–600
- CP-05 D421–840
- CP-06 D301–960
- CP-07 D841–1080
- CP-08 D1081–1200

The overlapping source windows are not converted into a false global FS chain. Derived audit gates `P01-CP05-GATE` D840 and `P01-CP06-GATE` D960 preserve the source boundaries while CP-07 may run concurrently with the tail of CP-06.

## Detailed refinement layers

### v0.4 — activity-level controls

- excavation / earthwork JSEA + PTW readiness
- localized environmental earthwork readiness
- work-at-height / scaffold / fall-rescue readiness
- foundation pre-pour Hold Point
- above-ceiling concealed-services Hold Point
- electrical isolation / LOTO before precommissioning
- raw-water pontoon lifting / traffic-special-movement / near-water readiness

No hot-work or confined-space activity is fabricated without approved method evidence. No heritage buffer distance, water setback, wildlife exclusion distance or new route is invented.

See `docs/v04-source-control-mapping.md`.

### v0.5 — package-specific testing

Generic functional testing is expanded into parallel test packs:

`Installation → Precommissioning → Parallel System Test Packs → Functional Test completion → Integrated Commissioning`

Package profiles cover the principal systems identified by Plan 1, with **where applicable** wording where the supplied scope is broad.

See `docs/v05-system-test-mapping.md`.

### v0.6 — package / discipline document release

Controlled-document milestones are added before actual workfronts:

- `STR-DOC` — structural drawings / Method Statement / ITP
- `ARC-DOC` — architectural / envelope coordination
- `MEP-DOC` — building-services / sleeves / first-fix coordination
- `TST-DOC` — precommissioning / test procedure / acceptance forms
- `CIV-DOC`, `UTIL-DOC`, `LAND-DOC` — external work releases
- dedicated raw-water pontoon fabrication/lifting/installation and test-document gates

These integrate Plans 1, 7, 11 and 13. Exact package release days remain proposal timing assumptions.

See `docs/v06-document-release-mapping.md`.

### v0.7 — scope applicability provenance

Every schedule row now carries one of:

- `SOURCE_REQUIRED`
- `DERIVED_FROM_SCOPE`
- `WHERE_APPLICABLE`
- `CONTROL_STREAM`

Validation fails if a row is left unclassified. Generic template systems that are not firmly established by the current package description remain visible but are marked `WHERE_APPLICABLE` rather than silently presented as confirmed scope.

See `docs/v07-scope-applicability.md`.

## Integrated physical / control network

Plan 01 remains the physical backbone. Plans 02–16 enter the network as readiness gates, active control streams, evidence processes and closeout requirements.

Area release can depend on:

- site / logistics / temporary utilities
- workforce competency and active coverage
- plant-personnel competency and active plant support
- QA Method Statement / ITP and inspection readiness
- HSE / JSEA / PTW
- traffic / booking / route control
- environment monitoring/readiness
- CDE / controlled documents
- Area-D heritage / sensitive-workfront controls

Plant streams are linked by SS to applicable earthwork, structure, MEP, landscape and Area-D workfronts so support is active when needed without falsely requiring an entire plant campaign to finish first.

## Procurement

Material families retain:

`Requirement → Submittal → Approval → Vendor alignment → PO → Production/Fabrication → FAT/Source Inspection → Delivery → MIR/Test/Quarantine Clearance → Released for Installation`

Families: STR, ARC, MEP, ICT, LAND and Area-D special materials. Detailed lead times remain assumptions until vendor confirmation.

## Commercial / installments

The schedule does **not** assume 497 equal-duration installments.

Explicit source points retained:

- Installment 1 — D30
- Installment 2 — D60
- Installment 3 — D90
- Installment 24 — D180
- Installments 493–497 — source-stated final deliverables inside D1200, with separate exact internal days treated as proposal assumptions where the source does not state them

## CPM / network validation

Two concepts remain separate:

1. `critical` — source-window / proposal critical-chain candidate.
2. `computed_critical` — zero-float activity calculated from the actual network to D1200.

Exported fields include:

- `network_from_start`
- `network_to_final`
- `computed_total_float_days`
- `computed_free_float_days`
- `computed_critical`
- `driving_successor`
- `scope_applicability`
- `scope_note`

The deterministic representative zero-float chain remains 36 activities from NTP through the Area-A Learning Centre, source CP convergence, installments 493–497 and D1200. Parallel document/test/control branches can also be zero-float without replacing that representative trace.

A Plan-01 physical row missing either complete NTP ancestry or a D1200 successor path is a validation failure.

## Interactive Gantt

The viewer supports:

- Plan / Zone / discipline filters
- activity basis and timing-basis filters
- **scope applicability filter**
- provisional-scope highlighting / chip
- NTP→D1200-only and zero-float-only views
- Plan → Area → Discipline collapsible hierarchy
- dependency lines: Off / Driving only / All visible
- total/free float and driving successor
- scope note in the activity detail drawer
- search / zoom / CSV / JSON export

## CLI

```bash
npm run validate
npm run export
```

Generated artifacts:

- `data/master-schedule.csv`
- `data/master-schedule.json`
- `data/schedule-stats.json`
- `data/cpm-report.json`
- `data/validation-report.json`

## Source / assumption policy

- `basis_type = SOURCE` — activity/control requirement explicitly stated by a source plan
- `basis_type = DERIVED` — schedulable decomposition from a source-defined process
- `basis_type = ASSUMPTION` — proposal-level activity detail
- `timing_basis = SOURCE` — exact day/window supported by source
- `timing_basis = ASSUMPTION` — detailed date/duration/lag is a proposal allowance
- `scope_applicability = WHERE_APPLICABLE` — detailed content retained for coordination but scope confirmation is still required

The benchmark PDF is **never** used as a source of dates, durations or dependencies.

## Contract-baseline items still to confirm

- actual NTP / approved calendar / weather calendars
- full BOQ quantity and cost mapping
- approved IFC / shop-drawing / submittal dates
- vendor-confirmed lead times
- production rates / crew compositions
- exact installment due dates where not stated
- approved environmental / heritage coordinates and restrictions
- approved Method Statements / ITPs / JSEAs / permits
- final equipment schedule / commissioning matrix
- final workfront / area-handover constraints

See the `docs/` directory for the audit trail.
