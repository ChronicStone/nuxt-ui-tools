# Granular DataList Rendering API

Status: implemented

This proposal separates table behavior from page composition. `defineTableSchema(...)` remains the source of data, filtering, sorting, selection, actions, layout availability, and loading strategy; `useTable(...)` remains the typed state and command API; public rendering components become freely composable inside a headless `DataListRoot`.

The third supplied Paperflow screenshot is the primary acceptance target. The first two screenshots remain useful secondary variants, but the API must be able to reproduce the third layout without replacing package state, duplicating filter logic, or forking internal components.

## 1. Decision

Adopt a root-and-parts component model:

```vue
<UiDataListRoot :table="table">
  <header>
    <UiDataListSearch />
    <UiDataListLayoutSwitch />
    <UiDataListSortMenu />
  </header>

  <div>
    <UiDataListFilterTags />
    <UiDataListAddFilter />
    <UiDataListClearFilters />
  </div>

  <UiDataListContent />
  <UiDataListPagination />
</UiDataListRoot>
```

`UiDataList` stays as the batteries-included assembled component. It must be rebuilt from the same public parts, so the convenience path and the freely composed path cannot drift into two implementations.

Keep the `DataList` name because the runtime renders table and grid layouts. `TableRoot` or `TableContentRender` would incorrectly describe only one presentation mode. Use nouns for rendered parts and controls:

- `DataListRoot`, not `TableProviderRender`
- `DataListContent`, not `TableContentRender`
- `DataListFilterTags`, not `TableInlineFilter`
- `DataListFilterPanel`, not `TablePanelFilter`
- `DataListLayoutSwitch`, not `TableGridTableControl`
- `DataListSortMenu`, not `SortMenuTrigger`

## 2. Problem in the current runtime

The schema and runtime already own most behavior, but `DataList.vue` owns the complete visual hierarchy:

- title, search, filters, actions, and controls are fixed inside `TableHeader`
- table/grid content and transitions are fixed inside one shell
- pagination is always rendered through `TableFooter`
- the default content height is fixed to `36rem`
- filter tags, the dynamic filter picker, and clear-all are emitted by one component
- public component registration exposes only `DataList`

The internal leaf components already consume prepared state through `useTableInternals()`. The missing boundary is a public provider and a curated set of public parts. Adding more slots to the current monolith would make predefined regions configurable, but it would still prevent consumers from changing region order, nesting, responsive placement, or the relationship between filters and result counts.

The pagination model is also hard-coded around `{ pageIndex, pageSize }`. Remote results require `rowCount`, `useTableData` uses `useQuery`, and `useTablePagination` derives numbered pages. Cursor loading needs a separate strategy, not nullable page fields threaded through the current implementation.

## 3. Design boundaries

### 3.1 Schema owns semantics

The schema continues to own behavior that must remain consistent regardless of rendering:

- source and query contracts
- columns and grid item rendering
- filter definitions, operators, sources, and presentation eligibility
- sorting keys and defaults
- selection and actions
- available layouts and default layout
- pagination strategy, page size, and count policy
- query-state persistence

The schema must not prescribe page markup such as “put search in the first row” or “put filter tags under the title.”

### 3.2 The table instance owns state and commands

`useTable(schema)` returns the inferred public API used by both package components and custom page controls. A consumer can use `table.sorting.set(...)`, `table.filters.clear()`, or `table.layout.set(...)` without reaching into `__internals`.

The current `__internals` property should become an opaque implementation channel consumed by `DataListRoot`. It is not a supported customization API.

### 3.3 Root owns context and lifecycle

`DataListRoot` is visually headless. It:

- provides the table instance to descendant parts
- provides locale and resolved UI defaults
- schedules startup and disposes runtime resources
- renders no mandatory wrapper or layout

Every public part must fail with a clear error when rendered outside a root. `UiDataList` includes the root internally.

### 3.4 Parts own rendering only

Public parts consume prepared state and commands. They must not recreate filter semantics, query state, cursor accumulation, sorting resolution, or selection logic.

