# Integrated Schedule Logic Notes — Baseline v0.4

## 1. เป้าหมายของ network

Schedule นี้ไม่ได้วางแผนที่ 1–16 เป็นเส้นขนานที่แยกกัน แต่สร้าง **physical delivery network** แล้วให้แผนควบคุมอื่นทำหน้าที่เป็น gate / enabling activity / concurrent control / closeout requirement ของงานจริง

`NTP → Readiness → Physical Workfront → Task-level Controls → Construction / Installation → Inspection / Test → Handover → CP Convergence → Closeout → D1200`

Baseline v0.4 เพิ่มความละเอียดจาก Area-wide control ไปถึง **activity-level gates** ในงานที่ source ระบุความเสี่ยงหรือ Hold Point ชัดเจน โดยไม่สร้างกิจกรรมเสี่ยงที่ source / scope ยังไม่ยืนยัน

## 2. Source CP windows retained

- CP-01: D1–90 — survey / benchmark / initial plan approval
- CP-02: D31–180 — field office / temporary utilities / fence / access / workfront readiness
- CP-03: D31–270 — detailed design / approvals / long-lead procurement
- CP-04: D181–600 — foundations / main structure Area A
- CP-05: D421–840 — architecture / MEP Area A
- CP-06: D301–960 — Areas B/C/D + external systems
- CP-07: D841–1080 — landscape / detail completion / system integration
- CP-08: D1081–1200 — commissioning / as-built / O&M / handover

Detailed leaf activities inside these windows are proposal planning allowances unless the source gives an explicit day.

Boundary audit milestones:

- `P01-CP05-GATE` — D840
- `P01-CP06-GATE` — D960

CP-07 starts after CP-05. CP-06 controls CP-07 **finish** because the source windows overlap; it is not converted into a false global FS chain.

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

Readiness activities that run concurrently with construction use SS where appropriate; they are not falsely required to finish before work starts.

## 4. Activity-level HSE / environmental / quality gates — v0.4

### Excavation / earthwork

Building `EXC` and external `EW` activities receive:

1. Plan-8 excavation / earthwork JSEA + PTW readiness gate
2. Plan-10 localized environmental-control readiness gate
3. applicable active earthwork plant-support interface

The Plan-8 gate represents source-required excavation permit, ground/water/access/barricade/spoil/plant readiness. The Plan-10 gate represents boundary, drainage/sediment, spill/waste and monitoring readiness. Exact detailed gate day follows the proposal workfront and is `timing_basis=ASSUMPTION`.

### Roof / work at height

Building roof work receives a Plan-8 work-at-height gate covering scaffold / working platform / anchor / fall protection / exclusion / rescue readiness. The frame is a rolling SS input, not a false whole-building FS prerequisite.

### Above-ceiling concealed work

Ceiling closure receives an explicit Plan-7 Hold Point. First-fix MEP / electrical / plumbing-fire / HVAC / ICT activities feed the Hold Point as rolling-workfront inputs. Ceiling closure is FS from the released Hold Point.

### Precommissioning / LOTO

Building precommissioning receives a Plan-8 electrical-isolation / LOTO / test-before-touch readiness gate. Electrical second-fix is treated as a progressive workfront input where applicable.

### Raw-water pontoon

The D55 package has dedicated controls for:

- lifting-plan / certified lifting team / exclusion / rescue readiness
- heavy/special movement route / turning / bearing / unloading / booking / signaler readiness
- near-water weather / water-condition / life-saving / watcher / communication / evacuation readiness
- existing Area-D environmental / heritage sensitive-workfront permit controls

No buffer distance, wildlife exclusion distance, water setback or new route is invented.

### Controls intentionally not fabricated

Hot-work and confined-space are recognized by Plan 8 as risk categories, but v0.4 does **not** create project activities or task gates for them unless an approved project Method Statement confirms that scope.

## 5. Building rolling-workfront logic

SS + lag is used where trades can progress by zones/rooms/fronts, for example:

