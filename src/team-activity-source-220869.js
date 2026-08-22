export const TEAM_SOURCE_METADATA = Object.freeze({
  source_file: 'ส่งให้ดร.ก้อง 220869.xlsx',
  source_sheet: 'Sheet1',
  source_date_code: '220869',
  source_type: 'TEAM_APPROVED_SCOPE_HEADINGS',
  timing_note: 'ไฟล์ต้นทางระบุหัวข้องาน โซน และรายการกิจกรรม แต่ไม่ระบุวันเริ่ม วันสิ้นสุด ระยะเวลา หรือความสัมพันธ์งาน',
  imported_google_sheet_id: '1uFVR0XeQV7xkYlAik_fCy4NpqqA06WR48qBRTCAr5Qo'
});

const activity = (source_row, source_label, mapping_key, options = {}) => ({
  source_row,
  source_label,
  display_label: options.display_label || source_label.trim(),
  mapping_key,
  source_issue: options.source_issue || '',
  normalization_note: options.normalization_note || ''
});

const zone = (zone_code, source_row, source_label, activities) => ({
  zone_code,
  source_row,
  source_label: source_label.trim(),
  activities
});

const work = (work_code, source_row, source_label, zones) => ({
  work_code,
  source_row,
  source_label: source_label.trim(),
  zones
});

