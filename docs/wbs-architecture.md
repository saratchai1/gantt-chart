# WBS Architecture — Integrated Master Schedule

## 1. หลักการ

WBS นี้แยกสองแกนพร้อมกัน:

1. **Physical Delivery Backbone** — งานก่อสร้างจริงตามแผนที่ 1 แยก Area / Building / Discipline / Activity
2. **Control & Enabling Workstreams** — แผนที่ 2–16 ซึ่งทำหน้าที่เป็น predecessor, gate, concurrent control, inspection, evidence หรือ closeout ของงานก่อสร้างจริง

Activity ระดับต่ำสุดต้องเป็นสิ่งที่สามารถกำหนด Duration, Predecessor, Responsible Party และ Deliverable/Evidence ได้จริง ไม่ใช้ชื่อกว้าง เช่น “งานก่อสร้างอาคาร” เป็นกิจกรรมเดียว

## 2. ระดับ WBS

- **L0 Project** — โครงการทั้งหมด 1,200 วัน
- **L1 Plan / Delivery Stream** — Plan 01–16
- **L2 Zone / Management Domain**
- **L3 Building / Area / System / Process**
- **L4 Discipline / Control Process**
- **L5 Activity**
- **L6 Sub-activity / Hold Point / Inspection / Test / Milestone** เมื่อจำเป็น

## 3. Plan 01 — Physical Delivery Backbone

### 1.1 งานอำนวยการและเตรียมการ — งวด 1–24

แตกอย่างน้อยเป็น:

- Notice to Proceed / Mobilization start
- Project organization mobilization
- Survey control / X-Y-Z benchmarks
- Existing-condition survey
- Site boundary verification
- Site layout development / approval
- Temporary office and welfare facilities
- Temporary power / water / sanitation
- Temporary fence / access control
- Traffic and emergency access setup
- Environmental baseline / sensitive-area marking
- HSE induction and permit systems
- Initial BIM/CDE/Application setup
- Removal / relocation / enabling works
- Workfront release milestone

### 1.2 พื้นที่ A — งวด 25–317

#### 1.2.1 โซนทางเข้า–ออกหลัก — งวด 25–39

Discipline breakdown:
- Survey & setting out
- Earthwork / formation
- Drainage / underground utilities
- Structural works
- Architectural / finish works where applicable
- Electrical / communications
- Security / access-control / CCTV / network where applicable
- Road / paving / kerb / signage
- Landscape / softscape
- Testing / inspection / workfront handover

#### 1.2.2 จุดรับส่งผู้โดยสาร — งวด 40–52

- Survey / setting out
- Earthwork / subgrade
- Drainage
- Structural / hardscape
- Architectural elements
- Electrical / lighting / communications
- Traffic safety systems
- Landscape
- Inspection / testing / handover

#### 1.2.3 อาคารศูนย์การเรียนรู้ทางธรรมชาติ — งวด 53–170

- Survey / workfront release
- Excavation
- Blinding / foundation preparation
- Footing reinforcement
- Footing formwork
- Embedded services before pour
- Pre-pour hold point
- Footing concrete / curing / test
- Ground beam / slab
- RC frame / structural frame
- Roof structure
- Roof covering / waterproofing
- External wall / façade
- Internal partitions
- MEP first fix
- Electrical first fix
- Plumbing / fire first fix
- HVAC first fix
- ICT / security containment
- Internal wall finishes
- Floor finishes
- Ceilings
- Doors / windows
- Sanitary fixtures
- Painting
- MEP second fix
- Electrical second fix
- Plumbing / fire second fix
- HVAC equipment / balancing
- ICT / CCTV / network / AV / controls
- Exhibition / content / special systems where applicable
- Fixed furniture / built-in
- External works / connections
- Pre-commissioning
- Functional testing
- Integrated commissioning
- Snag / defect correction
- As-built capture / BIM update
- Area handover

#### 1.2.4 อาคารร้านอาหารและร้านกาแฟ — งวด 171–205

ใช้ building template เดียวกับ 1.2.3 และเพิ่ม:
- Kitchen equipment submittal/procurement interface
- Kitchen exhaust / make-up air
- Grease / drainage interfaces
- Kitchen equipment installation
- Kitchen system testing

