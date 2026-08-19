import { schedule, sortSchedule, stats, toCSV } from './schedule-core.js';
import { buildPlans09to16 } from './plans-09-16.js';
import { buildPlans02to08 } from './plans-02-08.js';
import { buildPlan01Physical } from './plan-01-physical.js';
import { buildCloseoutDetail } from './closeout-detail.js';
import { normalizeSchedule } from './normalize-schedule.js';
import { applyFinalLogicRepairs } from './logic-repairs-v2.js';
import { applyTimingProvenance } from './timing-provenance.js';
import { applyNetworkIntegrationV3 } from './network-integration-v3.js';
import { applyTaskControlGatesV4 } from './task-control-gates-v4.js';
import { applyPostIntegrationRepairsV4 } from './post-integration-repairs-v4.js';
import { applyProposalDrivingChain } from './critical-driver.js';
import { applyCpmAnalysis, computedCriticalPath } from './cpm-analysis.js';
import { validationReport } from './schedule-validation.js';

buildPlans09to16();
buildPlans02to08();
buildPlan01Physical();
buildCloseoutDetail();
normalizeSchedule(schedule);
applyFinalLogicRepairs(schedule);
applyTimingProvenance(schedule);
applyNetworkIntegrationV3(schedule);
applyTaskControlGatesV4(schedule);
applyPostIntegrationRepairsV4(schedule);
applyProposalDrivingChain(schedule);
applyCpmAnalysis(schedule, 'P01-CO-006');

export const masterSchedule = sortSchedule(schedule);
export const scheduleStats = stats(masterSchedule);
export const cpm = computedCriticalPath(masterSchedule, 'P01-CO-006');
export const validation = validationReport(masterSchedule);
export const masterCSV = () => toCSV(masterSchedule);

export default masterSchedule;
