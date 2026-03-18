# V1 Architecture Reference

This document captures the V1 composable structure and organization from `tars-shared-ui` for use as a reference pattern when building V2 internals.

V1 source: `/Users/cyprienthao/Documents/DEV/ORGANISATIONS/AGORASTORE/NEW_STACK/tars-shared-ui/src/runtime/lib/data-list`

---

## Overall Organization

```
data-list/
├── composables/         ← One file per concern, no giant composables
├── components/          ← Vue SFCs for DataList, DataTable, DataGrid, etc.
├── types/               ← TypeScript interfaces and type contracts
├── adapters/            ← Remote query adapter processors
├── config/              ← Constants (pagination defaults, etc.)
└── utils/               ← Pure functions (state transformation, template utils)
```

---

## Entry Point: `createInjectionState` in `useTableInternals.ts`

V1 uses `createInjectionState` from `@vueuse/core` to orchestrate all sub-composables.

```ts
const [useProvideTableInternals, _useTableInternals] = createInjectionState(
  (rawSchema: ComputedRef<DataListSchema>) => {
    // All sub-composables wired together here
    return { queryState, queryContent, tableApi, selection, ... }
  }
)
```

**Key pattern:**

- `useProvideTableInternals(schema)` — called in `DataList` component's setup, sets up all state and provides it to the component subtree
- `useTableInternals()` — called by any child component (DataTable, DataGrid, toolbar, filters...) to inject the shared state
- `_useTableInternals()` — raw inject, returns `undefined` if no provider (used internally)

**Important:** In V1, `useProvideTableInternals` is called directly inside DataList, NOT in a user composable. Users do not call it. This means DataList is always the injection scope boundary.

---

## Sub-Composable Responsibilities

Each composable has a narrow, well-defined concern. They receive their dependencies as typed params and return reactive state.

### `useTableView({ rawSchema })`

- Computes `activeView` from `rawSchema.value.activeView`
- Produces a derived `schema: ComputedRef<DataListSchemaView>` where all view-template objects (`{ '#default': ..., 'active': ... }`) have been resolved to their active-view value
- This "view-resolved schema" is passed down to all other composables
- **Key insight:** schema is normalized once here, all other composables work with the resolved version

### `useQueryState({ schema, persistency, activeLayout })`

- Manages ALL persistent/queryable state: sort, pagination, filters (including quickFilters), search
- Handles URL persistence via `useRouteQuery`
- Manages context and pageContext loading using `useAsyncState`
- Builds `queryContext` (the request payload) as a computed from all state
- Debounces `queryContext` to avoid rapid-fire requests
- Returns: `pagination`, `sort`, `filters`, `contextData`, `pageContextData`, `isContextLoading`, `queryContext`, `refreshContext`, `refreshPageContext`

### `useTableData({ schema, source, queryContext, pagination, contextData, ... })`

- Watches `queryContext` and `contextData` changes (debounced at 10ms)
- Executes the source (remote adapter or local function) when they change
- For remote: calls the registered adapter processor to build payload, execute, normalize response
- For client: calls `queryTableState()` to filter/sort/paginate in memory
- Uses `obsoletableFn` pattern to cancel stale in-flight requests
- After each data fetch, triggers `refreshPageContext` with the new rows
- Returns: `data`, `rawData`, `isLoading`, `error`, `initialized`, `refreshData`

### `useTableSelection({ schema, queryState, queryContent })`

- Manages `selectedKeys` ref and `allSelected` flag
- Derives `selectedCount` (uses total count when `allSelected` is true)
- `getRowKey(row)` — reads `rowKey` path from schema
- `checkAllRows()`, `uncheckAllRows()`, `checkRows(keys)`, `uncheckRows(keys)`
- Watches `rawData` changes: if `allSelected`, updates keys to match new rows; else filters to keep only valid keys
- Returns selection state and mutation methods

### `useTableApi({ queryState, queryContent, selection })`

- Assembles the public `TableApi` object from the reactive pieces
- All mutation methods write directly to reactive state
- `refresh()`: calls `refreshData({ query: true, context })`
- `updateRow()` / `updateRows()`: patch `data` and `rawData` in place
- `updateContext()` / `updatePageContext()`: direct key mutation
- This is a thin orchestration layer — no logic, just wiring

### `useTableColumns({ schema, columns, queryState, queryContent, rowActions, actions, ... })`

- Resolves the columns array (handles function form)
- Injects the selection column at position 0 when enabled
- Injects a row-actions column at the end when `rowActions` exist
- Handles column visibility (hidden columns from persistency)
- Handles column ordering (drag-and-drop order from persistency)
- Returns computed `resolvedColumns` that the table renderer uses

### `useTableFilters({ queryState, filters })`

- Resolves filter definitions
- Tracks active filter count
- Returns filter state helpers used by the filter panel UI

