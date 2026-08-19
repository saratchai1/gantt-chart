# Scope Applicability Provenance — Baseline v0.7

Baseline v0.7 introduces a **separate scope-applicability field** so the schedule can remain detailed without silently turning generic proposal coordination content into a claim that every trade/system is already confirmed contractual scope.

This field is intentionally separate from:

- `basis_type` — whether the activity concept is SOURCE / DERIVED / ASSUMPTION;
- `timing_basis` — whether the exact day/window is SOURCE or ASSUMPTION.

A detailed activity can therefore be a valid proposal scheduling assumption and still be flagged as requiring IFC/BOQ confirmation.

## Allowed values

### `SOURCE_REQUIRED`

Used for Plan-01 project/control rows where the supplied source directly establishes the requirement or source control window.

### `DERIVED_FROM_SCOPE`

Used for detailed physical / closeout decomposition that is reasonably derived from the package description but whose exact leaf activity is not individually stated by the source.

### `WHERE_APPLICABLE`

Used where a generic template trade/system is retained for proposal coordination but the supplied package description does not firmly establish that exact system. These rows must be checked against:

- IFC drawings;
- BOQ;
- equipment schedules;
- approved shop drawings;
- approved Method Statements / ITPs;
- approved testing and commissioning matrix.

If the system is absent, the row is to be deleted or replaced before contract-baseline approval rather than left as a fabricated scope obligation.

### `CONTROL_STREAM`

Used for supporting control, enabling, monitoring, document, commercial or evidence streams from Plans 02–16.

## Conservative package-scope audit

The current supplied Plan-1 package descriptions are used conservatively.

### A23 Learning Centre

Plan 1 states structure, architecture and building services. Standard service decomposition remains `DERIVED_FROM_SCOPE`.

### A24 Restaurant / Cafe

Plan 1 principally states structure, architecture, kitchen systems and related testing. Generic full-building MEP / electrical / plumbing / HVAC / ICT rows remain in the proposal network but are flagged `WHERE_APPLICABLE`; kitchen-specific specialist rows remain `DERIVED_FROM_SCOPE`.

### A25 Meeting / Multipurpose Building

Electrical / communications are principal. Generic plumbing / HVAC layers are flagged `WHERE_APPLICABLE`.

### A26 Water Production Building

Process water and electrical/control interfaces are principal. Generic HVAC / ICT / sanitary-fixture layers are flagged `WHERE_APPLICABLE`.

### B31 Toilet Building

Sanitary systems are principal. Generic HVAC / ICT and generic electrical layers are flagged `WHERE_APPLICABLE` until approved building-services design confirms them.

### B32 Waste Building

Plan 1 emphasizes building, waste-management systems and environmental measures. Generic building-service template layers are flagged `WHERE_APPLICABLE`.

### C43 Pump Building

Pumping and electrical/control are principal. Generic HVAC / ICT / sanitary-fixture layers are flagged `WHERE_APPLICABLE`.

### External / Area-D packages

Where Plan 1 does not explicitly establish permanent utility/electrical systems for a particular external / nature package, those generic utility/electrical template rows are flagged `WHERE_APPLICABLE`. The physical civil / drainage / landscape / restoration scope remains detailed according to the source package description.

## v0.5 test-pack integration

Test activities whose name already contains **where applicable** are automatically classified `WHERE_APPLICABLE`. This makes the caution machine-readable instead of leaving it only in narrative notes.

## Validation rule

Every row must have one of the four allowed scope-applicability values. `UNCLASSIFIED` or blank status is a structural validation error.

The first v0.7 validation produced:

- `SOURCE_REQUIRED = 7`
- `DERIVED_FROM_SCOPE = 617`
- `WHERE_APPLICABLE = 64`
- `CONTROL_STREAM = 378`
- total = **1,066 rows**
- validation = **PASS**

All 64 provisional rows remain visible in the schedule and can be filtered in the interactive Gantt. They are not hidden or removed; the purpose is to make their status explicit for proposal review and later contract-baseline cleanup.
