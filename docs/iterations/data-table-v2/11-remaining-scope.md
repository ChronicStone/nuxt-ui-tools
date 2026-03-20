# Remaining Scope

This file captures the table runtime and product surface that still appears incomplete, partially implemented, or not yet started.

It is based on:

- the V1 reference implementation in `tars-shared-ui`
- the V2 iteration docs in this directory
- the current `src/runtime/table` implementation

The goal is not to force every V1 behavior back into V2 unchanged.
The goal is to make the remaining decision surface explicit so implementation can proceed intentionally.

## Status Legend

- `implemented`: shipped end-to-end in current runtime
- `partial`: present in types/docs or partly wired, but not complete
- `missing`: not implemented in the current runtime
- `decision`: requires a product/architecture choice before implementation

## Current Read

The current package already has more than the reset plan originally intended:

- query state
- context and page context
- client and remote data execution
- search
- UI filters
- static filters
- remote option filters and facet counts
- row actions
- table/grid rendering
- selection basics
- row updates via API

The main remaining scope is around:

- unfinished typed surfaces
- V1 capabilities not yet reintroduced
- filter presentation architecture
- persistence and configuration parity

## 1. High-Priority Runtime Gaps

### 1.1 Bulk actions

Status: `partial`

Exists today:

- schema type: `actions`
- action types
- consumer docs mention bulk workflows

Still missing:

- action resolution runtime
- header/footer action UI
- `requiresSelection` behavior
- disabled/loading/action execution plumbing
- layout-aware action presentation

Why it matters:

- selection currently exists without the main workflow it is meant to power

### 1.2 Toolbar actions

Status: `partial`

Exists today:

- schema type: `toolbarActions`
- action type definitions
- consumer docs mention them

Still missing:

- runtime resolution
- rendering surface in header
- condition/disabled/loading execution support

### 1.3 Selection auto mode

Status: `partial`

Exists today:

- `selection.mode` supports `false | true | 'auto'`

Still missing:

- real `'auto'` semantics

Expected behavior:

- `'auto'` should enable selection only when the schema makes it useful
- likely triggers:
  - bulk actions exist
  - explicit table selection is enabled
  - other future workflows depend on selection

Current problem:

- current runtime effectively treats anything except `false` as enabled

### 1.4 Controls schema

Status: `partial`

Exists today:

- schema type for `controls`
- V1 precedent for responsive control visibility

Still missing:

- actual resolution of `refresh`, `layout`, `columns`, `filters`, `sort`, `actions`
- responsive string/object handling
- rendering behavior tied to resolved controls

Why it matters:

- this is one of the key schema-driven customization surfaces

### 1.5 Pagination display controls

Status: `partial`

Exists today:

- `showPageSizePicker`
- `showPagesList`
- `showPagesCount`

Still missing:

- footer actually honoring those flags

## 2. Filter Presentation Scope

This is now an explicit product/runtime scope item.

The important distinction is:

- filter semantics define what a filter means
- filter presentation defines where and how the user activates/edits it

That presentation layer should not be hard-coded to the current tag workflow.

### 2.1 Per-filter location

Status: `missing`

Needed:

- each filter can declare a `location`
- location should support responsive values
- string DSL should be allowed, for example:
  - `tag`
  - `panel`
  - `tag-dynamic`
  - `panel md:tag`

Suggested direction:

- location should follow the same style as other responsive config surfaces in the repo
- resolution should happen once in normalized filter UI state, not ad hoc in multiple components

### 2.2 `tag`

Status: `implemented`

This is the current behavior:

- filter rendered directly in the tag bar
- user edits operator/value inline through the existing workflow

### 2.3 `panel`

Status: `missing`

Definition:

- filter is configured from a centralized filter panel instead of living in the tag bar

Recommended default surface:

- drawer, not popover

Reason:

- better for mobile
- better for large filter sets
- better for rich option/date/tree UIs
- more scalable than many independent popovers

Needed behavior:

- panel open/close state
- list of panel-located filters
- render same filter editor UI in panel context
- clear/apply workflow
- active state preview/counts
- synchronization with URL/query state

### 2.4 `tag-dynamic`

Status: `missing`

Definition:

- filter does not show as an always-present editable tag
- user starts from an "add filter" trigger
- user chooses:
  - filter
  - operator
  - value
- once applied, the filter appears as a normal active tag
- clearing removes the tag entirely and returns the filter to dormant state

Why this matters:

- it supports a more scalable table UX
- it avoids visually overwhelming the header with many inactive filters
- it matches modern issue-tracker / database-style filter insertion flows

Needed behavior:

- add-filter trigger
- searchable filter picker
- operator/value step flow
- dormant vs active filter lifecycle
- clear removes the inserted tag entirely
- coexistence with always-visible `tag` filters and `panel` filters

### 2.5 Mixed-mode composition