## 4. Public component surface

Only page-level composition primitives are auto-registered. Filter-kind editors, grid cards, column render adapters, and other implementation components remain internal.

| Component                  | Responsibility                                       | Default rendering                       | Main customization                  |
| -------------------------- | ---------------------------------------------------- | --------------------------------------- | ----------------------------------- |
| `UiDataList`               | Assembled default recipe                             | Current full DataList experience        | broad recipe slots and `ui`         |
| `UiDataListRoot`           | Provider and lifecycle                               | no visual wrapper                       | root `ui`, `density`, locale        |
| `UiDataListSearch`         | Search query control                                 | Nuxt UI input                           | input slot, size, debounce, `ui`    |
| `UiDataListFilterTags`     | Configured tag filters and active dynamic tags       | filter-kind tag registry                | per-filter trigger slot, size, `ui` |
| `UiDataListAddFilter`      | Dynamic-filter picker                                | dashed add-filter button and picker     | trigger slot, content slot          |
| `UiDataListFilterPanel`    | Staged panel filters                                 | button and drawer/popover               | trigger slot, panel slots           |
| `UiDataListClearFilters`   | Clear active UI filters                              | compact button                          | default slot with command state     |
| `UiDataListResultCount`    | Matching/loaded result count                         | localized text                          | default slot                        |
| `UiDataListRefresh`        | Refresh source data                                  | icon button                             | default slot                        |
| `UiDataListColumnPanel`    | Column visibility/order panel                        | button and drawer                       | trigger slot, panel slots           |
| `UiDataListSortMenu`       | Sort choice and direction                            | menu button                             | trigger slot, item slot             |
| `UiDataListLayoutSwitch`   | Table/grid selection                                 | segmented buttons                       | full default slot                   |
| `UiDataListContent`        | Active layout, loading, error, empty, refresh states | table or grid renderer                  | state slots, before/after slots     |
| `UiDataListTable`          | Force the table renderer                             | table only                              | state slots, `ui`                   |
| `UiDataListGrid`           | Force the grid renderer                              | grid only                               | state slots, `ui`                   |
| `UiDataListPagination`     | Numbered-page navigation                             | count, page size, page buttons          | granular slots and `ui`             |
| `UiDataListInfiniteLoader` | Cursor load-more sentinel/control                    | automatic sentinel with fallback button | loading/end/error/default slots     |

`UiDataListContent` is the normal choice because it follows `table.state.layout`. `UiDataListTable` and `UiDataListGrid` exist for pages that render one layout in a custom position or need different surrounding markup per layout.

## 5. Target composition

The third screenshot should be expressible approximately as follows. Consumer markup owns every page-level border, row, gap, and alignment decision.

