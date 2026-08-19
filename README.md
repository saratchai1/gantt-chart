# Integrated Master Gantt — โครงการพัฒนาแหล่งท่องเที่ยวห้วยขาแข้ง

Repository นี้พัฒนา **Integrated Master Schedule** จากแผนที่ 1–16 ของข้อเสนอ โดยใช้ไฟล์ `26.08.17 แผนงานก่อสร้างห้วยขาแข้ง หลัก.pdf` เป็น benchmark เฉพาะ **ระดับความละเอียดของ WBS / Activity Breakdown** เท่านั้น ไม่คัดลอกวัน ระยะเวลา หรือ predecessor logic ของตัวอย่างมาใช้เป็นฐาน

## Baseline v0.4 — validated proposal network

Latest CI-validated schedule snapshot:

- Project duration: **1,200 project days**
- Contract installment structure: **497 installments**
- Detailed activities / gates: **957 rows**
- Milestones / gates: **178**
- Source-window / proposal critical-chain candidates: **106**
- Computed zero-float activities: **51**
- Reachable from NTP: **957 / 957 = 100%**
- Connected downstream to D1200: **954 / 957 = 99.7%**
- Plan-01 physical NTP→D1200: **654 / 654 = 100%**
- Plan-01 physical handovers NTP→D1200: **23 / 23 = 100%**
- Structural validation errors: **0**
- Dependency cycles: **0**
- Network-integrity errors: **0**
- Temporal relationship warnings: **0**
- Validation status: **PASS**

The only non-Plan-01 terminal intentionally left without a D1200 successor path is `P04-WF-DEMOB` — progressive manpower demobilization after area acceptance/handover. It is retained as a level-of-effort terminal rather than force-connected merely to produce a cosmetic 100% overall network metric.

> Detailed leaf durations, detailed gate days and lags not explicitly stated in Plans 1–16 are proposal planning allowances. Activity provenance (`basis_type`) and exact timing provenance (`timing_basis`) remain separate so a source-stated requirement cannot be mistaken for a source-stated duration/date.

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

Because these source windows overlap, the schedule does **not** force them into a false global FS chain. `P01-CP05-GATE` at D840 and `P01-CP06-GATE` at D960 are derived audit milestones using source-stated boundary timing; CP-06 controls CP-07 finish while CP-07 is allowed to start at D841.

## v0.4 activity-level control refinement

Baseline v0.4 moves several controls from Area-wide summary bars down to the actual construction workfront. These gates are source-derived, while their exact detailed day is an assumed proposal placement.

### Plan 08 — HSE / JSEA / Permit to Work

Explicit gates are now inserted for scopes supported by the source documents:

- building excavation and external earthwork → excavation / earthwork JSEA + PTW readiness
- roof work → work-at-height / scaffold / fall-rescue readiness
- precommissioning → electrical isolation / LOTO / test-before-touch readiness
- raw-water pontoon lifting → lift-plan / certified-team / exclusion-zone / emergency-readiness gate
- raw-water pontoon installation → near-water weather / rescue / evacuation readiness gate

The schedule does **not** fabricate a confined-space or hot-work gate merely because those activities are common in construction. They are to be added only where an approved project Method Statement confirms the work actually occurs.

### Plan 07 — QA/QC

The existing foundation pre-pour Hold Point remains. v0.4 also adds an explicit **above-ceiling concealed-services Hold Point** before ceiling closure. MEP / electrical / plumbing-fire / HVAC / ICT first-fix activities feed this gate using rolling-workfront SS logic rather than an unrealistic whole-building FS relationship.

Calibration / laboratory / sample-chain setup is now connected to each Area QA readiness package before inspection/testing cycles commence.

### Plan 10 — Environment

Building excavation and external earthwork receive localized environmental readiness gates covering the source-required boundary, drainage/sediment, spill/waste and monitoring readiness before impact-generating work. No project-specific threshold or permit criterion is invented.

### Plan 09 — Traffic

