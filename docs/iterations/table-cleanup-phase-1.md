# Table Package — Phase 1 Cleanup Analysis

Deep audit of `packages/table/src/` covering **typing**, **ref explicitness**, **inline logic**, **organization**, and **extensibility**.

---

## 1. `any` Usage Inventory

### 1.1 Composable Parameters — The Worst Offenders

| File                          | Line(s) | What's typed `any`                                                          | Correct type                                                                                            |
| ----------------------------- | ------- | --------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `use-table-filters.ts`        | 17–20   | `schema`, `queryState`, `api`, `queryContent` — **all four params**         | `ComputedRef<TableSchemaView>`, `ReturnType<typeof useQueryState>`, `UseTableApi`, `UseTableDataReturn` |
| `use-table-filter-options.ts` | 36–38   | `filters`, `queryContent`, `schema`                                         | Return type of `useTableFilters`, `UseTableDataReturn`, `ComputedRef<TableSchemaView>`                  |
| `use-table-pagination.ts`     | 4–6     | `rowCount`, `pagination`, `api`                                             | `ComputedRef<number>`, `WritableComputedRef<{pageIndex; pageSize}>`, `UseTableApi`                      |
| `use-table-controls.ts`       | 4–5     | `schema`, `activeLayout`                                                    | `ComputedRef<TableSchemaView>`, `ComputedRef<TableLayout>`                                              |
| `use-table-rows.ts`           | 5–6     | `schema`, `rows` — **both params**                                          | `ComputedRef<TableSchemaView>`, `ComputedRef<GenericObject[]>`                                          |
| `use-table-selection.ts`      | 6–7     | `schema: ComputedRef<any>`, `rows: ComputedRef<Array<Record<string, any>>>` | `ComputedRef<TableSchemaView>`, `ComputedRef<Array<Record<string, unknown>>>`                           |
| `use-table-api.ts`            | 31      | `selection: any`                                                            | `ReturnType<typeof useTableSelection>`                                                                  |

**Impact:** These `any` params propagate loosely-typed data through the entire composable graph. Every downstream consumer loses type safety.

### 1.2 Utils — `any` in Parameters and Returns

| File                                               | Line(s)                                                          | What                                                                                       |
| -------------------------------------------------- | ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `utils/columns/types.ts` (UseTableColumnsParams)   | 37–42                                                            | `schema`, `data`, `query`, `api`, `selection`, `tableLayout` — **6 of 7 fields** are `any` |
| `utils/columns/types.ts` (TableCellRenderContext)  | 54–55                                                            | `context: Record<string, any>`, `pageContext: Record<string, any>`                         |
| `utils/columns/types.ts` (TableColumnRenderParams) | 48                                                               | `row: Record<string, any>`                                                                 |
| `utils/columns/state.ts`                           | 22–26, 59–62, 71–74, 100–103, 131–133, 143–146, 178–179, 193–196 | `schema: any`, `currentState: any` used in **8+ functions**                                |
| `utils/columns/schema.ts`                          | 6, 15–16                                                         | `schema: any`, `context: Record<string, any>`                                              |
| `utils/columns/menu.ts`                            | 6                                                                | `schema: any`                                                                              |
| `utils/columns/render.tsx`                         | 52, 60, 126, 193, 345, 351–352, 358                              | Dozens of inline `any` casts — `row: any`, `column: any`, `Record<string, any>`            |
| `utils/rows.ts`                                    | 4–5                                                              | `rowKey: TableRowKey<any>`, `row: Record<string, any>`                                     |
| `utils/resolved-filters.ts`                        | 20                                                               | `definitions` cast as `any` in `use-table-state.ts:20`                                     |

### 1.3 Component Props

| File                    | Line(s) | What                                               |
| ----------------------- | ------- | -------------------------------------------------- |
| `DataList.vue`          | 11      | `table: any`                                       |
| `DateFilterPopover.vue` | 13      | `definition: any`                                  |
| `TextFilterPopover.vue` | 13      | `definition: any`                                  |
| `TableFiltersBar.vue`   | 14      | `getFilterComponent(options: { definition: any })` |

### 1.4 Type-Level `any`

| File                   | Line(s) | What                                                                  |
| ---------------------- | ------- | --------------------------------------------------------------------- |
| `types/query-state.ts` | 110     | `Record<string, QueryParameterOptions<any>>`                          |
| `types/query-state.ts` | 126     | `Record<string, any>` in `TableQueryStateFilterParameterState`        |
| `types/filters.ts`     | 153     | `TableOptionFilterDefinition<TRow, TContext, TKey, any>` in the union |
| `types/utils.ts`       | 113     | `query: (...args: any[]) =>` in MergeContextItem                      |

