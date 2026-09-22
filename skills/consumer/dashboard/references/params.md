# Dashboard Params

Params are the typed state a dashboard's queries read. Each one has a filter handle
(`dashboard.filters.<key>`) that drives it from the shipped controls or from any component you
choose (see filters.md). Values are `v-model` targets: `dashboard.params.year = 2025`.

## Kinds

| Builder                                | Value type                                    | URL form                  |
| -------------------------------------- | --------------------------------------------- | ------------------------- |
| `p.string()`                           | `string \| undefined`                         | `abc`                     |
| `p.string({ multiple: true })`         | `string[]`                                    | `a,b`                     |
| `p.number()`                           | `number \| undefined`                         | `42`                      |
| `p.number({ multiple: true })`         | `number[]`                                    | `1,2`                     |
| `p.boolean()`                          | `boolean \| undefined`                        | `true` / `false`          |
| `p.date()`                             | `Date \| undefined`                           | `2026-03-01` (local date) |
| `p.dateRange()`                        | `{ start: Date; end: Date } \| undefined`     | `2026-03-01..2026-03-31`  |
| `p.enum([2024, 2025])`                 | `2024 \| 2025 \| undefined`                   | `2025`                    |
| `p.enum(values, { multiple: true })`   | `Value[]` (never undefined)                   | `a,b`                     |
| `p.options(items)`                     | item value union                              | value                     |
| `p.options(() => items)`               | `string \| undefined` (items read from data)  | value                     |
| `p.options(items, { multiple: true })` | item value array                              | `a,b`                     |
| `p.remote(source)`                     | `string \| undefined`                         | id                        |
| `p.remote(source, { multiple: true })` | `string[]`                                    | `id1,id2`                 |
| `p.comparison()`                       | `'previous' \| 'year' \| 'none' \| undefined` | `year`                    |
| `p.custom(codec)`                      | codec value                                   | codec output              |

## Options

Every builder accepts:

- `defaultValue` — narrows away `undefined` (`p.enum(['EUR', 'USD'], { defaultValue: 'EUR' })` is
  `'EUR' | 'USD'`). Values equal to the default never reach the URL. `multiple` params default to
  `[]`. A getter reads the default from data (see Defaults From Data).
- `label` — the filter name ("Year"), text or `() => t('…')`. Defaults to the param key.
- `placeholder` — the text of an empty selection ("All accounts"). Defaults to the localized "All".
- `headless` — state only: the filter bar skips it, `filtered` and `resetFilters()` ignore it.
- `presets` — shortcut values the filter menu lists under its options (`{ label, value, icon?,
hint? }[]`, or a getter to read them from data): picking one sets the whole value.
- `sync` — where the value lives (below).
- `urlKey`, `omitDefault` (set `false` to keep defaults in the URL), `historyMode` (params default
  to `'replace'`).

Params picked from a list (`enum`, `options`, `remote`, `boolean`, `comparison`) also take:

- `columns` — lays the menu out in a grid (`3` for twelve months).
- `searchable` — a search field in the menu (remote lists always search, on the server).
- `max` — with `multiple: true`, the most values a filter picks; other items disable once reached.

Params whose values have no label of their own (`enum`, `boolean`, `string`, `number`, dates,
`custom`) take `format: (value) => string`, used in menus and on pills. It runs reactively, so it
may read other state.

Unknown or invalid URL values fall back to the default. Writing `null` or `undefined` (a cleared
picker) restores the default.

## Where Values Live

```ts
params: (p) => ({
  year: p.enum(YEARS, { defaultValue: 2026 }), // URL (default)
  draft: p.string({ sync: 'memory' }), // component state
  organisation: p.string({ sync: storeToRefs(org).current }), // a store, both ways
  role: p.string({ sync: () => session.role }), // read-only source: headless
})
```

A nullish store value reads as the default. A getter is read-only (writes are ignored), so its
param is headless.

## Standalone Filters And Groups

Declare a filter once and reuse it in any dashboard or view:

```ts
export const yearFilter = defineDashboardFilter((p) =>
  p.enum(YEARS, { defaultValue: 2026, label: 'Year' }),
)
export const periodFilters = defineDashboardFilters({
  year: yearFilter,
  months: (p) => p.enum(MONTHS, { multiple: true, columns: 3, label: 'Months' }),
})
```

