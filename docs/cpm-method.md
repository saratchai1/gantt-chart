# CPM / Float Method — Baseline v0.7

## Purpose

Plans 1–16 define source control windows, process requirements and D1200 completion, but do not provide a complete leaf-level predecessor network for every construction subactivity. The proposal schedule therefore separates four different questions:

- **Source constraint** — what control, process or window is stated by the source?
- **Network logic** — how is that requirement decomposed into schedulable predecessors/successors?
- **Timing provenance** — is the exact detailed day/window source-stated or a proposal allowance?
- **Scope applicability** — is the detailed trade/system firmly supported by the supplied package description, or retained provisionally pending IFC/BOQ confirmation?

The benchmark PDF is used only for activity-breakdown depth. Its dates, durations and predecessor logic are not CPM inputs.

## Calculated fields

Each activity stores:

- `network_from_start`
- `network_to_final`
- `computed_free_float_days`
- `computed_total_float_days`
- `computed_critical`
- `driving_successor`
- `scope_applicability`
- `scope_note`

Endpoints:

- `P01-PRE-NTP` — commencement / NTP
- `P01-CO-006` — Day 1200 final acceptance

## Strict upstream rule

`network_from_start=Y` requires complete predecessor ancestry to NTP. For a non-start activity with several stored predecessors, every predecessor must itself be reachable from NTP. This prevents a physical activity from appearing anchored merely because one branch is connected while a mandatory QA/HSE/environment/document/permit branch is a floating island.

Plans 02–16 root processes are anchored to NTP with proposal integration lags that preserve their existing planned start. This improves traceability but does not convert assumed timing into source timing.

## Downstream / float rule

A reverse pass from D1200 checks successor reachability and accumulates the tightest relationship slack. `computed_critical=Y` means zero accumulated float to D1200 under the current proposal bar placement and stored logic.

Relationship gap logic:

- **FS** — successor start versus predecessor finish + lag and project-day convention
- **SS** — successor start versus predecessor start + lag
- **FF** — successor finish versus predecessor finish + lag
- **SF** — successor finish versus predecessor start + lag

This is proposal-baseline float, not approved contract float.

## CP-window convergence

Source windows retained:

- CP-05 D421–D840
- CP-06 D301–D960
- CP-07 D841–D1080
- CP-08 D1081–D1200

Derived audit milestones:

- `P01-CP05-GATE` — D840
- `P01-CP06-GATE` — D960

CP-07 starts after CP-05. CP-06 overlaps CP-07 and therefore controls CP-07 completion by FF rather than a false global FS relationship. Late landscape and raw-water-pontoon packages remain inside CP-07 convergence and must complete before CP-07 finishes.

## Activity-level control gates

The network includes source-derived gates for clearly supported interfaces:

- excavation / earthwork JSEA + PTW
- localized environmental earthwork readiness
- work-at-height / scaffold / fall-rescue readiness before roof work
- foundation pre-pour Hold Point
- above-ceiling concealed-services QA Hold Point
- electrical isolation / LOTO / test-before-touch before precommissioning
- raw-water pontoon lifting-plan / exclusion / emergency readiness
- raw-water pontoon special-movement / route readiness
- raw-water pontoon near-water / sensitive-area readiness

Exact detailed gate days use `timing_basis=ASSUMPTION`. Hot-work and confined-space task gates are not fabricated without approved project-method evidence that those activities exist.

## Package-specific testing

The package test network uses:

`Installation / Second Fix → PRECOM → [parallel system test packs] → FUNC completion → COMM`

Detailed test packs are FS from `PRECOM`, run within the existing `FUNC` window and are FF predecessors of `FUNC`. This allows parallel testing but prevents the functional-test phase from closing while a defined principal test pack remains incomplete.

Where the package description is broad, the detailed test row is marked `WHERE_APPLICABLE` and must be confirmed or removed against IFC / BOQ / equipment schedules / the approved commissioning matrix.

## Package / discipline document-release network

Controlled-document milestones are inserted before physical workfronts:

- `STR-DOC` before reinforcement / formwork
- `ARC-DOC` before envelope / facade / partition
- `MEP-DOC` before first-fix services / sleeves / penetrations
- `TST-DOC` before precommissioning
- `CIV-DOC`, `UTIL-DOC`, `LAND-DOC` for external workfronts
- dedicated pontoon fabrication/lifting/installation and test-document gates

Inputs include CDE go-live, Area QA readiness, Plan-13 coordination and CP-03 design-control status where applicable. A long-running stream enters by SS + lag when active at the workfront date; completed readiness enters by FS. Exact release days remain proposal timing assumptions.

## Scope-applicability layer — v0.7

Scope applicability is deliberately **not** used to alter CPM mathematics. It is an audit/provenance layer over the same network:

- `SOURCE_REQUIRED` — source-established Plan-01 framework/control
- `DERIVED_FROM_SCOPE` — detailed decomposition reasonably supported by package scope
- `WHERE_APPLICABLE` — retained proposal coordination content requiring IFC/BOQ/equipment confirmation
- `CONTROL_STREAM` — Plans 02–16 supporting control/evidence activity

The current v0.7 audit identifies 64 `WHERE_APPLICABLE` rows. They stay in the network so coordination interfaces are visible, but are not represented as definitively confirmed contractual systems. Before contract baseline approval, each must be confirmed, replaced or deleted.

This is important because a provisional activity may still have zero float in the proposal network. **Zero float does not convert provisional scope into confirmed scope.**

## Physical-package integrity

Every Plan-01 physical row must be fully connected NTP→D1200. Package handover waits for applicable parallel branches including envelope, finishes, furniture, external work, specialist interfaces, package-specific tests, integrated commissioning, punch/correction and as-built evidence.

A Plan-01 physical row failing either upstream or downstream network integrity is a validation failure.

## Supporting-plan / LOE integration

Supporting controls are connected where they are readiness inputs or produce closeout evidence without automatically making every monitoring bar critical. `P04-WF-DEMOB` remains an intentional level-of-effort terminal rather than being force-connected merely to obtain cosmetic 100% overall downstream coverage.

## Proposal driving chain

The deterministic representative zero-float chain remains traceable from NTP through the Area-A Learning Centre into source CP convergence and CP-08 closeout:

`NTP → Temporary readiness → Main release → A23 release → Survey → Excavation → Foundation → Frame → MEP/Electrical/ICT → Precommissioning → Functional-test coordination → Integrated commissioning → Punch/correction → A23 handover → CP-05 → CP-07 → Closeout 493–497 → Final acceptance processing → D1200`

Parallel document/test/control branches may also be zero-float without replacing that representative trace. Detailed driving lags remain proposal CPM logic.

## Latest validated network

Baseline v0.7 CI result:

- **1,066 activities**
- **258 milestones**
- **60 computed zero-float activities**
- **1,066 / 1,066 reachable from NTP**
- **1,064 / 1,066 complete NTP→D1200 network coverage = 99.8%**
- **Plan-01 physical 683 / 683 complete NTP→D1200**
- **Plan-01 handovers 23 / 23 complete NTP→D1200**
- scope audit: **7 SOURCE_REQUIRED / 617 DERIVED_FROM_SCOPE / 64 WHERE_APPLICABLE / 378 CONTROL_STREAM**
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
- resolution of all `WHERE_APPLICABLE` rows
- final workfront / interface constraints

At that point proposal timing assumptions and provisional scope can be replaced by contract-baseline data and float / criticality recomputed.