Raw-water pontoon lifting includes a special-movement / route / unloading-area readiness gate based on the source requirement for route survey, traffic authorization, booking/call-forward, bearing/turning/unloading readiness and signalers for heavy or special movements.

### Plan 16 — Heritage / sensitive workfront

Area-D task controls reuse approved-boundary / sensitive-workfront permit logic. No buffer distance, wildlife exclusion distance, water setback or new route is invented. Those remain dependent on approved project-specific coordinates and restrictions.

See `docs/v04-source-control-mapping.md` for the detailed source-to-schedule mapping.

## Integrated workfront readiness

Area release uses both one-time readiness gates and active control streams. Depending on the Area, the network includes:

- site office / temporary utility / logistics readiness
- workforce competency and active manpower coverage
- plant-personnel competency and active plant support
- QA/QC Method Statement / ITP readiness and inspection stream
- HSE / JSEA / PTW readiness and active HSE monitoring
- traffic plan / booking controls and active route control
- environmental readiness and active monitoring
- controlled-document / CDE readiness
- Area-D heritage / sensitive-area permit and monitoring

This prevents Plans 03–11 from existing as decorative parallel bars disconnected from physical construction.

## Plant-to-workfront integration

Plant control is integrated as an active support stream using SS relationships where appropriate:

- EARTH plant → excavation / earthwork
- STR plant → foundation / ground structure / frame / roof
- MEP plant → building-services installation and commissioning workfronts
- LAND plant → paving / soil / planting / irrigation / restoration
- restricted Area-D plant → relevant sensitive-area and near-water work

These links mean the required plant support is active when the workfront starts; they do not falsely require the entire plant campaign to finish before construction proceeds.

## Physical package completion integrity

Building handover waits for the applicable parallel branches, not only the commissioning chain. Depending on package scope, this includes:

- envelope / weather-tightness
- doors / glazing
- floor and final architectural finishes
- fixed furniture
- immediate external work
- specialist exhibition / kitchen / AV / process-equipment / control interfaces
- commissioning / functional test
- punch / correction / reinspection
- as-built / asset data

External packages similarly close final inspection, site furniture/signage and package environmental-monitoring records before handover.

## Procurement logic

Material families retain the detailed chain:

`Requirement → Submittal → Approval → Vendor alignment → PO → Production/Fabrication → FAT/Source Inspection → Delivery → MIR/Test/Quarantine Clearance → Released for Installation`

Families include STR, ARC, MEP, ICT, LAND and Area-D special materials. Detailed vendor lead times remain `timing_basis=ASSUMPTION` until vendor-confirmed dates are available.

## Commercial / installment logic

The schedule does **not** assume all 497 installments have equal time duration.

Explicit source control points retained:

- Installment 1 — D30
- Installment 2 — D60
- Installment 3 — D90
- Installment 24 — D180
- Installments 493–497 — source-stated final deliverable categories inside D1200; separate exact days are proposal CP-08 assumptions because the supplied plan does not state distinct exact due days

v0.4 connects the explicit early control-point sequence into main-work readiness without fabricating installment dates 4–23.

## Cross-plan closeout convergence

Final acceptance is downstream of the relevant closeout streams across Plans 02–16, including:

- final QA dossier / punch / NCR closure
- commissioning reconciliation
- As-Built / As-Built BIM / AIM / Digital Twin
- O&M / warranty / spares / training
- asset register / serial / location / value reconciliation
- CDE archive / controlled data export
- Application / AI system-data / registry / configuration handover
- site / plant / traffic demobilization and restoration
- environmental / heritage restoration acceptance
- final carbon inventory / report
- commercial forecast / cost reconciliation
- final progress / closeout reconciliation
- emergency-drill programme records
- final payment-package readiness

Level-of-effort streams are connected to an appropriate downstream reconciliation or acceptance node when they produce required closeout evidence. They are not made critical automatically.

## CPM / critical-path analysis

The schedule stores two separate concepts:

