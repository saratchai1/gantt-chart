# Source Mapping — แผนที่ 1–16 → Integrated Master Schedule

เอกสารนี้ระบุว่าแต่ละแผนมีบทบาทต่อ schedule อย่างไร เพื่อป้องกันการสร้าง Gantt แบบแยก 16 ชุดที่ไม่เชื่อมกัน

| Plan | Source plan | Schedule role | Gate / output สำคัญ |
|---|---|---|---|
| 01 | แผนการดำเนินการโครงการ | Physical delivery backbone / CPM | Workfront release, construction, testing, handover, critical path |
| 02 | แผนงบประมาณก่อสร้าง | Commercial / installment / payment overlay | BOQ-WBS mapping, payment-readiness, cash flow, installment 1–497 |
| 03 | แผนการจัดการสถานที่ | Site logistics / temporary facilities / workfront readiness | Site setup, temp utilities, access, laydown, workfront release, restoration |
| 04 | แผนอัตรากำลัง | Resource loading / mobilization / transfer / demobilization | Competency, manpower ramp-up, shift readiness, phase transfer |
| 05 | แผนการใช้เครื่องจักรกล | Plant readiness / operation / maintenance overlay | Plant permit, route/ground check, operator assignment, maintenance |
| 06 | แผนการจัดหาวัสดุ | Procurement and long-lead chain | Submittal → approval → PO → production → FAT → delivery → MIR → release |
| 07 | แผนควบคุมคุณภาพ | QA/QC gate network | PQP, Method Statement, ITP, Hold/Witness Point, inspection, test, NCR closure |
| 08 | แผนความปลอดภัย อาชีวอนามัย | HSE gate / PTW / emergency controls | JSEA, PTW, induction, lift/hot work/excavation/LOTO/near-water controls |
| 09 | แผนจราจร | Traffic / delivery logistics | Route survey, booking, call-forward, heavy delivery, emergency route |
| 10 | แผนสิ่งแวดล้อม | Environmental readiness / monitoring / restoration | Baseline, erosion/water/dust/noise/waste controls, monitoring, restoration |
| 11 | แผนบริหารเอกสารอัตโนมัติ | CDE/EDMS workflow | Controlled revision, submittal/RFI/NCR workflows, evidence and archive |
| 12 | แผนติดตามความก้าวหน้า | Schedule update / evidence / reporting engine | Baseline, daily/weekly/monthly capture, 3-week lookahead, recovery plan |
| 13 | แผน BIM / Digital Twin | BIM coordination / 4D / 5D / as-built / AIM | BEP, clash, 4D/5D mapping, field verification, as-built BIM, Digital Twin |
| 14 | แผน Application / AI | Field application + AI-assisted inspection / reporting | Requirements, test, pilot, UAT, go-live, human review, performance monitoring |
| 15 | แผน Carbon Footprint | Carbon data / calculation / reporting overlay | Boundary/method, EF register, activity data, QA, periodic/final carbon report |
| 16 | แผนป้องกันผลกระทบต่อมรดกโลก | Sensitive-area gate / monitoring / rehabilitation | Approved boundary, no-go zone, permit, wildlife/water/fire monitoring, restoration |

## Source-derived controlling facts

### Plan 01 — Project framework
- ระยะเวลารวม 1,200 วัน
- 497 งวด
- 6 กลุ่มหลัก: เตรียมการ, Area A, Area B, Area C, Area D, ปิดโครงการ
- ช่วงงวดหลัก:
  - 1–24 งานอำนวยการและเตรียมการ
  - 25–317 Area A
  - 318–348 Area B
  - 349–383 Area C
  - 384–492 Area D
  - 493–497 ส่งมอบและปิดโครงการ
- Control windows ระดับ critical-path narrative:
  - D1–90 survey / initial plan approval
  - D31–180 temporary site systems / workfront readiness
  - D31–270 detailed design / approvals / long-lead procurement
  - D181–600 main structure Area A
  - D421–840 architecture / MEP Area A
  - D301–960 B/C/D + external systems
  - D841–1080 landscape / integration / closeout preparation
  - D1081–1200 commissioning / as-built / O&M / handover

### Plan 02 — Commercial control
- ใช้เลขงวด 1–497 เป็นรหัสกลางเชื่อม schedule, WBS, BOQ, drawing, inspection และ payment certificate
- งวดต้นทางที่ระบุชัด: งวด 1, 2, 3 และ 24 มี milestone / evidence เฉพาะ
- งวด 493–497 เป็น final closeout packages: cleaning / as-built / system test / O&M / asset register
- งานที่ยังมี NCR หรือหลักฐานไม่ครบไม่ถือว่า payment-ready

### Plan 03 — Site readiness
- Workfront จะไม่เปิดก่อน access, temporary utilities, barricade และ JSEA พร้อม
- Site layout ต้องควบคุมทางคน/รถ, emergency route, warehouse, plant yard, fuel/maintenance, no-go zones
- Area D ใช้ permit และ controlled route เข้มกว่า area อาคาร

### Plan 04 — Workforce
- Manpower ไม่ใช่จำนวนคงที่ตลอด 1,200 วัน
- Mobilization / transfer / demobilization ต้องตาม workfront, remaining quantity, productivity, skill mix และ risk
- Area D ต้องมี conservation/environment/wildlife competency coverage
- Closeout phase ลด production labor และคง commissioning/BIM/document/HSE/engineering teams

