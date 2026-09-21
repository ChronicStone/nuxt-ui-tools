# Dashboard Schema

```ts
const schema = defineDashboardSchema({
  key: 'analytics',          // identity; used in default query keys
  urlPrefix: 'stats',        // optional: prefix every URL key (two dashboards on one page)
  params: (p) => ({ ... }),  // shared params
  queries: (ctx) => ({ ... }),
  derive: (ctx) => ({ ... }),
  views: (view) => ({ ... }),   // optional tabs
  defaultView: 'consumption',   // optional, defaults to the first view
})
```

Write the properties in this order (`params`, `queries`, `derive`, `views`): each builder is typed
from the ones before it.

## Queries And Stages

`queries` receives `{ essential, background, deferred, params }`.

| Stage        | Fetches when                                                                   | Drives `state` |
| ------------ | ------------------------------------------------------------------------------ | -------------- |
| `essential`  | the scope is active (root: always; view: once opened)                          | yes            |
| `background` | every essential query of the same scope has settled (ready, error, or idle)    | no             |
| `deferred`   | `resource.activate()` runs — blocks call it when they scroll near the viewport | no             |

Two call forms:

```ts
// plain: data is `T | undefined`
summary: essential.query(() => ({
  queryKey: ['summary', params.year],
  queryFn: () => api.summary(params.year),
})),

// configured
consumption: essential.query({
  defaultValue: [],                       // data is always `T` (never undefined)
  params: (p) => ({                       // widget-scoped params (see params.md)
    tracked: p.enum(PRODUCTS, { multiple: true, defaultValue: ['en'] }),
  }),
  requires: () => params.account,         // gate + narrow: idle while null/undefined
  enabled: () => params.compare,          // extra boolean gate
  keepPreviousData: true,                 // default: stale data stays while a new key loads
  staleTime: 60_000,
  query: ({ params: widget, required }) => ({
    queryKey: ['consumption', required, widget.tracked],
    queryFn: () => api.consumption({ account: required, products: widget.tracked }),
  }),
}),
```

- `queryKey` is always yours; include every param the query reads.
- TanStack `queryOptions()` objects (tuyau, etc.) work as-is: the data type is read from `queryFn`.
- A wrong `defaultValue` shape is a compile error on `queries`.
- Dependent queries read a sibling in `requires`:

```ts
queries: ({ essential, deferred }) => {
  const accounts = essential.query(() => ({ queryKey: ['accounts'], queryFn: api.accounts }))
  return {
    accounts,
    ranking: deferred.query({
      requires: () => accounts.data,      // `required` is `Account[]` inside `query`
      query: ({ required }) => ({ queryKey: ['ranking', required.length], queryFn: ... }),
    }),
  }
},
```

## Derive

```ts
derive: ({ data, params }) => ({
  ytd: () => data.consumption.reduce((sum, row) => sum + row.used, 0),
  projection: () => (data.months.length ? (sum(data.months) / data.months.length) * 12 : 0),
}),
```

Each entry becomes a resource on the facade (`dashboard.ytd`) with `data`, `state`, `error`,
`refreshing`, `activate()`, `refresh()`. Its state is the combined state of the queries it actually
read during its last evaluation: any error → `error`, any loading → `loading`, all idle → `idle`,
else `ready`. Bind blocks to it like a query.

A view's `derive` can read root queries and root derived values as well as its own queries.

## Views

```ts
views: (view) => ({
  consumption: view({
    label: () => t('dashboard.tabs.consumption'),
    params: (p) => ({ currency: p.enum(['EUR', 'USD'], { defaultValue: 'EUR' }) }),
    queries: ({ essential, params }) => ({ ... }),   // params = shared + view params
    derive: ({ data }) => ({ ... }),
  }),
  candidates: view({ ... }),
}),
```

- The current view is `dashboard.view.current` (writable, URL key `view`, pushed to history so Back
  returns to the previous tab). `dashboard.view.items` is ready for `UTabs`:
  `<UTabs v-model="dashboard.view.current" :items="[...dashboard.view.items]" :content="false" />`.
- A view's queries never fetch until the view is opened once, then stay warm.
- Omit `views` for a single-view dashboard; nothing else changes.

## The Facade

```ts
const dashboard = useDashboard(schema)

dashboard.summary // root query resource
dashboard.ytd // root derived resource
dashboard.params.year // shared params (writable)
dashboard.options.year // option handles (see params.md)
dashboard.state // root + current view essentials
dashboard.refreshing // a refresh() is in flight
await dashboard.refresh() // refetch every active query of opened scopes

dashboard.consumption.params.currency
dashboard.consumption.productLines.params.tracked // widget params
dashboard.consumption.view // { key, label, active, opened }
dashboard.view.current // only when views exist
```

Resource members: `data`, `state` (`idle | loading | ready | error`), `error`, `refreshing`,
`active`, `stage`, `params`, `options`, `activate()`, `refresh()`.

Reserved names — a query, derived value, or view named `params`, `options`, `state`,
`refreshing`, `refresh`, `view`, or `schema`, or colliding with a sibling, is a compile error.