#### 1.2.5 อาคารประชุมและอเนกประสงค์ — งวด 206–253

ใช้ building template และเพิ่ม:
- AV / sound system
- Communications / control
- Functional performance tests

#### 1.2.6 อาคารผลิตน้ำประปา — งวด 254–261

- Civil / foundation
- Tank / process structure
- Pumps / piping / valves
- Electrical power / controls
- Instrumentation
- Water-system flushing / testing
- Functional test / connection to utility network

#### 1.2.7 สนามหญ้าอเนกประสงค์ — งวด 262–277

- Survey / grading
- Earthwork
- Drainage
- Irrigation / utilities
- Soil preparation
- Turf / softscape
- Edge / hardscape
- Testing / establishment / acceptance

#### 1.2.8 ผังบริเวณและภูมิทัศน์ พื้นที่ A — งวด 278–310

- Site grading
- External drainage
- Roads / walkways / paving
- External utilities
- External electrical / lighting
- Landscape structures
- Softscape / planting
- Irrigation
- Signage / furniture
- Final grading / restoration
- Inspection / handover

#### 1.2.9 อาคารห้องนิรันดร์ พื้นที่ A — งวด 311–317

ใช้ small-building template:
- Setting out
- Foundation / structure
- Envelope / architecture
- MEP
- Finishes
- Testing
- Handover

### 1.3 พื้นที่ B — งวด 318–348

#### 1.3.1 อาคารห้องน้ำ — งวด 318–327
- Civil / structure
- Architecture / waterproofing
- Plumbing / sanitary
- Electrical
- Ventilation where applicable
- Fixtures / finishes
- Testing / handover

#### 1.3.2 อาคารขยะ — งวด 328–333
- Civil / structure
- Drainage / containment
- Architecture / protective finishes
- Electrical / lighting
- Environmental controls
- Inspection / handover

#### 1.3.3 ลานจอดรถ — งวด 334–345
- Survey / earthwork
- Subgrade
- Drainage
- Subbase / base
- Pavement
- Kerb / wheel stop
- Lighting / electrical
- Marking / signage
- Landscape
- Traffic-safety inspection / handover

#### 1.3.4 ผังบริเวณและภูมิทัศน์ พื้นที่ B — งวด 346–348
- External utilities / tie-ins
- Hardscape
- Softscape
- Restoration / final inspection

### 1.4 พื้นที่ C — งวด 349–383

#### 1.4.1 อาคารต้อนรับ — งวด 349–361
ใช้ building template

#### 1.4.2 บ้านเต็นท์ — งวด 362–380
แยกเป็น production batches / clusters เพื่อให้สามารถ overlap งานฐานราก โครงสร้าง สถาปัตย์ MEP และ landscape ได้โดยไม่ใช้ summary bar เพียงรายการเดียว

#### 1.4.3 อาคารห้องปั๊ม — งวด 381–383
- Civil / structure
- Pumps / piping
- Electrical / controls
- Testing / functional run
- Handover

### 1.5 พื้นที่ D — งวด 384–492

พื้นที่ D ใช้ **low-impact workfront template** เพิ่ม gate ด้านมรดกโลก สิ่งแวดล้อม ความปลอดภัย และการอนุญาตเฉพาะงานก่อนเปิดหน้าก่อสร้างทุกชุด

#### 1.5.1 พื้นที่ศึกษาธรรมชาติ 1 — งวด 384–409
#### 1.5.2 พื้นที่ศึกษาธรรมชาติ 2 — งวด 410–449
#### 1.5.3 พื้นที่ศึกษาธรรมชาติ 3 — งวด 450–480

แต่ละโซนแตกเป็น:
- Boundary / sensitive-area confirmation
- Before-condition record
- Work permit / workfront release
- Controlled access / route preparation
- Localized earthwork
- Trail / walkway foundation
- Structural / boardwalk / learning-point works where applicable
- Drainage / erosion control
- Utility / low-impact services where applicable
- Learning-point equipment / signage
- Landscape / planting / rehabilitation
- Environmental / wildlife monitoring during works
- After-condition survey
- Restoration acceptance

