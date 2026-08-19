import { schedule, sortSchedule, stats, toCSV } from './schedule-core.js';
import { buildPlans09to16 } from './plans-09-16.js';
import { buildPlans02to08 } from './plans-02-08.js';
import { buildPlan01Physical } from './plan-01-physical.js';
import { normalizeSchedule } from './normalize-schedule.js';
import { validationReport } from './schedule-validation.js';

// Build supporting/control streams first because Plan 01 physical workfronts
// reference their gate IDs. addTask itself permits forward references, but this
// order keeps procurementRelease IDs populated before Plan 01 is expanded.
buildPlans09to16();
buildPlans02to08();
buildPlan01Physical();
normalizeSchedule(schedule);

export const masterSchedule = sortSchedule(schedule);
export const scheduleStats = stats(masterSchedule);
export const validation = validationReport(masterSchedule);
export const masterCSV = () => toCSV(masterSchedule);

export default masterSchedule;
