import fs from 'node:fs';
import { masterSchedule, scheduleStats, validation, cpm } from '../src/build-schedule.js';

fs.mkdirSync('data', { recursive: true });
fs.writeFileSync('data/validation-report.json', JSON.stringify({ stats:scheduleStats, cpm, ...validation }, null, 2));

console.log(`Activities: ${masterSchedule.length}`);
console.log(`Milestones: ${scheduleStats.milestones}`);
console.log(`Critical candidates: ${scheduleStats.critical}`);
console.log(`Computed zero-float activities: ${scheduleStats.computedCritical}`);
console.log(`Activities connected to final milestone: ${scheduleStats.connectedToFinal}`);
console.log(`Representative critical path (${cpm.representative_path.length} activities): ${cpm.representative_path.join(' -> ')}`);
console.log(`Structure errors: ${validation.structure_errors.length}`);
console.log(`Dependency cycles: ${validation.dependency_cycles.length}`);
console.log(`Temporal warnings: ${validation.temporal_logic_warnings.length}`);
console.log(`Validation status: ${validation.status}`);

if (validation.temporal_logic_warnings.length) {
  console.log('TEMPORAL_WARNINGS_BEGIN');
  for (const w of validation.temporal_logic_warnings) console.log(JSON.stringify(w));
  console.log('TEMPORAL_WARNINGS_END');
}

if (validation.structure_errors.length || validation.dependency_cycles.length) {
  console.error(JSON.stringify({
    structure_errors: validation.structure_errors,
    dependency_cycles: validation.dependency_cycles
  }, null, 2));
  process.exit(1);
}