export const TEAM_WORK_SECTIONS = Object.freeze([
  work('W01', 1, 'งานโครงสร้าง', [
    zone('A', 2, 'โซนพิพิธภัณฑ์มรดกโลกห้วยขาแข้ง (zone A)', [
      activity(3, 'โซนทางเข้า-ออก หลัก', 'A_ENTRANCE', { display_label: 'โซนทางเข้า–ออกหลัก', normalization_note: 'ปรับเครื่องหมายขีดเพื่อการแสดงผลเท่านั้น' }),
      activity(4, 'โซนอาคารรับรอง อาคารพิพิธภัณฑ์และนิทรรศการ', 'A_MUSEUM'),
      activity(5, 'โซนอาคารร้านอาหารและร้านกาแฟ', 'A_RESTAURANT'),
      activity(6, 'โซนอาคารประชุม และอเนกประสงค์', 'A_MEETING'),
      activity(7, 'อาคารผลิตน้ำประปา', 'A_WATER'),
      activity(8, 'โซนสนามหญ้าอเนกประสงค์', 'A_LAWN')
    ]),
    zone('B', 9, 'โซนพักค้างคืน 1 (zone B)', [
      activity(10, 'งานห้องน้ำ', 'B_BATHROOM_WORK'),
      activity(11, 'โซนอาคารห้องน้ำ', 'B_BATHROOM_BUILDING'),
      activity(12, 'งานผังบริเวณและปรับปรุงภูมิทัศน์', 'B_LANDSCAPE'),
      activity(13, 'งานจุดรวมขยะโครงการ', 'B_WASTE'),
      activity(14, 'งานครุภัณฑ์จัดจ้างหรือสั่งทำ', 'B_EQUIPMENT')
    ]),
    zone('C', 15, 'โซนพักค้างคืน 2 (zone C)', [
      activity(16, 'โซนพื้นที่ต้อนรับ', 'C_RECEPTION'),
      activity(17, 'โซนพื้นที่บ้านเต็นท์', 'C_TENT')
    ]),
    zone('D', 18, 'โซนพื้นที่ศึกษาธรรมชาติ (zone D)', [
      activity(19, 'โซนศึกษาธรรมชาติ 3', 'D_NATURE3')
    ])
  ]),

  work('W02', 20, 'งานสถาปัตย์', [
    zone('A', 21, 'โซนพิพิธภัณฑ์มรดกโลกห้วยขาแข้ง (zone A)', [
      activity(22, 'โซนทางเข้า-ออก หลัก', 'A_ENTRANCE', { display_label: 'โซนทางเข้า–ออกหลัก' }),
      activity(23, 'โซนอาคารรับรอง อาคารพิพิธภัณฑ์และนิทรรศการ', 'A_MUSEUM'),
      activity(24, 'โซนอาคารร้านอาหารและร้านกาแฟ', 'A_RESTAURANT'),
      activity(25, 'โซนอาคารประชุม และอเนกประสงค์', 'A_MEETING'),
      activity(26, 'อาคารผลิตน้ำประปา', 'A_WATER')
    ]),
    zone('B', 27, 'โซนพักค้างคืน 1 (zone B)', [
      activity(28, 'งานห้องน้ำ', 'B_BATHROOM_WORK')
    ]),
    zone('C', 29, 'โซนพักค้างคืน 2 (zone C)', [
      activity(30, 'โซนพื้นที่ต้อนรับ', 'C_RECEPTION'),
      activity(31, 'โซนพื้นที่บ้านเต็นท์', 'C_TENT')
    ]),
    zone('D', 32, 'โซนพื้นที่ศึกษาธรรมชาติ (zone D)', [
      activity(33, 'โซนศึกษาธรรมชาติ 3', 'D_NATURE3')
    ])
  ]),

  work('W03', 34, 'งานระบบไฟฟ้าสื่อสาร', [
    zone('A', 35, 'โซนพิพิธภัณฑ์มรดกโลกห้วยขาแข้ง (zone A)', [
      activity(36, 'โซนทางเข้า-ออก หลัก', 'A_ENTRANCE', { display_label: 'โซนทางเข้า–ออกหลัก' }),
      activity(37, 'โซนอาคารรับรอง อาคารพิพิธภัณฑ์และนิทรรศการ', 'A_MUSEUM'),
      activity(38, 'โซนอาคารร้านอาหารและร้านกาแฟ', 'A_RESTAURANT'),
      activity(39, 'โซนอาคารประชุม และอเนกประสงค์', 'A_MEETING'),
      activity(40, 'อาคารผลิตน้ำประปา', 'A_WATER')
    ]),
    zone('B', 41, 'โซนพักค้างคืน 1 (zone B)', [
      activity(42, 'งานห้องน้ำ', 'B_BATHROOM_WORK')
    ]),
    zone('C', 43, 'โซนพักค้างคืน 2 (zone C)', [
      activity(44, 'โซนพื้นที่ต้อนรับ', 'C_RECEPTION'),
      activity(45, 'โซนพื้นที่บ้านเต็นท์', 'C_TENT')
    ]),
    zone('D', 46, 'โซนพื้นที่ศึกษาธรรมชาติ (zone D)', [
      activity(47, 'โซนศึกษาธรรมชาติ 3', 'D_NATURE3')
    ])
  ]),

  work('W04', 48, 'งานระบบสุขาภิบาลและป้องกันอัคคีภัย', [
    zone('A', 49, 'โซนพิพิธภัณฑ์มรดกโลกห้วยขาแข้ง (zone A)', [
      activity(50, 'โซนทางเข้า-ออก หลัก', 'A_ENTRANCE', { display_label: 'โซนทางเข้า–ออกหลัก' }),
      activity(51, 'โซนอาคารรับรอง อาคารพิพิธภัณฑ์และนิทรรศการ', 'A_MUSEUM'),
      activity(52, 'โซนอาคารร้านอาหารและร้านกาแฟ', 'A_RESTAURANT'),
      activity(53, 'โซนอาคารประชุม และอเนกประสงค์', 'A_MEETING'),
      activity(54, 'อาคารผลิตน้ำประปา', 'A_WATER')
    ]),
    zone('B', 55, 'โซนพักค้างคืน 1 (zone B)', [
      activity(56, 'งานห้องน้ำ', 'B_BATHROOM_WORK')
    ]),
    zone('C', 57, 'โซนพักค้างคืน 2 (zone C)', [
      activity(58, 'โซนพื้นที่ต้อนรับ', 'C_RECEPTION'),
      activity(59, 'โซนพื้นที่บ้านเต็นท์', 'C_TENT')
    ]),
    zone('D', 60, 'โซนพื้นที่ศึกษาธรรมชาติ (zone D)', [
      activity(61, 'โซนศึกษาธรรมชาติ 3', 'D_NATURE3')
    ])
  ]),

  work('W05', 62, 'งานระบบปรับอากาศและระบายอากาศ', [
    zone('A', 63, 'โซนพิพิธภัณฑ์มรดกโลกห้วยขาแข้ง (zone A)', [
      activity(64, 'โซนทางเข้า-ออก หลัก', 'A_ENTRANCE', { display_label: 'โซนทางเข้า–ออกหลัก' }),
      activity(65, 'โซนอาคารรับรอง อาคารพิพิธภัณฑ์และนิทรรศการ', 'A_MUSEUM'),
      activity(66, 'โซนอาคารร้านอาหารและร้านกาแฟ', 'A_RESTAURANT'),
      activity(67, 'โซนอาคารประชุม และอเนกประสงค์', 'A_MEETING'),
      activity(68, 'อาคารผลิตน้ำประปา', 'A_WATER')
    ]),
    zone('C', 69, 'โซนพักค้างคืน 2 (zone C)', [
      activity(70, 'โซนพื้นที่ต้อนรับ', 'C_RECEPTION'),
      activity(71, 'โซนพื้นที่บ้านเต็นท์', 'C_TENT')
    ])
  ]),

  work('W06', 72, 'งานตกแต่งภายใน', [
    zone('A', 73, 'โซนพิพิธภัณฑ์มรดกโลกห้วยขาแข้ง (zone A)', [
      activity(74, 'โซนทางเข้า-ออก หลัก', 'A_ENTRANCE', { display_label: 'โซนทางเข้า–ออกหลัก' }),
      activity(75, 'โซนอาคารรับรอง อาคารพิพิธภัณฑ์และนิทรรศการ', 'A_MUSEUM'),
      activity(76, 'โซนอาคารร้านอาหารและร้านกาแฟ', 'A_RESTAURANT'),
      activity(77, 'โซนอาคารประชุม และอเนกประสงค์', 'A_MEETING')
    ]),
    zone('B', 78, 'โซนพักค้างคืน 1 (zone B)', [
      activity(79, 'งานห้องน้ำ', 'B_BATHROOM_WORK')
    ]),
    zone('C', 80, 'โซนพักค้างคืน 2 (zone C)', [
      activity(81, 'โซนพื้นที่ต้อนรับ', 'C_RECEPTION')
    ]),
    zone('D', 82, 'โซนพื้นที่ศึกษาธรรมชาติ (zone D)', [
      activity(83, 'โซนศึกษาธรรมชาติ 3', 'D_NATURE3')
    ])
  ]),

  work('W07', 84, 'งานครุภัณฑ์จัดจ้างหรือสั่งทำ', [
    zone('A', 85, 'โซนพิพิธภัณฑ์มรดกโลกห้วยขาแข้ง (zone A)', [
      activity(86, 'โซนทางเข้า-ออก หลัก', 'A_ENTRANCE', { display_label: 'โซนทางเข้า–ออกหลัก' }),
      activity(87, 'โซนอาคารรับรอง อาคารพิพิธภัณฑ์และนิทรรศการ', 'A_MUSEUM'),
      activity(88, 'โซนอาคารร้านอาหารและร้านกาแฟ', 'A_RESTAURANT'),
      activity(89, 'โซนอาคารประชุม และอเนกประสงค์', 'A_MEETING'),
      activity(90, 'อาคารผลิตน้ำประปา', 'A_WATER')
    ]),
    zone('B', 91, 'โซนพักค้างคืน 1 (zone B)', [
      activity(92, 'โซนลานจอดรถ', 'B_PARKING')
    ]),
    zone('C', 93, 'โซนพักค้างคืน 2 (zone C)', [
      activity(94, 'โซนพื้นที่ต้อนรับ', 'C_RECEPTION'),
      activity(95, 'โซนพื้นที่บ้านเต็นท์', 'C_TENT')
    ]),
    zone('D', 96, 'โซนพื้นที่ศึกษาธรรมชาติ (zone D)', [
      activity(97, 'โซนศึกษาธรรมชาติ 3', 'D_NATURE3')
    ])
  ]),

  work('W08', 98, 'งานภูมิทัศน์', [
    zone('A', 99, 'โซนพิพิธภัณฑ์มรดกโลกห้วยขาแข้ง (zone A)', [
      activity(100, 'โซนทางเข้า-ออก หลัก', 'A_ENTRANCE', { display_label: 'โซนทางเข้า–ออกหลัก' }),
      activity(101, 'โซน Drop-off', 'A_DROPOFF'),
      activity(102, 'โซนอาคารรับรอง อาคารพิพิธภัณฑ์และนิทรรศการ', 'A_MUSEUM'),
      activity(103, 'โซนอาคารร้านอาหารและร้านกาแฟ', 'A_RESTAURANT'),
      activity(104, 'โซนอาคารประชุม และอเนกประสงค์', 'A_MEETING'),
      activity(105, 'อาคารผลิตน้ำประปา', 'A_WATER'),
      activity(106, 'โซนสนามหญ้าอเนกประสงค์', 'A_LAWN'),
      activity(107, 'งานผังบริเวณและปรับปรุงภูมิทัศน์', 'A_LANDSCAPE'),
      activity(108, 'ห้องปั๊มและถังเก็บน้ำ', 'A_PUMP_TANK'),
      activity(109, 'งานครุภัณฑ์จัดจ้างหรือสั่งทำ', 'A_EQUIPMENT')
    ]),
    zone('B', 110, 'โซนพักค้างคืน 1 (zone B)', [
      activity(111, 'โซนลานจอดรถ', 'B_PARKING'),
      activity(112, 'งานผังบริเวณและปรับปรุงภูมิทัศน์', 'B_LANDSCAPE'),
      activity(113, 'จุดรวมขยะโครงการ', 'B_WASTE'),
      activity(114, 'งานครุภัณฑ์จัดจ้างหรือสั่งทำ', 'B_EQUIPMENT')
    ]),
    zone('C', 115, 'โซนพักค้างคืน 2 (zone C)', [
      activity(116, 'โซนพื้นที่ต้อนรับ', 'C_RECEPTION'),
      activity(117, 'โซนพื้นที่บ้านเต็นท์', 'C_TENT'),
      activity(118, 'ห้องปั๊มและถังเก็บน้ำ', 'C_PUMP_TANK'),
      activity(119, 'ครุภัณฑ์จัดจ้างหรือสั่งทำ', 'C_EQUIPMENT')
    ]),
    zone('D', 120, 'โซนพื้นที่ศึกษาธรรมชาติ (zone D)', [
      activity(121, 'โซนศึกษาธรรมชาติ 1', 'D_NATURE1'),
      activity(122, 'โซนศึกษาธรรมชาติ 2', 'D_NATURE2'),
      activity(123, 'โซนศึกษาธรรมชาติ 3', 'D_NATURE3')
    ])
  ]),

  work('W09', 124, 'งานระบบพิเศษ', [
    zone('A', 125, 'โซนพิพิธภัณฑ์มรดกโลกห้วยขาแข้ง (zone A)', [
      activity(126, 'โซนทางเข้า-ออก หลัก', 'A_ENTRANCE', { display_label: 'โซนทางเข้า–ออกหลัก' }),
      activity(127, 'โซนพื้นที่ศึกษาธรรมชาติ (zone D)rop-off', 'A_DROPOFF', {
        display_label: 'โซน Drop-off',
        source_issue: 'SOURCE_TEXT_MALFORMED',
        normalization_note: 'ข้อความต้นทางมีการแทรก “โซนพื้นที่ศึกษาธรรมชาติ (zone D)” หน้าคำว่า rop-off; ใช้ “โซน Drop-off” เพื่อจับคู่ Gantt โดยคงข้อความต้นทางไว้ตรวจสอบ'
      }),
      activity(128, 'โซนอาคารรับรอง อาคารพิพิธภัณฑ์และนิทรรศการ', 'A_MUSEUM'),
      activity(129, 'โซนอาคารร้านอาหารและร้านกาแฟ', 'A_RESTAURANT'),
      activity(130, 'โซนอาคารประชุม และอเนกประสงค์', 'A_MEETING'),
      activity(131, 'อาคารผลิตน้ำประปา', 'A_WATER'),
      activity(132, 'โซนสนามหญ้าอเนกประสงค์', 'A_LAWN')
    ]),
    zone('B', 133, 'โซนพักค้างคืน 1 (zone B)', [
      activity(134, 'โซนลานจอดรถ', 'B_PARKING')
    ]),
    zone('C', 135, 'โซนพักค้างคืน 2 (zone C)', [
      activity(136, 'โซนพื้นที่บ้านเต็นท์', 'C_TENT')
    ]),
    zone('D', 137, 'โซนพื้นที่ศึกษาธรรมชาติ (zone D)', [
      activity(138, 'โซนศึกษาธรรมชาติ 1', 'D_NATURE1'),
      activity(139, 'โซนศึกษาธรรมชาติ 3', 'D_NATURE3')
    ])
  ])
]);

