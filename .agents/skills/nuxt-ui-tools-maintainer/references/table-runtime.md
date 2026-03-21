# Table Runtime

The table runtime is currently the richest domain in this repository.

It is the best current example of how this repository wants complex feature domains to evolve.

## What The Table Domain Is Responsible For

The table domain owns:

- schema-driven data-list configuration
- table and grid presentation modes
- URL-backed table state
- column and filter definitions
- selection, actions, controls, and context-aware interactions

The table domain should hide complexity behind a clean consumer flow:

1. define the schema
2. create the table with `useTable(...)`
3. render it with `DataList`

## Core Internal Layers

### Public layer

- `src/runtime/table/index.ts`
- `src/runtime/table/schema/index.ts`
- `src/runtime/table/composables/use-table.ts`

These should stay clean and consumer-oriented.

They should expose a stable package surface and avoid leaking orchestration details.

### Orchestration root

- `src/runtime/table/composables/use-table-internals.ts`

This is the best current map of how the domain fits together.

When you need the fastest understanding of current table wiring, start there.

### Major orchestration slices

- layout:
  `use-table-layout.ts`
- query state:
  `use-query-state.ts`
- state resolution:
  `use-table-state.ts`
- data:
  `use-table-data.ts`
- API:
  `use-table-api.ts`
- filters:
  `use-table-filters.ts`
- filter presentation:
  `use-table-filter-presentation.ts`
- selection:
  `use-table-selection.ts`
- columns:
  `use-table-columns.tsx`
- controls:
  `use-table-controls.ts`
- pagination helpers:
  `use-table-pagination.ts`

These composables should coordinate prepared domain logic rather than re-implementing the lower layers.

### Pure logic slices

- general:
  `src/runtime/table/utils/*`
- columns pipeline:
  `src/runtime/table/utils/columns/*`
- filter pipeline:
  `src/runtime/table/utils/filters/*`

This is where config/registry-driven behavior should live when the feature has multiple variants.

### Rendering

- shell:
  `src/runtime/table/components/DataList.vue`
- layout/table/grid renderers under:
  `components/*`

## Current Architecture Flow

The current high-level flow is:

1. `defineTableSchema(...)` resolves schema-facing builders into normalized schema data
2. `useTable(...)` exposes the consumer-facing table instance
3. `use-table-internals.ts` wires the domain graph
4. orchestration composables prepare layout, state, data, API, filters, selection, controls, columns, and pagination
5. `DataList.vue` and layout renderers consume the prepared state

Filter presentation is now its own orchestration concern:

- tag filters
- panel filters
- tag-dynamic filters
- panel draft state and apply/clear behavior

Do not collapse that back into render components.

## Where New Feature Code Usually Goes

If the work is about:

- public schema shape:
  `types/`, `schema/`, and builder-facing utils
- table state wiring:
  `composables/use-table-*.ts`
- pure filters logic:
  `utils/filters/*`
- pure columns logic:
  `utils/columns/*`
- rendering:
  `components/*`

Do not default to `use-table-internals.ts` as the place to add feature logic.
That file should stay an orchestration map, not a dumping ground.

## Table-Specific Internal Rules

- keep `DataList.vue` as a shell, not the domain brain
- keep variant-heavy logic in normalized utils/config-driven structures
- keep table state lean
- reduce extra reactive bridges when the abstraction can be improved directly
- keep columns as a pipeline
- keep filters definition-driven
- keep filter definitions organized around `behavior`, `display`, `source`, `editor`, and `preview`
- keep filter surface behavior in `use-table-filter-presentation.ts`, not in tag/panel components
- keep client facet computation in the data/query layer, not in filter UI composables
- keep actions, filters, columns, and layouts easy to document on the consumer side
- prefer normalized state shapes that are easy to serialize, explain, and test

## State Design Rule

Table state should be modeled as directly as possible.

Avoid this pattern when the abstraction can be improved:

- low-level query refs
- then grouped computed bridges
- then public reshaping computed bridges

Prefer:

- one grouped query-state abstraction for the domain slice
- one public mapping only when the public API truly needs a different shape

The existing query-state integration works, but it is still a known simplification target.

## Known Cleanup Direction

The current table implementation has useful structure, but there are known cleanup targets:

- reduce reactive waste
- reduce derivation-on-derivation layering
- simplify table/query-state integration
- keep moving builder logic toward the long-term structure

When refactoring, optimize for:

- less indirection
- clearer ownership
- easier explanation
- preserved or improved inference

## Feature-Addition Checklist

When adding or refactoring a table feature:

1. identify the owning layer
2. decide whether it is variant-heavy enough for config/registry structure
3. keep the consumer schema/API straightforward
4. update or add tests for behavior and inference
5. update consumer table skills if the feature is user-facing
6. update internal skill references if the architecture or extension path changed
