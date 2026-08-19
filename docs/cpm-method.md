# CPM / Float Method — Baseline v0.1

## Purpose

The source plans define critical control windows and the D1200 completion requirement, but do not provide a complete low-level predecessor network for every construction subactivity. Baseline v0.1 therefore separates:

- **Source constraints** — explicit source day/window or control requirement
- **Derived network logic** — detailed schedulable decomposition of the source process
- **Proposal timing assumptions** — exact leaf durations, lags and detailed placement needed to form a proposal-level network

## Calculated fields

For every activity the generator evaluates the current predecessor network and writes:

- `computed_free_float_days`
- `computed_total_float_days`
- `network_to_final`
- `computed_critical`
- `driving_successor`

The final target is `P01-CO-006` — Project final acceptance / Day 1200 milestone.

## Relationship gap calculation

Within the current planned bar arrangement, link slack is evaluated by relationship:

- FS: successor start minus predecessor finish, adjusted for project-day/milestone convention and lag
- SS: successor start minus predecessor start and lag
- FF: successor finish minus predecessor finish and lag
- SF: successor finish minus predecessor start and lag

A reverse pass from D1200 accumulates the tightest downstream slack. `computed_critical=Y` means zero accumulated float to the D1200 final milestone under the current proposal network.

## Proposal driving chain

To avoid a meaningless “critical path” consisting only of the final milestone, the baseline contains an explicit **proposal driving chain**. It selects a technically plausible path and makes its predecessor links tight while preserving the planned activity bars. The path is intended to trace:

1. NTP / commencement
2. Temporary site readiness
3. Main works release
4. Area-A learning-centre workfront release
5. Survey / setting out
6. Excavation / foundation preparation
7. Reinforcement / pre-pour hold / foundation
8. Ground structure / superstructure
9. MEP first fix
10. Electrical / ICT containment and installation
11. Pre-commissioning
12. Functional test
13. Integrated commissioning
14. Punch / defect correction
15. Area-A handover
16. Source CP07 D841–D1080 transition
17. Detailed CP08 closeout packages
18. Installments 493–497 gates
19. Final acceptance processing
20. D1200 final milestone

The detailed lags used to make this proposal chain driving are recorded in each successor activity note and are **not represented as TOR-stated lags** unless independently supported by a source constraint.

## Why the final installments were expanded

The source identifies final deliverables for installments 493–497 and the D1081–D1200 closeout envelope, but does not give a distinct exact day for each final installment in the supplied plan. Baseline v0.1 therefore adds detailed closeout activities for:

- Final cleaning / site handover inspection
- Final As-Built / As-Built BIM verification
- Final electrical/mechanical test-report reconciliation
- O&M / warranty / spares / training closeout
- Asset register / serial-location / value-by-item reconciliation
- Final joint inspection and acceptance processing

Their exact internal CP08 day splits have `timing_basis=ASSUMPTION`.

## Contract-baseline conversion

The proposal CPM should be recalculated after receiving:

- approved work calendar / holidays / weather constraints
- actual NTP
- IFC / shop drawing dates
- BOQ quantities and approved measurement rules
- productivity / crew rates
- vendor-confirmed lead times
- final workfront and interface constraints
- approved testing & commissioning matrix

At that point detailed proposal timing assumptions can be replaced and the calculated float/critical path can be used as the contract-baseline CPM.
