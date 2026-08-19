# CPM / Float Method — Baseline v0.6

## Purpose

Plans 1–16 define source control windows, process requirements and D1200 completion, but do not provide a complete leaf-level predecessor network for every construction subactivity. The proposal schedule therefore separates:

- **Source constraints** — explicit source day/window or control requirement
- **Derived network logic** — schedulable decomposition of a source-defined process
- **Proposal timing assumptions** — exact detailed date, duration or lag needed to form the proposal network

The benchmark PDF is used only for activity-breakdown depth. Its dates, durations and predecessor logic are not CPM inputs.

## Calculated fields

Each activity stores:

- `network_from_start`
- `network_to_final`
- `computed_free_float_days`
- `computed_total_float_days`
- `computed_critical`
- `driving_successor`

Endpoints:

- `P01-PRE-NTP` — commencement / NTP
- `P01-CO-006` — Day 1200 final acceptance

## Strict upstream rule

`network_from_start=Y` requires complete predecessor ancestry to NTP. For a non-start activity with several stored predecessors, every predecessor must itself be reachable from NTP. This prevents an activity from appearing properly anchored merely because one branch is connected while a mandatory QA/HSE/environment/document/permit branch remains a floating island.

Plans 02–16 root processes are anchored to NTP with proposal integration lags that preserve their existing planned start. This changes traceability, not source timing provenance.

## Downstream / float rule

A reverse pass from D1200 checks successor reachability and accumulates the tightest relationship slack. `computed_critical=Y` means zero accumulated float to D1200 under the current proposal bar placement and stored logic.

Relationship gap logic:

- **FS** — successor start versus predecessor finish + lag and project-day convention
- **SS** — successor start versus predecessor start + lag
- **FF** — successor finish versus predecessor finish + lag
- **SF** — successor finish versus predecessor start + lag

This is proposal-baseline float, not approved contract float.

## CP-05 / CP-06 / CP-07 convergence

Source windows:

- CP-05 D421–D840
- CP-06 D301–D960
- CP-07 D841–D1080
- CP-08 D1081–D1200

Derived audit milestones:

- `P01-CP05-GATE` — D840
- `P01-CP06-GATE` — D960

CP-07 starts after CP-05. CP-06 overlaps CP-07 and therefore controls CP-07 completion by FF rather than a false global FS relationship. Late landscape and raw-water-pontoon packages remain inside CP-07 convergence and must complete before CP-07 finishes.

## Activity-level control gates retained from v0.4

The CPM network includes source-derived leaf-level gates for clearly supported risk / quality interfaces:

- excavation / earthwork JSEA + PTW
- localized environmental earthwork readiness
- work-at-height / scaffold / fall-rescue readiness before roof work
- above-ceiling concealed-services QA Hold Point
- electrical isolation / LOTO / test-before-touch before precommissioning
- raw-water pontoon lifting-plan / exclusion / emergency readiness
- raw-water pontoon special-movement / traffic-route readiness
- raw-water pontoon near-water rescue / evacuation / sensitive-area readiness

Exact detailed gate days use `timing_basis=ASSUMPTION`. Hot-work and confined-space gates are not fabricated without approved project-method evidence that those activities exist.

## Package-specific testing retained from v0.5

The network pattern is:

`Installation / Second Fix → PRECOM → [parallel system test packs] → FUNC completion → COMM`

Detailed test packs are FS from package `PRECOM`, run inside the package `FUNC` window and are FF predecessors of `FUNC`. This permits parallel testing but prevents the functional-test phase from closing while a defined principal test pack remains incomplete.

Profiles are based on Plan-1 principal scope and include, where supported or explicitly marked where applicable, Learning Centre electrical/plumbing-fire/HVAC/ICT, restaurant kitchen and ventilation interfaces, meeting-building electrical/AV, water-production process/control systems, sanitary systems, tent-house services and pumping systems.

The detailed test rows remain proposal assumptions pending IFC / BOQ / equipment schedules / approved testing-and-commissioning matrix.