The factory runs when `useDashboard()` does, inside component setup: `useNuxtApp()`, `useI18n()`,
and stores work there. Use filters wherever params are declared:

```ts
params: { year: yearFilter, account: accountFilter }            // a map
params: { ...periodFilters, currency: currencyFilter }          // spread a group
params: (p) => ({ year: yearFilter, search: p.string() })       // the callback form
```

Inside a view, the callback also receives the shared params, typed, for lazy options that depend
on them:

```ts
params: (p, { params }) => ({
  compare: p.boolean({
    defaultValue: true,
    label: 'Compare with',
    format: (on) => (on ? String(params.year - 1) : 'None'),
  }),
}),
```

## URL Keys

| Scope                     | Key                      |
| ------------------------- | ------------------------ |
| shared param              | `<param>`                |
| current view              | `view`                   |
| auto-refresh interval     | `refresh` (seconds)      |
| view param                | `<view>.<param>`         |
| widget param (root query) | `<query>.<param>`        |
| widget param (view query) | `<view>.<query>.<param>` |

Every segment is a real name (a param, a view key, a query key), so URLs read like the schema.
With `urlPrefix: 'stats'`, every key is prefixed: `stats.year`, `stats.view`, … Use it when two
dashboards share a page, or when bare root param names could collide with other URL state.

A root param cannot use the URL key `view` while the dashboard has views (it would shadow the
current view), nor `refresh` (the auto-refresh interval): rename it or set its `urlKey`. A view
param cannot reuse a root param's key. Both are checked when the dashboard is created.

Example: `?year=2025&view=consumption&consumption.currency=USD&consumption.productLines.tracked=en,fr`

## Filter Handles

Every param has a handle on the sibling `filters` object; view handles list the root params too:

```ts
dashboard.filters.year
dashboard.consumption.filters.account
// {
//   key, kind, multiple, headless,
//   label, placeholder,                 // resolved text
//   value,                              // writable (same as params.x)
//   defaultValue, changed,              // `changed`: the value differs from the default
//   display,                            // "2026", "Acme", "Mar, Apr", "Mar +2", or the placeholder
//   items, selected,                    // DashboardOption[] ({ value, label, icon?, avatar?, hint?, description? })
//   isSelected(value), toggle(value),   // multiple: add/remove in item order, up to `max`; single: set
//   reset(),                            // restore the default
//   presets,                            // [{ label, value, icon?, hint?, active, apply() }]
//   columns, searchable, max,
//   loading, loadingMore, hasMore, error,
//   search, open,                       // writable; opening a remote list starts loading it
//   loadMore(), refresh(),
//   menu,                               // props to spread on USelectMenu / USelect
// }
dashboard.filtered // a filter on screen differs from its default (headless ones excluded)
dashboard.resetFilters() // restore them
```

`options` is the previous name of `filters` and still works.

## Remote Params

`p.remote(source, options)` takes a remote option source, the contract shared with table filters
and form fields:

```ts
account: p.remote(
  {
    // One page for a search term: a query definition (e.g. `queryOptions()`), or a promise.
    load: ({ search, page }) => ({
      queryKey: ['accounts', search, page.index],
      queryFn: () => api.accounts.search({ q: search, page: page.index, size: page.size }),
      // → { options, hasMore } for page pagination, { options, nextCursor } for cursor pagination
    }),
    // Labels of ids restored from the URL that the loaded pages do not contain.
    resolveSelected: ({ values }) => api.accounts.byIds(values),
    pagination: { type: 'page', size: 20 }, // default { type: 'page', size: 25 }
    search: { debounce: 250, minLength: 0 },
  },
  { label: 'Account', placeholder: 'All accounts' },
),
```

For an endpoint that speaks the table request protocol (the one a remote `UiDataList` uses),
`remoteTableOptions` builds the whole source:

