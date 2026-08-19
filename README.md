# Integrated Master Gantt — โครงการพัฒนาแหล่งท่องเที่ยวห้วยขาแข้ง

Repository นี้ใช้พัฒนา **Integrated Master Schedule** จากแผนที่ 1–16 ของข้อเสนอ โดยใช้ไฟล์ `26.08.17 แผนงานก่อสร้างห้วยขาแข้ง หลัก.pdf` เป็น benchmark เฉพาะ **ระดับความละเอียดของ WBS / Activity Breakdown** เท่านั้น ไม่คัดลอกวัน ระยะเวลา หรือ logic ของตัวอย่างมาใช้เป็นฐานของแผนฉบับนี้

## กรอบควบคุมหลัก

- ระยะเวลาโครงการ: **1,200 วัน** นับจาก Notice to Proceed / การส่งมอบพื้นที่ตามเงื่อนไขสัญญา
- งวดงาน: **497 งวด**
- โครงหลัก: งานอำนวยการและเตรียมการ → พื้นที่ A → พื้นที่ B → พื้นที่ C → พื้นที่ D → ส่งมอบและปิดโครงการ
- แผนที่ 1 เป็น physical-delivery backbone
- แผนที่ 2–16 เป็น control / enabling / support workstreams ที่เชื่อมกับ physical activities ด้วย predecessor, gate, hold point, deliverable และหลักฐาน
- Detailed durations / lags ที่ไม่มีระบุไว้ตรง ๆ ในแผนต้นทาง จะถูกทำเครื่องหมายเป็น **planning assumption** และเก็บ rationale ใน `docs/assumptions.md`

## โครงสร้าง repository

- `docs/wbs-architecture.md` — WBS architecture และกฎการแตกกิจกรรม
- `docs/source-mapping.md` — mapping แผนที่ 1–16 เข้ากับ schedule workstream
- `docs/assumptions.md` — scheduling assumptions / constraints / rules
- `data/` — activity register และ master schedule
- `scripts/` — ตัวสร้าง/ตรวจสอบ schedule
- `web/` — interactive Gantt viewer

## สถานะ

กำลังสร้าง baseline version `v0.1` โดยเน้นความละเอียดระดับเดียวกับ benchmark แต่ใช้ logic ที่พัฒนาจากแผนที่ 1–16 ของโครงการนี้เอง