### Plan 05 — Plant
- Mobilization ต้องผ่าน equipment document, condition, operator, route, ground-bearing, work method / JSEA
- Area D จำกัด plant size / route / fueling / servicing ตาม sensitivity
- มี pre-use, maintenance, breakdown/recovery และ demobilization controls

### Plan 06 — Procurement
- Material lifecycle: requirement → approval → vendor → PO → production → transport → receipt → storage/issue → installation/handover
- ห้ามสั่งซื้อก่อน material approval และห้ามติดตั้งก่อน inspection/testing release
- Long-lead equipment ต้องเชื่อมกับ schedule และ shop drawing / FAT / interface information
- QR / asset ID ใช้ traceability ตั้งแต่ receipt ถึง installed asset

### Plan 07 — Quality
- PQP, Method Statement และ ITP ต้องมาก่อนแต่ละ work package
- Hold / Witness / Review / Surveillance points เป็น gate จริง
- Progress จะเป็น complete เมื่อ accepted evidence ครบ; NCR ที่ยังไม่ปิดทำให้ status ค้าง
- Final phase รวม integrated testing, punch/NCR closure, as-built, O&M และ quality dossier

### Plan 08 — HSE
- Risk register, JSEA/JSA และ PTW เป็น readiness gate ก่อนกิจกรรมเสี่ยง
- Permit categories ครอบคลุม excavation, height, lifting, electrical/LOTO, hot work, confined space, near-water, chemical/fuel
- Monitoring cadence มี pre-shift, during shift, before high-risk work, after abnormal weather/event, weekly, monthly
- Stop-work / incident / root-cause / restart workflow ต้องตรวจสอบย้อนหลังได้

### Plan 09 — Traffic
- Route register / traffic plan ต้องมาจาก route survey จริง
- Delivery ใช้ booking / call-forward และห้าม queue หน้าประตู
- Heavy/oversize lifting delivery ต้องมี route check / trial / specific approval
- Heavy rain, flood, wildfire, wildlife, damaged route สามารถหยุด/เปลี่ยน routing ได้

### Plan 10 — Environment
- Aspect-impact register ครอบคลุม soil, water, air, noise, vegetation, wildlife, community, waste
- Workfront เปิดเมื่อ controls / monitoring / responsible persons พร้อม
- มี baseline / monitoring / abnormal event / corrective action / reinspection / restoration cycle

### Plan 11 — EDMS/CDE
- ใช้ controlled record ID, revision, status, reviewer/approver, effective date, WBS, area, installment และ audit trail
- Published records แก้ทับไม่ได้ ต้องสร้าง revision ใหม่
- Document readiness เชื่อม schedule / quality / payment / handover

### Plan 12 — Progress
- Baseline / update ใช้ WBS + activity + data date + revision เดียวกัน
- Field evidence ต้องมี before / during / after ตาม risk
- Daily / weekly / monthly / installment reporting ใช้ dataset เดียว
- Recovery plan ถูก trigger เมื่อ variance มีแนวโน้มกระทบ critical path

### Plan 13 — BIM
- BEP / CDE / naming / classification / model responsibilities ต้องพร้อมก่อน production
- Model object เชื่อม WBS, activity, BOQ, area, installment, quality และ asset ID
- 4D/5D ใช้ประกอบ schedule/payment แต่ไม่แทน accepted field measurement
- As-built BIM → asset information → Digital Twin หลังผ่าน verification/testing

### Plan 14 — Application / AI
- Application เป็น field-work platform; AI เป็น assistive layer ไม่ใช่ผู้อนุมัติ
- AI result ต้องมี source, model/version, confidence, human review
- Lifecycle: requirements → design → development/configuration → testing → controlled pilot → go-live → operation/improvement → handover/exit
- ต้องมี offline operation, security, rollback และ manual fallback

### Plan 15 — Carbon
- Carbon boundary ครอบคลุม direct, purchased energy และ significant indirect emissions
- ใช้ traceable activity data + emission factor + conversion / GWP rules
- Reporting phases อ้างอิง 1–24, 25–317, 318–383, 384–492, 493–497
- Final phase ปิด missing data, factors, actions, verification, final report, archive/data dictionary

### Plan 16 — World Heritage Protection
- Boundary/sensitive-area information ต้องอ้างอิง approved survey / permit / map; ไม่กำหนด buffer จากการคาดเดา
- Area D / sensitive workfront ใช้ permit + no-go + monitoring + stop/restart control
- Monitoring ครอบคลุม water, soil, dust, noise, light, wildlife, vegetation, fire, waste, complaints
- Final restoration ต้องตรวจสภาพหลังงานและปิด rehabilitation evidence

## Benchmark rule

ไฟล์ `26.08.17 แผนงานก่อสร้างห้วยขาแข้ง หลัก.pdf` ใช้ตรวจว่า activity breakdown มีระดับละเอียดเพียงพอ เช่น Zone → Building → Discipline → Sub-activity และมี duration / bar รายกิจกรรม แต่ **ไม่ใช้ duration, start/finish หรือ dependency ของไฟล์ตัวอย่างเป็น input ของ baseline ฉบับนี้**