### `useTableActions('table' | 'row', { tableApi, data, actions, contextData, ... })`

- Resolves action arrays (handles function form)
- Evaluates `condition` per-action
- Returns active actions list + execute handler

### `useTableLayout({ schema, persistency })`

- Tracks `activeLayout` (table/grid)
- Computes `tableEnabled` and `gridEnabled` from schema
- Persists layout choice if `persistency` is enabled

### `useTableControls({ schema, actions, activeLayout, filters, ... })`

- Resolves which toolbar controls are visible
- Evaluates responsive DSL strings for each control

---

## Data Flow Diagram

```
rawSchema (ComputedRef)
  └─> useTableView
        ├─> activeView
        └─> schema (view-resolved, ComputedRef)
              ├─> useTableLayout ──> activeLayout, gridEnabled, tableEnabled
              ├─> useQueryState ──> pagination, sort, filters, contextData, pageContextData
              │         └─> queryContext (debounced computed of all state + context)
              ├─> useTableData(source, queryContext, contextData, ...)
              │         ├─> data (current page rows)
              │         └─> rawData (all loaded rows, for client mode)
              ├─> useTableSelection(schema, queryState, queryContent)
              ├─> useTableApi(queryState, queryContent, selection) ──> TableApi
              ├─> useTableActions('table', ...) ──> bulk actions
              ├─> useTableActions('row', ...) ──> row actions
              ├─> useTableColumns(schema, columns, rowActions, ...) ──> resolvedColumns
              ├─> useTableFilters(queryState, filters)
              └─> useTableControls(schema, actions, activeLayout, ...)
```

---

## Key Patterns to Preserve in V2

### 1. `createInjectionState` as the orchestrator boundary

The DataList component is the injection scope. All internal state is provided by DataList and consumed by its child components via inject. Users never call the provide function directly.

V2 deviation: In V2, `useTable(schema)` is the user-facing entry point. DataList wraps the result. The injection happens in DataList's setup, using the table instance passed via `:table` prop.

### 2. One composable per concern

Each file handles exactly one responsibility. No large "god composable". Sub-composables receive their dependencies as typed params and return reactive values.

### 3. View resolution as a pre-pass

Schema view templates (e.g., `{ table: true, grid: false }`) are resolved once in a dedicated composable before any other logic runs. All downstream composables work with the pre-resolved schema.

V2 equivalent: `useTableResolvedSchema(schema, activeView)` should produce a view-resolved schema.

### 4. `queryContext` as the single fetch trigger

All state (sort, pagination, filters, search, context) is combined into a single computed `queryContext`. The data fetcher watches this single reactive value (debounced). This avoids multiple watchers triggering multiple fetches.

V2 equivalent: `requestContext` — a computed that combines state + context, debounced, watched by the source executor.

### 5. Request obsolescence pattern

V1 uses `obsoletableFn` — a higher-order function that wraps async functions and makes them cancellable. Each invocation receives an `isObsolete()` check. If a newer request was started before the current one completes, `isObsolete()` returns true and the stale result is discarded.

V2 should implement this as a simple request counter pattern:

```ts
let latestRequestId = 0
async function execute() {
  const requestId = ++latestRequestId
  const result = await loader(ctx)
  if (requestId !== latestRequestId) return // stale, discard
  // apply result
}
```

### 6. PageContext loads after data

`refreshPageContext` is called by `useTableData` after each successful data fetch. It receives the current page rows. This sequencing is important — pageContext is not loaded until after rows are available.

### 7. Context vs PageContext distinction

- `context`: loaded once on mount (and on `refresh({ context: true })`), used in the data fetch request
- `pageContext`: loaded after each data fetch, receives current page rows as input, useful for row-dependent secondary data

### 8. Debounced state application

`queryContext` is debounced at 0–10ms to batch synchronous state changes (e.g., resetting pagination AND applying a filter in the same tick should trigger only one fetch).

V2 should debounce the source trigger similarly.

---

## What V2 Does Differently

| Concern         | V1                                      | V2                                                    |
| --------------- | --------------------------------------- | ----------------------------------------------------- |
| Schema builder  | No formal builder, plain object         | `defineTableSchema(...)`                              |
| Source model    | `remote: 'adapter-key'` + data function | `mode: 'client' \| 'remote'` + `loader \| query`      |
| Filters         | Mixed quickFilters/filters              | Top-level `search`, `static`, `ui`                    |
| Context loading | `useAsyncState` per item                | Dedicated `useTableContext` composable                |
| Injection entry | `useProvideTableInternals` in DataList  | `useTable(schema)` + DataList provides via symbol key |
| Persistence     | `useRouteQuery` (tied to Nuxt)          | Abstracted persistence adapter                        |
| Column types    | Flat definition                         | `field`, `composite`, `display` with builder          |
| State surface   | Internal `queryState`                   | Public `table.state`, `table.meta`, `table.api`       |
