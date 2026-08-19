# Scheduling Assumptions / Constraints — Baseline v0.2

เอกสารนี้แยก **สิ่งที่ source ระบุจริง** ออกจาก **planning assumption** ที่จำเป็นต่อการสร้าง detailed CPM/Gantt โดยตั้งใจให้ผู้ตรวจสามารถตามกลับได้ว่าอะไรเป็น TOR/แผนที่ 1–16 และอะไรเป็น logic ที่ใช้สำหรับ proposal baseline

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
5. Final handover sequence ต้องครอบคลุม cleaning/restoration, as-built, system tests, O&M, asset register และ controlled document handover
6. Area D เป็น sensitive workfront ต้องมี heritage/environment/HSE readiness gate ก่อนเปิดงาน
7. Quality acceptance และ evidence completeness เป็นเงื่อนไขก่อน progress/payment status
8. Source windows สามารถซ้อนกันได้ จึงห้ามบังคับทุกช่วงเป็น global FS sequence หากขัดกับช่วงเวลาที่ source กำหนด

## B. Planning assumptions ที่ใช้ใน baseline v0.2

### B1. Calendar

- Schedule ใช้ **relative project day D1–D1200** เพราะเอกสารยังไม่ได้ให้ calendar start date ที่แน่นอนสำหรับ baseline นี้
- Duration ใน detailed activity register เป็น elapsed planning days สำหรับ proposal-level schedule; ก่อนนำเข้า contract baseline จริงต้อง map ไปยัง approved working calendar / holidays / weather calendar

### B2. Detailed durations

- Detailed durations ระดับ excavation / rebar / formwork / MEP first fix / finishes / testing ฯลฯ ไม่ได้ระบุตัวเลขครบในแผนที่ 1–16
- ตัวเลข detailed duration จึงเป็น **ASSUMPTION** ที่พัฒนาเพื่อ:
  1. ให้แต่ละ work package มี logic สมจริง
  2. รักษา source control windows และ 1,200-day completion
  3. ให้เกิด overlap ระหว่าง structure / architecture / MEP / procurement / quality / controls ตามธรรมชาติของโครงการ
- ห้ามอ้าง detailed duration เหล่านี้ว่าเป็นค่าที่ TOR ระบุ

### B3. Benchmark usage

- Benchmark ใช้เฉพาะระดับความละเอียดของการแตก WBS/Activity
- ไม่ copy start/finish, duration หรือ predecessor จาก benchmark

### B4. Relationship logic

Baseline ใช้ relationship หลัก:

- `FS` — predecessor เสร็จก่อน successor เริ่ม เช่น material approval → PO; pre-pour inspection → concrete pour
- `SS` — ให้กิจกรรมซ้อนกันเมื่อ workfront แยกได้ เช่น MEP first fix เริ่มหลัง partition/structure เปิดพื้นที่บางส่วน
- `FF` — ใช้กับ concurrent control/integration เมื่อ successor สามารถเริ่มก่อน predecessor จบ แต่ห้ามปิดก่อน stream นั้นเสร็จ
- `SF` — รองรับใน engine แต่หลีกเลี่ยงใน proposal network เว้นแต่มีเหตุผลเฉพาะ
- Lag ใช้เมื่อจำเป็นเพื่อแทน curing, review cycle, staggered workfront, production lead time หรือ source-window convergence

### B5. Source CP-05 / CP-06 / CP-07 convergence

- `P01-CP05-GATE` ที่ D840 และ `P01-CP06-GATE` ที่ D960 เป็น **DERIVED gate ที่ใช้ SOURCE timing** เพราะวัน boundary มาจาก source แต่ตัว milestone record ถูกสร้างเพื่อให้ network ตรวจสอบได้
- CP-07 D841–D1080 เริ่มหลัง CP-05 boundary
- CP-06 D301–D960 ซ้อนกับ CP-07 จึงเชื่อมเข้ากับ CP-07 ด้วย finish-control logic ไม่ใช่ global FS ที่จะเลื่อน CP-07 ไปเริ่มหลัง D960
- การกำหนด package ใดบ้างที่รวมเข้า CP-05/CP-06 gate เป็น proposal integration logic และต้องถูกแทน/ยืนยันเมื่อ detailed approved baseline ได้รับการอนุมัติ

### B6. Critical path

- `critical=Y` หมายถึง **source-window / proposal critical-chain candidate**
- `computed_critical=Y` หมายถึง zero accumulated float ไป D1200 ตาม current predecessor network และ current proposal bar placement
- `computed_total_float_days` / `computed_free_float_days` เป็น baseline-network calculation ไม่ใช่ approved contract float จนกว่าจะมี calendar / duration / constraint ที่อนุมัติครบ
- ไม่มีการทำสีแดงด้วยมือเพื่อให้ดูเหมือน critical โดยไม่มี predecessor logic

### B7. Physical-network integrity

- ทุก Plan-01 physical activity ใน Area A/B/C/D ต้องมี downstream path ถึง `P01-CO-006` D1200
- Parallel building branches เช่น envelope, door/glazing, floor, paint/final finish, furniture, external work และ specialist systems ต้อง feed package handover
- External packages ต้องปิด site furniture/signage และ monitoring evidence ก่อน handover
- Plan-01 physical activity ใดที่ไม่มี path ถึง D1200 เป็น validation failure

### B8. Supporting-plan / LOE interpretation