1. `critical` — source-window / proposal critical-chain candidate.
2. `computed_critical` — zero-float activity calculated from the current predecessor network to D1200.

Calculated/exported network fields include:

- `network_from_start`
- `network_to_final`
- `computed_total_float_days`
- `computed_free_float_days`
- `computed_critical`
- `driving_successor`

The validated representative zero-float path currently contains 36 activities and traces NTP through the Area-A learning-centre structure/MEP/ICT/commissioning sequence, CP-05 / CP-07 convergence, final installment packages 493–497 and D1200 final acceptance.

This is a **proposal-baseline network calculation against current bar placement**, not an approved contract CPM until the approved calendar, detailed dates, productivity and vendor lead times are confirmed.

## Network validation

`npm run validate` checks:

- unique IDs / day ranges / milestone durations
- missing predecessors
- dependency cycles
- temporal relationship consistency
- strict upstream ancestry from NTP
- downstream connectivity to D1200
- complete NTP→D1200 coverage for every Plan-01 physical activity
- complete NTP→D1200 coverage for every Plan-01 package handover
- remaining nonphysical/support network exceptions for review

A Plan-01 physical activity missing either NTP ancestry or a D1200 successor path is a **validation failure**.

## Interactive Gantt

Open `index.html` through a static server or GitHub Pages. The viewer supports:

- Plan 01–16, Zone and discipline filters
- SOURCE / DERIVED / ASSUMPTION activity basis
- SOURCE / ASSUMED timing basis
- computed zero-float-only view
- complete NTP→D1200-network-only view
- Plan → Building/Area → Discipline collapsible hierarchy
- dependency lines: Off / Driving only / All visible
- network status chip per activity
- total/free float and driving successor in the activity drawer
- search by ID / WBS / building / activity / responsible party
- 1,200-day zoomable timeline
- CSV / JSON export
- validation / temporal / network-integrity visibility

## CLI generation / validation

Node.js 20+; CI validates with Node.js 24. No external npm dependencies.

```bash
npm run validate
npm run export
```

`npm run export` generates:

- `data/master-schedule.csv`
- `data/master-schedule.json`
- `data/schedule-stats.json`
- `data/cpm-report.json`
- `data/validation-report.json`

GitHub Actions syntax-checks all JavaScript, validates the schedule, exports the data and uploads the generated files as a workflow artifact.

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
│   └── v04-source-control-mapping.md
├── src/
│   ├── schedule-core.js
│   ├── schedule-validation.js
│   ├── normalize-schedule.js
│   ├── logic-repairs-v2.js
│   ├── timing-provenance.js
│   ├── network-integration-v3.js
│   ├── task-control-gates-v4.js
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

- `basis_type = SOURCE` — activity/control requirement is explicitly stated by a source plan.
- `basis_type = DERIVED` — schedulable activity is decomposed from a source-defined process.
- `basis_type = ASSUMPTION` — proposal-level activity content was added where needed to form a usable programme.
- `timing_basis = SOURCE` — exact day/window is explicitly supported by source material.
- `timing_basis = ASSUMPTION` — exact detailed date/duration/lag is a proposal planning allowance.

The benchmark PDF is **never** used as a source of dates, durations or dependencies.

## Contract-baseline items still to replace / confirm

Before this becomes an approved contract CPM baseline, replace proposal assumptions with:

- actual NTP / approved working calendar / holidays / weather calendars
- full BOQ quantity and cost mapping
- approved IFC / shop-drawing issue dates
- vendor-confirmed procurement lead times
- production rates and crew compositions
- exact installment due dates where not explicitly stated
- approved environmental / heritage sensitive-area coordinates and restrictions
- approved Method Statements / ITPs / JSEAs / permits
- final testing & commissioning matrix
- final workfront / area handover constraints

See `docs/assumptions.md`, `docs/source-mapping.md`, `docs/cpm-method.md`, `docs/logic-notes.md` and `docs/v04-source-control-mapping.md` for the audit trail.
