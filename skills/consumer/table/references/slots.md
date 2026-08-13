# DataList Composition and Slots

`<UiDataList />` is the polished assembled table/grid recipe: it supplies the page shell, toolbar, sensible spacing, content surface, and pagination. Use `<UiDataListRoot>` and public parts when the application owns that layout; the root itself renders no wrapper and only provides behavior, lifecycle, locale, and UI defaults. Both paths use the same table instance and runtime.

```vue
<UiDataListRoot :table="table" density="compact">
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
    <template #empty>No matching templates.</template>
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

`UiDataListInfiniteLoader` separately exposes `loading`, `error`, and `end`, so a failed next page keeps already loaded content visible. The default `<UiDataList />` forwards `initial-loading`, `loading`, `empty`, `empty-table`, `empty-grid`, `error`, `refreshing`, `loading-more`, `load-more-error`, and `end`.

`UiDataListPagination` can be replaced through its default slot, or customized in pieces through `selected-count`, `page-size`, `page-count`, and `navigation`.

## Sizing and density

Root `density` resolves control sizes for all package parts. Override one part without changing the others:

```vue
<UiDataListRoot
  :table="table"
  density="compact"
  :ui="{
    search: { size: 'md', width: '20rem' },
    filterTags: { size: 'xs' },
    pagination: { size: 'sm' },
    content: { ui: { root: 'p-3' } },
  }"
>
```

Each public part also accepts a flat Nuxt UI-style `ui` map. Slot names follow the rendered anatomy, so a page can change the search input itself, a trigger, a panel surface, state copy, a grid item, or pagination controls without replacing the component:

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

Table UI follows Nuxt UI's native table anatomy. `table.ui.wrapper` belongs to the DataList renderer wrapper; `root`, `base`, `thead`, `tbody`, `tr`, `th`, `td`, and the remaining slots are forwarded to `UTable` unchanged.

The same `nuxtUiTools.dataList` object can be provided through Nuxt app config. Precedence is app DataList defaults, `UiDataListRoot` defaults, then the granular component's props and `ui` map.

DataList controls keep using Nuxt UI primitives. An application-level `app.config.ui.input`, `button`, `dropdownMenu`, `popover`, or `slideover` theme is therefore applied normally, and DataList `ui` slots merge on top of that primitive theme. Replacing a trigger through its slot intentionally transfers rendering ownership to the custom child.

`UiDataListContent` uses `fit="content"`, `fit="height"`, or `fit="fill"`, and the granular root has no implicit fixed height.