- ไม่บังคับให้ทุก recurring governance/control activity ของ Plans 02–16 เป็น critical predecessor เพราะหลายรายการมีลักษณะ **level-of-effort / monitoring / recurring control**
- แต่ supporting-plan readiness gate ที่ source ระบุว่าเป็นเงื่อนไขก่อนเปิดงาน ต้องเชื่อมเข้ากับ physical workfront จริง
- Baseline v0.2 เชื่อม competency, plant-personnel authorization, traffic management, controlled-document/CDE readiness, HSE, environment และ Area-D heritage permit เข้ากับ workfront release ตามความเกี่ยวข้อง
- Control stream ที่ใช้เป็น closeout evidence จะเชื่อมเข้ากับ final readiness/restoration/acceptance ด้วย FS หรือ FF ตามลักษณะงาน

### B9. Installment mapping

- เอกสารให้ installment range ของ work packages แต่ไม่ได้ให้ exact day-to-installment mapping สำหรับ 1–497 ทั้งหมด
- เก็บ `installment_start / installment_end` ตาม source ที่มี และใช้ relative-day schedule แยกต่างหาก
- ไม่สมมติว่า 497 งวดมีระยะเวลาเท่ากัน
- งวด 493–497 มี source deliverable ชัด แต่ไม่มี exact separate due day ในข้อมูลที่ใช้อยู่ จึงใช้ internal CP-08 day split เป็น ASSUMPTION เท่านั้น

### B10. Procurement lead time

- Lead time ของ long-lead materials/equipment ที่ source ไม่ให้ตัวเลขจะใส่เป็น planning allowance และทำเครื่องหมาย `ASSUMPTION`
- ก่อน contract baseline ต้องแทนด้วย vendor-confirmed lead time
- Procurement release ที่เป็น predecessor ของงานติดตั้งหมายถึง material approval / production / delivery / MIR/test/quarantine clearance ครบตาม family ที่เกี่ยวข้อง

### B11. Quantity / productivity / manpower

- Source ระบุวิธีคิด workforce จาก remaining quantity / productivity / workable days / workfront factor แต่ไม่มี BOQ quantity + productivity rate ครบทุก activity ในชุดเอกสารที่ใช้ทำ Gantt นี้
- v0.2 จึงยังไม่สร้าง resource-loaded manpower histogram แบบตัวเลขคนรายวัน
- Activity structure เก็บ `resource_group` / `responsible_party` เพื่อรองรับ resource loading ใน iteration หลังได้รับข้อมูลปริมาณและ productivity

### B12. Area D

- ไม่สร้าง buffer distance / wildlife restriction / water setback ใหม่จากความรู้ทั่วไป
- ใช้คำว่า “approved boundary / sensitive-area / no-go zone” ตาม source จนกว่าจะมีพิกัดหรือระยะที่ได้รับอนุมัติ
- งาน Area-D landscape และ raw-water pontoon ที่อยู่หลัง D960 ถูกเก็บใน overlapping CP-07 convergence แทนการบังคับย้อนหลังให้จบ D960 โดยไม่มี source leaf-level day support

### B13. Application / AI

- AI activity ใน schedule เป็น system-development / validation / assistive workflow เท่านั้น
- AI ไม่มี predecessor logic ที่ให้อำนาจอนุมัติ quality/payment อัตโนมัติ; human review เป็น mandatory gate
- Application / AI data/configuration handover ถูกนำเข้าร่วม final controlled-information closeout

### B14. Dependency visualization

- Interactive viewer สามารถแสดง dependency links ของ rows ที่มองเห็นอยู่
- `Driving only` แสดง link ที่ CPM engine ระบุเป็น representative driving successor
- `All visible` แสดง predecessor links เฉพาะคู่กิจกรรมที่ยังมองเห็นหลัง filter/collapse เพื่อป้องกันกราฟรกเกินไป
- การวาดเส้นเป็น visualization ของ stored predecessor data ไม่ได้สร้าง logic ใหม่

## C. Quality rules for generated schedule

1. ทุก leaf activity ต้องมี unique ID
2. Summary row ไม่ใช้เป็น predecessor ของ leaf activityถ้ามี leaf gate ที่เหมาะสมกว่า
3. `finish_day >= start_day`
4. ไม่มี activity เกิน D1200
5. Predecessor ต้องอ้าง activity ที่มีอยู่จริง
6. Milestone duration = 0
7. Physical work ที่ถูกปิดทับต้องมี inspection/hold-point predecessor
8. Installation ที่ใช้วัสดุ long-lead ต้องมี procurement-release predecessor
9. Area D workfront ต้องมี heritage/environment/HSE release predecessor
10. Final acceptance ต้องตามหลัง final commissioning / as-built / O&M / asset / archive / restoration / carbon-final streams
11. Plan-01 physical activities ต้องเชื่อมถึง D1200 final network
12. Source-stated day/window ต้องถูกแยกจาก assumed detailed timing ด้วย `timing_basis`
13. Activity content provenance ต้องถูกแยกจาก timing provenance ด้วย `basis_type` และ `timing_basis`

## D. Items to replace when more project data becomes available

- Approved project calendar / actual NTP date
- Complete BOQ quantity and cost mapping
- Vendor confirmed lead times
- Final design / IFC issue schedule
- Actual productivity rates / crew compositions
- Exact installment due dates 1–497
- Approved environmental/heritage sensitive-area coordinates and restrictions
- Final testing & commissioning matrix
- Approved detailed workfront / area handover sequence
