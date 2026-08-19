# Scheduling Assumptions / Constraints — Baseline v0.1

เอกสารนี้แยก **สิ่งที่ source ระบุจริง** ออกจาก **planning assumption** ที่จำเป็นต่อการสร้าง detailed CPM/Gantt

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
4. Final handover sequence ต้องครอบคลุม cleaning/restoration, as-built, system tests, O&M, asset register และ controlled document handover
5. Area D เป็น sensitive workfront ต้องมี heritage/environment/HSE readiness gate ก่อนเปิดงาน
6. Quality acceptance และ evidence completeness เป็นเงื่อนไขก่อน progress/payment status

## B. Planning assumptions ที่ใช้ใน baseline v0.1

### B1. Calendar

- Schedule ใช้ **relative project day D1–D1200** เพราะเอกสารยังไม่ได้ให้ calendar start date ที่แน่นอนสำหรับ baseline นี้
- Duration ใน detailed activity register เป็น elapsed planning days สำหรับ proposal-level schedule; ก่อนนำเข้า contract baseline จริงต้อง map ไปยัง approved working calendar / holidays / weather calendar

### B2. Detailed durations

- Detailed durations ระดับ excavation / rebar / formwork / MEP first fix / finishes / testing ฯลฯ ไม่ได้ระบุตัวเลขครบในแผนที่ 1–16
- ตัวเลข detailed duration ใน v0.1 จึงเป็น **ASSUMPTION** ที่พัฒนาเพื่อ:
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
- `FF` — ใช้เฉพาะ control/reporting ที่ต้องจบพร้อม physical phase
- Lag ใช้เมื่อจำเป็นเพื่อแทน curing, review cycle, staggered workfront หรือ production lead time

### B5. Critical path

- `critical=true` ใน v0.1 หมายถึง **proposal baseline critical-chain candidate** ที่เชื่อมถึง Day 1200
- หลัง detailed network ทั้งหมดถูกสร้าง จะใช้ forward/backward pass เพื่อตรวจ total float และปรับ critical flags จาก computation
- ไม่มีการทำสีแดงด้วยมือเพื่อให้ดูเหมือน critical โดยไม่มี predecessor logic

### B6. Installment mapping

- เอกสารให้ installment range ของ work packages แต่ไม่ได้ให้ exact day-to-installment mapping สำหรับ 1–497 ทั้งหมด
- v0.1 เก็บ installment_start / installment_end ตาม source ที่มี และใช้ relative day schedule แยกต่างหาก
- ไม่สมมติว่า 497 งวดมีระยะเวลาเท่ากัน

### B7. Procurement lead time

- Lead time ของ long-lead materials/equipment ที่ source ไม่ให้ตัวเลขจะใส่เป็น planning allowance และทำเครื่องหมาย `ASSUMPTION`
- ก่อน contract baseline ต้องแทนด้วย vendor-confirmed lead time

### B8. Quantity / productivity / manpower

- Source ระบุวิธีคิด workforce จาก remaining quantity / productivity / workable days / workfront factor แต่ไม่มี BOQ quantity + productivity rate ครบทุก activity ในชุดเอกสารที่ใช้ทำ Gantt นี้
- v0.1 จึงยังไม่สร้าง resource-loaded manpower histogram แบบตัวเลขคนรายวัน
- Activity structure จะเตรียม field `resource_group` / `responsible_party` เพื่อรองรับข้อมูลดังกล่าวใน iteration ถัดไป

### B9. Area D

- ไม่สร้าง buffer distance / wildlife restriction / water setback ใหม่จากความรู้ทั่วไป
- ใช้คำว่า “approved boundary / sensitive-area / no-go zone” ตาม source จนกว่าจะมีพิกัดหรือระยะที่ได้รับอนุมัติ

### B10. Application / AI

- AI activity ใน schedule เป็น system-development / validation / assistive workflow เท่านั้น
- AI ไม่มี predecessor logic ที่ให้อำนาจอนุมัติ quality/payment อัตโนมัติ; human review เป็น mandatory gate

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

## D. Items to replace when more project data becomes available

- Approved project calendar / actual NTP date
- Complete BOQ quantity and cost mapping
- Vendor confirmed lead times
- Final design / IFC issue schedule
- Actual productivity rates / crew compositions
- Exact installment due dates 1–497
- Approved environmental/heritage sensitive-area coordinates and restrictions
- Final testing & commissioning matrix
