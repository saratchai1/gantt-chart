const thaiCollator = new Intl.Collator('th', { numeric: true, sensitivity: 'base' });

export const WORK_CATEGORY_ORDER = [
  'งานอำนวยการและเตรียมการ',
  'จุดควบคุมกรอบเวลาหลัก',
  'งานบริหารและจุดควบคุม',
  'งานสำรวจและปักผัง',
  'งานโครงสร้าง',
  'งานโครงสร้างและงานโยธา',
  'สถาปัตย์',
  'งานระบบประกอบอาคาร',
  'งานระบบไฟฟ้าและสื่อสาร',
  'งานระบบสุขาภิบาลและป้องกันอัคคีภัย',
  'งานระบบปรับอากาศและระบายอากาศ',
  'งานระบบพิเศษ',
  'งานระบบครัว',
  'งานระบบผลิตน้ำ',
  'งานครุภัณฑ์',
  'งานตกแต่งภายในและนิทรรศการ',
  'งานภูมิทัศน์และงานภายนอก',
  'งานภูมิทัศน์',
  'งานระบบระบายน้ำ',
  'งานระบบภายนอก',
  'งานสิ่งแวดล้อมและฟื้นฟู',
  'งานทดสอบและเดินระบบ',
  'งานตรวจสอบและแก้ไขข้อบกพร่อง',
  'งานแบบก่อสร้างจริงและส่งมอบ',
  'งานคู่มือและการฝึกอบรม',
  'งานทะเบียนทรัพย์สิน',
  'งานส่งมอบ',
  'งานปิดโครงการและส่งมอบ',
  'งานงบประมาณและบริหารสัญญา',
  'งานบริหารพื้นที่ก่อสร้าง',
  'งานสาธารณูปโภคชั่วคราว',
  'งานโลจิสติกส์พื้นที่ก่อสร้าง',
  'งานบริหารอัตรากำลัง',
  'งานบริหารเครื่องจักรกล',
  'งานจัดหาและวัสดุ',
  'งานควบคุมคุณภาพ',
  'งานความปลอดภัยและอาชีวอนามัย',
  'งานบริหารจราจร',
  'งานควบคุมเอกสาร',
  'งานควบคุมโครงการ',
  'งาน BIM',
  'งาน BIM 4D/5D',
  'งาน BIM ตามสภาพก่อสร้างจริง',
  'งานแบบจำลองสินทรัพย์ดิจิทัล',
  'งานโปรแกรมประยุกต์และ AI',
  'งานคาร์บอนฟุตพริ้นท์',
  'งานคุ้มครองมรดกโลก',
  'งานควบคุมเอกสารและอนุมัติแบบ',
  'งานสิ่งแวดล้อม',
  'จุดควบคุมการขนส่งพิเศษ',
  'จุดควบคุมงานใกล้น้ำ',
  'จุดควบคุมงานยก'
];

const categoryRank = new Map(WORK_CATEGORY_ORDER.map((name, index) => [name, index]));
const mainZoneCodes = new Set(['A', 'B', 'C', 'D']);
const zoneRank = new Map([
  ['PRE', -30],
  ['PROJECT', -20],
  ['A', 10],
  ['B', 20],
  ['C', 30],
  ['D', 40],
  ['CLOSEOUT', 90]
]);

export function cleanHierarchyText(value) {
  return String(value ?? '').replace(/\s+/g, ' ').trim();
}

export function naturalCompare(a, b) {
  return thaiCollator.compare(cleanHierarchyText(a), cleanHierarchyText(b));
}

export function canonicalZone(value) {
  const raw = cleanHierarchyText(value);
  if (!raw) return 'PROJECT';
  const compact = raw.toUpperCase().replace(/[\s_-]+/g, ' ').trim();
  const mainMatch = compact.match(/^(?:ZONE|AREA|โซน|พื้นที่)?\s*([ABCD])$/i);
  if (mainMatch) return mainMatch[1].toUpperCase();
  if (['PRE', 'PRECONSTRUCTION', 'PRE CONSTRUCTION', 'PREPARATION', 'เตรียมการ'].includes(compact)) return 'PRE';
  if (['PROJECT', 'PROJECT WIDE', 'PROJECT-WIDE', 'ALL', 'ALL AREAS', 'ทั้งโครงการ'].includes(compact)) return 'PROJECT';
  if (['CLOSEOUT', 'CLOSE OUT', 'HANDOVER', 'CO', 'ปิดโครงการ'].includes(compact)) return 'CLOSEOUT';
  return raw;
}

export function isMainZone(value) {
  return mainZoneCodes.has(canonicalZone(value));
}

export function zoneDisplayLabel(value) {
  const zone = canonicalZone(value);
  if (mainZoneCodes.has(zone)) return `โซนหลัก ${zone} (Zone ${zone})`;
  if (zone === 'PRE') return 'ช่วงเตรียมการโครงการ';
  if (zone === 'PROJECT') return 'งานสนับสนุนทั้งโครงการ';
  if (zone === 'CLOSEOUT') return 'ช่วงปิดโครงการและส่งมอบ';
  return `พื้นที่ดำเนินงาน ${zone}`;
}

export function zoneDisplayCode(value) {
  const zone = canonicalZone(value);
  if (mainZoneCodes.has(zone)) return zone;
  if (zone === 'PRE') return 'PRE';
  if (zone === 'PROJECT') return 'ALL';
  if (zone === 'CLOSEOUT') return 'CO';
  return zone;
}

export function compareZones(a, b) {
  const ca = canonicalZone(a);
  const cb = canonicalZone(b);
  const ra = zoneRank.has(ca) ? zoneRank.get(ca) : 60;
  const rb = zoneRank.has(cb) ? zoneRank.get(cb) : 60;
  return ra - rb || naturalCompare(ca, cb);
}

