# V1 Analysis

## What Exists Today

The V1 system in `tars-shared-ui/src/runtime/lib/data-list` is already a fairly complete table platform, not just a table component.

Main pieces:

- schema definition: `types/table.ts`, `utils/schema.ts`
- query model and adapters: `types/query.ts`, `adapters/elasticsearch.ts`
- query state and persistence: `composables/useQueryState.ts`
- data execution: `composables/useTableData.ts`
- filters and quick filters: `types/filters.ts`, `composables/useTableFilters.ts`, `utils/filter.tsx`
- layout, controls, actions, view parsing: `useTableLayout.ts`, `useTableControls.ts`, `useTableActions.tsx`, `useTableView.ts`
- rendering: `components/DataList.vue`, `components/table/*`, `components/grid/*`

## Strong Parts Worth Keeping

### 1. Schema-first design

The biggest success of V1 is that consumers define behavior declaratively:

- columns
- grid items
- row actions
- bulk actions
- filters
- static filters
- quick filters
- pagination
- controls
- view-specific variants

That should remain the core V2 philosophy.

### 2. Local and remote modes share a single feature surface

Even if the internals differ, users get a consistent mental model:

- search
- sort
- filters
- pagination
- refresh
- selection
- layout switching

This is the right product goal. V2 should preserve it, but with cleaner abstractions.

### 3. Context and page-context are genuinely useful

Two V1 ideas are stronger than they look:

- `context`: external async dependencies required to define behavior
- `pageContext`: derived async data fetched from the current page rows

These solve real problems for tables with dynamic permissions, dependent filter options, faceting, and row-aware side metadata.

V2 should keep this capability, but rename it more clearly.

### 4. Grid and table are treated as first-class views

V1 is not "table only". It supports:

- dense tabular mode
- card/grid mode
- layout-specific sort defaults
- layout-specific controls

That is important for inventory, listings, media, and marketplace use cases.

## Structural Problems In V1

### 1. Remote querying is adapter-first instead of state-first

The current shape revolves around `remote: false | QueryAdapterKey`, `DataSource<RemoteAdapter>`, and adapter contracts keyed by a registry.

That works, but it creates the wrong design center:

- the primary abstraction becomes backend payload translation
- remote mode feels special even when an app just wants `query(state) => result`
- filter definitions need adapter metadata early

This is the opposite of the desired V2 direction.

The stable core should be:

- a normalized query state
- a normalized query result

Adapters should become optional codecs around that core.

### 2. Filters are overloaded

V1 filters mix several concerns:

- UI form field definition
- filter preview rendering
- client filter semantics
- remote adapter semantics
- quick filter semantics

This is powerful, but hard to reason about. It also creates inconsistencies:

- client filters use `QueryFilter`
- remote filters use adapter-specific metadata
- quick filters behave differently from regular filters
- static filters are not the same kind of object as dynamic filters

V2 should separate:

- filter field definition
- applied filter state
- query serialization

### 3. View templating is flexible but implicit

The `ViewTemplateObject` pattern and `useTableView.ts` give a lot of power, but the behavior is partially hidden:

- some arrays are view-resolved
- some nested item properties are view-resolved
- some object properties are view-resolved
- not all schema keys follow the same rules

This is ergonomic once you know it, but too magical for a foundational library.

V2 should keep scoped config, but make it explicit and uniform.

### 4. Rendering and engine concerns are too intertwined

V1 is coupled to Naive UI table concepts:

- column config maps closely to the renderer
- control panels assume that rendering model
- internals expose table-specific structure directly

For V2, the architecture needs clearer layers:

- query engine
- state engine
- schema model
- renderer integration

### 5. Persisted query state is mixed with UI state

V1 persists sort, pagination, and filters, which is correct. But a V2 should define exactly what belongs in:

- shareable query state
- restorable UI preferences
- ephemeral runtime state

These are currently adjacent but not clearly separated.

## Product Features To Preserve

V2 should preserve these V1 capabilities:

- local client-side data querying
- remote paginated querying
- schema-based columns
- schema-based card/grid renderer
- row actions and bulk actions
- search query
- dynamic filters
- static filters
- quick filters
- persisted state
- row updates via API
- selection
- view templates
- default layout and layout toggles
- configurable controls
- tree/table support if still needed
- route-aware table keys
- per-layout pagination defaults and sort defaults

## Product Features To Reconsider

These should be re-evaluated instead of copied verbatim:

- tree mode
- implicit view-scoped parsing
- filter side panels
- adapter registry as the primary remote abstraction
- form-schema driven filters as the only way to define filter UI

## Key V2 Interpretation

V1 proves the domain model is valid.

The V2 task is not "replace the old system". It is:

- keep the domain model
- simplify the core contracts
- separate headless state from renderer integration
- make remote integration feel natural
- make TanStack optional at the architecture boundary
