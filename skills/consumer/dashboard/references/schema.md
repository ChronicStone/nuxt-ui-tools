# Dashboard Schema

```ts
export function analyticsSchema(params: { accountId: string }) {
  return defineDashboardSchema({
    key: 'analytics',          // identity; used in default query keys
    urlPrefix: 'stats',        // optional: prefix every URL key (two dashboards on one page)
    autoRefresh: 60,           // optional: default auto-refresh interval in seconds (0: off)
    filters: (f) => ({ ... }), // optional: filters of the root
    queries: (ctx) => ({ ... }),
    derive: (ctx) => ({ ... }),
    views: {                   // optional tabs, each declared with defineDashboardView
      consumption: consumptionView(params),
      candidates: candidatesView(params),
    },
    defaultView: 'consumption', // optional, defaults to the first view
  })
}
```

Write the properties in this order (`filters`, `queries`, `derive`): each builder is typed from the
ones before it.

## Schema And View Functions

A dashboard is about something: an account, the workspace a user works in. Wrap the schema in a
function whose params are that context, and hand them on to the views, the same way form schemas
hand their context to field functions:

```ts
export function accountSchema(params: { accountId: string; workspace: Workspace }) {
  return defineDashboardSchema({
    key: 'account',
    views: {
      activity: accountActivityView(params),
      invoices: accountInvoicesView(params),
    },
  })
}
```

- Call app-level composables at the top of the function (`useNuxtApp()` for `$i18n` and `$api`, a
  store, `useRoute()`), then return the definition. Builders (`filters`, `queries`, `derive`) may
  read them.
- Context is not a filter. Never sync an id or an audience into a filter from the route or a store:
  the page passes it, so the schema stays reusable in a modal, another workspace, or a test.
- A schema without context can stay a plain object (`const salesSchema = defineDashboardSchema(…)`).

`useDashboard` takes a schema, or a function returning one:

```ts
const sales = useDashboard(salesSchema)
const account = useDashboard(() =>
  accountSchema({ accountId: String(route.params.id), workspace: workspace.value }),
)
```

The getter runs in setup, and again when what it reads changes. The dashboard then rebuilds for the
new input behind the same objects: `account`, view handles, and every descendant's handle keep
working; filters keep their values (they live in the URL); queries whose key changed load, with
their blocks' loading state; the previous build stops. Because it runs again outside setup, the
function (and the views it calls) may use app-level composables and `useDashboardFormat()` (its
formats keep the page locale), not `useI18n()` or lifecycle hooks. Read only the context in the
getter: whatever it reads rebuilds the dashboard.

## Queries And Stages

`queries` receives `{ essential, background, deferred, filters }`: `filters` holds the values of the
scope's filters.

| Stage        | Fetches when                                                                   | Drives `state` |
| ------------ | ------------------------------------------------------------------------------ | -------------- |
| `essential`  | the scope is active (root: always; view: once opened)                          | yes            |
| `background` | every essential query of the same scope has settled (ready, error, or idle)    | no             |
| `deferred`   | `resource.activate()` runs — blocks call it when they scroll near the viewport | no             |

Two call forms:

```ts
// plain: data is `T | undefined`
summary: essential.query(() => ({
  queryKey: ['summary', filters.year],
  queryFn: () => api.summary(filters.year),
})),

// configured
consumption: essential.query({
  defaultValue: [],                       // data is always `T` (never undefined)
  filters: (f) => ({                      // filters of this query only (see filters.md)
    tracked: f.enum(PRODUCTS, { multiple: true, defaultValue: ['en'] }),
  }),
  requires: () => filters.account,        // gate + narrow (see below)
  enabled: () => filters.compare,         // part of the dashboard right now (see Conditions)
  keepPreviousData: true,                 // default: stale data stays while a new key loads
  staleTime: 60_000,
  query: ({ filters: own, required }) => ({
    queryKey: ['consumption', required, own.tracked],
    queryFn: () => api.consumption({ account: required, products: own.tracked }),
  }),
  select: (rows) => rows.filter((row) => row.used > 0), // optional: the part this resource exposes
}),
```

- `queryKey` is always yours; include every filter and param the query reads.
- TanStack `queryOptions()` objects (tuyau, etc.) work as-is: the data type is read from `queryFn`.
- A wrong `defaultValue` shape is a compile error on `queries`; with `select`, the default is
  checked against the selected type.

### One Response, Several Blocks

An endpoint that returns a whole tab (`{ summary, months, products }`) feeds one resource per block
with `select`. Resources built from the same factory share its request and cache entry: the
response is fetched once, and each resource keeps its own state for its blocks.

A selector may read filters and other resources: `select: (data) => data.revenue[filters.currency]`
selects again when the currency changes, without refetching (keep such filters out of the query).

