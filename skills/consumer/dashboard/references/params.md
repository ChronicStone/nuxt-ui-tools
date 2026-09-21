# Dashboard Params

Params are typed, URL-synced values. The engine renders no controls; bind them with `v-model`.

## Kinds

| Builder                                   | Value type                                | URL form                  |
| ----------------------------------------- | ----------------------------------------- | ------------------------- |
| `p.string()`                              | `string \| undefined`                     | `abc`                     |
| `p.number()`                              | `number \| undefined`                     | `42`                      |
| `p.boolean()`                             | `boolean \| undefined`                    | `true` / `false`          |
| `p.date()`                                | `Date \| undefined`                       | `2026-03-01` (local date) |
| `p.dateRange()`                           | `{ start: Date; end: Date } \| undefined` | `2026-03-01..2026-03-31`  |
| `p.enum([2024, 2025])`                    | `2024 \| 2025 \| undefined`               | `2025`                    |
| `p.enum(values, { multiple: true })`      | `Value[]` (never undefined)               | `a,b`                     |
| `p.options(items)`                        | item value union                          | value                     |
| `p.options(items, { multiple: true })`    | item value array                          | `a,b`                     |
| `p.remote(config)`                        | `string \| undefined`                     | id                        |
| `p.remote({ ...config, multiple: true })` | `string[]`                                | `id1,id2`                 |
| `p.custom(codec)`                         | codec value                               | codec output              |

Every builder accepts:

- `defaultValue` — narrows away `undefined` (`p.enum(['EUR', 'USD'], { defaultValue: 'EUR' })` is
  `'EUR' | 'USD'`). Values equal to the default never reach the URL.
- `urlKey` — override the URL segment.
- `omitDefault` — set `false` to keep defaults in the URL.
- `historyMode` — params default to `'replace'`.

Unknown or invalid URL values fall back to the default. Writing `null` or `undefined` (a cleared
picker) restores the default.

## URL Keys

| Scope                     | Key                      |
| ------------------------- | ------------------------ |
| shared param              | `<param>`                |
| current view              | `view`                   |
| view param                | `<view>.<param>`         |
| widget param (root query) | `<query>.<param>`        |
| widget param (view query) | `<view>.<query>.<param>` |

Every segment is a real name (a param, a view key, a query key), so URLs read like the schema.
With `urlPrefix: 'stats'`, every key is prefixed: `stats.year`, `stats.view`, … Use it when two
dashboards share a page, or when bare root param names could collide with other URL state.

A root param cannot use the URL key `view` while the dashboard has views (it would shadow the
current view): rename it or set its `urlKey`. This is checked when the dashboard is created.

Example: `?year=2025&view=consumption&consumption.currency=USD&consumption.productLines.tracked=en,fr`

## Widget-Scoped Params

State owned by one card (tracked series, a top-N limit) is declared on its query:

```ts
productLines: deferred.query({
  defaultValue: [],
  params: (p) => ({ tracked: p.enum(PRODUCT_KEYS, { multiple: true, defaultValue: ['en-gen'] }) }),
  query: ({ params: widget }) => ({
    queryKey: ['lines', params.year, widget.tracked],
    queryFn: () => api.lines({ year: params.year, products: widget.tracked }),
  }),
}),
```

```vue
<USelectMenu
  v-model="dashboard.consumption.productLines.params.tracked"
  v-bind="dashboard.consumption.productLines.options.tracked.menu"
  multiple
/>
```

## Option Handles

Option-backed params (`enum`, `options`, `remote`) expose a handle on the sibling `options` object:

```ts
dashboard.options.currency
// {
//   items, selected,            // DashboardOption[] ({ value, label, icon?, avatar?, description? })
//   loading, loadingMore, hasMore, error,
//   search, open,               // writable
//   loadMore(), refresh(),
//   menu,                       // props to spread on USelectMenu / USelect
// }
```

`menu` carries `items`, `valueKey: 'value'`, `labelKey: 'label'`, and, for remote handles,
`searchTerm`, `ignoreFilter`, `loading`, and the `onUpdate:searchTerm` / `onUpdate:open` listeners:

```vue
<USelectMenu v-model="dashboard.params.account" v-bind="dashboard.options.account.menu" clear>
  <template #content-bottom>
    <UButton
      v-if="dashboard.options.account.hasMore"
      label="Load more"
      :loading="dashboard.options.account.loadingMore"
      @click="dashboard.options.account.loadMore()"
    />
  </template>
</USelectMenu>
```

## Remote Params

Same contract as the form engine's remote options:

```ts
account: p.remote({
  load: ({ search, page }) => api.accounts.search({ q: search, page: page.index, size: page.size }),
  // → { options: DashboardOption<string>[], hasMore: boolean }
  //   or { options, nextCursor: string | null } for cursor pagination (page.cursor)
  resolveSelected: ({ values }) => api.accounts.byIds(values), // labels for ids restored from the URL
  pagination: { type: 'page', size: 20 },   // default { type: 'page', size: 25 }
  search: { debounce: 250, minLength: 0 },
  queryKey: ['accounts-picker'],            // optional cache identity
}),
```

- Nothing loads until the picker opens (`open`) or a search term is typed.
- Pages are cached per search term by TanStack Query.
- Selected ids missing from the loaded pages are hydrated through `resolveSelected`, so the trigger
  shows the right label after a reload.
