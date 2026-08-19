# Proposal Review Registers — Baseline v0.7

`npm run export` creates focused review registers in addition to the master schedule. These registers turn proposal assumptions into a controlled review workflow rather than leaving them buried inside a 1,000+ row Gantt.

## 1. `data/provisional-scope-register.csv`

Contains every `scope_applicability = WHERE_APPLICABLE` row.

Current validated population: **64 rows**.

### Review fields

- `review_priority`
- `network_impact`
- `review_priority_basis`
- `review_status` — starts as `OPEN`
- `reviewer`
- `confirmed_scope_reference`
- `resolution_action` — `CONFIRM / DELETE / REPLACE`
- `resolution_note`

### Review-priority heuristic

Priority is a **proposal review heuristic**, not a source requirement:

- `P1_ZERO_FLOAT` — provisional row currently has zero calculated float
- `P1_LOW_FLOAT` — nonzero total float up to 30 project days
- `P2_MEDIUM_FLOAT` — total float above 30 and up to 90 project days
- `P3_STANDARD` — remaining provisional rows

The point is to review scope uncertainty where it could affect the proposal completion network first. A P1 flag does **not** prove the activity belongs in contractual scope; it means the current proposal network is sensitive to the row if it is retained.

### Resolution workflow

1. check IFC drawing / BOQ / equipment schedule / approved shop drawing / commissioning matrix;
2. record the confirming reference;
3. choose CONFIRM, DELETE or REPLACE;
4. if replaced, identify the correct activity/system and update the master generator rather than editing only the exported CSV;
5. rerun validation and CPM after changing the generator.

A provisional row may be network-connected or zero-float. That does not make its scope confirmed.

## 2. `data/provisional-scope-summary.csv` / `.json`

Groups provisional rows by **Building/Area + Discipline** and reports:

- total provisional rows
- P1 review rows
- zero-float provisional rows
- minimum total float in the group
- activity IDs

The summary is sorted to put higher network-impact groups first. This is intended for proposal/design review meetings where resolving 64 individual rows one-by-one from the master Gantt would be inefficient.

## 3. `data/package-document-release-register.csv`

Contains the package/discipline controlled-document milestones generated from Plan 1 + Plans 7/11/13 integration.

Current schedule has **80 document-release review rows**.

Review columns:

- `review_status`
- `approved_document_reference`
- `actual_release_date`
- `review_note`

Use this register when the actual submittal / shop-drawing / Method Statement / ITP schedule becomes available. Replace proposal gate dates in the generator with approved dates and rerun CPM.

Typical gate families:

- STR-DOC
- ARC-DOC
- MEP-DOC
- TST-DOC
- CIV-DOC
- UTIL-DOC
- LAND-DOC
- D55 marine/test document gates

## 4. `data/system-test-pack-register.csv`

Contains package-specific functional test packs.

Current schedule has **29 test-pack review rows**.

Review fields include:

- `review_priority`
- `network_impact`
- `review_status`
- `confirmed_equipment_system_reference`
- `approved_test_procedure`
- `resolution_note`

Use this register against the approved equipment schedule and testing & commissioning matrix. Test packs marked `WHERE_APPLICABLE` must be confirmed, deleted or replaced before the contract baseline is accepted.

## Change-control rule

The generated registers are **review aids**, not the schedule source of truth. Permanent changes must be made in the schedule generator/source mapping and then regenerated. This preserves:

- unique IDs
- predecessor logic
- timing provenance
- scope provenance
- validation history
- repeatable exports

## CI artifact

GitHub Actions uploads one integrated validation artifact containing:

- master schedule CSV / JSON
- schedule statistics
- CPM report
- validation report
- provisional scope register CSV / JSON
- provisional scope summary CSV / JSON
- package document release register CSV
- system test pack register CSV

This lets planning, design, QA/QC, commissioning and commercial reviewers work from the same validated snapshot.
