const CATEGORY_REPLACEMENTS=new Map([
  ['งานสถาปัตย์','สถาปัตย์'],
  ['งานสถาปัตยกรรม','สถาปัตย์']
]);

const SUFFIX_CATEGORY_OVERRIDES=new Map([
  // The benchmark activity list places sanitary fixtures/equipment under the
  // architectural work package, while first-fix pipework and fire protection
  // remain under plumbing/fire services.
  ['SAN','สถาปัตย์']
]);

/**
 * Keep the visible WBS category terminology consistent with the benchmark
 * schedule image. This changes labels only; IDs, dates and dependencies are
 * untouched.
 */
export function normalizeThaiWorkCategoriesV8(rows){
  for(const row of rows){
    const suffix=row.activity_id.split('-').at(-1);
    const override=SUFFIX_CATEGORY_OVERRIDES.get(suffix);
    const category=override||CATEGORY_REPLACEMENTS.get(row.work_category_th)||row.work_category_th;
    const disciplineTh=CATEGORY_REPLACEMENTS.get(row.discipline_th)||row.discipline_th;
    if(category){
      row.work_category_th=category;
      row.discipline=category;
    }
    if(disciplineTh)row.discipline_th=disciplineTh;
  }
  return rows;
}
