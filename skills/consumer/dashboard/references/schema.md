# Dashboard Schema

```ts
const schema = defineDashboardSchema({
  key: 'analytics',          // identity; used in default query keys
  urlPrefix: 'stats',        // optional: prefix every URL key (two dashboards on one page)
  autoRefresh: 60,           // optional: default auto-refresh interval in seconds (0: off)
  params: (p) => ({ ... }),  // shared params (or a map: { year: yearFilter })
  queries: (ctx) => ({ ... }),
  derive: (ctx) => ({ ... }),
  views: (view) => ({ ... }),   // optional tabs (or a map of defineDashboardView views)
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
  params: {                               // widget-scoped params (see params.md)
    tracked: (p) => p.enum(PRODUCTS, { multiple: true, defaultValue: ['en'] }),
  },
  requires: () => params.account,         // gate + narrow (see below)
  enabled: () => params.compare,          // extra boolean gate
  keepPreviousData: true,                 // default: stale data stays while a new key loads
  staleTime: 60_000,
  query: ({ params: widget, required }) => ({
    queryKey: ['consumption', required, widget.tracked],
    queryFn: () => api.consumption({ account: required, products: widget.tracked }),
  }),
  select: (rows) => rows.filter((row) => row.used > 0), // optional: the part this resource exposes
}),
```

- `queryKey` is always yours; include every param the query reads.
- TanStack `queryOptions()` objects (tuyau, etc.) work as-is: the data type is read from `queryFn`.
- A wrong `defaultValue` shape is a compile error on `queries`; with `select`, the default is
  checked against the selected type.

### One Response, Several Blocks

An endpoint that returns a whole tab (`{ summary, months, products }`) feeds one resource per block
with `select`. Resources built from the same factory share its request and cache entry: the
response is fetched once, and each resource keeps its own state for its blocks.

A selector may read params and other resources: `select: (data) => data.revenue[params.currency]`
selects again when the currency changes, without refetching (keep such params out of the query).

```ts
queries: ({ essential, params }) => {
  const overview = () => api.consumption.queryOptions({ year: params.year })
  return {
    summary: essential.query({ query: overview, select: (data) => data.summary }),
    months: essential.query({ defaultValue: [], query: overview, select: (data) => data.months }),
    products: essential.query({ defaultValue: [], query: overview, select: (data) => data.products }),
  }
},
```

### Dependent Queries

`requires` gates a query on a value and narrows it: while it returns `null` or `undefined` the query
does not fetch, and `required` is the non-nullish value inside `query`. Reading another resource's
`data` in it makes a dependent query:

```ts
queries: ({ essential, background }) => {
  const products = essential.query({ query: overview, select: (data) => data.products })
  return {
    products,
    usage: background.query({
      defaultValue: [],
      requires: () => (products.data?.length ? products.data : null),
      query: ({ required }) => ({
        queryKey: ['usage', required.map((product) => product.id)],
        queryFn: () => api.usage(required.map((product) => product.id)),
      }),
    }),
  }
},
```

While `requires` is not satisfied, the resource follows the resources it read: `loading` while they
load, `error` if one failed (its retry refetches them), and once they are ready without satisfying
it, `ready` with its `defaultValue` — its block shows the empty state instead of waiting forever.
Without a `defaultValue` it stays `idle`.

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

Inline, with the `view(...)` builder:

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

Or as a map of views declared on their own (next section):

```ts
views: { consumption: consumptionView, candidates: candidatesView },
```

- The current view is `dashboard.view.current` (writable, URL key `view`, pushed to history so Back
  returns to the previous tab). `UiDashboardViewTabs :dashboard` renders the tabs (see filters.md);
  `dashboard.view.items` is ready for any other tab component.
- A view's queries never fetch until the view is opened once, then stay warm.
- Omit `views` for a single-view dashboard; nothing else changes.

## Splitting A Dashboard Across Files

`defineDashboardView` declares a view on its own. `shared` lists the root params it reads (a filter
group or a map): its queries, derived values, and handle see them next to its own params, and
`defineDashboardSchema` rejects a views map whose root params do not declare them with the same
type.

```ts
// dashboard/consumption.ts
export const consumptionView = defineDashboardView({
  label: () => t('Consumption'),
  shared: periodFilters,
  params: { account: accountFilter, currency: currencyFilter },
  queries: ({ essential, params }) => { ... },   // params.year, params.account, params.currency
  derive: ({ data }) => ({ ... }),
})

// dashboard/schema.ts
export const adminDashboard = defineDashboardSchema({
  key: 'admin',
  params: periodFilters,
  views: { consumption: consumptionView, certifications: certificationsView },
})
```

`useDashboard(schema)` makes the dashboard available to every descendant component:

```ts
// a tab component: no props
const consumption = useDashboardView(consumptionView)
consumption.summary.data
consumption.params.year // shared params are on the view handle

// any component under the page
const dashboard = injectDashboard(adminDashboard)
```

Both throw a clear error when no ancestor created the dashboard. `InferDashboard<typeof schema>`
and `InferDashboardView<typeof view>` name the types when a prop or helper needs them.

## The Facade

```ts
const dashboard = useDashboard(schema)

dashboard.summary // root query resource
dashboard.ytd // root derived resource
dashboard.params.year // shared params (writable)
dashboard.filters.year // filter handles (see params.md)
dashboard.filtered // a filter on screen differs from its default
dashboard.resetFilters() // restore the filters on screen (root + current view)
dashboard.state // root + current view essentials
dashboard.refreshing // a refresh() is in flight
dashboard.updatedAt // oldest fetch time on screen (root + current view), epoch ms
await dashboard.refresh() // refetch every active query of opened scopes
dashboard.autoRefresh = 30 // poll every active query every 30 s (URL key `refresh`); 0 turns it off

dashboard.consumption.params.currency // view params, the shared ones included
dashboard.consumption.filters.account
dashboard.consumption.productLines.params.tracked // widget params
dashboard.consumption.productLines.filters.tracked
dashboard.consumption.view // { key, label, active, opened }
dashboard.view.current // only when views exist
```

Resource members: `data`, `state` (`idle | loading | ready | error`), `error`, `refreshing`,
`updatedAt` (last successful fetch, epoch ms; a derived value reports its oldest input), `active`,
`stage`, `params`, `filters`, `activate()`, `refresh()`. View handles expose `state`, `refreshing`,
`updatedAt`, `refresh()`, `filtered`, and `resetFilters()` too.

`autoRefresh` sets TanStack's `refetchInterval` on every active query: idle and inactive-view
queries do not poll, polling pauses while the page is in a background tab, and a query's own
`refetchInterval` wins. `UiDashboardRefresh` is a ready-made control for it (see blocks.md).

Reserved names — a query, derived value, or view named `params`, `filters`, `filtered`,
`resetFilters`, `options`, `state`, `refreshing`, `refresh`, `updatedAt`, `autoRefresh`, `view`, or
`schema`, or colliding with a sibling, is a compile error.
