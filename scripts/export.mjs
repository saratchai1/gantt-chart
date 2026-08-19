import fs from 'node:fs';
import { masterSchedule, masterCSV, scheduleStats, validation } from '../src/build-schedule.js';

fs.mkdirSync('data', { recursive: true });
fs.writeFileSync('data/master-schedule.csv', masterCSV());
fs.writeFileSync('data/master-schedule.json', JSON.stringify(masterSchedule, null, 2));
fs.writeFileSync('data/schedule-stats.json', JSON.stringify(scheduleStats, null, 2));
fs.writeFileSync('data/validation-report.json', JSON.stringify({ stats:scheduleStats, ...validation }, null, 2));

console.log(`Exported ${masterSchedule.length} activities.`);
console.log(`Validation: ${validation.status}`);
