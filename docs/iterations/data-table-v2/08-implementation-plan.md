# Implementation Plan

This plan is designed for future Codex sessions to execute the V2 `DataList` work incrementally.

Principles:

- core internals first
- orchestration before polished UI
- inspectability before aesthetics
- one implementation step per Codex session
- every session appends progress notes, issues, and outcomes to the relevant step log
- type-safety is a hard requirement
- performance is a hard requirement
- motion quality is a high-priority UI requirement once UI implementation begins

The first iterations should prefer debug-first rendering and instrumentation over final UI polish.

## Non-Negotiable Engineering Constraints

- preserve type inference aggressively
- avoid manual userland generics unless absolutely unavoidable
- validate type quality during implementation, not only runtime behavior
- design runtime paths to be performant by default
- avoid architecture that requires later performance rescue work
- favor predictable state transitions and narrow reactive dependencies

## Execution Rules

- Each numbered step below is intended to be completed in its own Codex session.
- Do not skip ahead unless dependencies are already complete.
- Every session must update the `Session Log` section of the step it worked on.
- Every session must also create or update a file in:
  - [`./session-logs/`](./session-logs/)
- If a step is partially completed, mark what remains clearly before ending the session.
- If implementation reveals a spec mismatch, update:
  - [`07-current-spec.md`](./07-current-spec.md)
  - and the step log in this file

## Deliverable Strategy

### Phase A: Engine and instrumentation

Goal:

- get schema parsing, state, source execution, serialization, persistence, and tracing working
- use temporary debug UIs to inspect runtime behavior

### Phase B: Table/grid functional rendering

Goal:

- plug the engine into basic table/grid rendering
- keep UI minimal but usable

### Phase C: Real UI system

Goal:

- build the final `DataList` shell, toolbar, filters, footer, panels, and polished interactions
- add subtle, high-quality motion and micro-interactions

## Package / Folder Assumption

Current recommendation:

- keep one `table` package
- structure internally with folders such as:
  - `src/core`
  - `src/composables`
  - `src/components`
  - `src/debug`
  - `src/types`

Shared generic utilities may live in `packages/shared`.

## Step 1. Package Skeleton And Internal Module Boundaries

Objective:

- create the internal folder structure for the new table system
- establish the public export surface
- define placeholder modules so future sessions can fill them in incrementally

Scope:

- create internal folders
- create index exports
- create placeholder files for:
  - schema
  - types
  - source execution
  - state
  - filters
  - actions
  - persistence
  - context/pageContext
  - debug components

Expected output:

- coherent file structure
- no real logic yet beyond safe scaffolding

Session Log:

- Status:
- Date:
- Session summary:
- Files created/changed:
- Open issues:
- Next session handoff:

## Step 2. Type System Foundations

Objective:

- implement the core type model for the new schema

Scope:

- schema input types
- `source` XOR typing for `loader` vs `query`
- `rowKey` typing
- state types
- filter rule types
- sorting rule types
- context/pageContext item types
- action types
- `TableApi`, `TableState`, `TableMeta`

Expected output:

- foundational TS contracts compile cleanly
- inference direction is testable with editor/typecheck

Important:

- do not start implementing runtime logic before this is stable enough

Session Log:

- Status:
- Date:
- Session summary:
- Files created/changed:
- Open issues:
- Next session handoff:

## Step 3. Schema Builder

Objective:

- implement `defineTableSchema(...)`

Scope:

- inference-preserving identity builder
- builder callback support for:
  - `columns: column => [...]`
  - `filters.dynamic: filter => [...]`
- initial column builder support:
  - `field`
  - `composite`
  - `display`
- initial filter builder support:
  - `text`
  - `option`
  - `boolean`
  - `number`
  - `date`

Expected output:

- schemas compile
- builders feel ergonomic in type tests

Do not yet implement UI rendering.

Session Log:

- Status:
- Date:
- Session summary:
- Files created/changed:
- Open issues:
- Next session handoff:

## Step 4. Source Resolution Engine

Objective:

- implement source execution orchestration

Scope:

- `client` mode with plain array contract
- `remote` mode with `{ rows, rowCount }` contract
- `loader` path
- `query` path abstraction
- remote serializer pipeline:
  - `toRequest`
  - `fromResponse`

Expected output:

- one normalized internal result shape
- runtime can execute schema sources deterministically

Important:

- keep it UI-agnostic
- query-backed execution can be stubbed if needed before full TanStack Query integration

Session Log:

- Status:
- Date:
- Session summary:
- Files created/changed:
- Open issues:
- Next session handoff:

## Step 5. Context And PageContext Lifecycle

Objective:

- implement the full loading lifecycle

Lifecycle:

1. load `context`
2. load table data
3. load `pageContext`

Scope:

- array-based `context`
- array-based `pageContext`
- `views`
- `condition`
- `loader` xor `query`
- resolved values merged into runtime meta
- patch APIs:
  - `updateContext`
  - `updatePageContext`

Expected output:

- full lifecycle orchestration works
- resolved values are readable and patchable

Session Log:

