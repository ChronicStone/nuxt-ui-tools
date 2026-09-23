---
name: nuxt-ui-tools-dashboard
description: Use this skill when building analytics dashboards with nuxt-ui-tools as a package consumer. Covers defineDashboardSchema, useDashboard, standalone filters and views (defineDashboardFilter, defineDashboardFilters, defineDashboardView) with typed injection (useDashboardView, injectDashboard, InferDashboard), typed params synced with the URL, memory, or an external store, headless params, filter handles and the shipped controls (UiDashboardFilters, UiDashboardFilter, UiDashboardViewTabs) with slot overrides, remote paginated pickers and remoteTableOptions, staged queries (essential / background / deferred) with select and dependent requires, enabled conditions on views, queries, and filters (one schema for several audiences, blocks of disabled queries hidden, grids closing up), derived values, views (tabs), widget-scoped params, number formats (presets, Intl options, useDashboardFormat), and the dashboard blocks (stats with trends, goals, and comparisons, stat groups, gauges, unovis charts with highlights, value labels, and totals, lists with progress rings, bars, funnel, alerts, activity feeds, sortable tables, custom widgets) with their automatic loading, error, empty, and refresh states, card menus, header and footer actions, row actions, drill-down and selected state, card tabs, split cards, comparison periods, auto-refresh, and data freshness.
---

# nuxt-ui-tools Dashboard

Use this skill for package-consumer tasks involving:

- `defineDashboardSchema(...)` and `useDashboard(...)`
- standalone definitions: `defineDashboardFilter`, `defineDashboardFilters`, `defineDashboardView`
- typed injection: `useDashboardView(view)`, `injectDashboard(schema)`, `InferDashboard`,
  `InferDashboardView`
- typed params, where they live (`sync`: URL, memory, a store), headless params
- `UiDashboardPage`: the whole page (header, refresh, pinned tabs and filters, the current view)
- filter handles (`dashboard.filters.x`) and the controls `UiDashboardFilters`, `UiDashboardFilter`,
  `UiDashboardViewTabs`, a chart's series picked by a filter, a block's drill-down filter chips
- staged queries, `select`, dependent queries (`requires`), and `derive`
- conditions: `enabled` on views, queries, and params, for one schema serving several audiences
- remote pickers and `remoteTableOptions`
- number formats (`format="integer"`, `Intl.NumberFormat` options, `useDashboardFormat()`)
- `UiDashboardGrid`, `UiDashboardStat`, `UiDashboardWidget`, chart and list blocks, and the rest of
  the block library

Focused references:

- `skills/consumer/dashboard/references/schema.md` — schema, stages, `select`, conditions
  (`enabled`), views, derive, splitting a dashboard across files, the facade
- `skills/consumer/dashboard/references/params.md` — param kinds and options, sync, URL keys, filter
  handles, remote pickers
- `skills/consumer/dashboard/references/filters.md` — the filter bar, pills, view tabs, slots,
  binding a handle to your own control
- `skills/consumer/dashboard/references/blocks.md` — the page, every block, formats, grid sizing,
  theming

## Setup

The dashboard ships with the module. Queries run through TanStack Query, so the app must install
`VueQueryPlugin` (same requirement as the table). Chart blocks render with unovis, an optional peer
dependency:

```bash
bun add @unovis/vue @unovis/ts
```

Stats, lists, bars, paired bars, funnels, stacked bars, and custom widgets work without unovis.

## The Shape In One Example

A single file is enough for a small dashboard:

```vue
<script setup lang="ts">
const schema = defineDashboardSchema({
  key: 'sales',
  params: (p) => ({
    period: p.enum([7, 30, 90], {
      defaultValue: 30,
      label: 'Period',
      format: (days) => `${days} days`,
    }),
  }),
  queries: ({ essential, background, params }) => ({
    summary: essential.query(() => ({
      queryKey: ['sales', 'summary', params.period],
      queryFn: () => api.sales.summary({ days: params.period }),
    })),
    daily: background.query({
      defaultValue: [],
      query: () => ({
        queryKey: ['sales', 'daily', params.period],
        queryFn: () => api.sales.daily({ days: params.period }),
      }),
    }),
  }),
})

const dashboard = useDashboard(schema)
</script>

<template>
  <UiDashboardPage :dashboard title="Sales">
    <UiDashboardGrid>
      <UiDashboardStat
        size="12 md:4"
        :source="dashboard.summary"
        label="Revenue"
        :value="(summary) => summary.revenue"
        :compare="(summary) => summary.previousRevenue"
        :format="{ currency: 'EUR' }"
      />
      <UiDashboardBarChart
        size="12 lg:8"
        :source="dashboard.daily"
        title="Orders per day"
        :x="(day) => day.date"
        :series="[{ key: 'orders', label: 'Orders', value: (day) => day.orders }]"
        format="integer"
        totals
      />
    </UiDashboardGrid>
  </UiDashboardPage>
</template>
```

