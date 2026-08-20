# DataList Composition and Slots

`<UiDataList />` is the polished assembled table/grid recipe: it supplies the page shell, toolbar, sensible spacing, content surface, and pagination. Use `<UiDataListRoot>` and public parts when the application owns that layout; the root itself renders no wrapper and only provides behavior, lifecycle, locale, and UI defaults. Both paths use the same table instance and runtime.

Set `size="xs" | "sm" | "md" | "lg" | "xl"` on `UiDataList` or `UiDataListRoot` to choose one scale for the entire composed surface. The root size drives controls, filter editors and popovers, panel spacing, table header/row/cell geometry, result counts, loading/empty/error states, grid actions, selection actions, and pagination. A granular part's own `size` prop still wins for that part. `density="compact" | "default" | "comfortable"` remains a compatibility fallback for callers that do not set `size`; when `size` is present, the five-step size scale is authoritative.

```vue
<UiDataListRoot :table="table" size="sm">
  <header class="flex items-center gap-2 border-b p-3">
    <h1 class="mr-auto">Templates</h1>
    <UiDataListSearch />
    <UiDataListLayoutSwitch labels />
    <UiDataListSortMenu />
  </header>

  <div class="flex items-center gap-2 border-b p-2">
    <UiDataListFilterTags />
    <UiDataListAddFilter />
    <UiDataListResultCount class="ml-auto" />
    <UiDataListClearFilters />
  </div>

  <UiDataListContent fit="fill">
    <template #initial-loading>Loading skeletons…</template>
    <template #empty="{ hasActiveQuery, clearQuery }">
      <TemplateEmptyState
        :filtered="hasActiveQuery"
        @clear="clearQuery"
      />
    </template>
    <template #error="{ retry }">
      <button @click="retry">Retry</button>
    </template>
    <template #after>
      <UiDataListInfiniteLoader />
    </template>
  </UiDataListContent>
</UiDataListRoot>
```

Public parts include search, filter tags, add/clear/panel filters, result count, refresh, column panel, sort menu, layout switch, content, forced table/grid renderers, offset pagination, and cursor infinite loading.

`UiDataListFilterPanel` accepts `mode="panel"` for a raw inline panel and
`commit-mode="live" | "submit"` for its filter update contract. Action surfaces
follow the same granular model: `UiDataListActionsDropdown` is the built-in
dropdown, while `UiDataListActionsToolbar` exposes action definitions and state
through its slots for custom rendering.

## Replacing triggers

Popup parts expose a `#trigger` slot. Bind `triggerProps` to the custom child so the package can retain overlay state and accessibility behavior.

```vue
<UiDataListSortMenu>
  <template #trigger="{ triggerProps, label }">
    <MySortButton v-bind="triggerProps" :label="label" />
  </template>
</UiDataListSortMenu>
```

Filter and column panels additionally expose `open`, `close`, `toggle`, and `openState`. Non-popup parts expose direct state and commands in their default slot.

Each popup-backed filter tag can replace its trigger without replacing the filter editor:

```vue
<UiDataListFilterTags size="xs">
  <template #filter="{ filter, triggerProps, preview, active }">
    <MyFilterChip
      v-bind="triggerProps"
      :label="filter.label"
      :preview="preview"
      :active="active"
    />
  </template>
</UiDataListFilterTags>
```

## State slots

`UiDataListContent` exposes `initial-loading` (`loading` remains an alias), `empty`, `error`, `refreshing`, `content`, `table`, `grid`, `before`, and `after`. Those states work for offset, cursor, and unpaginated data.

The `empty` slot receives `layout`, `refresh`, `hasActiveQuery`, and `clearQuery`. Use `hasActiveQuery` to distinguish a truly empty collection from a search or filter with no matches; `clearQuery` clears both the search term and active UI filters without coupling the empty-state component to the table instance.

`UiDataListInfiniteLoader` separately exposes `loading`, `error`, and `end`, so a failed next page keeps already loaded content visible. The default `<UiDataList />` forwards `initial-loading`, `loading`, `empty`, `empty-table`, `empty-grid`, `error`, `refreshing`, `loading-more`, `load-more-error`, and `end`.

`UiDataListPagination` can be replaced through its default slot, or customized in pieces through `selected-count`, `page-size`, `page-count`, and `navigation`.