- Status:
- Date:
- Session summary:
- Files created/changed:
- Open issues:
- Next session handoff:

## Step 6. Core State Engine

Objective:

- implement the reactive table state model

Scope:

- `search`
- `filters`
- `sorting`
- `pagination`
- `selection`
- `activeView`
- `activeLayout`
- preserve state across reactive schema changes when possible

Expected output:

- `useTable(schema)` can hold and mutate stable runtime state

Session Log:

- Status:
- Date:
- Session summary:
- Files created/changed:
- Open issues:
- Next session handoff:

## Step 7. Effective Filter Pipeline

Objective:

- build the full filter pipeline

Scope:

- dynamic filter state
- static filters
- `source: 'static' | 'dynamic'` provenance
- search integration
- normalized effective filters
- filter operator typing and runtime shaping

Expected output:

- one effective filter list consumable by source execution
- clear distinction between authored dynamic filters and resolved static filters

Session Log:

- Status:
- Date:
- Session summary:
- Files created/changed:
- Open issues:
- Next session handoff:

## Step 8. Sorting And Pagination Engine

Objective:

- implement sorting and pagination behavior

Scope:

- simple sorting only
- table sorting from columns
- grid sorting config
- offset pagination only
- `rowCount` to `pageCount` derivation

Expected output:

- stable state transitions for paging and sorting

Session Log:

- Status:
- Date:
- Session summary:
- Files created/changed:
- Open issues:
- Next session handoff:

## Step 9. Selection Engine

Objective:

- implement key-based selection

Scope:

- key-based `state.selection`
- derived `meta.selectedRows`
- derived `meta.selectedCount`
- API methods:
  - `clearSelection`
  - `setSelection`
  - `toggleSelection`
- selection mode:
  - `always`
  - `hidden`
  - `auto`
- no grid selection in first iteration

Expected output:

- selection works cleanly in table mode

Session Log:

- Status:
- Date:
- Session summary:
- Files created/changed:
- Open issues:
- Next session handoff:

## Step 10. Persistence Engine

Objective:

- implement persistence independently from Nuxt

Scope:

- `persistence: true`
- `persistence: { state, preferences }`
- persistence key scoping compatible with V1 approach
- pluggable persistence adapter
- initial adapter contract in shared/core

Expected output:

- state/preferences persistence works without coupling to `useCookie`

Session Log:

- Status:
- Date:
- Session summary:
- Files created/changed:
- Open issues:
- Next session handoff:

## Step 11. URL Query State Engine

Objective:

- implement compact internal URL serialization

Scope:

- internal compact serializer
- parse from route query into table state
- emit route query from table state
- avoid giant raw JSON arrays
- expose:
  - `buildTableQuery(schema, partialState)`

Expected output:

- compact, schema-aware, typed deep-linking support

Important:

- this is separate from remote source serializer logic

Session Log:

- Status:
- Date:
- Session summary:
- Files created/changed:
- Open issues:
- Next session handoff:

## Step 12. Query-Backed Resolver Integration

Objective:

- integrate query-backed execution properly

Scope:

- support `source.query`
- support query-backed async sources for:
  - table data
  - filter options
  - `context`
  - `pageContext`
- make sure normalized contracts hold

Expected output:

- query-backed flows are fully functional

Important:

- keep the source semantics identical to uncached `loader` paths
- only the caching/execution mechanism should differ

Session Log:

- Status:
- Date:
- Session summary:
- Files created/changed:
- Open issues:
- Next session handoff:

## Step 13. Debug Runtime Surface

Objective:

- create temporary debug-first UI for inspecting the engine

Scope:

- debug component to render:
  - current state
  - effective filters
  - resolved context
  - resolved pageContext
  - source request payload
  - normalized result
  - loading phases
  - errors
- mountable playground example

Expected output:

- future sessions can inspect behavior visually before final UI work

This step is critical.

Do not jump into polished UI before this exists.

Session Log:

- Status:
- Date:
- Session summary:
- Files created/changed:
- Open issues:
- Next session handoff:

## Step 14. Public `useTable` Runtime

Objective:

- finalize the public `useTable(schema)` API

Scope:

- expose:
  - `table.api`
  - `table.state`
  - `table.meta`
- reactive schema support
- stable public method wiring

Expected output:

- external consumers can drive the full table from the composable alone

Session Log:

- Status:
- Date:
- Session summary:
- Files created/changed:
- Open issues:
- Next session handoff:

## Step 15. Minimal `DataList` Functional Shell

Objective:

- build a minimal functional UI shell on top of the working runtime

Scope:

- basic `DataList`
- schema or table prop support
- simple debug-ish rendering for:
  - toolbar
  - content
  - footer
- no polish required

Expected output:

- end-to-end interaction works through a basic component

Important:

- prioritize inspectability over appearance

Session Log:

- Status:
- Date:
- Session summary:
- Files created/changed:
- Open issues:
- Next session handoff:

## Step 16. Minimal Table Layout Renderer

Objective:

- implement a first usable table renderer

Scope:

- basic header rendering
- basic cell rendering
- row actions support
- selection column
- loading/empty/error integration
- layout-specific empty slots