What you get without writing it:

- the page: title, today's date and when the data was fetched, the refresh control, and the filter
  bar pinned while the page scrolls
- a "Period 30 days ⌄" pill that picks the period, turns accent when changed, and resets
- `?period=7` in the URL (defaults never reach the URL)
- `summary` fetches first; `daily` fetches once `summary` settles
- each block shows a skeleton while its source loads, a retryable error scoped to that block, an
  empty state, and a thin progress bar whenever a request is in flight (refetch or retry)
- the stat's delta and "vs €12,400 previous period" caption, in the current locale
- every accessor (`summary.revenue`, `day.date`) typed from the query result

## Split A Dashboard Across Files

Larger dashboards put each piece where it belongs; nothing is passed around by hand:

```ts
// filters.ts: reusable, typed filters (factories run in setup, so composables work)
export const yearFilter = defineDashboardFilter((p) =>
  p.enum(years(), { defaultValue: currentYear(), label: () => t('Year') }),
)
export const accountFilter = defineDashboardFilter((p) => {
  const { $api } = useNuxtApp()
  return p.remote(
    remoteTableOptions((request) => $api.accounts.query.queryOptions({ body: request }), {
      search: ['name'],
      sort: 'name',
      option: (account) => ({ label: account.name, value: account.id }),
    }),
    { label: () => t('Account'), placeholder: () => t('All accounts') },
  )
})
export const periodFilters = defineDashboardFilters({ year: yearFilter })

// consumption.ts: one tab
export const consumptionView = defineDashboardView({
  label: () => t('Consumption'),
  shared: periodFilters, // root params this view reads
  params: { account: accountFilter },
  queries: ({ essential, params }) => {
    const overview = () =>
      api.consumption.queryOptions({ year: params.year, account: params.account })
    return {
      summary: essential.query({ query: overview, select: (data) => data.summary }),
      months: essential.query({ defaultValue: [], query: overview, select: (data) => data.months }),
    }
  },
})

// schema.ts
export const adminDashboard = defineDashboardSchema({
  key: 'admin',
  params: periodFilters,
  views: { consumption: consumptionView, certifications: certificationsView },
})
```

```vue
<!-- page: instantiate, then bind. The page renders the tabs, the filters, and the current view. -->
<script setup lang="ts">
const dashboard = useDashboard(adminDashboard)
</script>
<template>
  <UiDashboardPage :dashboard :title="t('Dashboard')">
    <template #consumption><ConsumptionTab /></template>
    <template #certifications><CertificationsTab /></template>
  </UiDashboardPage>
</template>

<!-- ConsumptionTab.vue: no props, fully typed, blocks only -->
<script setup lang="ts">
const consumption = useDashboardView(consumptionView)
</script>
<template>
  <UiDashboardGrid variant="panels" columns="2 md:4">
    <UiDashboardStat
      size="1"
      :source="consumption.summary"
      label="Units"
      :value="(s) => s.units"
      format="integer"
    />
  </UiDashboardGrid>
</template>
```

## Rules Of Thumb

- A page instantiates the dashboard and binds components: `useDashboard(schema)` in the script,
  `UiDashboardPage` in the template, one slot per view. Never wire a header, a date line, sticky
  tabs, a scroll shadow, or a `v-if` on `dashboard.view.current` by hand; view components contain
  blocks only.
- There is no `.value` anywhere: `dashboard.params.year`, `dashboard.summary.data`,
  `dashboard.refreshing` are plain reads, and params are `v-model` targets.
- Bind blocks to resources, not strings: `:source="dashboard.summary"`.
- Put shared calculations in `derive`, not in page `computed`s, so blocks get their state for free.
- Declare presentation on the param (`label`, `placeholder`, `format`, `columns`) and render
  `UiDashboardFilters`; slot or bind a handle yourself only where a filter needs a custom control.
- Split one response per block with `select` instead of reshaping it in `derive`.
- Serve every audience from one schema: put the audience in a headless param synced from the
  session, and give views, queries, and filters an `enabled` condition. Blocks bound to a disabled
  query render nothing and grids close up, so templates never branch on permissions.
- Use `useDashboardView(view)` / `injectDashboard(schema)` in child components; never prop-drill the
  dashboard or restate its type (`InferDashboard<typeof schema>` names it when you need to).
- Format with presets, `{ currency }`, or `useDashboardFormat()`; do not build
  `Intl.NumberFormat` options in `computed`s.
- Let the engine render filter controls: a chart whose series the user picks binds the filter as its
  `series`; a block narrowed by a drill-down value lists it in `filters`; a header link is an action
  `{ label, to }`; rows that open a page take `to`.
- Drill down by writing a param from `@select`; show it back with `selected`.
- Compare periods with `p.comparison()` and `resolveDashboardComparisonRange`, then pass `compare`
  accessors to stats and chart series: deltas, captions, and legends follow.
- Call `useDashboard` once in `<script setup>`; all queries and URL bindings are created there.
