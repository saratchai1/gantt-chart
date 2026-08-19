# Package / Discipline Controlled Document Release Mapping — Baseline v0.6

Baseline v0.6 makes document readiness visible at the actual package / discipline workfront instead of relying only on the project-wide CDE go-live and Area QA readiness bars.

## Source basis

The refinement is grounded in the supplied plans:

- **Plan 1** requires the detailed schedule to connect approved design / submittal / long-lead readiness with physical work and identifies CP-03 D31–D270 as the detailed-design / approval / long-lead control window.
- **Plan 7** requires approved drawings, Method Statements, ITPs, checklists, calibration and controlled inspection documentation before work proceeds; incomplete or wrong-revision documentation blocks release.
- **Plan 11** controls document coding, revision, status, approval, supersession and the CDE / EDMS audit trail.
- **Plan 13** requires model coordination, constructability / clash management and controlled information exchange.
- **Plans 10 and 16** add environmental / heritage method and rehabilitation-document requirements for external and Area-D work.

The source defines these readiness requirements but does **not** give a separate exact project day for every package / discipline release. Therefore every new v0.6 gate uses:

`basis_type = DERIVED`

`timing_basis = ASSUMPTION`

The exact gate day is aligned to the current proposal workfront start and must be replaced / confirmed by the approved design / submittal / Method Statement / ITP schedule.

## Building-package gates

For each main building package, v0.6 creates four controlled-document gates where the corresponding activity exists:

### Structural release

`Approved structural drawings / Method Statement / ITP release`

Feeds foundation reinforcement / formwork workfronts. Inputs include:

- CDE go-live
- Area QA readiness
- active / completed BIM coordination as applicable at the gate date
- active / completed CP-03 design-control window as applicable at the gate date

### Architectural / envelope release

`Approved architectural / envelope coordination document release`

Feeds envelope, external wall / facade and partition workfronts.

### Building-services / first-fix release

`Coordinated building-services / sleeves / first-fix document release`

Feeds general MEP, electrical, plumbing/fire, HVAC and ICT first-fix workfronts. The gate represents controlled coordinated drawings, sleeves / penetrations, interface information, Method Statement and ITP readiness.

### Precommissioning / test-document release

`Approved precommissioning / test procedure / acceptance-form release`

Feeds the package precommissioning workfront before v0.5 system test packs and integrated commissioning.

## External-package gates

External work packages receive, where the relevant activities exist:

- `CIV-DOC` — external earthwork / drainage / base Method Statement / ITP release
- `UTIL-DOC` — external utility / electrical route and interface release
- `LAND-DOC` — hardscape / landscape / irrigation / rehabilitation document release

Area-D gates retain the approved-boundary / heritage / environmental constraints already present in the network; v0.6 does not invent additional buffer distances, routes or restrictions.

## Raw-water pontoon gates

The pontoon package is handled separately from the generic building / external templates:

- `P11-D55-MAR-DOC` — controlled fabrication / lifting / installation drawings, Method Statements and ITP release
- `P11-D55-TST-DOC` — controlled pump / piping / electrical / control precommissioning and test-procedure release

These gates operate in addition to the existing lifting, traffic-special-movement, near-water HSE, environment and heritage controls.

## Relationship convention

The gate itself is a zero-duration milestone at the current proposal workfront release date.

- completed source / control streams enter by **FS**;
- a long-running coordination stream that is active at the gate date enters by **SS + lag** to the relevant date;
- the physical activity starts **FS from the document-release milestone**.

This avoids the false assumption that an entire project-wide BIM / design / document-control campaign must be finished before any package can start, while still making the package-specific approved-document condition enforceable in the network.

## Validation result

The first v0.6 CI validation produced:

- **1,066 activities**
- **258 milestones**
- **60 computed zero-float activities**
- **1,066 / 1,066 reachable from NTP**
- **1,064 / 1,066 complete NTP→D1200 network coverage = 99.8%**
- **Plan-01 physical 683 / 683 complete NTP→D1200**
- **Plan-01 handovers 23 / 23 complete NTP→D1200**
- **0 structural errors**
- **0 dependency cycles**
- **0 network-integrity errors**
- **0 temporal warnings**
- **PASS**

The only intentional support terminal remains `P04-WF-DEMOB`.