Expected output:

- minimal but functional table mode

Session Log:

- Status:
- Date:
- Session summary:
- Files created/changed:
- Open issues:
- Next session handoff:

## Step 17. Minimal Grid Layout Renderer

Objective:

- implement a first usable grid renderer

Scope:

- card rendering
- custom grid skeleton support
- layout switching compatibility
- no selection in first iteration

Expected output:

- minimal but functional grid mode

Session Log:

- Status:
- Date:
- Session summary:
- Files created/changed:
- Open issues:
- Next session handoff:

## Step 18. Toolbar Foundation

Objective:

- implement the default toolbar structure

Target structure:

- top row:
  - filter trigger
  - search
  - right-side toolbar actions / layout switch / column config
- second row:
  - active filter chips
  - clear/reset action

Scope:

- `DataListToolbar`
- `DataListFilters`
- `toolbarActions`
- search
- active filter display

Expected output:

- default layout matches the agreed direction structurally, even if not yet visually polished

Session Log:

- Status:
- Date:
- Session summary:
- Files created/changed:
- Open issues:
- Next session handoff:

## Step 19. Filter Builder UI

Objective:

- implement the Bazza-inspired filter UX

Scope:

- single filter trigger button
- overlay rule builder
- operator selection
- async options
- rule chip rendering
- clear/reset behavior

Expected output:

- first-class filter UI fully wired to the engine

Session Log:

- Status:
- Date:
- Session summary:
- Files created/changed:
- Open issues:
- Next session handoff:

## Step 20. Column Header Dropdown UI

Objective:

- implement header-driven dropdown interaction

Scope:

- hover affordance
- header opens dropdown
- default actions:
  - sort asc
  - sort desc
  - hide
  - pin left
  - pin right
- column resizing handles

Expected output:

- improved discoverability and interaction parity with the agreed references

Session Log:

- Status:
- Date:
- Session summary:
- Files created/changed:
- Open issues:
- Next session handoff:

## Step 21. Column Config Overlay

Objective:

- implement the single compact column configuration overlay

Scope:

- visibility
- order
- pinning
- persistence integration

Expected output:

- functional compact view/columns overlay

Session Log:

- Status:
- Date:
- Session summary:
- Files created/changed:
- Open issues:
- Next session handoff:

## Step 22. Footer And Pagination UI

Objective:

- implement the shared footer UI for table and grid

Scope:

- selected count
- total row count
- pagination controls
- per-layout consistency

Expected output:

- stable shared footer for both layouts

Session Log:

- Status:
- Date:
- Session summary:
- Files created/changed:
- Open issues:
- Next session handoff:

## Step 23. `defineEntityActions` And `RowActions`

Objective:

- restore the reusable action model

Scope:

- `defineEntityActions`
- typed events
- target-based behavior
- table-only `<RowActions>` wrapping `UDropdownMenu`

Expected output:

- reusable entity actions work in and outside table context

Session Log:

- Status:
- Date:
- Session summary:
- Files created/changed:
- Open issues:
- Next session handoff:

## Step 24. Testing Selectors

Objective:

- redesign testing selectors with the new architecture

Scope:

- generic selector primitives in shared
- table-specific helpers
- predictable naming
- easy access from table runtime / components

Expected output:

- practical test selectors that do not repeat V1 mistakes blindly

Session Log:

- Status:
- Date:
- Session summary:
- Files created/changed:
- Open issues:
- Next session handoff:

## Step 25. Visual Refinement Pass

Objective:

- move from debug-functional to intentional visual design

Scope:

- compact toolbar sizing
- calmer buttons
- spacing and hierarchy refinement
- responsive behavior
- better shell polish for table and grid
- subtle high-quality motion and micro-interactions

Expected output:

- visual quality aligned with the agreed direction in [`06-ui-direction.md`](./06-ui-direction.md)
- interaction quality clearly improved over V1

Important:

- use the installed motion-oriented skills when working on this step:
  - `ui-animation`
  - `animate`

Session Log:

- Status:
- Date:
- Session summary:
- Files created/changed:
- Open issues:
- Next session handoff:

## Step 26. Documentation And Playgrounds

Objective:

- finish handoff-quality docs and examples

Scope:

- update package README/docs
- create playground examples for:
  - client loader source
  - remote loader source
  - query-backed source
  - static filters
  - context/pageContext
  - toolbar actions
  - column config
  - filter builder

Expected output:

- future agents and humans can continue work without reverse engineering the implementation

Session Log:

- Status:
- Date:
- Session summary:
- Files created/changed:
- Open issues:
- Next session handoff:

## Session Logging Convention

Every session should update the step it worked on with:

- `Status`: `not started` / `in progress` / `blocked` / `done`
- `Date`
- `Session summary`
- `Files created/changed`
- `Open issues`
- `Next session handoff`

If a session changes the agreed spec, it must also update:

- [`05-decisions-log.md`](./05-decisions-log.md) if the change is a decision
- [`07-current-spec.md`](./07-current-spec.md) if the change affects the working spec
