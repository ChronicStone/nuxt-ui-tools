# Table Runtime Architecture

This reference explains the current internal table runtime shape in more concrete detail.

## 1. Public Entry Layer

Main entrypoints:

- `src/runtime/table/index.ts`
- `src/runtime/table/schema/index.ts`
- `src/runtime/table/composables/use-table.ts`

What they do:

- expose the package-facing surface
- let consumers define a schema
- let consumers instantiate a table object

This layer should stay clean and inference-friendly.
If internals are awkward, fix the internals instead of leaking complexity outward.

## 2. Orchestration Root

The internal composition root is:

- `src/runtime/table/composables/use-table-internals.ts`

Today it wires together:

- layout
- query state
- resolved filters
- data loading
- column state
- selection
- public API
- filter helpers
- controls
- table columns
- pagination helpers

This file is the best high-level map of how the table runtime currently fits together.

## 3. State Model

Current state is distributed across several composables:

- `use-table-layout.ts`
- `use-table-state.ts`
- `use-query-state.ts`
- `use-table-data.ts`
- `use-table-selection.ts`
- `use-table-controls.ts`
- `use-table-columns.tsx`

Current design strengths:

- responsibilities are already somewhat split
- the system is not trapped in one monolithic composable

Current design weakness:

- there is still too much reactive layering in places
- some abstractions are created, then remapped, then re-derived again
- table/query-state integration should likely be simplified further

Target bias:

- fewer layers
- fewer bridge computeds
- clearer state ownership
- better direct abstractions

## 4. Query-State Bridge

The current table URL state bridge is:

- `src/runtime/table/composables/use-query-state.ts`

It currently composes:

- pagination grouped state
- sorting grouped state plus nullable mapping
- filters grouped state plus dynamic filter query state

This is a live pain-point area.
When extending or refactoring it, prefer:

- direct domain state modeling
- less mirrored state
- fewer conversion layers

## 5. Data Flow

The current data pipeline centers around:

- `use-table-data.ts`

Responsibilities include:

- context queries
- request context creation
- data query execution
- client-side query execution when needed
- page-context queries
- loading/error aggregation

This layer should own data orchestration, not rendering components.

## 6. Filter Flow

Important files:

- `use-table-filters.ts`
- `utils/filters/*`
- `utils/resolved-filters.ts`
- `utils/query-state.ts`

Good current pattern:

- filter preview logic is split per kind under `utils/filters/preview/*`

This is the kind of organization to continue:

- shared normalized contract
- per-kind isolated implementation
- orchestration layer consuming prepared outputs

## 7. Column Flow

Important files:

- `use-table-columns.tsx`
- `utils/columns/*`

This area already behaves like a pipeline:

- create runtime columns
- order them
- filter by visibility
- sync runtime state
- compute menu items
- produce final table columns

When growing it, preserve pipeline structure instead of centralizing everything into one render utility.

## 8. Rendering Layer

Main files:

- `components/DataList.vue`
- `components/table/*`
- `components/grid/*`
- `components/layout/*`

`DataList.vue` is primarily the shell/composition boundary.
It should consume orchestrated state rather than become the domain brain.

## 9. Playground Role

Current package usage examples live mainly in:

- `playground/app/pages/table-client.vue`
- `playground/app/pages/table-remote.vue`

Use them to validate package-facing behavior, but do not move reusable logic there.

## 10. Safe Extension Workflow

When adding a feature:

1. identify the schema/public contract
2. decide whether a normalized utility contract is needed
3. keep orchestration in composables
4. keep heavy domain transforms in utils
5. keep renderers thin
6. update tests, playground, and consumer skills if the package surface changed