---

## 2. Refs Not Explicitly Typed

Every `ref()` call must have an explicit type parameter per your convention.

| File                         | Line  | Current                                     | Should be                  |
| ---------------------------- | ----- | ------------------------------------------- | -------------------------- |
| `use-table-filters.ts`       | 23    | `ref(String(...))`                          | `ref<string>(String(...))` |
| `use-table-internals.ts`     | 38    | `ref<TableColumnState>(...)`                | Already correct            |
| `use-table-selection.ts`     | 9     | `ref<string[]>([])`                         | Already correct            |
| `use-table-selection.ts`     | 10    | `ref<string \| null>(null)`                 | Already correct            |
| `use-table-controls.ts`      | 7     | `ref(false)`                                | `ref<boolean>(false)`      |
| `use-table-controls.ts`      | 8     | `ref('')`                                   | `ref<string>('')`          |
| `OptionFilterPopover.vue`    | 22    | `ref('')`                                   | `ref<string>('')`          |
| `OptionFilterPopover.vue`    | 23    | `ref(false)`                                | `ref<boolean>(false)`      |
| `OptionFilterPopover.vue`    | 67    | `ref<Set<string>>(new Set())`               | Already correct            |
| `TextFilterPopover.vue`      | 17    | `ref('')`                                   | `ref<string>('')`          |
| `TextFilterPopover.vue`      | 18–22 | `ref<{from: string; to: string}>({...})`    | Already correct            |
| `shared/use-range-select.ts` | 16    | `ref<number \| null>(null)`                 | Already correct            |
| `shared/use-range-select.ts` | 17    | `ref<'select' \| 'deselect' \| null>(null)` | Already correct            |

---

## 3. Computeds That Should Stay Inferred (Verify)

Most `computed()` calls correctly rely on inference. The following use explicit annotations — check they're truly necessary:

| File                   | Line        | Annotation                                              | Verdict                                               |
| ---------------------- | ----------- | ------------------------------------------------------- | ----------------------------------------------------- |
| `use-table-filters.ts` | 24          | `computed<TableUiFilterDefinition[]>`                   | **Remove** — inference from schema would be cleaner   |
| `use-table-filters.ts` | 25          | `computed<TableQueryStateFilterRule[]>`                 | **Remove**                                            |
| `use-table-data.ts`    | 99          | `computed<TableSourceRequestContext>`                   | **Keep** — constrains the shape                       |
| `use-table-data.ts`    | 119, 137    | `computed<TableExternalState>`                          | **Keep** — normalizes union                           |
| `use-table-state.ts`   | 18–24       | Cast as `ComputedRef<TableResolvedFilterGroup<string>>` | **Fix** — cast hides the `any` param problem upstream |
| `use-query-state.ts`   | 72, 85, 106 | `computed<TableFilterState>`, `computed({get/set})`     | **Keep** — writable computeds need the annotation     |

---

## 4. Inline Logic That Should Be Extracted

### 4.1 `buildFilterPreview` — Monolithic Switch on `kind`

**File:** `utils/filters/preview.ts`

This is a 130-line function with 4 branches by filter kind (`option|boolean`, `date`, `number`, fallback). Each branch produces the same `{ active, count, tags, summary }` shape.

**Proposed refactor:**

- Define a `FilterPreviewResult` type
- Create a `FilterPreviewBuilder` registry pattern:
  ```
  utils/filters/preview/
    index.ts           — exports buildFilterPreview (dispatches by kind)
    types.ts           — FilterPreviewResult
    option-preview.ts  — buildOptionFilterPreview
    date-preview.ts    — buildDateFilterPreview
    number-preview.ts  — buildNumberFilterPreview
    text-preview.ts    — buildTextFilterPreview (default/fallback)
  ```
- Each builder is a pure function: `(definition, rule?, optionEntries?) => FilterPreviewResult`
- This makes adding new filter kinds (e.g., `enum`, `multi-select`, `range-slider`) trivial

### 4.2 `resolveFilterOptionEntries` — Mixed Concerns

**File:** `utils/filters/options.ts`

Handles boolean special-casing inline. Should be:

- `buildBooleanFilterEntries(...)` — standalone
- `buildOptionFilterEntries(...)` — standalone
- Both return the same `ResolvedFilterOptionEntry[]` shape

### 4.3 `DateFilterPopover.vue` — Heavy Inline Value Conversion

