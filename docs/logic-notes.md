# Integrated Schedule Logic Notes — Baseline v0.5

## 1. เป้าหมายของ network

Schedule นี้ไม่ได้วางแผนที่ 1–16 เป็นเส้นขนานที่แยกกัน แต่สร้าง **physical delivery network** แล้วให้แผนควบคุมอื่นทำหน้าที่เป็น gate / enabling activity / concurrent control / closeout requirement ของงานจริง

`NTP → Readiness → Physical Workfront → Task-level Controls → Construction / Installation → Precommissioning → Package-specific Test Packs → Integrated Commissioning → Handover → CP Convergence → Closeout → D1200`

v0.4 เพิ่ม task-level HSE / environmental / quality gates; v0.5 เพิ่ม system-test branches ตาม principal package scope ที่ Plan 1 ระบุ โดยยังคงแยก source requirement ออกจาก exact detailed timing assumption

## 2. Source CP windows retained

- CP-01: D1–90 — survey / benchmark / initial plan approval
- CP-02: D31–180 — field office / temporary utilities / fence / access / workfront readiness
- CP-03: D31–270 — detailed design / approvals / long-lead procurement
- CP-04: D181–600 — foundations / main structure Area A
- CP-05: D421–840 — architecture / MEP Area A
- CP-06: D301–960 — Areas B/C/D + external systems
- CP-07: D841–1080 — landscape / detail completion / system integration
- CP-08: D1081–1200 — commissioning / as-built / O&M / handover

Boundary audit milestones:

- `P01-CP05-GATE` — D840
- `P01-CP06-GATE` — D960

CP-07 starts after CP-05. CP-06 controls CP-07 **finish** because source windows overlap; it is not converted into a false global FS chain.

Detailed leaf activities inside these windows are proposal planning allowances unless the source gives an explicit day.

## 3. Workfront readiness logic

Area release combines:

- temporary/site-access and logistics readiness
- workforce competency and active coverage
- plant-personnel authorization and applicable active plant support
- HSE / JSEA / PTW readiness and active monitoring
- environmental readiness and active monitoring
- traffic-management / delivery controls
- QA/QC Method Statement / ITP readiness and active inspection stream
- CDE / controlled-document readiness
- Area D heritage / sensitive-area permit and monitoring

Recurring controls use SS where they need to be active at workfront opening rather than falsely complete before construction starts.

## 4. Activity-level HSE / environmental / quality gates — retained from v0.4

### Excavation / earthwork

Building `EXC` and external `EW` receive:

1. Plan-8 excavation / earthwork JSEA + PTW readiness gate
2. Plan-10 localized environmental-control readiness gate
3. applicable active earthwork plant-support interface

### Roof / work at height

Roof work receives Plan-8 scaffold / working-platform / anchor / fall-protection / exclusion / rescue readiness. Frame progress is a rolling SS input rather than a whole-building FS constraint.

### Concealed work

Ceiling closure is downstream of a Plan-7 above-ceiling Hold Point. MEP / electrical / plumbing-fire / HVAC / ICT first-fix activities feed that Hold Point as rolling workfront inputs.

### Precommissioning / LOTO

Precommissioning receives Plan-8 electrical-isolation / LOTO / test-before-touch readiness, with progressive electrical second-fix as an applicable input.

### Raw-water pontoon

Dedicated gates cover:

- lift plan / competent team / exclusion / rescue
- heavy/special movement route / turning / bearing / unloading / booking / signaler readiness
- near-water weather / water / life-saving / watcher / communication / evacuation readiness
- existing Area-D environmental / heritage permit controls

No buffer distance, wildlife exclusion distance, water setback or new route is invented.

### Controls not fabricated

Plan 8 identifies hot work and confined space as risk categories, but the schedule does not create those task gates unless approved project methodology confirms that scope.

## 5. Building rolling-workfront logic

SS + lag is used where trades can progress by zones / rooms / fronts:

- Survey → excavation
- Excavation → blinding
- Ground structure → superstructure
- Superstructure → roof / envelope / partition / MEP first fix
- Partition → finishes
- first-fix services → concealed-work inspection / ceiling closure
- finishes → second fix / furniture

FS remains for true gates:

- material approval → PO
- pre-pour Hold Point → concrete
- concealed-work Hold Point → closure
- precommissioning → testing
- functional-test completion → integrated commissioning
- punch / NCR correction → handover

## 6. Package-specific test-pack logic — v0.5

The generic `FUNC` activity is retained as the package-level functional-test coordination / completion window. v0.5 inserts parallel detailed test packs between `PRECOM` and completion of `FUNC`:

`PRECOM → [Test Pack A | Test Pack B | ...] → FUNC completion → COMM`

Each detailed test pack is:

- FS from `PRECOM`
- run inside the existing `FUNC` window
- FF into `FUNC` so `FUNC` cannot finish while a principal system test pack is incomplete
- `basis_type=ASSUMPTION`
- `timing_basis=ASSUMPTION`