```vue
<script setup lang="tsx">
const schema = defineTableSchema({
  tableKey: 'templates',
  rowKey: 'id',
  defaultLayout: 'grid',
  source: {
    mode: 'remote',
    query: (request) => ({
      queryKey: ['templates', request],
      queryFn: () => api.queryTemplates(request),
    }),
  },
  pagination: {
    mode: 'offset',
    defaultSize: { grid: 24, table: 20 },
    sizeOptions: { grid: [24, 48], table: [20, 50, 100] },
  },
  filters: {
    search: {
      fields: ['name'],
      placeholder: () => t('templates.search'),
    },
    ui: (filter) => [
      filter.option('status', {
        label: () => t('templates.status'),
        display: { location: 'tag' },
        source: { options: statusOptions },
      }),
      filter.option('format', {
        label: () => t('templates.format'),
        display: { location: 'tag' },
        source: { options: formatOptions },
      }),
    ],
  },
  table: {
    columns: (column) => templateColumns(column),
  },
  grid: {
    enabled: true,
    gridSize: 5,
    renderItem: ({ row }) => <TemplateCard template={row} />,
  },
})

const table = useTable(schema)
</script>

<template>
  <UiDataListRoot
    :table="table"
    density="compact"
    :ui="{
      control: { size: 'sm' },
      filterTags: { size: 'xs' },
      content: { class: 'gap-3' },
    }"
  >
    <section class="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border">
      <header class="flex items-center gap-2 border-b px-5 py-3">
        <h1 class="mr-auto text-lg font-semibold">
          Templates
          <span class="ml-2 font-normal text-muted">24</span>
        </h1>

        <UiDataListSearch class="w-80" />

        <UiDataListLayoutSwitch>
          <template #default="{ layout, setLayout }">
            <UFieldGroup size="sm">
              <UButton
                label="Grid"
                :variant="layout === 'grid' ? 'solid' : 'ghost'"
                @click="setLayout('grid')"
              />
              <UButton
                label="Table"
                :variant="layout === 'table' ? 'solid' : 'ghost'"
                @click="setLayout('table')"
              />
            </UFieldGroup>
          </template>
        </UiDataListLayoutSwitch>

        <UiDataListSortMenu>
          <template #trigger="{ triggerProps, label }">
            <UButton v-bind="triggerProps" :label="`Sort: ${label}`" variant="outline" />
          </template>
        </UiDataListSortMenu>

        <UButton label="New template" />
      </header>

      <div class="flex min-h-14 items-center gap-2 border-b bg-elevated/30 px-5 py-2">
        <UiDataListFilterTags size="xs" />
        <UiDataListAddFilter size="xs" />
        <UiDataListResultCount class="ml-auto" />
        <UiDataListClearFilters size="xs" />
      </div>

      <UiDataListContent class="min-h-0 flex-1 p-3" fit="fill" />

      <UiDataListPagination class="border-t px-5 py-3" />
    </section>
  </UiDataListRoot>
</template>
```

The first screenshot can move `UiDataListFilterTags`, `UiDataListSortMenu`, and result count into a separate toolbar above the grid. The second can render the same controls above `UiDataListContent` while the active layout is `table`. Neither variant requires a schema fork.

## 6. Standard trigger contract

Every component that opens a menu, popover, dialog, or drawer must expose a `trigger` slot. The package continues to own the overlay, focus management, keyboard behavior, and domain commands; the consumer can replace the visual child completely.

```vue
<UiDataListFilterPanel>
  <template #trigger="{ triggerProps, open, activeCount }">
    <MyToolbarButton
      v-bind="triggerProps"
      :pressed="open"
      :badge="activeCount"
    />
  </template>
</UiDataListFilterPanel>
```

The slot contract is consistent across `SortMenu`, `FilterPanel`, `AddFilter`, `ColumnPanel`, and popup-backed filter tags:

```ts
interface DataListTriggerBinding {
  id: string
  'aria-haspopup': 'menu' | 'listbox' | 'dialog'
  'aria-expanded': boolean
  'aria-controls'?: string
  disabled: boolean
  onClick: (event: MouseEvent) => void
  onKeydown: (event: KeyboardEvent) => void
}

interface DataListTriggerSlotProps {
  triggerProps: DataListTriggerBinding
  open: boolean
  disabled: boolean
  label: string
}
```

The implementation should use Nuxt UI/Radix `as-child` behavior where available. A custom trigger must bind `triggerProps`; this preserves focus, keyboard, and ARIA behavior without constraining its component, icon, label, or styling.

Non-popup controls expose direct state and commands instead:

```vue
<UiDataListLayoutSwitch>
  <template #default="{ active, available, set }">
    <MyViewPicker :model-value="active" :items="available" @update:model-value="set" />
  </template>
</UiDataListLayoutSwitch>
```

`UiDataListFilterTags` forwards a per-filter trigger slot so compact tags can also be completely replaced:

```vue
<UiDataListFilterTags>
  <template #filter="{ filter, triggerProps, preview, active }">
    <MyFilterChip
      v-bind="triggerProps"
      :label="filter.label"
      :value="preview"
      :active="active"
    />
  </template>
</UiDataListFilterTags>
```

## 7. UI configuration

Composition controls layout; typed UI configuration controls the default appearance of package parts.