Lines 42–114: ~70 lines of date ↔ CalendarDate conversion, range parsing, summary generation all inline in `<script setup>`. This should be a composable:

```
composables/filters/use-date-filter-state.ts
```

### 4.4 `TextFilterPopover.vue` — Mixed Text + Number Logic

This component handles both `kind === 'text'` and `kind === 'number'` (including number ranges). These are conceptually different filters sharing a component. At minimum:

- Extract `use-text-filter-state.ts`
- Extract `use-number-filter-state.ts`
- Consider splitting into `TextFilterPopover` and `NumberFilterPopover` components

### 4.5 `OptionFilterPopover.vue` — Pinning / Sorting Logic

Lines 87–112: Sort and pin logic for entries is UI presentation logic that should live in a composable rather than inline in the component.

### 4.6 `use-table-filters.ts` — God Composable

This 338-line composable does **everything filter-related**:

- Search debouncing
- Filter definition lookup
- Filter state access
- Option entry resolution
- Preview building
- Operator management
- Value setting/toggling
- Filter clearing

This should be broken into focused composables:

- `use-table-search` — search query, debouncer, placeholder
- `use-table-filter-definitions` — definition lookup, operator resolution
- `use-table-filter-state` — get/set/toggle/clear filter values
- `use-table-filter-preview` — preview computation (delegates to preview builders)

### 4.7 Duplicated `resolveSchemaSource` and `createPublicQueryState`

Both `use-table.ts` and `use-table-internals.ts` contain identical copies of these two functions. Should exist once in a shared util.

---

## 5. Component Organization

### Current Flat Structure

```
components/
  DataList.vue
  drawers/
    ColumnPanel.vue
  filters/
    DateFilterPopover.vue
    FilterMatchModeButton.vue
    FilterOptionRow.vue
    OptionFilterPopover.vue
    TableFiltersBar.vue
    TableFilterTrigger.vue
    TextFilterPopover.vue
  grid/
    GridRenderer.vue
  layout/
    TableFooter.vue
    TableHeader.vue
  table/
    TableEmptyState.vue
    TableLoadingState.vue
    TableRenderer.vue
  utils/
    SearchQueryInput.vue
```

### Proposed Restructured Layout

#### Filter Display Model

Filters are **composable per-definition** — each filter declares its own display mode:

| Mode      | Behavior                                                                                    | Example                                   |
| --------- | ------------------------------------------------------------------------------------------- | ----------------------------------------- |
| `inline`  | Always visible as a tag in the header bar                                                   | Status, Priority                          |
| `dynamic` | Hidden by default, user adds from an "Add filter" dropdown; appears as a tag once activated | Department, Skills, Assignee              |
| `panel`   | Renders in a side panel for complex UIs                                                     | Date ranges, multi-field compound filters |

These modes are **not exclusive** — a single table can mix all three:

```ts
filter.option('status',     { display: 'inline', ... })   // always visible tag
filter.option('department', { display: 'dynamic', ... })   // add-from-menu tag
filter.date('createdAt',    { display: 'panel', ... })     // side panel
```

A "hybrid" is just the natural result of composing different display modes.

#### Component Structure

```
components/
  DataList.vue
  layout/
    TableHeader.vue
    TableFooter.vue
  table/
    TableRenderer.vue
    TableEmptyState.vue
    TableLoadingState.vue
  grid/
    GridRenderer.vue
  columns/
    ColumnPanel.vue
  filters/
    shared/                          ← shared across all display modes
      FilterMatchModeButton.vue
      FilterOptionRow.vue
      FilterTriggerTag.vue           ← renamed from TableFilterTrigger
    tags/                            ← inline & dynamic tag rendering
      FilterTagsBar.vue              ← orchestrates static + dynamic tags
      FilterAddMenu.vue              ← "Add filter" dropdown for dynamic filters
      OptionFilterTag.vue            ← option/boolean filter as a tag popover
      DateFilterTag.vue              ← date filter as a tag popover
      TextFilterTag.vue              ← text-only filter tag
      NumberFilterTag.vue            ← number filter tag (split from TextFilterPopover)
    panel/                           ← side panel display mode
      FilterPanel.vue                ← the panel container (drawer/slide-over)
      FilterPanelSection.vue         ← one filter section inside the panel
      PanelOptionFilter.vue          ← option filter rendered in panel context
      PanelDateFilter.vue            ← date filter rendered in panel context
      PanelNumberFilter.vue
      PanelTextFilter.vue
  utils/
    SearchQueryInput.vue
```

Key decisions:

1. `tags/` holds both inline (always visible) and dynamic (add-from-menu) — they render identically as tags, the only difference is visibility logic
2. `panel/` has its own component variants because the UI is fundamentally different (no popover, full section layout)
3. `shared/` contains reusable atoms used by both tags and panel (match mode selector, option row, trigger tag shell)
4. `FilterTagsBar` is the orchestrator — it renders inline tags always, shows the "Add filter" menu for dynamic filters, and renders dynamic tags once activated
5. Each filter kind (option, date, text, number) is a separate component — no more `TextFilterPopover` handling both text and number

---

## 6. Utils Organization

### Current

```
utils/
  client-query.ts          (540 lines — filtering + sorting + pagination)
  columns/
    index.ts
    menu.ts
    render.tsx             (414 lines — column rendering, cell rendering, JSX)
    schema.ts
    state.ts               (230 lines — 8 functions, all typed `any`)
    types.ts
  filters/
    common.ts              (223 lines — mixed date/number/string helpers)
    index.ts
    operators.ts
    options.ts
    preview.ts
  query-state.ts           (352 lines — codec, serialization, normalization)
  resolved-filters.ts
  rows.ts
```

### Proposed

```
utils/
  client-query/
    index.ts               ← re-export
    filter-engine.ts       ← matchesFilterNode, matchesFilterCondition, operators
    search-engine.ts       ← matchesSearch, pathMatchesSearchValue
    sort-engine.ts         ← lazySortRows, createRowComparator
    pagination.ts          ← paginateRows
  columns/
    index.ts
    menu.ts
    render.tsx
    schema.ts
    state.ts               ← properly typed with TableColumnState instead of `any`
    types.ts
  filters/
    common.ts              ← keep, but split date helpers vs number helpers
    index.ts
    operators.ts
    options/
      index.ts
      option-entries.ts
      boolean-entries.ts
    preview/
      index.ts             ← dispatcher
      types.ts             ← FilterPreviewResult
      option-preview.ts
      boolean-preview.ts
      date-preview.ts
      number-preview.ts
      text-preview.ts
  query-state/
    index.ts
    codecs.ts              ← createTableFilterValueCodec, createSortKeyCodec
    defaults.ts            ← getDefaultPageSize, getDefaultSort, getPageSizeOptions, getSortKeys
    normalization.ts       ← normalizeFilterDefinition, resolveFilterDefaultOperator
    serialization.ts       ← createUiFilterQuerySchema, get/setUiFilterRules
  resolved-filters.ts
  rows.ts
```

---

## 7. `@ts-expect-error` and Unsafe Casts

| File                   | Line                    | Issue                                                                                      |
| ---------------------- | ----------------------- | ------------------------------------------------------------------------------------------ |
| `use-table-data.ts`    | 283                     | `// @ts-expect-error` on `withEnabled` — the `enabled` field mismatch with vue-query types |
| `use-table-data.ts`    | 114                     | `requestContext.value as never` — forces query param                                       |
| `use-table-data.ts`    | 168                     | `contextData.value as never` — forces page context param                                   |
| `use-table.ts`         | 78                      | `resolvedSchema.value as unknown as TableSchemaView` — double cast                         |
| `use-table.ts`         | 84                      | `internals.tableApi as UseTableApi<TSchema>` — unsafe generic cast                         |
| `use-table-state.ts`   | 20                      | `as any` on filter definitions                                                             |
| `use-table-filters.ts` | 164, 179, 189, 239, 297 | Multiple `as any` for operator values                                                      |

---

## 8. `Record<string, any>` vs `Record<string, unknown>`

Throughout the codebase, `Record<string, any>` is used where `Record<string, unknown>` would be safer and force proper narrowing:

- `use-table-selection.ts` — `rows`, `row` params
- `utils/columns/render.tsx` — `row`, `context`, `pageContext`
- `utils/columns/schema.ts` — `context`
- `utils/columns/types.ts` — `TableCellRenderContext`, `TableColumnRenderParams`
- `utils/rows.ts` — `row`

**Rule:** Use `Record<string, unknown>` for external data boundaries. Use properly typed interfaces for internal data.

---

## 9. Missing Return Type Interfaces

Several composables return complex objects but have no named return type. This makes consumers depend on inferred structural types, which are fragile.