#### 1.5.4 ผังบริเวณและภูมิทัศน์ พื้นที่ D — งวด 481–491
- Controlled landscape completion
- Drainage / erosion stabilization
- Replanting / rehabilitation
- Removal of temporary controls
- Environmental acceptance

#### 1.5.5 แพสูบน้ำดิบ — งวด 492
- Workfront / near-water permit
- Access / lifting preparation
- Pontoon / structure installation
- Pump / piping
- Electrical / controls
- Safety inspection
- Functional test
- Environmental restoration

### 1.6 งานส่งมอบและปิดโครงการ — งวด 493–497

- Final cleaning / demobilization / restoration
- As-built drawings / As-built BIM
- System test records / integrated commissioning
- O&M manuals / warranties / training
- Asset register with value / serial number / location
- Final quality dossier
- Final environmental / heritage restoration dossier
- Final carbon-footprint report
- Final document archive / data export
- Final acceptance milestone

## 4. Plan 02–16 — Control & Enabling Streams

### Plan 02 Commercial / Budget / Payment
- Budget baseline
- Installment register 1–497
- BOQ-WBS mapping
- Cash-flow baseline
- Commitment control
- Progress measurement gate
- Quality acceptance gate
- Document completeness gate
- Payment application / certification cycles
- Forecast-to-complete updates
- Final-account closeout

### Plan 03 Site Management / Temporary Works
- Survey-based site logistics plan
- Site office / welfare setup
- Temporary utilities
- Warehouse / laydown / quarantine zones
- Plant yard / maintenance / fuel areas
- Pedestrian / vehicle separation
- Emergency routes / assembly points
- Workfront release per zone
- Layout change-control cycles
- Demobilization / restoration

### Plan 04 Workforce
- Organization mobilization
- Personnel / competency register
- Induction / authorization
- Discipline manpower loading
- Shift / fatigue controls
- Zone A ramp-up
- B/C transfer
- Zone D specialist mobilization
- Commissioning / digital / closeout team transition
- Daily / weekly / monthly manpower review
- Demobilization

### Plan 05 Mechanical / Plant
- Plant register
- Selection / capacity check
- Mobilization permit
- Operator / signaler assignment
- Route / ground-bearing check
- Pre-use inspection
- Preventive maintenance
- Breakdown / recovery controls
- Zone transfers
- Low-impact plant controls for Area D
- Demobilization

### Plan 06 Material / Procurement
สำหรับ material package สำคัญใช้ workflow:
- Requirement definition
- Material submittal
- Approval
- Vendor qualification
- PO / subcontract award
- Production / fabrication
- FAT / source inspection where required
- Delivery booking / transport
- Site receipt / MIR
- Testing / quarantine release
- Storage / issue
- Installation release
- Installed-record / QR / asset handover

Material families:
- Civil / structural
- Architectural
- MEP
- ICT / AV / CCTV / smart systems
- Landscape
- Hazardous / shelf-life-controlled materials

### Plan 07 Quality
- Project Quality Plan
- Discipline Method Statements
- ITPs
- Calibration register
- Mockups / samples
- Hold / Witness / Review / Surveillance points
- Material inspections
- Work inspections
- Tests
- NCR / corrective action / reinspection
- Punch / commissioning / quality dossier

### Plan 08 HSE
- HSE plan
- Risk register
- Induction / toolbox system
- JSEA/JSA
- Permit-to-work system
- Excavation permit
- Work-at-height controls
- Lifting permit / lift plan
- Electrical LOTO
- Hot-work permit / fire watch
- Confined-space permit
- Near-water rescue controls
- Chemical/fuel controls
- Wildlife / wildfire / heavy-rain emergency controls
- Shift / weekly / monthly inspections
- Emergency drills / incident investigation

### Plan 09 Traffic
- Route survey / route register
- Traffic management plan
- Gate / waiting / loading zones
- Delivery booking / call-forward
- Public-road controls
- Heavy / oversize delivery route checks
- Emergency route maintenance
- Weather / route closure controls
- Community notification / complaints
- Route repair / restoration