- Survey → excavation
- Excavation → blinding
- Ground structure → superstructure
- Superstructure → roof / envelope / partition / MEP first fix
- Partition → wall finish
- first-fix services → concealed-work inspection / ceiling closure
- finishes → second fix / furniture

FS remains for true gates, including:

- material approval → PO
- pre-pour Hold Point → concrete
- concealed-work Hold Point → closure
- precommissioning → functional test → integrated commissioning
- punch / NCR correction → handover

## 6. Plant interface logic

Active support streams are linked by SS to relevant physical work:

- EARTH → excavation / earthwork
- STR → foundation / ground beams / frame / roof
- MEP → service installation / testing / commissioning workfronts
- LAND → paving / soil / planting / irrigation / restoration
- Area-D restricted plant → applicable sensitive / near-water work

This means plant support is operational when needed; it does not require the entire plant campaign to finish before the physical activity starts.

## 7. Procurement logic

`Requirement → Submittal → Approval → Vendor/Commercial Alignment → PO → Production/Fabrication → FAT/Source Inspection → Delivery → MIR/Test/Quarantine Clearance → Released for Installation`

Families: STR, ARC, MEP, ICT, LAND and Area-D special materials. Detailed lead times are proposal assumptions pending vendor confirmation.

## 8. Quality logic

Quality completion requires evidence, not physical quantity alone:

- PQP / Method Statement / ITP before work
- calibration / lab / sample-chain setup feeding Area QA readiness
- pre-pour Hold Point before foundation concrete
- above-ceiling Hold Point before concealed-work closure
- material inspection before installation release
- tests before commissioning
- NCR / punch correction and reinspection before handover

`Physical Complete ≠ Payment Ready` unless accepted quality evidence is complete.

## 9. Commercial logic

497 installments are contractual references, not equal-duration time buckets.

Explicit source points retained: D30, D60, D90, D180 and final deliverables 493–497 within D1200. Baseline v0.4 connects the explicit early sequence into main-work readiness but does not fabricate dates for installments 4–23.

## 10. Area D / heritage logic

`approved boundary/baseline → no-go/access controls → heritage/environment/HSE workfront permit → controlled access → localized work → monitoring → after-condition record → rehabilitation → restoration acceptance`

Project-specific buffer/setback/restriction values are not created without approved evidence.

## 11. CP-07 project-wide convergence

`P01-CO-001` is the CP-07 D841–D1080 integration window. Plan-01 package handovers converge on CP-07 completion using FF where concurrent integration is appropriate. CP-05 / CP-06 remain the source-window critical narrative controls.

## 12. Supporting-plan / LOE closeout convergence

v0.4 connects supporting streams to suitable downstream reconciliation nodes rather than leaving them as logic islands:

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

`P04-WF-DEMOB` is intentionally retained as a terminal level-of-effort activity because it represents progressive manpower demobilization after area acceptance/handover and does not need to be force-made a final-acceptance predecessor.

## 13. Network validation

Latest validated v0.4 metrics:

- 957 total rows
- 957 / 957 reachable from NTP
- 954 / 957 with downstream D1200 path
- Plan-01 physical: 654 / 654 complete NTP→D1200
- Plan-01 handovers: 23 / 23 complete NTP→D1200
- 0 structure errors
- 0 dependency cycles
- 0 network-integrity errors
- 0 temporal warnings
- PASS

Plan-01 physical work fails validation if either full NTP ancestry or a D1200 successor path is missing. Supporting-plan terminals are reported separately for engineering review rather than automatically force-connected.

## 14. Critical-path status

`critical=Y` = source-window / proposal critical candidate. `computed_critical=Y` = zero accumulated float under the current proposal network.

Latest validated calculation has 51 zero-float activities and a 36-activity representative chain from NTP through the Area-A learning centre and CP-08 deliverable sequence to D1200.

This remains a proposal CPM until approved calendar, durations, vendor dates, production rates, Method Statements, ITPs, JSEAs, permits and final interface constraints are confirmed.