```ts
const accounts = remoteTableOptions(
  // The query comes first: the row type is read from its result.
  (request) => $api.accounts.query.queryOptions({ body: request }),
  {
    search: ['name'], // or { fields: ['name'], debounce: 200 }
    sort: 'name', // or [{ key: 'name', dir: 'asc' }]
    option: (account) => ({ label: account.name, value: account.id }),
    valueKey: 'id', // default; matched with `isAnyOf` to resolve selected ids
    pagination: { type: 'cursor', size: 25 }, // default; match what the endpoint pages by
  },
)
p.remote(accounts, { multiple: true, label: 'Accounts' })
```

- Nothing loads until the picker opens (`open`) or a search term is typed.
- Pages are cached per search term; the previous term's options stay while the next one loads.
- Selected ids missing from the loaded pages are hydrated through `resolveSelected`; the handle's
  `display` shows `…` until they resolve.

## Items From Data

A widget param can offer items read from another query:

```ts
queries: ({ essential }) => {
  const products = essential.query({ query: overview, select: (data) => data.products })
  return {
    products,
    usage: essential.query({
      defaultValue: [],
      params: {
        tracked: (p) =>
          p.options(() => (products.data ?? []).map((product) => ({ label: product.name, value: product.id })), {
            multiple: true,
            max: 6,
          }),
      },
      query: ({ params: widget }) => ({ … }),
    }),
  }
}
```

Such items are read reactively; their values are strings.

## Defaults From Data

A getter default follows data, e.g. the three best-selling products once the list loads:

```ts
tracked: (p) =>
  p.options(() => toOptions(products.data), {
    multiple: true,
    defaultValue: () => topProductIds(products.data, 3),
  }),
```

The param reads the getter while it is unset, so the default changes with the data. Picking exactly
the default keeps the URL clean and the param keeps following it; `reset()` restores the current
default. A single-value getter that may return `undefined` (data not loaded yet) keeps `undefined`
in the param type; a list param falls back to `[]`.

## Presets

```ts
tracked: (p) =>
  p.options(PRODUCTS, {
    multiple: true,
    max: 6,
    label: 'Tracked products',
    presets: () =>
      PRODUCT_LINES.map((line) => ({ label: line.name, value: line.products, hint: `${line.products.length} products` })),
  }),
```

Presets work on every kind, including those without options (a date range with "Last 30 days"),
which then get a menu of their presets.

## Comparison Period

`p.comparison({ defaultValue: 'previous' })` declares the period a dashboard compares against:
`'previous'` (the same number of days right before the range), `'year'` (the same dates a year
earlier), or `'none'`. Its filter carries localized labels ("Previous period", "Previous year", "No
comparison").

`resolveDashboardComparisonRange(range, mode)` (auto-imported) returns the range to fetch, or
`undefined` for `'none'`. It counts calendar days, so it never drifts across daylight-saving
changes; Feb 29 falls back to Feb 28 a year earlier.

```ts
params: (p) => ({
  range: p.dateRange({ defaultValue: lastThirtyDays() }),
  compare: p.comparison({ defaultValue: 'previous', label: 'Compare with' }),
}),
queries: ({ essential, params }) => ({
  revenue: essential.query(() => ({
    queryKey: ['revenue', params.range, params.compare],
    queryFn: () =>
      api.revenue({
        range: params.range,
        previous: resolveDashboardComparisonRange(params.range, params.compare),
      }),
  })),
}),
```

Blocks then show the comparison: a stat's `compare` accessor (default delta and caption), a chart
series' `compare` accessor (faded bars or a dashed line). See blocks.md.

## Widget-Scoped Params

State owned by one card (tracked series, a top-N limit) is declared on its query, and has a filter
handle on the resource:

```ts
productLines: deferred.query({
  defaultValue: [],
  params: { tracked: (p) => p.enum(PRODUCT_KEYS, { multiple: true, defaultValue: ['en-gen'], label: 'Products' }) },
  query: ({ params: widget }) => ({
    queryKey: ['lines', params.year, widget.tracked],
    queryFn: () => api.lines({ year: params.year, products: widget.tracked }),
  }),
}),
```

```vue
<UiDashboardFilter
  :filter="dashboard.consumption.productLines.filters.tracked"
  variant="button"
  icon="i-lucide-plus"
  label="Add a product"
/>
```
