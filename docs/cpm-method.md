# CPM / Float Method — Baseline v0.2

## Purpose

The source plans define critical control windows and the D1200 completion requirement, but do not provide a complete low-level predecessor network for every construction subactivity. The proposal schedule therefore separates:

- **Source constraints** — explicit source day/window or control requirement
- **Derived network logic** — detailed schedulable decomposition of the source process
- **Proposal timing assumptions** — exact leaf durations, lags and detailed placement needed to form a proposal-level network

The benchmark PDF is used only to calibrate activity-breakdown depth. Its dates, durations and predecessor logic are not inputs to this CPM network.

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

This is a **baseline-network float calculation against the current proposal bar placement**. It is not represented as an approved contract CPM until the working calendar, production rates, approved detailed dates and vendor lead times are confirmed.

## Source CP-05 / CP-06 / CP-07 convergence

Plan 1 states:

- CP-05: D421–D840 — Area A architecture / MEP
- CP-06: D301–D960 — Areas B/C/D + external systems
- CP-07: D841–D1080 — landscape / detail completion / system integration
- CP-08: D1081–D1200 — commissioning / as-built / O&M / handover

Baseline v0.2 makes this convergence explicit with two derived boundary milestones:

- `P01-CP05-GATE` at D840
- `P01-CP06-GATE` at D960

`P01-CO-001` remains the source CP-07 control window. CP-07 starts after the CP-05 boundary. Because CP-06 overlaps CP-07 at project-summary level, CP-06 is connected to CP-07 completion by an FF relationship rather than a false global FS relationship that would prevent CP-07 from starting until D960. The D960→D1080 relationship is a source-window control relationship, not a claimed leaf-activity construction lag.

Late landscape and raw-water-pontoon packages remain inside the overlapping CP-07 convergence and must be complete before CP-07 finishes.

## Physical-package handover integrity

Every Plan-01 physical package handover is connected downstream to CP-07 and then to D1200. The integration layer also closes parallel internal branches that were intentionally exposed by the detailed WBS:

- building envelope
- doors / glazing
- floors / final architectural finishes
- fixed furniture
- immediate external works
- specialist package activities such as exhibition, kitchen, conference AV or process-equipment interfaces
- external-work site furniture / signage
- environmental monitoring records

A package handover therefore cannot be treated as complete merely because commissioning or punch correction is complete while another material physical branch is still open.

The validator now reports:

- overall network coverage
- Plan-01 physical activity network coverage
- Plan-01 handover network coverage
- unconnected physical handovers

An unconnected Plan-01 physical handover is a **validation failure**.

## Proposal driving chain

To avoid a meaningless “critical path” consisting only of the final milestone, the baseline contains an explicit **proposal driving chain**. It selects a technically plausible path and makes its predecessor links tight while preserving the planned activity bars. The representative path is intended to trace:

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
16. CP-05 D840 boundary
17. CP-06 D960 parallel boundary / CP-07 convergence
18. CP-07 D841–D1080 completion
19. Detailed CP-08 closeout packages
20. Installments 493–497 gates
21. Final acceptance processing
22. D1200 final milestone

The detailed lags used to make this proposal chain driving are recorded in each successor activity note and are **not represented as TOR-stated leaf-activity lags** unless independently supported by a source constraint.

## Cross-plan closeout convergence

The final network also requires completion of relevant control streams from the other plans. In particular:

- site / temporary-facility demobilization
- plant demobilization and service-area restoration
- temporary traffic-control removal / route repair
- environmental restoration verification
- heritage / sensitive-area rehabilitation acceptance
- BIM / AIM / Digital Twin handover
- Application / AI system-data export and handover
- final QA dossier
- final carbon report
- commercial forecast / cost reconciliation
- controlled-document archive cycle
- final progress / closeout reconciliation

These links are modeled as FS or FF according to whether the closeout activity must start after the evidence or may proceed concurrently but cannot finish before the evidence stream closes.

## Why the final installments were expanded

The source identifies final deliverables for installments 493–497 and the D1081–D1200 closeout envelope, but does not give a distinct exact day for each final installment in the supplied plan. The proposal therefore adds detailed closeout activities for:

- Final cleaning / site handover inspection
- Final As-Built / As-Built BIM verification
- Final electrical/mechanical test-report reconciliation
- O&M / warranty / spares / training closeout
- Asset register / serial-location / value-by-item reconciliation
- Final joint inspection and acceptance processing

Their exact internal CP-08 day splits have `timing_basis=ASSUMPTION`.

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