```ts
type DataListDensity = 'compact' | 'default' | 'comfortable'
type DataListSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl'

interface DataListUiConfig {
  density?: DataListDensity
  control?: DataListControlUi
  root?: DataListPartUi
  header?: DataListPartUi
  search?: DataListSearchUi
  filterTags?: DataListFilterTagUi
  filterPanel?: DataListFilterPanelUi
  columnPanel?: DataListColumnPanelUi
  sortMenu?: DataListSortMenuUi
  layoutSwitch?: DataListLayoutSwitchUi
  refresh?: DataListPartUi
  resultCount?: DataListPartUi
  content?: DataListContentUi
  table?: DataListTableUi
  grid?: DataListGridUi
  pagination?: DataListPaginationUi
  infiniteLoader?: DataListInfiniteLoaderUi
}
```

Each part config should expose meaningful component props such as `size`, `color`, and `variant`, plus a Nuxt UI-style `ui` object for named internal slots. Every public component also accepts `class` and its own `ui` override.

Resolution order is:

1. props and `ui` passed to the individual component
2. `ui` passed to `DataListRoot`
3. module-wide defaults from `app.config.nuxtUiTools.dataList`
4. package defaults derived from density

`density` is a preset, not a closed styling system. It resolves coordinated defaults for control height, tag size, table row height, grid gap, and footer spacing. Explicit part configuration always wins. This makes compact tags a one-line choice while preserving pixel-level override capability.

The UI config must not enter query keys, URL state, schema normalization, or data orchestration.

## 8. Content sizing and viewport ownership

The current implicit `36rem` height prevents full-page compositions such as the target screenshot. `DataListContent` should support three explicit sizing modes:

```ts
type DataListContentFit = 'content' | 'height' | 'fill'
```

- `content` grows with rendered rows/cards and uses the page scroll container.
- `height` uses an explicit `height` prop and owns an internal scroll viewport.
- `fill` uses the available flex/grid space and requires a `min-height: 0` ancestor.

There is no fixed default height at the root level.

Table and grid renderers must use one shared viewport contract. This is required for consistent sticky headers, scroll-to-top behavior, virtualization, and the cursor sentinel. The viewport context exposes the scroll element internally; consumers do not pass DOM refs through schema config.

`DataListContent` exposes `before` and `after` slots inside the scrolling content boundary. `DataListInfiniteLoader` registers against that viewport when it is rendered in `after`.

## 9. Pagination strategies

Treat “no numbered pager” and “no pagination” as different behaviors. The schema accepts three explicit strategies:

```ts
type TablePaginationSchema = false | TableOffsetPaginationSchema | TableCursorPaginationSchema

interface TableOffsetPaginationSchema {
  mode?: 'offset'
  defaultSize?: number | Partial<Record<TableLayout, number>>
  sizeOptions?: number[] | Partial<Record<TableLayout, number[]>>
  showPageSizePicker?: boolean
  showPagesList?: boolean
  showPagesCount?: boolean
}

interface TableCursorPaginationSchema {
  mode: 'cursor'
  pageSize?: number | Partial<Record<TableLayout, number>>
  count?: 'none' | 'exact'
}
```

Semantics:

- omitted pagination or `{ mode: 'offset' }` keeps the current numbered-page behavior
- `false` means the complete result is returned and rendered with no page state
- `{ mode: 'cursor' }` means remote batches accumulate through an opaque cursor and no numbered page exists

Cursor mode is remote-only in V1. Client data already exists locally, so client infinite rendering is viewport virtualization rather than a network pagination strategy.

### 9.1 Request contracts

The source request becomes discriminated:

```ts
type TablePaginationRequest =
  | { mode: 'offset'; pageIndex: number; pageSize: number; count: 'exact' }
  | {
      mode: 'cursor'
      cursor: string | null
      pageSize: number
      count: 'none' | 'exact'
    }
  | { mode: 'none' }
```

This shape is structurally compatible with Drizzle Resource 2.0. Offset mode requests an exact count because numbered navigation needs a total. Cursor mode defaults to `count: 'none'`; consumers opt into `exact` only when the page needs a total result count.

