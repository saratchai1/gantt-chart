import fs from 'node:fs';
import { masterSchedule, scheduleStats, localizationStats, editorialIssues, validation, cpm } from '../src/build-schedule.js';

fs.mkdirSync('data', { recursive: true });
fs.writeFileSync('data/validation-report.json', JSON.stringify({ stats:scheduleStats, localization:localizationStats, editorial_issues:editorialIssues, cpm, ...validation }, null, 2));

const nc=validation.network_coverage;
const sc=validation.scope_applicability;
console.log(`Activities: ${masterSchedule.length}`);
console.log(`Milestones: ${scheduleStats.milestones}`);
console.log(`Critical candidates: ${scheduleStats.critical}`);
console.log(`Computed zero-float activities: ${scheduleStats.computedCritical}`);
console.log(`Activities reachable from NTP: ${scheduleStats.connectedFromStart}`);
console.log(`Activities connected to final milestone: ${scheduleStats.connectedToFinal}`);
console.log(`Overall from-NTP coverage: ${nc.overall_from_start.connected}/${nc.overall_from_start.total} (${nc.overall_from_start.coverage_pct}%)`);
console.log(`Overall through-network coverage: ${nc.overall_through.connected}/${nc.overall_through.total} (${nc.overall_through.coverage_pct}%)`);
console.log(`Plan 01 physical from-NTP coverage: ${nc.plan01_physical_from_start.connected}/${nc.plan01_physical_from_start.total} (${nc.plan01_physical_from_start.coverage_pct}%)`);
console.log(`Plan 01 physical to-D1200 coverage: ${nc.plan01_physical_to_final.connected}/${nc.plan01_physical_to_final.total} (${nc.plan01_physical_to_final.coverage_pct}%)`);
console.log(`Plan 01 physical through NTP→D1200: ${nc.plan01_physical_through.connected}/${nc.plan01_physical_through.total} (${nc.plan01_physical_through.coverage_pct}%)`);
console.log(`Plan 01 handovers through NTP→D1200: ${nc.plan01_handovers_through.connected}/${nc.plan01_handovers_through.total} (${nc.plan01_handovers_through.coverage_pct}%)`);
console.log(`Scope applicability counts: ${Object.entries(sc.by_status).map(([k,v])=>`${k}=${v}`).join(', ')}`);
console.log(`WHERE_APPLICABLE rows requiring IFC/BOQ confirmation: ${sc.where_applicable.length}`);
console.log(`Thai primary activity names: ${localizationStats.thai_primary}/${localizationStats.total}`);
console.log(`Thai translation review required: ${localizationStats.review_required}`);
console.log(`Plan 01 Thai translation review required: ${localizationStats.plan01_review_required}`);
console.log(`Thai editorial English-term issues: ${editorialIssues.length}`);
console.log(`Thai translation statuses: ${Object.entries(localizationStats.by_status).map(([k,v])=>`${k}=${v}`).join(', ')}`);
console.log(`Non-Plan-01 activities without D1200 successor path: ${nc.unconnected_support_to_final.length}`);
if(nc.unconnected_support_to_final.length) console.log(`Remaining support exceptions: ${nc.unconnected_support_to_final.join(', ')}`);
console.log(`Representative critical path (${cpm.representative_path.length} activities): ${cpm.representative_path.join(' -> ')}`);
console.log(`Structure errors: ${validation.structure_errors.length}`);
console.log(`Dependency cycles: ${validation.dependency_cycles.length}`);
console.log(`Network integrity errors: ${validation.network_integrity_errors.length}`);
console.log(`Temporal warnings: ${validation.temporal_logic_warnings.length}`);
console.log(`Validation status: ${validation.status}`);

if (validation.temporal_logic_warnings.length) {
  console.log('TEMPORAL_WARNINGS_BEGIN');
  for (const w of validation.temporal_logic_warnings) console.log(JSON.stringify(w));
  console.log('TEMPORAL_WARNINGS_END');
}

if (validation.network_integrity_errors.length) {
  console.log('NETWORK_INTEGRITY_ERRORS_BEGIN');
  for (const e of validation.network_integrity_errors) console.log(e);
  console.log('NETWORK_INTEGRITY_ERRORS_END');
}

const localizationErrors=[];
if(localizationStats.thai_primary!==localizationStats.total){
  localizationErrors.push(`Thai-primary activity coverage is ${localizationStats.thai_primary}/${localizationStats.total}`);
}
if(localizationStats.plan01_review_required){
  localizationErrors.push(`Plan 01 has ${localizationStats.plan01_review_required} activity names requiring Thai review`);
}
if(editorialIssues.length){
  localizationErrors.push(`${editorialIssues.length} visible Thai fields still contain forbidden editorial English terms`);
}
if(localizationErrors.length){
  console.log('LOCALIZATION_ERRORS_BEGIN');
  for(const e of localizationErrors)console.log(e);
  for(const issue of editorialIssues)console.log(JSON.stringify(issue));
  console.log('LOCALIZATION_ERRORS_END');
}

if (validation.structure_errors.length || validation.dependency_cycles.length || validation.network_integrity_errors.length || localizationErrors.length) {
  console.error(JSON.stringify({
    structure_errors: validation.structure_errors,
    dependency_cycles: validation.dependency_cycles,
    network_integrity_errors: validation.network_integrity_errors,
    localization_errors: localizationErrors,
    editorial_issues:editorialIssues
  }, null, 2));
  process.exit(1);
}