This gives detailed commissioning logic without changing the source CP-08 window or artificially serializing systems that can be tested in parallel.

Package profiles are based on Plan-1 principal scope:

- A23 Learning Centre — Electrical / Plumbing-Fire / HVAC / ICT-AV-Security
- A24 Restaurant-Cafe — Electrical / Water-Drainage-Grease / Kitchen Ventilation / Kitchen Equipment
- A25 Meeting Building — Electrical / AV-Communications
- A26 Water Production — Process Water / Electrical-Controls-Instrumentation
- A29 Eternal Room — Electrical / applicable Plumbing
- B31 Toilet — Sanitary-Drainage / applicable Electrical
- B32 Waste Building — Waste-Drainage-Environmental Interface / applicable Electrical
- C41 Reception — principal building-services tests
- C42A/B/C Tent Houses — Electrical / applicable Water-Sanitary-Drainage
- C43 Pump Building — Pump-Flow / Electrical-Controls

Where the source does not state a particular system explicitly, the row is worded **where applicable** and must be confirmed or deleted against IFC / BOQ / equipment schedules before contract baseline approval.

## 7. Plant interface logic

Active support streams use SS to relevant physical work:

- EARTH → excavation / earthwork
- STR → foundation / ground beams / frame / roof
- MEP → services installation / testing / commissioning
- LAND → paving / soil / planting / irrigation / restoration
- Area-D restricted plant → applicable sensitive / near-water work

This means plant support is active when needed, not complete before the workfront starts.

## 8. Procurement logic

`Requirement → Submittal → Approval → Vendor/Commercial Alignment → PO → Production/Fabrication → FAT/Source Inspection → Delivery → MIR/Test/Quarantine Clearance → Released for Installation`

Families: STR, ARC, MEP, ICT, LAND and Area-D special materials. Detailed lead times remain proposal assumptions pending vendor confirmation.

## 9. Quality logic

Quality completion requires evidence:

- PQP / Method Statement / ITP before work
- calibration / lab / sample-chain setup feeding Area QA readiness
- pre-pour Hold Point before concrete
- above-ceiling Hold Point before closure
- material inspection before installation release
- detailed system test packs before functional-test completion
- integrated commissioning after functional tests
- NCR / punch correction and reinspection before handover

`Physical Complete ≠ Payment Ready` unless accepted quality evidence is complete.

## 10. Commercial logic

497 installments are contractual references, not equal-duration time buckets.

Explicit source points retained: D30, D60, D90, D180 and final deliverables 493–497 inside D1200. The explicit early sequence feeds main-work readiness without fabricating dates for installments 4–23.

## 11. Area D / heritage logic

`approved boundary/baseline → no-go/access controls → heritage/environment/HSE permit → controlled access → localized work → monitoring → after-condition record → rehabilitation → restoration acceptance`

Project-specific buffer/setback/restriction values are not created without approved evidence.

## 12. CP-07 convergence

`P01-CO-001` is the CP-07 D841–D1080 integration window. Plan-01 package handovers converge on CP-07 completion using FF where concurrent integration is appropriate. CP-05 / CP-06 remain source-window critical narrative controls.

## 13. Supporting-plan / LOE closeout convergence

- Site area operations → site demobilization
- Workforce area/review streams → workforce closeout
- Plant operation streams → plant demobilization
- QA area monitoring → final QA dossier
- Traffic area controls → route restoration
- Environment monitoring / waste records → restoration / final restoration acceptance
- CDE cycles → CDE closeout
- Progress cycles → final progress reconciliation
- BIM coordination / 4D-5D → progressive as-built BIM
- AI monitoring → system/data handover
- Carbon area/prelim data → periodic calculation → final carbon report
- Heritage monitoring → final heritage restoration
- Commercial area cycles → forecast-to-complete reconciliation

`P04-WF-DEMOB` is intentionally retained as a terminal level-of-effort activity rather than force-made a final-acceptance predecessor.

## 14. Network validation

Latest validated v0.5 metrics:

- 986 total rows
- 986 / 986 reachable from NTP
- 983 / 986 with downstream D1200 path
- Plan-01 physical: 683 / 683 complete NTP→D1200
- Plan-01 handovers: 23 / 23 complete NTP→D1200
- 0 structure errors
- 0 dependency cycles
- 0 network-integrity errors
- 0 temporal warnings
- PASS

Plan-01 physical work fails validation if either complete NTP ancestry or a D1200 successor path is missing. Supporting-plan terminals are reported separately rather than automatically force-connected.

## 15. Critical-path status

`critical=Y` = source-window / proposal critical candidate. `computed_critical=Y` = zero accumulated float under the current proposal network.

Latest validated v0.5 calculation has **55 zero-float activities**. The deterministic representative driving chain remains **36 activities**, because the new detailed test packs add parallel commissioning branches without forcing an artificial change to the selected driving sequence.

This remains a proposal CPM until approved calendar, durations, vendor dates, production rates, IFC/BOQ, Method Statements, ITPs, JSEAs, permits and final commissioning/interface constraints are confirmed.