The active cursor is a TanStack infinite-query page parameter, not durable table query state. `useTableData` gives the source its stable first-page request with `cursor: null`; the source injects each `pageParam` into the transport request:

```ts
const schema = defineTableSchema({
  tableKey: 'templates',
  rowKey: 'id',
  pagination: {
    mode: 'cursor',
    pageSize: 24,
    count: 'none',
  },
  source: {
    mode: 'remote',
    query: (request) => ({
      queryKey: ['templates', request],
      queryFn: () => api.queryTemplates(request),
    }),
  },
  grid: {
    enabled: true,
    renderItem: ({ row }) => <TemplateCard template={row} />,
  },
})
```

The remote result mirrors the discriminated Drizzle Resource response shape without creating a package dependency:

```ts
interface TableCursorPageResult<TRow> {
  rows: TRow[]
  pageInfo:
    | {
        mode: 'cursor'
        pageSize: number
        nextCursor: string | null
        count: 'none'
        rowCount: null
      }
    | {
        mode: 'cursor'
        pageSize: number
        nextCursor: string | null
        count: 'exact'
        rowCount: number
      }
  facets?: TableFacetResult[]
}
```

Opaque strings support encoded compound cursors without leaking database ordering fields into the component library. Drizzle Resource appends the root `id` to the effective sort when needed and binds the cursor to the resource and sorting rules; other backends must provide an equivalent stable unique tie-breaker.

### 9.2 Runtime behavior

Cursor mode uses `useInfiniteQuery`, then exposes a single prepared row list by flattening pages and de-duplicating by `rowKey`.

The runtime owns:

- first-page loading and error states
- `hasNextPage`
- next-page loading and next-page errors
- accumulated loaded rows
- refresh of the complete active infinite query
- reset when the stable query contract changes
- protection against concurrent duplicate `fetchNextPage()` calls

Search, filters, sorting, context, page size, count policy, and any source-owned query key input define the stable query. When one changes, TanStack Query creates a new infinite query and accumulation restarts with `cursor: null`. The current cursor and accumulated cursors are never serialized into the URL.

Layout changes preserve loaded pages when both layouts use the same page size. A layout-specific page-size change produces a new query key and resets accumulation.

### 9.3 Public API

`table.pagination` should be conditional on the inferred schema strategy:

```ts
type TablePaginationApi<TSchema> = TSchema extends { pagination: false }
  ? TableNoPaginationApi
  : TSchema extends { pagination: { mode: 'cursor' } }
    ? TableCursorPaginationApi
    : TableOffsetPaginationApi
```

Cursor mode exposes:

```ts
interface TableCursorPaginationApi {
  mode: 'cursor'
  state: ComputedRef<{
    loadedCount: number
    totalCount: number | null
    hasNextPage: boolean
    isLoadingMore: boolean
    loadMoreError: unknown
  }>
  loadMore: () => Promise<unknown>
  reset: () => void
}
```

Offset-only methods such as `setPage(4)` must not appear on a cursor table. Cursor-only methods must not appear on an offset table. Runtime internals can resolve the strategy through a normalized pagination registry, while the public API preserves the discriminated schema inference.

### 9.4 Row-count semantics

The current `rowCount` name is ambiguous once the runtime can accumulate a partial result without knowing the total. The public data API should expose:

```ts
data.loadedRowCount // always rows.length
data.totalRowCount // number | null
```

`DataListResultCount` renders the total when known and a localized “N loaded” form otherwise. Numbered offset mode continues to require an exact total. Cursor mode maps `pageInfo.rowCount` to `totalRowCount`, preserving `null` when `count: 'none'`. No-pagination mode derives the total from the complete row array unless the remote response provides one.

### 9.5 Infinite loader rendering

```vue
<UiDataListContent fit="fill">
  <template #after>
    <UiDataListInfiniteLoader auto :root-margin="'320px 0px'">
      <template #loading>
        <TemplateCardSkeleton v-for="index in 5" :key="index" />
      </template>

      <template #end="{ loadedCount }">
        <span>{{ loadedCount }} templates loaded</span>
      </template>
    </UiDataListInfiniteLoader>
  </template>
</UiDataListContent>
```