export function subzoneName(row) {
  const value = cleanHierarchyText(row?.building_area_th || row?.building_area);
  if (!value || /^project[- ]wide$/i.test(value)) return 'ทั้งโครงการ';
  return value;
}

export function workCategoryName(row) {
  return cleanHierarchyText(row?.work_category_th || row?.discipline_th || row?.discipline) || 'งานทั่วไป';
}

export function compareWorkCategories(a, b) {
  const ra = categoryRank.has(a) ? categoryRank.get(a) : 999;
  const rb = categoryRank.has(b) ? categoryRank.get(b) : 999;
  return ra - rb || naturalCompare(a, b);
}

export function compareActivities(a, b) {
  return naturalCompare(a?.wbs, b?.wbs)
    || Number(a?.start_day || 0) - Number(b?.start_day || 0)
    || naturalCompare(a?.activity_id, b?.activity_id);
}

function span(rows) {
  if (!rows.length) return [1, 1];
  return [
    Math.min(...rows.map(row => Number(row.start_day || 1))),
    Math.max(...rows.map(row => Number(row.finish_day || row.start_day || 1)))
  ];
}

function hierarchyKey(parts) {
  return parts.map(value => encodeURIComponent(cleanHierarchyText(value))).join('|');
}

function makeGroup(type, keyParts, label, rows, extra = {}) {
  const [startDay, finishDay] = span(rows);
  return {
    type,
    key: hierarchyKey(keyParts),
    label,
    rows,
    start_day: startDay,
    finish_day: finishDay,
    count: rows.length,
    ...extra
  };
}

function groupRows(rows, keyFn) {
  const map = new Map();
  for (const row of rows) {
    const key = keyFn(row);
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(row);
  }
  return map;
}

export function buildWebHierarchy(rows, planNames = {}) {
  const sourceRows = [...rows].sort(compareActivities);
  const planMap = groupRows(sourceRows, row => cleanHierarchyText(row.plan_no).padStart(2, '0'));
  const plans = [];

  for (const [planNo, planRowsRaw] of [...planMap.entries()].sort(([a], [b]) => Number(a) - Number(b))) {
    const planRows = [...planRowsRaw].sort(compareActivities);
    const plan = makeGroup(
      'plan',
      ['plan', planNo],
      `แผน ${planNo} — ${planNames[planNo] || ''}`,
      planRows,
      { plan_no: planNo, zones: [] }
    );

    const zoneMap = groupRows(planRows, row => canonicalZone(row.zone));
    for (const [zoneCode, zoneRowsRaw] of [...zoneMap.entries()].sort(([a], [b]) => compareZones(a, b))) {
      const zoneRows = [...zoneRowsRaw].sort(compareActivities);
      const zone = makeGroup(
        'zone',
        ['plan', planNo, 'zone', zoneCode],
        zoneDisplayLabel(zoneCode),
        zoneRows,
        {
          plan_no: planNo,
          zone_code: zoneCode,
          display_code: zoneDisplayCode(zoneCode),
          main_zone: isMainZone(zoneCode),
          subzones: []
        }
      );

      const subzoneMap = groupRows(zoneRows, subzoneName);
      const subzoneEntries = [...subzoneMap.entries()].sort(([, aRows], [, bRows]) => {
        const aFirst = [...aRows].sort(compareActivities)[0];
        const bFirst = [...bRows].sort(compareActivities)[0];
        return compareActivities(aFirst, bFirst) || naturalCompare(subzoneName(aFirst), subzoneName(bFirst));
      });

      for (const [subzoneLabel, subzoneRowsRaw] of subzoneEntries) {
        const subzoneRows = [...subzoneRowsRaw].sort(compareActivities);
        const subzone = makeGroup(
          'subzone',
          ['plan', planNo, 'zone', zoneCode, 'subzone', subzoneLabel],
          subzoneLabel,
          subzoneRows,
          { plan_no: planNo, zone_code: zoneCode, works: [] }
        );

        const workMap = groupRows(subzoneRows, workCategoryName);
        for (const [workLabel, workRowsRaw] of [...workMap.entries()].sort(([a], [b]) => compareWorkCategories(a, b))) {
          const workRows = [...workRowsRaw].sort(compareActivities);
          subzone.works.push(makeGroup(
            'work',
            ['plan', planNo, 'zone', zoneCode, 'subzone', subzoneLabel, 'work', workLabel],
            workLabel,
            workRows,
            { plan_no: planNo, zone_code: zoneCode, subzone: subzoneLabel }
          ));
        }
        zone.subzones.push(subzone);
      }
      plan.zones.push(zone);
    }
    plans.push(plan);
  }

  const activityIds = [];
  for (const plan of plans) {
    for (const zone of plan.zones) {
      for (const subzone of zone.subzones) {
        for (const work of subzone.works) {
          for (const row of work.rows) activityIds.push(row.activity_id);
        }
      }
    }
  }

  return {
    plans,
    activity_ids: activityIds,
    stats: {
      plans: plans.length,
      zones: plans.reduce((sum, plan) => sum + plan.zones.length, 0),
      main_zones: plans.reduce((sum, plan) => sum + plan.zones.filter(zone => zone.main_zone).length, 0),
      subzones: plans.reduce((sum, plan) => sum + plan.zones.reduce((inner, zone) => inner + zone.subzones.length, 0), 0),
      works: plans.reduce((sum, plan) => sum + plan.zones.reduce((inner, zone) => inner + zone.subzones.reduce((workSum, subzone) => workSum + subzone.works.length, 0), 0), 0),
      activities: activityIds.length
    }
  };
}