## v0.6 package / discipline document-release network

v0.6 adds controlled-document release milestones at the actual package workfront. This implements the source requirement that the approved revision of drawings, Method Statements, ITPs, checklists and test procedures be available before physical work proceeds.

Main building packages receive, where applicable:

- `STR-DOC` before reinforcement / formwork;
- `ARC-DOC` before envelope / facade / partition work;
- `MEP-DOC` before building-services / sleeves / first fix;
- `TST-DOC` before precommissioning.

External packages receive:

- `CIV-DOC` before earthwork / drainage / base;
- `UTIL-DOC` before utilities / external electrical;
- `LAND-DOC` before hardscape / soil / planting / irrigation.

Raw-water pontoon work receives dedicated fabrication/lifting/installation and precommissioning/test-document gates.

Inputs to these gates include CDE go-live, Area QA readiness, Plan-13 coordination where active and the CP-03 design-control stream where applicable. A long-running design/BIM coordination stream uses SS + lag when it is active at the workfront date; completed readiness streams use FS.

The physical activity is FS from its package document-release milestone. Exact release dates follow the current proposal workfront and use `timing_basis=ASSUMPTION`; they are not represented as source-stated package due dates.

## Physical-package integrity

Every Plan-01 physical row must be fully connected NTP→D1200. Package handover waits for applicable parallel branches including envelope, doors/glazing, finishes, furniture, external work, specialist systems, package-specific tests, integrated commissioning, punch/correction and as-built evidence.

A Plan-01 physical row failing either upstream or downstream network integrity is a validation failure.

## Supporting-plan / LOE integration

Supporting controls are connected where they are readiness inputs or produce required closeout evidence without automatically making every monitoring bar critical. Examples include active workforce / QA / HSE / traffic / environment / heritage streams feeding Area release; plant streams feeding physical workfronts by SS; CDE / progress / BIM / AI / carbon / commercial streams feeding relevant closeout nodes.

`P04-WF-DEMOB` remains an intentional level-of-effort terminal rather than being force-connected merely to obtain cosmetic 100% overall downstream coverage.

## Proposal driving chain

The deterministic representative zero-float chain remains traceable from NTP through Area-A Learning Centre into source CP convergence and CP-08 closeout:

`NTP → Temporary readiness → Main release → A23 release → Survey → Excavation → Foundation → Frame → MEP/Electrical/ICT → Precommissioning → Functional test coordination → Integrated commissioning → Punch/correction → A23 Handover → CP-05 → CP-07 → Closeout 493–497 → Final acceptance processing → D1200`

v0.6 document gates strengthen parallel readiness branches and increase the zero-float set, but do not artificially force a different deterministic representative chain. Detailed driving lags remain proposal CPM logic.

## Latest validated network

Baseline v0.6 CI result:

- **1,066 activities**
- **258 milestones**
- **60 computed zero-float activities**
- **1,066 / 1,066 reachable from NTP**
- **1,064 / 1,066 complete NTP→D1200 network coverage = 99.8%**
- **Plan-01 physical 683 / 683 complete NTP→D1200**
- **Plan-01 handovers 23 / 23 complete NTP→D1200**
- **0 structure errors**
- **0 dependency cycles**
- **0 network-integrity errors**
- **0 temporal warnings**
- **PASS**

The representative deterministic driving chain remains 36 activities. The only intentional non-Plan-01 terminal is the workforce-demobilization level-of-effort row.

## Contract-baseline conversion

Recalculate CPM after approval / confirmation of:

- project calendar / holidays / weather constraints
- actual NTP
- IFC / shop-drawing / submittal dates
- BOQ quantities / measurement rules
- productivity / crew rates
- vendor-confirmed lead times
- approved Method Statements / ITPs / JSEAs / permits
- final equipment schedule
- approved testing & commissioning matrix
- final workfront / interface constraints

At that point proposal timing assumptions can be replaced by contract-baseline data and float / criticality recomputed.