const specialCost = (source_row, number, source_label, mapping_key, continuation_rows = []) => ({
  source_row,
  number,
  source_label,
  display_label: [source_label, ...continuation_rows.map(row => row.text)].join(' ').replace(/\s+/g, ' ').trim(),
  mapping_key,
  continuation_rows
});

export const TEAM_SPECIAL_COSTS = Object.freeze([
  specialCost(141, 1, 'ค่าใช้จ่ายทำรั้วชั่วคราว', 'SC_TEMP_FENCE'),
  specialCost(142, 2, 'ค่าใช้จ่ายที่เกิดจากการกำหนดให้ใช้นั่งร้านพิเศษเพื่อความปลอดภัยต่อคนงานก่อสร้าง', 'SC_SPECIAL_SCAFFOLD'),
  specialCost(143, 3, 'และค่าใช้จ่ายในการทำระบบป้องกันฝุ่นตามข้อบังคับตามกฎหมายและระเบียบที่เกี่ยวข้อง', 'SC_DUST_CONTROL'),
  specialCost(144, 4, 'ค่าใช้จ่ายสำหรับอุปกรณ์เครื่องจักรกลพิเศษในการก่อสร้าง', 'SC_SPECIAL_PLANT'),
  specialCost(145, 5, 'ค่าใช้จ่ายกรณีไม่อนุญาตให้คนงานพักในบริเวณที่ก่อสร้าง', 'SC_OFFSITE_WORKER_ACCOMMODATION', [
    { source_row: 146, text: '(ค่าพาหนะไป-กลับ ที่พักและค่าเช่าที่)' }
  ]),
  specialCost(147, 6, 'ค่าใช้จ่ายอากาศยานไร้คนขับ', 'SC_DRONE'),
  specialCost(148, 7, 'ค่าใช้จ่ายในการรื้อถอน โยกย้าย ล้อมย้ายสิ่งปลูกสร้าง ต้นไม้ ฯลฯ', 'SC_RELOCATION_DEMOLITION'),
  specialCost(149, 8, 'ค่าใช้จ่ายในการก่อสร้างสำนักงานสนาม / หรือค่าเช่าสำนักงานสนามเคลื่อนที่', 'SC_FIELD_OFFICE', [
    { source_row: 150, text: 'พร้อมอุปกรณ์สำนักงาน ( สำหรับผู้ว่าจ้าง )' }
  ]),
  specialCost(151, 9, 'ค่าใช้จ่ายในการจัดหางานอำนวยความสะดวกสำหรับบุคลากร', 'SC_EMPLOYER_FACILITIES', [
    { source_row: 152, text: 'ของผู้ว่าจ้างตลอดระยะเวลาโครงการ' }
  ]),
  specialCost(153, 10, 'ค่าใช้จ่ายในการทำความสะอาดก่อนออกจากไซต์งานก่อสร้างสู่ที่สาธารณะ', 'SC_SITE_EXIT_CLEANING'),
  specialCost(154, 11, 'ค่าใช้จ่ายในการทดสอบเฉพาะทาง', 'SC_SPECIALIST_TESTING')
]);

export function flattenTeamSourceActivities() {
  const physical = [];
  for (const section of TEAM_WORK_SECTIONS) {
    for (const zoneGroup of section.zones) {
      for (const item of zoneGroup.activities) {
        physical.push({
          source_kind: 'PHYSICAL_SCOPE',
          work_code: section.work_code,
          work_label: section.source_label,
          work_source_row: section.source_row,
          zone_code: zoneGroup.zone_code,
          zone_label: zoneGroup.source_label,
          zone_source_row: zoneGroup.source_row,
          ...item
        });
      }
    }
  }

  const special = TEAM_SPECIAL_COSTS.map(item => ({
    source_kind: 'SPECIAL_COST',
    work_code: 'W10',
    work_label: 'ค่าใช้จ่ายพิเศษตามข้อกำหนดทุกรายการ',
    work_source_row: 140,
    zone_code: 'PROJECT',
    zone_label: 'ทั้งโครงการ',
    zone_source_row: 140,
    source_issue: '',
    normalization_note: '',
    ...item
  }));

  return [...physical, ...special];
}

export const TEAM_SOURCE_ACTIVITY_COUNT = flattenTeamSourceActivities().length;