Status: `missing`

Needed:

- some filters can be `tag`
- some can be `panel`
- some can be `tag-dynamic`
- responsive switching must work, for example:
  - `panel md:tag`

This needs a single ownership model for:

- resolved filter presentation
- active filter list
- dormant filter list
- insertion/removal rules

### 2.6 Filter panel architecture

Status: `decision`

Open decision:

- one global drawer for all `panel` filters
- or separate per-filter popovers

Recommendation:

- use one shared drawer as the primary architecture
- keep popovers as a possible secondary UI detail for simple desktop cases later

## 3. Persistence Scope

### 3.1 Query state persistence

Status: `partial`

Exists today:

- URL-backed query state for layout, pagination, sorting, filters

Still missing:

- explicit honoring of schema-level `persistence.state`
- clear separation between shareable query state and non-shareable preferences

### 3.2 Preferences persistence

Status: `missing`

Needed:

- layout preference persistence
- column visibility persistence
- column order persistence
- potentially column pinning/sizing persistence
- future filter presentation preferences if needed

Still missing today:

- actual use of `persistence.preferences`
- runtime storage abstraction
- scoping by stable table identity

### 3.3 Table identity

Status: `partial`

Exists today:

- `tableKey: string`

Still missing:

- using `tableKey` as a persistence namespace
- route-aware table keys if desired

Open decision:

- keep V2 simpler with string-only `tableKey`
- or reintroduce route-aware / computed table keys from V1

## 4. V1 Capabilities Not Yet Brought Back

These are not all automatic must-haves.
Some are restore candidates, some are deliberate simplification candidates.

### 4.1 Quick filters

Status: `missing`

V1 had:

- `quickFilters`
- dedicated quick-filter state
- quick-filter slot workflow

Current V2:

- no schema surface for quick filters

Decision needed:

- restore as a first-class surface
- replace with `tag-dynamic`
- or intentionally drop in favor of a cleaner unified filter model

### 4.2 View templates / active view resolution

Status: `missing`

V1 had:

- `viewTemplates`
- `activeView`
- view-scoped schema resolution

Current V2:

- no active-view schema resolution layer

Decision needed:

- reintroduce an explicit version of scoped schema variants
- or keep layout as the only first-class view switch

### 4.3 Route-aware table keys

Status: `missing`

V1 had:

- function-valued `tableKey({ view, route })`

Current V2:

- `tableKey` is string-only

Decision needed:

- keep string-only
- or reintroduce computed keys when persistence scope is implemented

### 4.4 Tree mode

Status: `partial`

Exists today:

- `treeMode`
- `childrenKey`

Still missing:

- actual runtime support in data shaping and renderer behavior

Recommendation:

- keep deferred unless there is an active product need

## 5. Deferred Feature Work

These are already acknowledged as deferred in the iteration docs.

### 5.1 Inline editable columns

Status: `missing`

### 5.2 Cursor pagination

Status: `missing`

Note:

- remote option/filter queries already use cursor-style inputs
- main table pagination still works in page/index form

### 5.3 Header drag-and-drop reorder polish

Status: `partial`

Current V2 already has some column reordering support in the column panel.

Still deferred:

- more advanced direct header drag-and-drop reorder as an explicit product surface

## 6. Documentation And Surface Honesty

Status: `partial`

Current issue:

- some consumer docs and schema surface docs describe features that are not actually implemented end-to-end yet

Examples:

- `actions`
- `toolbarActions`
- `controls`
- `persistence`

Needed:

- keep consumer guidance aligned with shipped behavior
- or mark planned surfaces explicitly as planned

This matters because the table package is intentionally schema-driven and users will trust the documented schema surface.

## 7. Recommended Delivery Order

Recommended order for implementation:

1. Finish schema honesty:
   - bulk actions
   - toolbar actions
   - real `selection: 'auto'`
   - controls resolution
   - pagination visibility flags

2. Design and implement filter presentation modes:
   - location config
   - shared resolution model
   - drawer-based `panel`
   - `tag-dynamic`
   - mixed-mode composition

3. Implement persistence properly:
   - query-state vs preferences split
   - table-key scoping
   - layout / column preference persistence

4. Decide V1 carryovers:
   - quick filters
   - view templates
   - route-aware keys
   - tree mode

5. Revisit deferred richer features:
   - cursor pagination
   - inline editing
   - richer header drag-and-drop

## 8. Suggested Next Working Slice

The best next slice is probably:

- finalize the filter presentation model before more UI implementation spreads

Suggested first implementation sequence inside that slice:

1. define filter `location` schema and normalized runtime type
2. implement responsive resolution
3. implement shared filter drawer for `panel`
4. implement dormant/active lifecycle for `tag-dynamic`
5. integrate mixed-mode rendering into the current header/filter bar

That gives a strong foundation for the rest of the table UX.
