# Dashboard Filters

Filters are the typed state the user controls: a year, a currency, the accounts to compare. Each
schema, view, or query declares its own, inline, with the `f` builder. Their values are plain reads
and `v-model` targets (`dashboard.filters.year = 2025`), and each has a control
(`dashboard.controls.<key>`) that drives it from the shipped UI or from any component you choose
(see controls.md).

What a dashboard is about (an account id, the workspace) is not a filter: it is a param of the
function wrapping the schema (see schema.md).

## Kinds

| Builder                                | Value type                                    | URL form                  |
| -------------------------------------- | --------------------------------------------- | ------------------------- |
| `f.string()`                           | `string \| undefined`                         | `abc`                     |
| `f.string({ multiple: true })`         | `string[]`                                    | `a,b`                     |
| `f.number()`                           | `number \| undefined`                         | `42`                      |
| `f.number({ multiple: true })`         | `number[]`                                    | `1,2`                     |
| `f.boolean()`                          | `boolean \| undefined`                        | `true` / `false`          |
| `f.date()`                             | `Date \| undefined`                           | `2026-03-01` (local date) |
| `f.dateRange()`                        | `{ start: Date; end: Date } \| undefined`     | `2026-03-01..2026-03-31`  |
| `f.enum([2024, 2025])`                 | `2024 \| 2025 \| undefined`                   | `2025`                    |
| `f.enum(values, { multiple: true })`   | `Value[]` (never undefined)                   | `a,b`                     |
| `f.options(items)`                     | item value union                              | value                     |
| `f.options(() => items)`               | `string \| undefined` (items read from data)  | value                     |
| `f.options(items, { multiple: true })` | item value array                              | `a,b`                     |
| `f.remote(source)`                     | `string \| undefined`                         | id                        |
| `f.remote(source, { multiple: true })` | `string[]`                                    | `id1,id2`                 |
| `f.comparison()`                       | `'previous' \| 'year' \| 'none' \| undefined` | `year`                    |
| `f.custom(codec)`                      | codec value                                   | codec output              |

## Options

Every builder accepts:

- `defaultValue` — narrows away `undefined` (`f.enum(['EUR', 'USD'], { defaultValue: 'EUR' })` is
  `'EUR' | 'USD'`). Values equal to the default never reach the URL. `multiple` filters default to
  `[]`. A getter reads the default from data (see Defaults From Data).
- `label` — the filter name ("Year"), text or `() => $i18n.t('…')`. Defaults to the filter key.
- `placeholder` — the text of an empty selection ("All accounts"). Defaults to the localized "All".
- `headless` — state only: the filter bar skips it, `filtered` and `resetFilters()` ignore it.
- `enabled` — a lazy callback: whether the filter exists right now. While it returns `false` the
  filter leaves the bar, reads its default whatever the URL holds, and ignores writes. Use it for
  filters some audiences must not use, e.g. an account filter where the workspace fixes the account
  (see schema.md, Conditions).
- `presets` — shortcut values the filter menu lists under its options (`{ label, value, icon?,
hint? }[]`, or a getter to read them from data): picking one sets the whole value.
- `sync` — where the value lives (below).
- `urlKey`, `omitDefault` (set `false` to keep defaults in the URL), `historyMode` (filters default
  to `'replace'`).

Filters picked from a list (`enum`, `options`, `remote`, `boolean`, `comparison`) also take:

- `columns` — lays the menu out in a grid (`3` for twelve months).
- `searchable` — a search field in the menu (remote lists always search, on the server).
- `max` — with `multiple: true`, the most values a filter picks; other items disable once reached.

Filters whose values have no label of their own (`enum`, `boolean`, `string`, `number`, dates,
`custom`) take `format: (value) => string`, used in menus and on pills. It runs reactively, so it
may read other state.

Unknown or invalid URL values fall back to the default. Writing `null` or `undefined` (a cleared
picker) restores the default.

## One Filter Reading Another

A definition reads its current value through `.value` once the dashboard runs (its default
before), so a lazy option can depend on another filter of the same scope, typed:

```ts
filters: (f) => {
  const year = f.enum(years(), { defaultValue: currentYear(), label: 'Year' })
  return {
    year,
    compare: f.boolean({
      defaultValue: true,
      label: 'Compare with',
      format: (on) => (on ? String(year.value - 1) : 'None'),
    }),
  }
},
```

## Where Values Live

```ts
filters: (f) => ({
  year: f.enum(YEARS, { defaultValue: 2026 }), // URL (default)
  draft: f.string({ sync: 'memory' }), // component state
  organisation: f.string({ sync: storeToRefs(org).current }), // a store, both ways
  role: f.string({ sync: () => session.role }), // read-only source: headless
})
```

A nullish store value reads as the default. A getter is read-only (writes are ignored), so its
filter is headless.

## URL Keys

| Filter of               | Key                 |
| ----------------------- | ------------------- |
| the root or a view      | `<filter>`          |
| a query                 | `<query>.<filter>`  |
| (the current view)      | `view`              |
| (auto-refresh interval) | `refresh` (seconds) |

A filter key names one state across the dashboard: the root and every view declaring `year` read
and write `?year=`, so the year survives a tab change and shows once in the bar. Declarations
sharing a key must agree on the kind, single or multiple values, and the default; otherwise the
dashboard fails with an error naming both. Give a filter another key (or `urlKey`) to keep it
apart.

