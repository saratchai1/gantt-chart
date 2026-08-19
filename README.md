# Integrated Master Gantt — โครงการพัฒนาแหล่งท่องเที่ยวห้วยขาแข้ง

Repository นี้พัฒนา **Integrated Master Schedule** จากแผนที่ 1–16 ของข้อเสนอ โดยใช้ไฟล์ `26.08.17 แผนงานก่อสร้างห้วยขาแข้ง หลัก.pdf` เป็น benchmark เฉพาะ **ระดับความละเอียดของ WBS / Activity Breakdown** เท่านั้น ไม่คัดลอกวัน ระยะเวลา หรือ logic ของตัวอย่างมาใช้เป็นฐานของแผนฉบับนี้

## Baseline v0.1

- Project duration: **1,200 project days**
- Contract installment structure: **497 installments**
- Generated detailed activities: **872 activities**
- Milestones / gates: **93**
- Source-window / proposal critical-chain candidates: **104**
- Logic-driven computed zero-float activities: **40**
- Activities connected by dependency network to final D1200 milestone: **158**
- Structural validation: **0 missing/duplicate/range errors**
- Dependency cycle validation: **0 cycles**
- Temporal relationship validation: **0 warnings**
- JavaScript syntax validation: **PASS**

> Detailed leaf durations and lags not explicitly stated in Plans 1–16 are proposal planning allowances. Activity provenance (`basis_type`) and exact timing provenance (`timing_basis`) are stored separately so a source-stated requirement cannot be mistaken for a source-stated duration/date.

## Schedule architecture

**Plan 01** is the physical-delivery backbone. **Plans 02–16** are integrated as predecessor gates, enabling activities, concurrent controls, inspection/evidence processes and closeout requirements.

Main source work-package bands:

- Installments 1–24 — preliminaries / enabling
- 25–317 — Area A
- 318–348 — Area B
- 349–383 — Area C
- 384–492 — Area D
- 493–497 — closeout / handover

The source-level critical control windows are retained:

- D1–90 survey / control / initial approval
- D31–180 temporary site systems / workfront readiness
- D31–270 design / approvals / long-lead procurement
- D181–600 main structure Area A
- D421–840 architecture / MEP Area A
- D301–960 Areas B/C/D + external systems
- D841–1080 landscape / detail completion / integration
- D1081–1200 commissioning / as-built / O&M / handover

## CPM / critical-path analysis

The schedule stores two different concepts:

1. `critical` — source-window / proposal critical-chain candidate used while constructing the baseline.
2. `computed_critical` — zero-float activity calculated from the actual predecessor network and the current D1200 final milestone.

Additional CPM fields exported per activity:

- `computed_total_float_days`
- `computed_free_float_days`
- `network_to_final`
- `driving_successor`

The proposal driving chain is intentionally made traceable from NTP through the Area-A learning-centre structure/MEP/ICT/commissioning sequence, the source CP07 transition, final installment packages 493–497, and the D1200 acceptance milestone. Detailed driving lags remain proposal assumptions unless explicitly source-stated.

## Interactive Gantt

Open `index.html` through a static web server or GitHub Pages. The viewer supports:

- Plan 01–16 filtering
- Zone and discipline filtering
- Activity basis: SOURCE / DERIVED / ASSUMPTION
- Timing basis: SOURCE timing / ASSUMED timing
- Computed zero-float critical-only view
- Search by ID / WBS / building / activity / responsible party
- Collapse / expand by Plan and Building/Area
- Zoomed 1,200-day timeline
- Click-through activity detail with predecessor logic, evidence, float and driving successor
- CSV / JSON export from the browser
- Validation status and temporal advisory visibility

Because the viewer uses ES modules, do not open it as a raw `file://` page if the browser blocks module imports. A simple static server is sufficient.

## CLI generation / validation

Node.js 20+; CI currently validates with Node.js 24. No external npm dependencies.

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

GitHub Actions runs JavaScript syntax checks, schedule validation and export, then uploads the same generated files as an artifact.

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
│   └── logic-notes.md
├── src/
│   ├── schedule-core.js
│   ├── schedule-validation.js
│   ├── normalize-schedule.js
│   ├── logic-repairs-v2.js
│   ├── timing-provenance.js
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
- `basis_type = ASSUMPTION` — proposal-level activity content had to be added to make the network usable.
- `timing_basis = SOURCE` — exact day/window is explicitly supported by source material.
- `timing_basis = ASSUMPTION` — exact detailed date/duration/lag is a proposal planning allowance.

The benchmark PDF is **never** used as a source of dates, durations or dependencies.

## Contract-baseline items still to replace/confirm

Before this becomes an approved contract CPM baseline, replace proposal assumptions with:

- actual NTP / approved working calendar / holidays
- full BOQ quantity and cost mapping
- approved IFC / shop-drawing issue dates
- vendor-confirmed procurement lead times
- production rates and crew compositions
- exact installment due dates where not explicitly stated
- approved environmental / heritage sensitive-area coordinates and restrictions
- final testing & commissioning matrix

See `docs/assumptions.md`, `docs/source-mapping.md` and `docs/logic-notes.md` for the audit trail.
