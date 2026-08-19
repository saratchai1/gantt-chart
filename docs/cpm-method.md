# CPM / Float Method — Baseline v0.5

## Purpose

Plans 1–16 define source control windows, process requirements and the D1200 completion requirement, but do not provide a complete leaf-level CPM predecessor network for every construction subactivity. The proposal schedule therefore keeps three concepts separate:

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

Project endpoints:

- `P01-PRE-NTP` — commencement / NTP
- `P01-CO-006` — Day 1200 final acceptance

## Strict upstream rule

`network_from_start=Y` requires complete predecessor ancestry to NTP. For a non-start activity with several stored predecessors, every predecessor must itself be reachable from NTP. This prevents an activity from looking properly anchored merely because one branch is connected while a mandatory QA/HSE/environment/permit branch remains a floating logic island.

Plans 02–16 root processes are anchored to NTP with proposal integration lags that preserve their current planned start. This changes network traceability, not source timing provenance.

## Downstream / float rule

A reverse pass from D1200 checks successor reachability and accumulates the tightest relationship slack. `computed_critical=Y` means zero accumulated float to D1200 under the current proposal bar placement and stored logic.

Relationship gap logic:

- **FS** — successor start versus predecessor finish + lag and project-day convention
- **SS** — successor start versus predecessor start + lag
- **FF** — successor finish versus predecessor finish + lag
- **SF** — successor finish versus predecessor start + lag

This is a **proposal-baseline float calculation**, not approved contract float.

## CP-05 / CP-06 / CP-07 convergence

Source windows:

- CP-05 D421–D840
- CP-06 D301–D960
- CP-07 D841–D1080
- CP-08 D1081–D1200

Derived audit milestones:

- `P01-CP05-GATE` — D840
- `P01-CP06-GATE` — D960

CP-07 starts after CP-05. CP-06 overlaps CP-07 and therefore controls CP-07 completion by FF rather than a false global FS relationship. Late landscape and raw-water-pontoon packages remain inside the CP-07 convergence and must complete before CP-07 finishes.

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

Exact detailed gate days use `timing_basis=ASSUMPTION` because the source defines the control process but not those leaf-level project days.

Hot-work and confined-space gates are not created without approved project-method evidence that the activity actually exists in the corresponding work package.

## v0.5 package-specific testing network

v0.5 expands the generic package functional-testing phase into parallel system test packs based on the principal package scope stated in Plan 1.

The network pattern is:

`Installation / Second Fix → PRECOM → [parallel test packs] → FUNC completion → COMM`

Detailed test packs are:

- FS from package `PRECOM`;
- scheduled inside the existing package `FUNC` window;
- FF predecessors of `FUNC`, so the package functional-test window cannot finish while a defined principal test pack remains incomplete;
- proposal-level rows with `basis_type=ASSUMPTION` and `timing_basis=ASSUMPTION`;
- not used to alter the source CP-08 boundary.

The profiles include, where supported by the package description:

- A23 Learning Centre — electrical, plumbing/fire, HVAC, ICT/AV/security
- A24 Restaurant/Cafe — electrical, water/drainage/grease, kitchen ventilation, kitchen equipment interfaces
- A25 Meeting/Multipurpose — electrical, AV/communications
- A26 Water Production — process water, electrical/controls/instrumentation
- A29 Eternal Room — electrical, plumbing where applicable
- B31 Toilet — sanitary/drainage, electrical where applicable
- B32 Waste Building — waste/drainage/environmental interface, electrical where applicable
- C41 Reception — principal building-services test packs
- C42 Tent House clusters — electrical, water/sanitary/drainage where applicable
- C43 Pump Building — pump/flow, electrical/controls

Where Plan 1 gives only a broad building-services statement, the test activity is explicitly worded **where applicable** and must be confirmed or removed using IFC / BOQ / equipment schedules / the approved testing-and-commissioning matrix before contract-baseline approval.

## Physical-package integrity

Every Plan-01 physical row must be fully connected NTP→D1200. Package handover waits for applicable parallel branches including envelope, doors/glazing, floors/final finishes, furniture, external work, specialist systems, package-specific system-test branches, integrated commissioning, punch/correction and as-built evidence.

A Plan-01 physical row failing either upstream or downstream network integrity is a validation failure.

## Supporting-plan / LOE integration

Supporting controls are connected where they are readiness inputs or produce required closeout evidence, without automatically making every monitoring bar critical. Examples:

- active workforce / QA / HSE / traffic / environment / heritage streams feed Area release;
- plant operation streams feed relevant physical workfronts by SS;
- site / plant / traffic / environment / heritage streams converge through restoration closeout;
- QA area monitoring feeds final QA dossier;
- CDE / progress cycles feed final closeout cycles;
- BIM coordination / 4D-5D feeds as-built BIM;
- AI monitoring feeds digital-system handover;
- carbon data collection feeds periodic calculation and final report;
- commercial area cycles feed forecast-to-complete reconciliation.

`P04-WF-DEMOB` remains an intentional level-of-effort terminal rather than being force-connected merely to obtain cosmetic 100% overall downstream coverage.

## Proposal driving chain

The deterministic representative zero-float chain remains traceable from NTP through the Area-A Learning Centre into source CP convergence and CP-08 closeout:

`NTP → Temporary readiness → Main release → A23 release → Survey → Excavation → Foundation → Frame → MEP/Electrical/ICT → Precommissioning → Functional test coordination → Integrated commissioning → Punch/correction → A23 Handover → CP-05 → CP-07 → Closeout 493–497 → Final acceptance processing → D1200`

The v0.5 system test packs strengthen parallel commissioning detail but do not artificially force a different representative driving sequence. Other zero-float branches remain visible through `computed_critical=Y`.

Detailed driving lags are proposal CPM logic and are not represented as TOR-stated leaf-activity lags.

## Latest validated network

Baseline v0.5 CI result:

- **986 activities**
- **178 milestones**
- **55 computed zero-float activities**
- **986 / 986 reachable from NTP**
- **983 / 986 connected to D1200**
- **Plan-01 physical 683 / 683 complete NTP→D1200**
- **Plan-01 handovers 23 / 23 complete NTP→D1200**
- **0 structure errors**
- **0 dependency cycles**
- **0 network-integrity errors**
- **0 temporal warnings**
- **PASS**

The representative deterministic driving chain contains 36 activities. The only intentionally reported non-Plan-01 terminal is the workforce-demobilization level-of-effort row.

## Contract-baseline conversion

Recalculate CPM after approval / confirmation of:

- project calendar / holidays / weather constraints
- actual NTP
- IFC / shop-drawing issue dates
- BOQ quantities / measurement rules
- productivity / crew rates
- vendor-confirmed lead times
- approved Method Statements / ITPs / JSEAs / permits
- final equipment schedule
- approved testing & commissioning matrix
- final workfront / interface constraints

At that point proposal timing assumptions can be replaced by contract-baseline data and float / criticality recomputed.