| Composable              | Has explicit return type?    |
| ----------------------- | ---------------------------- |
| `useTableData`          | Yes (`UseTableDataReturn`)   |
| `useTableApi`           | Yes (`UseTableApi<TSchema>`) |
| `useTableState`         | No — inline inferred         |
| `useQueryState`         | No — inline inferred         |
| `useTableFilters`       | No — inline inferred         |
| `useTableFilterOptions` | No — inline inferred         |
| `useTableSelection`     | No — inline inferred         |
| `useTableRows`          | No — inline inferred         |
| `useTablePagination`    | No — inline inferred         |
| `useTableControls`      | No — inline inferred         |
| `useTableLayout`        | No — inline inferred         |

These don't need explicit return types (inference is fine for return values per your rules), but the **params types** MUST be explicit interfaces — not inline `{ schema: any; ... }` objects.

---

## 10. Priority Execution Plan

### Phase 1a — Type Safety (no behavior changes)

1. Define proper param interfaces for every composable (replacing all `any`)
2. Add explicit type parameters to all `ref()` calls
3. Replace `Record<string, any>` with `Record<string, unknown>` or proper interfaces
4. Remove `as any` casts — fix the underlying type mismatches
5. Fix `@ts-expect-error` in `use-table-data.ts`
6. Properly type `utils/columns/state.ts` — replace all 8 functions' `schema: any` / `currentState: any`
7. Type `DataList.vue` prop (create a `UseTableReturn` reference or use the existing type)
8. Type `DateFilterPopover.vue` and `TextFilterPopover.vue` definition props

### Phase 1b — Extract & Reorganize Utils

1. Define `FilterPreviewResult` type
2. Split `buildFilterPreview` into per-kind builders
3. Split `resolveFilterOptionEntries` into boolean vs option builders
4. Deduplicate `resolveSchemaSource` and `createPublicQueryState`
5. Split `client-query.ts` into filter/search/sort/pagination modules

### Phase 1c — Composable Decomposition

1. Extract `use-table-search` from `use-table-filters`
2. Extract filter definition/operator logic into `use-table-filter-definitions`
3. Extract filter value mutation logic into `use-table-filter-state`
4. Extract date filter state logic from `DateFilterPopover` into composable
5. Split `TextFilterPopover` into text and number components

### Phase 1d — Component Restructuring

1. Create `filters/shared/`, `filters/tags/`, `filters/panel/` directories
2. Move shared filter components (trigger tag, option row, match mode) into `shared/`
3. Move and rename current filter popovers into `tags/` (they are the tag display mode)
4. Split `TextFilterPopover` into `TextFilterTag` + `NumberFilterTag`
5. Build `FilterTagsBar` orchestrator with inline/dynamic visibility logic
6. Build `FilterAddMenu` for dynamic filter activation
7. Stub `filters/panel/` directory for future panel display mode

### Phase 1e — Filter Display Mode Type System

1. Add `display?: 'inline' | 'dynamic' | 'panel'` to `TableFilterDefinitionBase`
2. Default to `'inline'` for backwards compatibility
3. Update `FilterTagsBar` to partition definitions by display mode
4. Tags bar renders: inline tags always + dynamic tags when activated + "Add filter" menu
5. Panel filters rendered by a separate `FilterPanel` component (future)

---

## 11. Circular Dependency Risk

Currently `use-table-internals.ts` orchestrates everything and uses `createInjectionState`. The composable graph:

```
useTable
  └── useProvideTableInternals
        ├── useTableLayout
        ├── useTableState
        │     └── useQueryState
        ├── useTableData
        ├── useTableRows
        ├── useTableSelection
        ├── useTableApi (depends on selection)
        ├── useTableFilters (depends on api, queryContent, schema, queryState)
        ├── useTableControls
        ├── useTableColumns (depends on data, query, api, selection)
        └── useTablePagination (depends on api)
```

`useTableFilters` depending on `useTableApi` (the full API) creates a coupling concern. Filters should only need the filter-related API subset. Consider passing only the needed methods rather than the entire API object.

---

## Summary

| Category                      | Count                                                            |
| ----------------------------- | ---------------------------------------------------------------- |
| `any` in composable params    | **22 fields** across 7 composables                               |
| `any` in util params          | **18+ fields** across columns/state, schema, menu, render        |
| `any` in component props      | **4 components**                                                 |
| Untyped `ref()` calls         | **7 instances**                                                  |
| `as any` casts                | **8+ instances** in composables                                  |
| `@ts-expect-error`            | **1**                                                            |
| Unsafe double casts           | **1** (`as unknown as`)                                          |
| Monolithic functions to split | **3** (buildFilterPreview, use-table-filters, TextFilterPopover) |
| Duplicated functions          | **2** (resolveSchemaSource, createPublicQueryState)              |
