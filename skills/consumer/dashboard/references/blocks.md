# Dashboard Blocks

Every block takes `:source` (a query or derived resource) and infers its data type from it, so
accessors like `(row) => row.used` are typed without annotations. Components are registered with the
module prefix (`Ui` by default).

## Shared Props

| Prop                | Type                                                                | Notes                                                    |
| ------------------- | ------------------------------------------------------------------- | -------------------------------------------------------- |
| `title`, `subtitle` | `LazyTextValue`                                                     | card header                                              |
| `size`              | responsive string                                                   | grid span: `"12 md:6 xl:4"`; defaults to the full row    |
| `rows`              | responsive string                                                   | grid row span                                            |
| `card`              | `boolean`                                                           | `false` removes border, padding, background              |
| `activation`        | `'visible' \| 'mount' \| 'manual'`                                  | when a deferred source is activated; default `'visible'` |
| `empty`             | `{ icon?, title?, description? }`                                   | empty state content; defaults to a localized message     |
| `ui`                | `{ root, header, title, subtitle, actions, toolbar, body, footer }` | class overrides, plus the block's own parts (see below)  |

Shared slots:

- `#header-right`: links and buttons on the title row, next to the legend
- `#toolbar`: a row under the header for active filters or chips; it stays visible in every phase,
  including while the source loads
- `#footer`: totals (use `UiDashboardTotal`; consecutive totals share one rule). While loading, a
  footer slot reserves its height with a ghost row, so the card does not jump when data lands

```vue
<UiDashboardLineChart :source="dashboard.productLines" title="Per product" ...>
  <template #header-right>
    <UButton size="xs" icon="i-lucide-plus" label="Add a product" />
  </template>
  <template #toolbar>
    <UBadge v-for="product in tracked" :key="product" :label="product" />
  </template>
</UiDashboardLineChart>
```

States are automatic:

- skeleton while `idle` / `loading`, shaped like the block (bars, lines, ring, rows, funnel…); one
  highlight sweeps across it, animated on the compositor, and real values are not in the DOM
- a retryable error scoped to the block, and an empty state (`empty` prop)
- a thin progress bar while stale data refetches; values stay readable
- content fades in once when it replaces a skeleton

## Layout

```vue
<UiDashboardGrid variant="panels" columns="2 md:3 xl:5">  <!-- joined KPI strip -->
  <UiDashboardStat size="1" ... />
</UiDashboardGrid>
<UiDashboardGrid variant="panels">                        <!-- 12 columns by default -->
  <UiDashboardBarChart size="12 md:6 xl:8" ... />
  <UiDashboardDonutChart size="12 md:6 xl:4" ... />
</UiDashboardGrid>
```

`variant="cards"` (default) lays out separate cards with `gap` (any CSS length, default `1rem`).
`variant="panels"` draws one bordered surface whose cells are separated by 1px rules; blocks inside
drop their own border and radius. Keep panel rows full, or the empty cell shows the rule color.

`columns` and `size` use the responsive string syntax (`"a md:b xl:c"`), resolved through
`nuxt-viewport` breakpoints.

## Blocks

`UiDashboardStat` — KPI tile.
`value: (data) => number | string` (numbers go through `format`), `delta: (data) => number | null`
(percent by default; `deltaFormat` to change, e.g. points), `invertDelta` (a decrease is good news),
`caption: string | (data) => text` (wraps under the delta when space runs out), `icon`, `label`.
The delta reads `▲ +12 %` / `▼ −3 %`: the mark shows the direction, the color says good or bad.
Slots `#value`, `#caption`. `ui` parts: `label`, `value`, `meta`, `delta`, `mark`, `caption`.

`UiDashboardBarChart` — `x: (row, index) => label`, `series: [{ key, label, value, color? }]`,
`comparison` (dashed line over the bars), `stacked`, `yAxis: { format, min, max, ticks }`,
`format`, `reference: { value, label?, position?: 'start' | 'end' }` (or an array), `height`,
`legend`, `xFormat`, `points` (x positions the skeleton draws before data arrives). Every row is an
x position, so return `null` values to keep empty months on the axis.

`UiDashboardLineChart` — same as bars, plus `area` (fill under every series; comparison areas are
fainter). Solid series get point markers; `dashed: true` (or `comparison`) draws a thin dashed line.
Lines stop at `null` values instead of dropping to zero.

`UiDashboardComboChart` — mixed series: `type: 'bar' | 'line' | 'area'` and `axis: 'left' | 'right'`
per series; `y2Axis` configures the right axis, whose labels take the right series' color.