### Plan 10 Environment
- Aspect-impact register
- Baseline condition
- Boundary / no-go zones
- Erosion / sediment controls
- Water / drainage controls
- Dust / air controls
- Noise / vibration / light controls
- Chemical / fuel / spill controls
- Waste segregation / waste-yard setup
- Wildlife / wildfire controls
- Monitoring / abnormal-event response
- Area D enhanced controls
- Restoration / acceptance

### Plan 11 Document Management
- CDE/EDMS configuration
- Metadata / coding structure
- Roles / access
- Transmittal workflow
- Review / approval workflow
- Revision / supersession control
- RFI / submittal / NCR workflow
- Alerts / overdue escalation
- Schedule / progress / payment links
- Quality dossier links
- Handover archive / export

### Plan 12 Progress Control
- WBS / activity coding
- Baseline schedule
- Progress-measurement rules
- Before / during / after evidence matrix
- Daily field capture
- Weekly update
- 3-week lookahead
- Monthly report / S-curve
- Variance / critical-path review
- Recovery schedule when triggered
- Payment / quality reconciliation
- Data-date freeze / audit trail

### Plan 13 BIM / Digital Twin
- BIM readiness assessment
- BEP
- MIDP/TIDP
- CDE / naming / classification
- Discipline models
- Federated model
- Clash detection cycles
- Constructability review
- 4D mapping
- 5D / BOQ mapping
- Field verification
- As-built BIM
- Asset information model
- Digital Twin data mapping
- Sensor / interface validation
- Handover

### Plan 14 Application / AI
- Requirements / use-case register
- Architecture / data flow / UI prototype
- Configuration / development
- Integration
- Unit / integration / security / offline tests
- AI validation / performance baseline
- Controlled pilot
- User acceptance
- Go-live approval
- Training / rollout
- Human-review workflow
- Performance / drift / false-positive monitoring
- Change / rollback controls
- Data / model / configuration handover

### Plan 15 Carbon Footprint
- Boundary / method approval
- Source register
- Emission-factor register
- Data templates / evidence rules
- Baseline / significant-source screening
- Fuel / energy / material / transport / waste data collection
- Periodic data validation / reconciliation
- Calculation / QA
- Reduction-measure register
- Periodic reporting
- Final reconciliation / verification
- Final report / archive

### Plan 16 World Heritage Protection
- Approved boundary / sensitive-area map
- Baseline survey
- Wildlife / habitat / water / vegetation / fire-risk register
- No-go-zone setup
- Workfront permit gate
- Low-impact method / route approval
- Construction monitoring
- Incident / stop-work / restart workflow
- Stakeholder / authority coordination
- Before / during / after records
- Rehabilitation / invasive-species check
- Final restoration acceptance

## 5. กฎสำหรับ Detailed Activity Register

ทุก activity ต้องมีอย่างน้อย:

`activity_id, wbs, plan_no, zone, building_area, discipline, activity_name, duration_days, predecessor, relationship, lag_days, start_day, finish_day, milestone, critical, responsible_party, installment_start, installment_end, deliverable_evidence, basis_type, source_reference`

`basis_type` ใช้ค่า:
- `SOURCE` — ระบุโดยแผนต้นทางโดยตรง
- `DERIVED` — สรุป/แตกจากกระบวนการที่แผนต้นทางกำหนด
- `ASSUMPTION` — ระยะเวลา/lag/sequence รายละเอียดที่ต้องใช้เพื่อทำ CPM แต่ต้นทางไม่ได้ระบุตัวเลข

## 6. กฎสำคัญ

1. Benchmark ใช้เทียบ **granularity เท่านั้น**
2. ไม่ยก duration/date จาก benchmark
3. งานที่ต้องได้รับอนุมัติ / inspection / permit ต้องมี gate ใน logic
4. งานปิดทับต้องผ่าน Hold Point ก่อน
5. Progress `Complete` ต้องสัมพันธ์กับ accepted quality evidence
6. Payment-ready ต้องผ่าน physical + quality + document gates
7. Area D ต้องมี heritage/environment/work-permit gate ก่อนเปิด workfront
8. Final handover ต้องรวม commissioning + as-built + O&M + asset + archive + restoration + carbon final report