The loader uses VueUse `useIntersectionObserver` against the shared content viewport. `auto="false"` renders a load-more control instead. A failed next page preserves existing rows and turns the control into a retry action; it does not replace the content with a full error state.

## 10. Query state

Offset mode keeps:

```txt
p.page=3&p.size=50
```

Cursor mode stores no cursor or accumulated-page state in the URL. It may store `p.size` only when consumers are allowed to change the page size. Filters, search, sorting, and layout remain URL-backed as today.

No-pagination mode creates no `p.*` keys.

Resetting filters, search, or sorting should call the normalized pagination strategy’s `reset()` command. It must not directly write `pageIndex = 1` from filter and sorting composables. This removes the current cross-owner coupling and lets page, cursor, and none strategies implement reset correctly.

## 11. Internal architecture

The implementation should follow a strategy registry rather than branch throughout data, controls, footer, filters, and sorting:

```txt
src/runtime/table/
  components/
    root/
      DataListRoot.vue
      DataList.vue
    controls/
      DataListSearch.vue
      DataListRefresh.vue
      DataListLayoutSwitch.vue
      DataListSortMenu.vue
      DataListColumnPanel.vue
    filters/
      DataListFilterTags.vue
      DataListAddFilter.vue
      DataListFilterPanel.vue
      DataListClearFilters.vue
    content/
      DataListContent.vue
      DataListTable.vue
      DataListGrid.vue
      DataListResultCount.vue
    pagination/
      DataListPagination.vue
      DataListInfiniteLoader.vue
  composables/
    use-table-pagination.ts
    use-table-data.ts
    use-table-viewport.ts
  types/
    pagination.ts
    rendering.ts
    ui.ts
  utils/
    pagination/
      registry.ts
      page.ts
      cursor.ts
      none.ts
```

Each pagination strategy normalizes a shared internal contract:

```ts
interface NormalizedTablePaginationRuntime {
  mode: 'offset' | 'cursor' | 'none'
  request: ComputedRef<TablePaginationRequest>
  rows: ComputedRef<GenericObject[]>
  loadedRowCount: ComputedRef<number>
  totalRowCount: ComputedRef<number | null>
  reset: () => void
}
```

Mode-specific state and commands remain in the owning strategy. `useTableApi` groups them into the public facade; it does not implement pagination behavior.

Filter, search, and sorting composables receive the whole pagination runtime and call `pagination.reset()`. They do not inspect its mode or reconstruct its state.

## 12. Slots and state overrides

Rendering components expose state-specific slots without forcing the consumer to replace normal content:

```vue
<UiDataListContent>
  <template #initial-loading="{ layout }">...</template>
  <template #empty="{ layout, query }">...</template>
  <template #error="{ error, retry }">...</template>
  <template #refreshing>...</template>
  <template #before>...</template>
  <template #after>...</template>
</UiDataListContent>
```

`UiDataListPagination` exposes parallel pieces for pages, previous/next controls, page-size selection, count, and selected count. The consumer can replace one piece without rebuilding the entire footer, or replace the default slot and use the typed page API directly.

Slots are not the only customization path. Default renderings must also accept typed props and Nuxt UI-style `ui` objects, so a size change does not require a slot.

## 13. Accessibility requirements

- custom triggers bind the complete provided trigger contract
- layout switching is a labelled single-selection control
- search retains an accessible label when its visual label is absent
- filter tag previews and clear actions remain keyboard reachable
- infinite loading announces added results through a polite live region
- loading-more state does not mark already loaded content as busy or inert
- focus remains stable when another cursor page is appended
- reduced-motion preferences disable content and layout transitions

## 14. Compatibility and migration

`UiDataList` remains available and keeps its current basic props and high-level slots during the migration. Internally it moves to:

```vue
<UiDataListRoot :table="table" :locale="locale" :ui="ui">
  <DefaultDataListRecipe ... />
</UiDataListRoot>
```

