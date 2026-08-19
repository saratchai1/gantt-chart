# Integrated Master Gantt — โครงการพัฒนาแหล่งท่องเที่ยวห้วยขาแข้ง

Repository นี้พัฒนา **Integrated Master Schedule** จากแผนที่ 1–16 ของข้อเสนอ โดยใช้ไฟล์ `26.08.17 แผนงานก่อสร้างห้วยขาแข้ง หลัก.pdf` เป็น benchmark เฉพาะ **ระดับความละเอียดของ WBS / Activity Breakdown** เท่านั้น ไม่คัดลอกวัน ระยะเวลา หรือ predecessor logic ของตัวอย่างมาใช้เป็นฐาน

## Baseline v0.5 — validated proposal network

Latest CI-validated snapshot:

- Project duration: **1,200 project days**
- Contract installment structure: **497 installments**
- Detailed activities / gates: **986 rows**
- Milestones / gates: **178**
- Source-window / proposal critical-chain candidates: **106**
- Computed zero-float activities: **55**
- Reachable from NTP: **986 / 986 = 100%**
- Connected downstream to D1200: **983 / 986 = 99.7%**
- Plan-01 physical NTP→D1200: **683 / 683 = 100%**
- Plan-01 physical handovers NTP→D1200: **23 / 23 = 100%**
- Structural validation errors: **0**
- Dependency cycles: **0**
- Network-integrity errors: **0**
- Temporal relationship warnings: **0**
- Validation status: **PASS**

The only non-Plan-01 terminal intentionally left without a D1200 successor path is `P04-WF-DEMOB` — progressive manpower demobilization after area acceptance/handover. It remains a level-of-effort terminal rather than being force-connected merely to make the overall metric read 100%.

> Detailed leaf durations, detailed control-gate dates and lags not explicitly stated in Plans 1–16 are proposal planning allowances. `basis_type` and `timing_basis` are kept separate so a source-stated requirement cannot be mistaken for a source-stated duration/date.

## Schedule architecture

**Plan 01** is the physical-delivery backbone. **Plans 02–16** are integrated as predecessor gates, enabling activities, concurrent controls, inspection/evidence processes and closeout requirements.

Source work-package bands retained:

- Installments 1–24 — preliminaries / enabling
- 25–317 — Area A
- 318–348 — Area B
- 349–383 — Area C
- 384–492 — Area D
- 493–497 — closeout / handover

Source critical-control windows retained:

- CP-01 D1–90 — survey / benchmark / initial approval
- CP-02 D31–180 — temporary site systems / workfront readiness
- CP-03 D31–270 — design / approvals / long-lead procurement
- CP-04 D181–600 — foundations / main structure Area A
- CP-05 D421–840 — architecture / MEP Area A
- CP-06 D301–960 — Areas B/C/D + external systems
- CP-07 D841–1080 — landscape / detail completion / integration
- CP-08 D1081–1200 — commissioning / as-built / O&M / handover

Because these source windows overlap, the schedule does **not** force them into a false global FS chain. `P01-CP05-GATE` at D840 and `P01-CP06-GATE` at D960 are derived audit milestones using source boundary timing; CP-06 controls CP-07 finish while CP-07 is allowed to start at D841.

## v0.4 activity-level control refinement retained in v0.5

### HSE / JSEA / PTW

Source-supported task gates include:

- excavation / earthwork JSEA + PTW readiness
- work-at-height / scaffold / fall-rescue readiness before roof work
- electrical isolation / LOTO / test-before-touch before precommissioning
- raw-water pontoon lifting-plan / exclusion / emergency readiness
- raw-water pontoon near-water weather / rescue / evacuation readiness

No hot-work or confined-space task is fabricated without approved Method Statement evidence that the activity actually exists.

### QA/QC

- foundation pre-pour Hold Point
- above-ceiling concealed-services Hold Point before ceiling closure
- calibration / laboratory / sample-chain setup feeding Area QA readiness
- quality / NCR / reinspection evidence feeding closeout

### Environment / Traffic / Heritage

- localized environmental earthwork readiness before impact-generating work
- special movement / route / unloading-area readiness for raw-water pontoon lifting
- approved-boundary / sensitive-area controls reused for Area D
- no invented buffer distance, wildlife exclusion distance, water setback or new route

