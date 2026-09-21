---
name: nuxt-ui-tools-dashboard
description: Use this skill when building analytics dashboards with nuxt-ui-tools as a package consumer. Covers defineDashboardSchema, useDashboard, typed URL-synced params (including remote paginated pickers), staged queries (essential / background / deferred), derived values, views (tabs), widget-scoped params, and the dashboard blocks (stats, unovis charts, lists, bars, funnel, custom widgets) with their automatic loading, error, empty, and refresh states.
---

# nuxt-ui-tools Dashboard

Use this skill for package-consumer tasks involving:

- `defineDashboardSchema(...)` and `useDashboard(...)`
- typed dashboard params and their URL keys
- staged queries, dependent queries (`requires`), and `derive`
- dashboard views (tabs) and widget-scoped params
- `UiDashboardGrid`, `UiDashboardStat`, `UiDashboardWidget`, chart and list blocks

Focused references:

- `skills/consumer/dashboard/references/schema.md` — schema, stages, views, derive, facade shape
- `skills/consumer/dashboard/references/params.md` — param kinds, URL keys, option handles, remote pickers
- `skills/consumer/dashboard/references/blocks.md` — every block, its props, grid sizing, theming

## Setup

The dashboard ships with the module. Queries run through TanStack Query, so the app must install
`VueQueryPlugin` (same requirement as the table). Chart blocks render with unovis, an optional peer
dependency:

```bash
bun add @unovis/vue @unovis/ts
```

Stats, lists, bars, paired bars, funnels, stacked bars, and custom widgets work without unovis.

## The Shape In One Example

```vue
<script setup lang="ts">
const schema = defineDashboardSchema({
  key: 'sales',
  params: (p) => ({
    period: p.enum([7, 30, 90], { defaultValue: 30 }),
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
  derive: ({ data }) => ({
    total: () => data.daily.reduce((sum, day) => sum + day.revenue, 0),
  }),
})

const dashboard = useDashboard(schema)
</script>

<template>
  <USelect v-model="dashboard.params.period" v-bind="dashboard.options.period.menu" />

  <UiDashboardGrid>
    <UiDashboardStat
      size="12 md:4"
      :source="dashboard.summary"
      label="Revenue"
      :value="(summary) => summary.revenue"
      :delta="(summary) => summary.revenueChange"
    />
    <UiDashboardStat
      size="12 md:4"
      :source="dashboard.total"
      label="Total"
      :value="(total) => total"
    />
    <UiDashboardBarChart
      size="12 lg:8"
      :source="dashboard.daily"
      title="Revenue per day"
      :x="(day) => day.date"
      :series="[{ key: 'revenue', label: 'Revenue', value: (day) => day.revenue }]"
    />
  </UiDashboardGrid>
</template>
```

What you get without writing it:

- `?period=7` in the URL (defaults never reach the URL)
- `summary` fetches first; `daily` fetches once `summary` settles
- each block shows a skeleton while its source loads, a retryable error scoped to that block, an
  empty state, and a thin refresh bar while stale data refetches (values stay readable)
- `total` is a derived resource: its state follows `daily`, so its stat shows a skeleton until
  `daily` is ready
- every accessor (`summary.revenue`, `day.date`) is typed from the query result; a typo is a
  compile error in the template

## Rules Of Thumb

- There is no `.value` anywhere: `dashboard.params.period`, `dashboard.summary.data`,
  `dashboard.refreshing` are plain reads, and params are `v-model` targets.
- Bind blocks to resources, not strings: `:source="dashboard.summary"`.
- Put shared calculations in `derive`, not in page `computed`s, so blocks get their state for free.
- Controls are yours: the engine owns values, codecs, URL keys, and option lists; render them with
  Nuxt UI components.
- Call `useDashboard` once in `<script setup>`; all queries and URL bindings are created there.