```ts
queries: ({ essential, filters }) => {
  const overview = () => api.consumption.queryOptions({ year: filters.year })
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

## Conditions: What A User Can See

One schema can serve several audiences (an administrator, a manager, a client) when each part says
when it exists. Views, queries, and filters take `enabled`, a lazy callback read reactively. The
audience is context: the schema function receives it, and the conditions read it.

```ts
export function consumptionView(params: { workspace: Workspace }) {
  const can = (section: Section) => canReadSection({ section, workspace: params.workspace })

  return defineDashboardView({
    enabled: () => can('consumption'), // no tab for an audience that cannot read it
    filters: (f) => ({
      // A client's account is fixed by its workspace: no filter, never sent.
      account: f.remote(accounts, { enabled: () => params.workspace === 'admin' }),
    }),
    queries: ({ essential, filters }) => ({
      margin: essential.query({
        enabled: () => can('margin'),
        query: () => api.margin.queryOptions({ account: filters.account }),
      }),
    }),
  })
}
```

- **A disabled query** never fetches, its state is `disabled`, its data its `defaultValue`. Blocks
  bound to it render nothing, and so do blocks bound to a derived value reading only disabled
  sources. Scope and dashboard states leave it out, and background queries do not wait for it.
- **A disabled view** has no tab (`dashboard.view.items`), is never `dashboard.view.current` (a URL
  naming it reads as the default view, else the first enabled one; writing it is ignored), and its
  queries are `disabled`. `dashboard.<view>.view.enabled` reports it.
- **A disabled filter** leaves every filter bar, reads its default whatever the URL or store holds
  (so queries never send it), ignores writes, and counts in neither `filtered` nor
  `resetFilters()`. Its control reports `enabled`.

Grids close up around hidden blocks (see blocks.md), so a page never lays out holes for what a user
cannot see. Keep `enabled` for availability and `requires` for waiting on data: a query that waits
for another shows its loading state; a disabled one is simply not there.

## Derive

```ts
derive: ({ data, filters }) => ({
  ytd: () => data.consumption.reduce((sum, row) => sum + row.used, 0),
  projection: () => (data.months.length ? (sum(data.months) / data.months.length) * 12 : 0),
}),
```

Each entry becomes a resource on the facade (`dashboard.ytd`) with `data`, `state`, `error`,
`refreshing`, `activate()`, `refresh()`. Its state is the combined state of the queries it actually
read during its last evaluation: any error → `error`, any loading → `loading`, all idle → `idle`,
else `ready`. Bind blocks to it like a query.

## Views

Each view is a self-contained schema: its label, its condition, its filters, its queries and derived
values. Declare it with `defineDashboardView`, wrapped in a function taking what it needs from the
dashboard's params, in its own file:

```ts
export function consumptionView(params: { workspace: Workspace }) {
  const { $i18n } = useNuxtApp()
  return defineDashboardView({
    label: () => $i18n.t('dashboard.tabs.consumption'),
    enabled: () => params.workspace !== 'client',
    filters: (f) => ({
      year: f.enum(years(), { defaultValue: currentYear() }),
      currency: f.enum(['EUR', 'USD'], { defaultValue: 'EUR' }),
    }),
    queries: ({ essential, filters }) => ({ ... }),
    derive: ({ data }) => ({ ... }),
  })
}
```

- The current view is `dashboard.view.current` (writable, URL key `view`, pushed to history so Back
  returns to the previous tab). `UiDashboardPage` renders the tabs and the current view's slot;
  `dashboard.view.items` is ready for any other tab component.
- A view's queries never fetch until the view is opened once, then stay warm.
- A filter key names one state across the dashboard: two views declaring `year` share its value,
  so it survives a tab change. They must declare it the same way (kind, list or single value,
  default); otherwise the dashboard fails with an error naming both.
- Omit `views` for a single-view dashboard; nothing else changes.

## Handles In Components

`useDashboard` makes the dashboard available to every descendant component:

```ts
// a tab component rendered in a view slot of UiDashboardPage: no props
const consumption = useDashboardView(consumptionView)
consumption.summary.data
consumption.filters.year

// any component under the page
const account = injectDashboard(accountSchema)
account.activity.months.data
```

- `useDashboardView(viewFunction)` returns the view whose slot renders the component; outside a view
  slot, it reads the view on screen. A view declared as an object is also found by identity.
- `injectDashboard(schemaFunction)` returns the nearest dashboard; with a schema object, the one
  built from it.
- Both throw a clear error when no ancestor created a dashboard. The handles follow rebuilds:
  hold them in `setup`, read through them in templates and computeds.
- `InferDashboard<typeof accountSchema>` and `InferDashboardView<typeof consumptionView>` name the
  types when a prop or helper needs them.

## The Facade

```ts
const dashboard = useDashboard(() => analyticsSchema(params))

dashboard.summary // root query resource
dashboard.ytd // root derived resource
dashboard.filters.year // filter values of the root (writable)
dashboard.controls.year // controls of the same filters (see filters.md)
dashboard.filtered // a filter on screen differs from its default
dashboard.resetFilters() // restore the filters on screen (root + current view)
dashboard.state // root + current view essentials
dashboard.refreshing // a refresh() is in flight
dashboard.updatedAt // oldest fetch time on screen (root + current view), epoch ms
await dashboard.refresh() // refetch every active query of opened scopes
dashboard.autoRefresh = 30 // poll every active query every 30 s (URL key `refresh`); 0 turns it off

dashboard.consumption.filters.currency // filters of a view
dashboard.consumption.controls.account
dashboard.consumption.productLines.filters.tracked // filters of one query
dashboard.consumption.productLines.controls.tracked
dashboard.consumption.view // { key, label, active, enabled, opened }
dashboard.view.current // only when views exist
```

Resource members: `data`, `state` (`idle | loading | ready | error | disabled`), `error`, `refreshing`
(a refetch while `ready`), `fetching` (any request in flight, including a retry in `error`),
`updatedAt` (last successful fetch, epoch ms; a derived value reports its oldest input), `active`,
`stage`, `filters`, `controls`, `activate()`, `refresh()`. View handles expose `state`, `refreshing`,
`updatedAt`, `refresh()`, `filtered`, and `resetFilters()` too.

`autoRefresh` sets TanStack's `refetchInterval` on every active query: idle and inactive-view
queries do not poll, polling pauses while the page is in a background tab, and a query's own
`refetchInterval` wins. `UiDashboardRefresh` is a ready-made control for it (see blocks.md).

Reserved names — a query, derived value, or view named `filters`, `controls`, `filtered`,
`resetFilters`, `state`, `refreshing`, `refresh`, `updatedAt`, `autoRefresh`, `view`, or `schema`,
or colliding with a sibling, is a compile error.