See `docs/v04-source-control-mapping.md`.

## v0.5 package-specific testing refinement

Baseline v0.5 expands the generic building functional-testing window into **parallel package-specific system test packs** before integrated commissioning.

The logic is:

`Installation / Second Fix → Precommissioning → Parallel System Test Packs → Functional Test Coordination completion → Integrated Commissioning`

Individual test packs are FS from precommissioning and FF into the package-level `FUNC` window. This allows parallel testing but prevents the functional-test phase from closing before the defined principal test packs are complete.

Examples include:

- Learning Centre — electrical, plumbing/fire, HVAC, ICT/AV/security
- Restaurant/Cafe — electrical, water/drainage/grease, kitchen ventilation, kitchen equipment interfaces
- Meeting Building — electrical and conference AV/communications
- Water Production Building — process-water and controls/instrumentation
- Toilet Building — sanitary/drainage and applicable electrical
- Waste Building — waste/drainage/environmental interface and applicable electrical
- Reception Building — principal building-services test packs
- Tent House clusters — electrical and applicable water/sanitary/drainage
- Pump Building — pump/flow and electrical/control test packs

Where the source gives only a broad building-services description, the detailed row is explicitly worded **where applicable** and remains an assumption pending IFC / BOQ / equipment schedule / final commissioning matrix.

See `docs/v05-system-test-mapping.md`.

## Integrated workfront readiness

Area release uses both one-time readiness gates and active control streams:

- site office / temporary utility / logistics readiness
- workforce competency and active manpower coverage
- plant-personnel competency and active plant support
- QA/QC Method Statement / ITP readiness and inspection stream
- HSE / JSEA / PTW readiness and HSE monitoring
- traffic plan / booking controls and route control
- environmental readiness and monitoring
- controlled-document / CDE readiness
- Area-D heritage / sensitive-area permit and monitoring

This prevents Plans 03–11 from existing as decorative bars disconnected from physical construction.

## Plant-to-workfront integration

Active plant support uses SS relationships where appropriate:

- EARTH → excavation / earthwork
- STR → foundation / ground structure / frame / roof
- MEP → building-services installation / testing / commissioning
- LAND → paving / soil / planting / irrigation / restoration
- Area-D restricted plant → applicable sensitive-area / near-water work

The link means plant support is active when the workfront starts; it does not require the entire plant campaign to finish before construction proceeds.

## Physical package completion integrity

Building handover waits for applicable parallel branches, including:

- envelope / weather-tightness
- doors / glazing
- floor / final architectural finishes
- fixed furniture
- immediate external work
- specialist exhibition / kitchen / AV / process interfaces
- package-specific test packs and integrated commissioning
- punch / correction / reinspection
- as-built / asset data

External packages likewise close final inspection, site furniture/signage and package monitoring records before handover.

## Procurement logic

Material families retain:

`Requirement → Submittal → Approval → Vendor alignment → PO → Production/Fabrication → FAT/Source Inspection → Delivery → MIR/Test/Quarantine Clearance → Released for Installation`

Families include STR, ARC, MEP, ICT, LAND and Area-D special materials. Detailed vendor lead times remain assumptions until vendor confirmation.

## Commercial / installment logic

The 497 installments are **not** assumed to have equal duration.

Explicit source control points retained:

- Installment 1 — D30
- Installment 2 — D60
- Installment 3 — D90
- Installment 24 — D180
- Installments 493–497 — final source-stated deliverable categories inside D1200; separate exact days are proposal CP-08 assumptions where the source does not state distinct due days

The early explicit control points feed main-work readiness without fabricating exact dates for installments 4–23.

## Cross-plan closeout convergence

Final acceptance is downstream of relevant completion streams across Plans 02–16, including:

- final QA dossier / punch / NCR closure
- commissioning and package test reconciliation
- As-Built / As-Built BIM / AIM / Digital Twin
- O&M / warranty / spares / training
- asset register / serial / location / value reconciliation
- CDE archive / controlled data export
- Application / AI system-data handover
- site / plant / traffic demobilization and restoration
- environmental / heritage restoration acceptance
- final carbon inventory / report
- commercial forecast / cost reconciliation
- final progress / closeout reconciliation
- emergency-drill programme records
- final payment-package readiness

Level-of-effort streams are connected to appropriate downstream reconciliation nodes where they produce closeout evidence. They are not made critical automatically.

