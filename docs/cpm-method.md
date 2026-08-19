# CPM / Float Method — Baseline v0.4

## Purpose

Plans 1–16 define source control windows, process requirements and D1200 completion, but do not provide a complete leaf-level CPM network. The proposal therefore separates:

- **Source constraints** — explicit source day/window or control requirement
- **Derived network logic** — schedulable decomposition of the source process
- **Proposal timing assumptions** — exact detailed dates, durations and lags needed to form the proposal network

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

`network_from_start=Y` requires a complete predecessor ancestry to NTP. For a non-start row with multiple predecessors, every stored predecessor must itself be reachable from NTP. This prevents an activity from appearing valid merely because one branch is connected while a mandatory QA/HSE/environment/permit branch remains a floating island.

Plans 02–16 root processes are anchored to NTP with proposal integration lags that preserve their existing planned start. This changes traceability, not source timing provenance.

## Downstream / float rule

A reverse pass from D1200 checks successor reachability and accumulates the tightest relationship slack. `computed_critical=Y` means zero accumulated float to D1200 under the current proposal bar placement.

Relationship gap logic:

- FS — successor start versus predecessor finish + lag and project-day convention
- SS — successor start versus predecessor start + lag
- FF — successor finish versus predecessor finish + lag
- SF — successor finish versus predecessor start + lag

This is a **proposal-baseline float calculation**, not approved contract float.

## CP-05 / CP-06 / CP-07 convergence

Source windows:

- CP-05 D421–D840
- CP-06 D301–D960
- CP-07 D841–D1080
- CP-08 D1081–D1200

Derived audit milestones:

- `P01-CP05-GATE` D840
- `P01-CP06-GATE` D960

CP-07 starts after CP-05. CP-06 overlaps CP-07 and therefore controls CP-07 completion by FF rather than a false global FS relationship. Late landscape and raw-water-pontoon packages remain inside CP-07 convergence and must complete before CP-07 finishes.

## v0.4 task-level control gates

The CPM network now includes source-derived leaf-level gates for clearly supported risk/quality interfaces:

- excavation / earthwork JSEA + PTW
- localized environmental earthwork readiness
- work-at-height / scaffold / fall-rescue readiness for roof work
- above-ceiling concealed-services QA Hold Point
- electrical isolation / LOTO / test-before-touch before precommissioning
- raw-water pontoon lifting-plan / exclusion / emergency readiness
- raw-water pontoon special-movement / traffic-route readiness
- raw-water pontoon near-water rescue / evacuation / sensitive-area readiness

Exact gate days use `timing_basis=ASSUMPTION` because the source defines the control process but not these detailed project days.

Hot-work and confined-space gates are not created without approved project-method evidence that the activity exists in the corresponding work package.

## Physical-package integrity

Every Plan-01 physical row must be fully connected NTP→D1200. Package handover also waits for applicable parallel branches including envelope, doors/glazing, floors/final finishes, furniture, immediate external work, specialist systems, commissioning, punch/correction and as-built evidence.

A Plan-01 physical row failing either upstream or downstream network integrity is a validation failure.

## Supporting-plan / LOE integration

v0.4 connects active controls and closeout evidence without automatically making every monitoring bar critical. Examples:

- active workforce / QA / HSE / traffic / environment / heritage streams feed Area release
- plant operation streams feed relevant physical workfronts by SS
- site / plant / traffic / environment / heritage streams converge through restoration closeout
- QA area monitoring feeds final QA dossier
- CDE / progress cycles feed final closeout cycles
- BIM coordination / 4D-5D feeds as-built BIM
- AI monitoring feeds digital-system handover
- carbon data collection feeds periodic calculation and final report
- commercial area cycles feed forecast-to-complete reconciliation

`P04-WF-DEMOB` remains an intentional level-of-effort terminal rather than being force-connected for cosmetic overall network coverage.

## Proposal driving chain

The representative zero-float chain is made traceable from NTP through a technically plausible Area-A learning-centre sequence into source CP convergence and CP-08 closeout. The current validated representative chain has 36 activities:

`NTP → Temporary readiness → Main release → A23 release → Survey → Excavation → Foundation → Frame → MEP/Electrical/ICT → Precommissioning → Functional test → Integrated commissioning → Punch/correction → A23 Handover → CP-05 → CP-07 → Closeout 493–497 → Final acceptance processing → D1200`

Detailed driving lags are proposal CPM logic and are not represented as TOR-stated leaf-activity lags.

## Latest validated network

Baseline v0.4 CI result:

- 957 activities
- 178 milestones
- 51 computed zero-float activities
- 957 / 957 reachable from NTP
- 954 / 957 connected to D1200
- Plan-01 physical 654 / 654 complete NTP→D1200
- Plan-01 handovers 23 / 23 complete NTP→D1200
- 0 structure errors
- 0 dependency cycles
- 0 network-integrity errors
- 0 temporal warnings
- PASS

## Contract-baseline conversion

Recalculate the CPM when the following are approved/confirmed:

- project calendar / holidays / weather constraints
- actual NTP
- IFC / shop-drawing dates
- BOQ quantities / measurement rules
- productivity / crew rates
- vendor-confirmed lead times
- approved Method Statements / ITPs / JSEAs / permits
- final workfront / interface constraints
- final testing & commissioning matrix

At that point proposal timing assumptions can be replaced by contract-baseline data and float/criticality recomputed.