`UiDashboardDonutChart` — `label`, `value`, `color?`, `text: (row, share) => text` (legend values;
share in percent by default), `center: (rows) => value`, `centerLabel`, `layout: 'side' | 'stacked'`,
`legendColumns` (stacked layout), `diameter`, `thickness`, `gap` (px between segments).

`UiDashboardList` — ranked rows: `label`, `description`, `value` + `format`, `percent`, `delta`,
`leading: 'avatar' | 'code'` with `leadingText`, `icon`, `limit`, `rowKey`. Slots `#item`,
`#trailing`. `ui` parts: `row`, `avatar`, `code`, `label`, `description`, `share`, `delta`, `value`.

`UiDashboardBars` — horizontal bars: `label`, `tag` (small monospace suffix), `value`, `meta`
(right text), `max`, `color`, `emphasis: 'all' | 'first'` (only the leading row is colored),
`limit`.

`UiDashboardPairedBars` — a value inside a total per row: `label`, `total`, `value`, `totalLabel` +
`valueLabel` (header legend), `format`, `colors`, `limit`.

`UiDashboardFunnel` — `label`, `value`, `format`, `colors`; shows each step's share of the previous one.

`UiDashboardStackBar` — one stacked bar with a legend: `label`, `value`, `text: (row, share) => text`,
`color`, `legendColumns: 1 | 2`.

`UiDashboardWidget` — custom content with the same states:

```vue
<UiDashboardWidget :source="dashboard.funnel" title="Journey" skeleton="rows">
  <template #default="{ data, refreshing, refresh }">
    <MyFunnel :steps="data" />
  </template>
</UiDashboardWidget>
```

`isEmpty: (data) => boolean` overrides the empty check (default: `null` or an empty array).
`skeleton` picks the loading shape (`'rows'`, `'bars'`, `'lines'`, `'donut'`, `'stat'`, `'hbars'`,
`'funnel'`, `'stack'`, `'paired'`), or pass a `#skeleton` slot.

`UiDashboardCard` — the chrome alone (title, legend, header-right, footer, states) for fully custom
cards; pass `source` to get its states, `isEmpty` to flag emptiness.

`UiDashboardLegend` (`items: { key, label, color, dashed? }[]`) and `UiDashboardTotal`
(`label`, `value`) are the header and footer pieces used by the blocks.

## Colors And Theming

Series `color` accepts a palette slot (`'series-1'` … `'series-6'`), a Nuxt UI color
(`'primary'`, `'success'`, `'warning'`, `'error'`, `'info'`, `'neutral'`), or any CSS color.
Omitted colors follow the palette order. The palette is a set of CSS variables mapped on Nuxt UI
tokens, so charts follow the theme and dark mode; override them in your CSS:

```css
:root {
  --nut-dash-s1: #ff9600;
  --nut-dash-s2: #1f1d1a;
  --nut-dash-up: #1f1d1a; /* good-news delta text */
  --nut-dash-up-mark: #ff9600; /* its ▲ */
  --nut-dash-down: #a8463c; /* bad-news delta and ▼ */
  --nut-dash-muted: #e4ddd3; /* secondary bars */
  --nut-dash-track: #f7f3ee; /* empty part of bar tracks */
  --nut-dash-grid: #f1ece5; /* chart grid, list rules */
  --nut-dash-ghost: #f3eee7; /* skeleton shapes */
}
```

Library defaults have zero specificity, so plain `:root` rules win regardless of stylesheet order.

Class overrides merge (tailwind-merge) in this order: library defaults → app config → the block's
`ui` prop. App-wide overrides live in `app.config.ts`:

```ts
export default defineAppConfig({
  nuxtUiTools: {
    dashboard: {
      card: { root: 'rounded-[9px] px-6 py-[22px]', subtitle: 'font-light' },
      grid: { panels: 'rounded-[9px]', panel: 'bg-white' },
      stat: { value: 'text-[26px] font-light tracking-[-0.05em]' },
      total: { label: 'text-muted' },
    },
  },
})
```

Sections: `card`, `grid`, `stat`, `legend`, `total`, `list`, `bars`, `pairedBars`, `funnel`,
`stackBar`, `donut`, `state` (empty / error content).

## Motion And Performance

- Charts respect `prefers-reduced-motion`, render only on the client (the server paints the
  skeleton), and load unovis lazily the first time a chart mounts.
- Deferred sources are activated through one IntersectionObserver shared by every block; blocks
  bound to a non-deferred query register nothing.
- Number formatters are built once per locale and shared by every block.
- Skeleton shimmer, the refresh bar, and the content fade-in only animate `transform` / `opacity`.
  Under `prefers-reduced-motion` the shimmer and fade-in stop and the refresh bar slows down.
