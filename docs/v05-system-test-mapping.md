# Package-specific System Test Mapping — Baseline v0.5

Baseline v0.5 expands the generic functional-testing window into parallel system test packs before integrated commissioning. The purpose is to bring the programme closer to the activity depth expected from a detailed construction Gantt while keeping the source / assumption boundary explicit.

## Source basis

Plan 1 identifies the principal scope of each work package, including for example:

- 2.3 Learning Centre — structure, architecture, building services and quality inspection
- 2.4 Restaurant / Cafe — structure, architecture, kitchen systems and related testing
- 2.5 Meeting / Multipurpose Building — structure, architecture, electrical-communications and commissioning
- 2.6 Water Production Building — water systems and utility-interface testing
- 2.9 Eternal Room — building and building services
- 3.1 Toilet Building — building, sanitary systems and testing
- 3.2 Waste Building — building, waste-management systems and environmental measures
- 4.1 Reception Building — building and building services
- 4.2 Tent Houses — structure, architecture and tent-house building services
- 4.3 Pump Building — pumping systems and operational testing

Plan 7 requires inspection / testing evidence and acceptance before work is considered complete. Plan 1 also requires final testing / commissioning and closeout evidence.

The source does **not** give a complete equipment-by-equipment test schedule or separate exact day for every discipline. Therefore the v0.5 leaf test activities are proposal-level detailed planning rows with `basis_type=ASSUMPTION` and `timing_basis=ASSUMPTION`.

## Test-pack logic

Each selected package retains its existing sequence:

`Second Fix / Installation → Precommissioning → Functional Test Coordination → Integrated Commissioning`

v0.5 inserts parallel test packs between Precommissioning and the completion of the package-level Functional Test window:

`Precommissioning → [System Test Pack A | B | C | ...] → Functional Test Coordination completion → Integrated Commissioning`

The individual test packs are FS from precommissioning and FF into the package-level `FUNC` activity. This means system tests can run in parallel but the package functional-test window cannot finish before all defined principal test packs are complete.

## Package profiles

### A23 — Learning Centre

- Electrical test pack
- Plumbing / fire-service test pack
- HVAC test pack
- ICT / CCTV / network / AV / access-control test pack

### A24 — Restaurant / Cafe

- Electrical / kitchen-equipment supply test pack
- Water / drainage / grease-drain / sanitary test pack
- Kitchen exhaust / make-up-air / ventilation test pack
- Kitchen equipment interface / operational test pack

### A25 — Meeting / Multipurpose Building

Plan 1 explicitly emphasizes electrical-communications and commissioning, therefore v0.5 conservatively adds:

- Electrical test pack
- Conference AV / sound / communications / control-system test pack

It does not add extra package-specific HVAC/plumbing test packs solely from general construction convention.

### A26 — Water Production Building

- Water-production / pump / tank / valve / flushing / process test pack
- Power / instrumentation / control-panel / sensor test pack

### A29 — Eternal Room

- Electrical / lighting / protection test pack
- Plumbing / drainage test pack **where applicable**

### B31 — Toilet Building

- Sanitary / water / drainage test pack
- Electrical / lighting / protection test pack **where applicable**

### B32 — Waste Building

- Waste-handling / drainage / washdown / environmental-control interface test pack **where applicable**
- Electrical / lighting / equipment-supply test pack **where applicable**

### C41 — Reception Building

- Electrical / lighting / protection test pack
- Plumbing / drainage / fire-service test pack **where applicable**
- Communications / access / operational-interface test pack **where applicable**

### C42A/B/C — Tent House clusters

- Electrical / lighting / protection test pack
- Water / sanitary / drainage test pack **where applicable**

### C43 — Pump Building

- Pump / piping / valve / flow / operational test pack
- Pump power / protection / controls / instrumentation test pack

## “Where applicable” rule

The detailed proposal schedule must not convert a broad building-services phrase into an unsupported statement that every listed system definitely exists in every building. Rows marked by wording such as **where applicable** are retained as planning allowances pending confirmation from:

- IFC drawings
- BOQ / equipment schedule
- approved shop drawings
- approved Method Statements / ITPs
- final commissioning matrix

If a system is absent from the approved project scope, the corresponding proposal row should be deleted or replaced before contract-baseline approval rather than left as a fabricated obligation.

## Validation result after v0.5 expansion

The first v0.5 CI validation produced:

- 986 activities
- 178 milestones
- 55 computed zero-float activities
- 986 / 986 reachable from NTP
- 983 / 986 connected to D1200
- Plan-01 physical 683 / 683 complete NTP→D1200
- Plan-01 handovers 23 / 23 complete NTP→D1200
- 0 structural errors
- 0 dependency cycles
- 0 network-integrity errors
- 0 temporal warnings
- PASS

The representative critical path remains a 36-activity chain because the new detailed parallel system-test packs strengthen the commissioning network without forcing an artificial change to the selected proposal driving chain.