With `urlPrefix: 'stats'`, every key is prefixed: `stats.year`, `stats.view`, … Use it when two
dashboards share a page, or when bare filter names could collide with other URL state.

No filter can use the URL key `view` while the dashboard has views (it would shadow the current
view), nor `refresh` (the auto-refresh interval): rename it or set its `urlKey`. Both are checked
when the dashboard is created.

Example: `?year=2025&view=consumption&currency=USD&productLines.tracked=en,fr`

## Controls

Every filter has a control on the sibling `controls` object:

```ts
dashboard.controls.year
dashboard.consumption.controls.account
// {
//   key, kind, multiple, headless, enabled,
//   label, placeholder,                 // resolved text
//   value,                              // writable (same as filters.x)
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

## Remote Filters

`f.remote(source, options)` takes a remote option source, the contract shared with table filters
and form fields:

For a source reused across several places, use `defineRemoteOptions` from `#ui-tools/shared` and
pass the loader directly to `f.remote`. The endpoint query key, including scope and search, drives
that loader's cache identity. [Reusable Remote Options](../../shared/references/remote-options.md)
shows the definition and all three uses. A dashboard-specific inline source remains valid:

```ts
account: f.remote(
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
account: f.remote(
  remoteTableOptions(
    // The query comes first: the row type is read from its result.
    (request) => $api.accounts.query.queryOptions({ body: request }),
    {
      search: ['name'], // or { fields: ['name'], debounce: 200 }
      sort: 'name', // or [{ key: 'name', dir: 'asc' }]
      option: (account) => ({ label: account.name, value: account.id }),
      valueKey: 'id', // default; matched with `isAnyOf` to resolve selected ids
      pagination: { type: 'cursor', size: 25 }, // default; match what the endpoint pages by
    },
  ),
  { multiple: true, label: 'Accounts' },
),
```

- Nothing loads until the picker opens (`open`) or a search term is typed.
- Pages are cached per search term; the previous term's options stay while the next one loads.
- Selected ids missing from the loaded pages are hydrated through `resolveSelected`; the control's
  `display` shows `…` until they resolve.

## Items From Data

A query filter can offer items read from another query:

```ts
queries: ({ essential }) => {
  const products = essential.query({ query: overview, select: (data) => data.products })
  return {
    products,
    usage: essential.query({
      defaultValue: [],
      filters: (f) => ({
        tracked: f.options(
          () => (products.data ?? []).map((product) => ({ label: product.name, value: product.id })),
          { multiple: true, max: 6 },
        ),
      }),
      query: ({ filters: own }) => ({ … }),
    }),
  }
}
```

Such items are read reactively; their values are strings.

## Defaults From Data

A getter default follows data, e.g. the three best-selling products once the list loads:

```ts
tracked: f.options(() => toOptions(products.data), {
  multiple: true,
  defaultValue: () => topProductIds(products.data, 3),
}),
```

The filter reads the getter while it is unset, so the default changes with the data. Picking
exactly the default keeps the URL clean and the filter keeps following it; `reset()` restores the
current default. A single-value getter that may return `undefined` (data not loaded yet) keeps
`undefined` in the filter type; a list filter falls back to `[]`.

## Presets

```ts
tracked: f.options(PRODUCTS, {
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

`f.comparison({ defaultValue: 'previous' })` declares the period a dashboard compares against:
`'previous'` (the same number of days right before the range), `'year'` (the same dates a year
earlier), or `'none'`. Its control carries localized labels ("Previous period", "Previous year",
"No comparison").

`resolveDashboardComparisonRange(range, mode)` (auto-imported) returns the range to fetch, or
`undefined` for `'none'`. It counts calendar days, so it never drifts across daylight-saving
changes; Feb 29 falls back to Feb 28 a year earlier.

```ts
filters: (f) => ({
  range: f.dateRange({ defaultValue: lastThirtyDays() }),
  compare: f.comparison({ defaultValue: 'previous', label: 'Compare with' }),
}),
queries: ({ essential, filters }) => ({
  revenue: essential.query(() => ({
    queryKey: ['revenue', filters.range, filters.compare],
    queryFn: () =>
      api.revenue({
        range: filters.range,
        previous: resolveDashboardComparisonRange(filters.range, filters.compare),
      }),
  })),
}),
```

Blocks then show the comparison: a stat's `compare` accessor (default delta and caption), a chart
series' `compare` accessor (faded bars or a dashed line). See blocks.md.

## Query Filters

State owned by one card (tracked series, a top-N limit) is declared on its query, and has a control
on the resource:

```ts
productLines: deferred.query({
  defaultValue: [],
  filters: (f) => ({
    tracked: f.enum(PRODUCT_KEYS, { multiple: true, defaultValue: ['en-gen'], label: 'Products' }),
  }),
  query: ({ filters: own }) => ({
    queryKey: ['lines', filters.year, own.tracked],
    queryFn: () => api.lines({ year: filters.year, products: own.tracked }),
  }),
}),
```

```vue
<UiDashboardLineChart
  :source="consumption.productLines"
  :series="consumption.productLines.controls.tracked"
  :series-value="(row, product) => row.units[product]"
/>
```