Existing schemas default to offset mode, so the current numbered-page behavior remains unchanged until a schema selects `false` or `{ mode: 'cursor' }`.

The new granular components are an additive public surface. The internal injection contract and `__internals` are explicitly not compatibility surfaces.

## 15. Delivery plan

1. **Contracts and ownership.** Add pagination discriminants, rendering/UI types, conditional API inference tests, and normalized strategy contracts. Remove direct page resets from filter/search/sorting ownership.
2. **Headless root.** Extract locale, startup, disposal, and injection from `DataList.vue` into `DataListRoot.vue`. Make `UiDataList` consume the root.
3. **Public parts.** Promote the curated controls, filter surfaces, result count, content, and offset pagination components. Add the standard trigger-slot contract and component registration.
4. **Shared viewport.** Normalize table/grid viewport ownership and explicit `content`, `height`, and `fill` sizing. Remove the implicit `36rem` root default.
5. **Cursor data strategy.** Add `useInfiniteQuery`, page flattening, row-key de-duplication, reset behavior, optional totals, and next-page error handling.
6. **Infinite loader.** Add the viewport-aware sentinel/manual control and verify table and grid virtualization.
7. **Target playground.** Build a dedicated composition route matching the third screenshot at desktop and responsive widths, with page and cursor fixtures.
8. **Documentation.** Update consumer table skills for composition, triggers, UI configuration, pagination modes, query-state behavior, and migration.

Each slice needs targeted runtime tests, schema inference tests, public component surface tests, and playground/browser validation before the next slice depends on it.

## 16. Acceptance criteria

- The third screenshot can be reproduced without editing package components or duplicating table state.
- Search, sort, layout, filter tags, filter panel, add filter, clear filters, counts, content, and pagination can be ordered independently in consumer markup.
- Every overlay-opening control supports a completely custom trigger child while preserving focus, keyboard, and ARIA behavior.
- Filter tags can use `xs` sizing independently of search, layout, and action controls.
- Component props override root UI config; root UI config overrides app defaults.
- `UiDataList` and granular composition share the same runtime and leaf implementations.
- `pagination: false` performs no client slicing and renders no pagination state.
- cursor mode uses opaque cursors, accumulates remote pages, does not require a total count, and exposes no numbered-page commands.
- cursor requests and responses are structurally compatible with Drizzle Resource 2.0 pagination and `pageInfo` contracts.
- search, filter, sort, or relevant context changes reset cursor accumulation without page-specific writes in those composables.
- a failed next-page request preserves existing content and supports retry.
- table and grid layouts work in content, fixed-height, and fill modes.
- the public API preserves row, filter, sort, context, page-context, and pagination-strategy inference without consumer casts or manual generics.

## 17. Drizzle Resource alignment

The sibling Drizzle Resource checkout was inspected on 2026-08-13 at its released 2.0 cursor implementation. It provides the server contract this proposal should consume:

- offset and cursor requests are discriminated by `pagination.mode`
- cursor input is an opaque `string | null`
- cursor mode defaults to `count: 'none'`, while `count: 'exact'` is opt-in
- responses expose `nextCursor` and nullable `rowCount` under mode-specific `pageInfo`
- cursor queries use one-row lookahead when no exact count is requested
- the effective ordering receives an `id` tie-breaker when the requested sort lacks one
- encoded cursors are bound to the resource and effective sorting, so a cursor cannot be reused against a different query order

The deployed [Drizzle Resource playground](https://drizzle-resource.vercel.app/playground) still opens with an offset request, but the [2.0 repository contract](https://github.com/ChronicStone/drizzle-resource) supports both modes. Nuxt UI Tools owns client accumulation and intersection-trigger behavior; Drizzle Resource owns keyset execution and the opaque transport cursor.

This division also follows the database requirements described by the official [Drizzle ORM cursor pagination guide](https://orm.drizzle.team/docs/guides/cursor-based-pagination): stable ordering, a unique tie-breaker, and a cursor that identifies where the next query resumes.
