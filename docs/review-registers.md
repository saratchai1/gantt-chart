# Proposal Review Registers — Baseline v0.7

`npm run export` now creates three focused review registers in addition to the master schedule. These registers are intended to turn the remaining proposal assumptions into a controlled review workflow rather than leaving them buried inside a 1,000+ row Gantt.

## 1. `data/provisional-scope-register.csv`

Contains every `scope_applicability = WHERE_APPLICABLE` row.

Current validated population: **64 rows**.

Review columns are included in the export:

- `review_status` — starts as `OPEN`
- `reviewer`
- `confirmed_scope_reference`
- `resolution_action` — `CONFIRM / DELETE / REPLACE`
- `resolution_note`

Recommended review rule:

1. check IFC drawing / BOQ / equipment schedule / approved shop drawing / commissioning matrix;
2. record the confirming reference;
3. choose CONFIRM, DELETE or REPLACE;
4. if replaced, identify the correct activity/system and update the master generator rather than editing only the exported CSV;
5. rerun validation after the master logic is changed.

A provisional row may be network-connected or zero-float. That does not make its scope confirmed.

## 2. `data/package-document-release-register.csv`

Contains the v0.6 package/discipline controlled-document milestones generated from Plan 1 + Plans 7/11/13 integration.

Review columns:

- `review_status`
- `approved_document_reference`
- `actual_release_date`
- `review_note`

Use this register when the actual document/submittal schedule becomes available. The proposal gate date should then be replaced by the approved release date and the CPM rerun.

Typical gate families:

- STR-DOC
- ARC-DOC
- MEP-DOC
- TST-DOC
- CIV-DOC
- UTIL-DOC
- LAND-DOC
- D55 marine/test document gates

## 3. `data/system-test-pack-register.csv`

Contains the v0.5 package-specific functional test packs.

Review columns:

- `review_status`
- `confirmed_equipment_system_reference`
- `approved_test_procedure`
- `resolution_note`

Use this register against the approved equipment schedule and testing & commissioning matrix. Test packs marked `WHERE_APPLICABLE` must be confirmed, deleted or replaced before the contract baseline is accepted.

## Change-control rule

The generated CSV registers are **review aids**, not the schedule source of truth. Permanent changes must be made in the schedule generator/source mapping and then regenerated. This preserves:

- unique IDs
- predecessor logic
- timing provenance
- scope provenance
- validation history
- repeatable exports

## CI artifact

GitHub Actions uploads the master schedule plus these review registers after every successful validation. This allows a reviewer to use one validation artifact containing:

- master schedule CSV / JSON
- schedule statistics
- CPM report
- validation report
- provisional scope register CSV / JSON
- package document release register CSV
- system test pack register CSV
