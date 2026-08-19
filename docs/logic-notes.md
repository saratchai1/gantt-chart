# Integrated Schedule Logic Notes — Baseline v0.1

## 1. เป้าหมายของ network

Schedule นี้ไม่ได้วางแผนที่ 1–16 เป็นเส้นขนานที่แยกกัน แต่สร้าง **physical delivery network** แล้วให้แผนควบคุมอื่นทำหน้าที่เป็น gate / enabling activity / concurrent control / closeout requirement ของงานจริง

ตัวอย่าง logic หลัก:

`Workfront Survey / Boundary`  
→ `Environment + Heritage + HSE Readiness`  
→ `Integrated Site Workfront Release`  
→ `Survey / Setting Out`  
→ `Earthwork / Foundation / Structure`  
→ `Architecture + MEP rolling workfronts`  
→ `Inspection / Hold Points / Tests`  
→ `Pre-commissioning`  
→ `Functional Test`  
→ `Integrated Commissioning`  
→ `Snag / NCR Closure`  
→ `As-built / Asset Data`  
→ `Area Handover`

## 2. Source CP windows retained

แผนที่ 1 ให้ control windows ระดับโครงการซึ่งถูกเก็บเป็น hard framework:

- CP-01: D1–90 — survey / benchmark / initial plan approval
- CP-02: D31–180 — field office / temporary utilities / fence / access / workfront readiness
- CP-03: D31–270 — detailed design / approvals / long-lead procurement
- CP-04: D181–600 — foundations / main structure Area A
- CP-05: D421–840 — architecture / MEP Area A
- CP-06: D301–960 — Areas B/C/D + external systems
- CP-07: D841–1080 — landscape / detail completion / system integration
- CP-08: D1081–1200 — commissioning / as-built / O&M / handover

Detailed leaf activities inside these windows are proposal planning allowances unless the source gives an explicit day.

## 3. Workfront readiness logic

ทุก Area มี integrated release gate ซึ่งอ้างอิงอย่างน้อย:

- temporary/site access readiness
- HSE / JSEA / PTW readiness
- environmental readiness
- QA/QC method/ITP readiness
- Area D เพิ่ม heritage/sensitive-area permit gate

ไม่ใช้การเปิด workfront จากวันใน Gantt เพียงอย่างเดียว

## 4. Building rolling-workfront logic

อาคารขนาดใหญ่ไม่บังคับให้ทั้ง trade เสร็จทั้งอาคารก่อน trade ถัดไปเริ่ม เพราะไม่สมจริงสำหรับ proposal schedule ที่มีหลายห้อง/หลายแนวงาน

ดังนั้นใช้ SS + lag ในจุดที่สามารถทยอยส่งพื้นที่ได้ เช่น:

- Survey → excavation
- Excavation → blinding
- Ground structure → superstructure
- Superstructure → roof / envelope / partition / MEP first fix
- Partition → wall finish
- MEP first fix → ceiling closure
- Finishes → second fix / furniture

แต่ยังรักษา FS gate ในกิจกรรมที่ต้องผ่านก่อนจริง เช่น:

- Material submittal approval → PO
- Pre-pour Hold Point → concrete pour
- Pre-commissioning → functional test → integrated commissioning
- Punch/NCR closure → handover

## 5. Procurement logic

Material family workflow:

`Requirement` → `Submittal` → `Approval` → `Vendor/Commercial Alignment` → `PO` → `Production/Fabrication` → `FAT/Source Inspection` → `Delivery` → `MIR/Test/Quarantine Clearance` → `Released for Installation`

กลุ่มที่มี schedule chain แยก:

- STR — civil/structural materials
- ARC — architectural/envelope/finish materials
- MEP — major MEP equipment/panels/pumps/valves/controls
- ICT — AV/CCTV/network/smart systems
- LAND — landscape/irrigation/external furniture
- D — Area-D low-impact/trail/near-water special materials

Detailed lead times are explicitly tagged ASSUMPTION and shall be replaced by vendor-confirmed dates.

## 6. Quality logic

งานที่ปิดทับหรือมี acceptance gate ต้องเชื่อมกับ QA/QC:

- Method Statement / ITP ready before work package
- pre-pour inspection before concrete
- above-ceiling inspection before closure
- material inspection before release for installation
- system tests before commissioning
- NCR / punch correction and reinspection before handover

`Physical Complete` และ `Payment Ready` จึงไม่เท่ากันโดยอัตโนมัติ

## 7. Commercial logic

Payment overlay uses 497-installment register as contractual reference. Schedule does **not** assume all 497 installments have equal time duration.

Explicit source control points retained:

- Installment 1 — D30
- Installment 2 — D60
- Installment 3 — D90
- Installment 24 — D180
- Installments 493–497 — final closeout deliverables, all completed within D1200; exact separate due day is not fabricated where source does not state it

Payment-ready condition requires:

`measured physical quantity` + `accepted quality` + `controlled document evidence` + `no blocking NCR / duplicate claim`

## 8. Area D logic

Area D is treated as a sensitive low-impact program:

`approved boundary/baseline` → `no-go/access controls` → `specific heritage/environment/HSE workfront permit` → `controlled access` → `localized work` → `continuous monitoring` → `after-condition record` → `rehabilitation` → `restoration acceptance`

No buffer distance, wildlife restriction distance or water setback has been invented. These require approved project-specific evidence.

## 9. Closeout logic

Final acceptance at D1200 is downstream of:

- integrated commissioning
- final quality dossier / punch and NCR closure
- verified as-built / As-built BIM
- O&M / warranty / training
- asset register / serial / location / value reconciliation
- CDE archive / controlled data export
- environmental / heritage restoration acceptance
- final carbon-footprint reconciliation/report
- final payment-package readiness

## 10. Critical-path status

Rows marked `critical=Y` in v0.1 are **critical-chain candidates based on source CP windows and proposal sequencing**. They are not claimed as a final contract CPM float calculation until:

1. approved working calendar is known,
2. all detailed activity durations are replaced/confirmed,
3. all vendor lead times are confirmed,
4. exact interfaces and constraints are approved,
5. forward/backward pass is run on the contract-baseline network.