## CPM / critical-path analysis

Two concepts remain separate:

1. `critical` — source-window / proposal critical-chain candidate.
2. `computed_critical` — zero-float activity calculated from the current predecessor network to D1200.

Calculated/exported fields include:

- `network_from_start`
- `network_to_final`
- `computed_total_float_days`
- `computed_free_float_days`
- `computed_critical`
- `driving_successor`

The representative zero-float path remains a 36-activity chain through NTP, Area-A Learning Centre, CP convergence, installments 493–497 and D1200. The new v0.5 test packs strengthen parallel commissioning detail without artificially forcing a different representative driving chain.

This is proposal-baseline CPM, not approved contract float until calendar, detailed dates, productivity, vendor lead times and approved methods are confirmed.

## Network validation

`npm run validate` checks:

- unique IDs / day ranges / milestone durations
- missing predecessors
- dependency cycles
- temporal relationship consistency
- strict NTP ancestry
- downstream D1200 connectivity
- complete NTP→D1200 coverage for every Plan-01 physical activity
- complete NTP→D1200 coverage for every Plan-01 handover
- remaining support / LOE exceptions for review

A Plan-01 physical row missing either upstream or downstream connectivity is a **validation failure**.

## Interactive Gantt

The viewer supports:

- Plan 01–16 / Zone / discipline filters
- SOURCE / DERIVED / ASSUMPTION activity basis
- SOURCE / ASSUMED timing basis
- computed zero-float-only view
- complete NTP→D1200-network-only view
- Plan → Building/Area → Discipline collapsible hierarchy
- dependency lines: Off / Driving only / All visible
- network status per activity
- total/free float and driving successor
- search / zoom / CSV / JSON export
- validation / temporal / network-integrity visibility

## CLI

Node.js 20+; CI validates with Node.js 24.

```bash
npm run validate
npm run export
```

Exports:

- `data/master-schedule.csv`
- `data/master-schedule.json`
- `data/schedule-stats.json`
- `data/cpm-report.json`
- `data/validation-report.json`

## Repository structure

```text
gantt-chart/
├── index.html
├── app.js
├── style.css
├── timing.css
├── package.json
├── README.md
├── data/
│   └── installment-control-points.csv
├── docs/
│   ├── wbs-architecture.md
│   ├── source-mapping.md
│   ├── assumptions.md
│   ├── cpm-method.md
│   ├── logic-notes.md
│   ├── v04-source-control-mapping.md
│   └── v05-system-test-mapping.md
├── src/
│   ├── schedule-core.js
│   ├── schedule-validation.js
│   ├── normalize-schedule.js
│   ├── logic-repairs-v2.js
│   ├── timing-provenance.js
│   ├── network-integration-v3.js
│   ├── task-control-gates-v4.js
│   ├── system-test-detail-v5.js
│   ├── post-integration-repairs-v4.js
│   ├── cpm-analysis.js
│   ├── critical-driver.js
│   ├── closeout-detail.js
│   ├── plans-09-16.js
│   ├── plans-02-08.js
│   ├── plan-01-physical.js
│   └── build-schedule.js
├── scripts/
│   ├── validate.mjs
│   └── export.mjs
└── .github/workflows/validate.yml
```

## Source / assumption policy

- `basis_type = SOURCE` — activity/control requirement explicitly stated by a source plan.
- `basis_type = DERIVED` — schedulable activity decomposed from a source-defined process.
- `basis_type = ASSUMPTION` — proposal-level detail added to form a usable schedule.
- `timing_basis = SOURCE` — exact day/window supported by source material.
- `timing_basis = ASSUMPTION` — exact detailed date/duration/lag is a proposal allowance.

The benchmark PDF is **never** used as a source of dates, durations or dependencies.

## Contract-baseline items still to replace / confirm

- actual NTP / approved working calendar / weather calendars
- full BOQ quantity and cost mapping
- approved IFC / shop-drawing issue dates
- vendor-confirmed procurement lead times
- production rates / crew compositions
- exact installment due dates where not explicitly stated
- approved environmental / heritage coordinates and restrictions
- approved Method Statements / ITPs / JSEAs / permits
- final equipment schedule and commissioning matrix
- final workfront / area-handover constraints

See the files under `docs/` for the audit trail.
