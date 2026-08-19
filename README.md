# Integrated Master Gantt — โครงการพัฒนาแหล่งท่องเที่ยวห้วยขาแข้ง

Repository นี้พัฒนา **Integrated Master Schedule** จากแผนที่ 1–16 ของข้อเสนอ โดยใช้ไฟล์ `26.08.17 แผนงานก่อสร้างห้วยขาแข้ง หลัก.pdf` เป็น benchmark เฉพาะ **ระดับความละเอียดของ WBS / Activity Breakdown** เท่านั้น ไม่คัดลอกวัน ระยะเวลา หรือ logic ของตัวอย่างมาใช้เป็นฐานของแผนฉบับนี้

## Baseline v0.1

- Project duration: **1,200 project days**
- Contract installment structure: **497 installments**
- Generated detailed activities: **866 activities**
- Milestones / gates: **93**
- Proposal critical-chain candidates: **98**
- Structural validation: **0 missing/duplicate/range errors**
- Dependency cycle validation: **0 cycles**
- Source/derived/assumption distinction is retained per row

> Detailed leaf durations and lags not explicitly stated in Plans 1–16 are proposal planning allowances and are tagged `ASSUMPTION`. They are not represented as TOR-stated durations.

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

## Interactive Gantt

Open `index.html` through a static web server or GitHub Pages. The viewer supports:

- Plan 01–16 filtering
- Zone and discipline filtering
- SOURCE / DERIVED / ASSUMPTION filtering
- Critical-only view
- Search by ID / WBS / building / activity / responsible party
- Collapse / expand by Plan and Building/Area
- Zoomed 1,200-day timeline
- Click-through activity detail with predecessor logic and evidence
- CSV / JSON export from the browser
- Validation status and temporal advisory visibility

Because the viewer uses ES modules, do not open it as a raw `file://` page if the browser blocks module imports. A simple static server is sufficient.

## CLI generation / validation

Node.js 20+; no external npm dependencies.

```bash
npm run validate
npm run export
```

`npm run export` generates:

- `data/master-schedule.csv`
- `data/master-schedule.json`
- `data/schedule-stats.json`
- `data/validation-report.json`

GitHub Actions executes validation and exports the same files as a workflow artifact.

## Repository structure

```text
gantt-chart/
├── index.html
├── app.js
├── style.css
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

- `SOURCE` — source document explicitly states the constraint/activity/control point.
- `DERIVED` — decomposed from a source-defined process into schedulable activities.
- `ASSUMPTION` — proposal-level detailed duration/lag/sequence allowance needed to form a usable network where the source does not supply the number.

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