## Sizing and density

Root `size` is the universal scale. Override one part without changing the others, either through that component's `size` prop or the root UI config:

```vue
<UiDataListRoot
  :table="table"
  size="lg"
  :ui="{
    search: { size: 'sm', width: '20rem' },
    filterTags: { size: 'md' },
    table: { size: 'xl' },
    resultCount: { size: 'xs' },
    pagination: { size: 'sm' },
    content: { ui: { root: 'p-3' } },
  }"
>
```

The five root sizes are intentionally granular rather than aliases: `xs`, `sm`, `md`, `lg`, and `xl` each produce distinct table geometry and filter-editor spacing. Use `density` only as the older three-step fallback when a consumer has not adopted root sizing yet.

Each public part also accepts a flat Nuxt UI-style `ui` map. Slot names follow the rendered anatomy, so a page can change the search input itself, a trigger, a panel surface, state copy, a grid item, or pagination controls without replacing the component. `UiDataListContent` is boundary-free by default for granular compositions; the assembled `UiDataList` opts into its single contained table surface, and a custom composition can request `surface="contained"` when it owns that boundary.

```vue
<UiDataListSearch :ui="{ root: 'w-64', base: 'text-xs' }" />
<UiDataListSortMenu :ui="{ trigger: 'rounded-full', content: 'min-w-56' }" />
<UiDataListContent :ui="{ root: 'border-0 p-0', error: 'min-h-96' }" />
<UiDataListGrid :ui="{ flow: 'gap-3', item: 'min-w-56' }" />
```

Progressive filter editors use the `filterTags.ui` anatomy after activation. This lets the page tune the actual popover and its controls, rather than only the visible tag:

```vue
<UiDataListRoot
  :table="table"
  :ui="{
    addFilter: { size: 'md', ui: { panel: 'min-w-80', option: 'py-2.5' } },
    filterTags: {
      size: 'md',
      ui: {
        popoverContent: 'w-80 p-0',
        operatorContent: 'min-w-36 p-1',
        operatorTrigger: 'px-2.5',
        editor: 'bg-default',
        searchHeader: 'p-3',
        searchInput: 'h-9',
        scrollViewport: 'max-h-96',
        option: 'rounded-sm px-3 py-2.5',
        optionCheckbox: 'rounded-sm',
        optionExpander: 'text-dimmed',
        footer: 'px-3 py-2',
        preset: 'rounded-sm',
      },
    },
  }"
>
  <!-- application-owned composition -->
</UiDataListRoot>
```

The progressive Add-filter flow keeps one popover and one trigger anchor mounted while it advances through the filter picker, an optional match-mode step, and the chosen editor. Stage changes use a short directional transition and reduce to an opacity-only crossfade when the user requests reduced motion. Custom Add-filter triggers receive `stage` and `definition` in addition to the normal open controls, so they can update their label without replacing the anchor.

The editor `size` scales the search, options, footer controls, spacing, and default width together. Default widths have explicit viewport-safe minimum and maximum bounds; when an application overrides them, set the complete width contract rather than only a large minimum:

```ts
filterTags: {
  size: 'sm',
  ui: {
    popoverContent: 'w-auto max-w-[min(15rem,calc(100vw-1rem))]',
    editor: 'w-[min(15rem,calc(100vw-1rem))] min-w-48 max-w-60',
  },
}
```

Table UI follows Nuxt UI's native table anatomy. `table.ui.wrapper` belongs to the DataList renderer wrapper; `root`, `base`, `thead`, `tbody`, `tr`, `th`, `td`, and the remaining slots are forwarded to `UTable` unchanged.

The same `nuxtUiTools.dataList` object can be provided through Nuxt app config. Precedence is app DataList defaults, `UiDataListRoot` defaults, then the granular component's props and `ui` map.

DataList controls keep using Nuxt UI primitives. An application-level `app.config.ui.input`, `button`, `dropdownMenu`, `popover`, or `slideover` theme is therefore applied normally, and DataList `ui` slots merge on top of that primitive theme. Replacing a trigger through its slot intentionally transfers rendering ownership to the custom child.

`UiDataListContent` uses `fit="content"`, `fit="height"`, or `fit="fill"`, and the granular root has no implicit fixed height.
