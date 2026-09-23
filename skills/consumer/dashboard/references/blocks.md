# Dashboard Blocks

Every block takes `:source` (a query or derived resource) and infers its data type from it, so
accessors like `(row) => row.used` are typed without annotations. Components are registered with the
module prefix (`Ui` by default).

## The Page

`UiDashboardPage` is a whole dashboard page, and the only thing a page template needs:

```vue
<UiDashboardPage
  :dashboard
  :title="t('Dashboard')"
  :actions="[{ label: 'Export', icon: 'i-lucide-download', onClick: exportAll }]"
>
  <template #consumption><ConsumptionTab /></template>
  <template #certifications><CertificationsTab /></template>
</UiDashboardPage>
```

- **Header:** the title; under it, today's date and when the data on screen was fetched
  (`description` replaces the line, `false` removes it); `actions` (Nuxt UI buttons, icon only on
  phones when they have one) and the refresh control (`refresh: false` removes it).
- **Pinned band:** the view tabs (while two views or more are enabled) and the filter bar. They stay
  pinned while the page scrolls and draw a shadow once content passes under them (`data-stuck`);
  `sticky: false`, `tabs: false`, and `filters: false` opt out.
- **Body:** the current view, from the slot named after it (`#consumption`), or the default slot
  (`{ view }`) for a dashboard without views or a view without its own slot. The body owns the
  padding and the space between grids, so views are just grids of blocks.
- **Scrolling:** the page is its own scroll container, so give it a height (`h-full` inside a layout
  that sizes its main area).
- **Slots:** `#title`, `#description`, `#actions`, `#tabs`, `#filters` replace their part (for
  example a `UiDashboardFilters` with a custom pill).
- **Theming:** `ui` parts `root`, `header`, `title`, `description`, `actions`, `toolbar`, `tabs`,
  `filters`, `body`, also `appConfig.nuxtUiTools.dashboard.page`.

## Shared Props

| Prop                | Type                                                                | Notes                                                    |
| ------------------- | ------------------------------------------------------------------- | -------------------------------------------------------- |
| `title`, `subtitle` | `LazyTextValue`                                                     | card header                                              |
| `size`              | responsive string                                                   | grid span: `"12 md:6 xl:4"`; defaults to the full row    |
| `card`              | `boolean`                                                           | `false` removes border, padding, background              |
| `activation`        | `'visible' \| 'mount' \| 'manual'`                                  | when a deferred source is activated; default `'visible'` |
| `empty`             | `{ icon?, title?, description? }`                                   | empty state content; defaults to a localized message     |
| `menu`              | `boolean \| entries[] \| (context) => entries[]`                    | card menu (see below); inherits the grid's `menu`        |
| `actions`           | `(ButtonProps & { placement?: 'header' \| 'footer' })[]`            | header buttons, or full-width buttons under the content  |
| `filters`           | filter controls                                                     | drill-down filters narrowing the block, as chips         |
| `freshness`         | `boolean`                                                           | "Updated 3 min ago" under the content; inherits the grid |
| `ui`                | `{ root, header, title, subtitle, actions, toolbar, body, footer }` | class overrides, plus the block's own parts (see below)  |

A header action with a `to` and no look of its own (`variant`, `icon`, `trailingIcon`) reads as a
text link with a chevron: `:actions="[{ label: 'All', to: '/accounts' }]"` draws "All ›".

`filters` lists the filters narrowing a block, such as a drill-down value picked on another block.
While one differs from its default, the toolbar shows it as a chip ("Day 12 Sep ✕") whose button
resets it: `:filters="[dashboard.controls.day]"`.

Row and chart blocks also emit `select` with `{ row, index }` (index in the source data):

```vue
<UiDashboardBarChart
  :source="dashboard.daily"
  ...
  @select="({ row }) => (dashboard.filters.day = row.day)"
/>
<UiDashboardTable
  :source="dashboard.accounts"
  ...
  @select="({ row }) => navigateTo(`/accounts/${row.id}`)"
/>
```

With a listener, each row (list, bars, paired bars, funnel step, donut and stack-bar legend, alert,
feed event, table row) becomes a button with a hover highlight; charts select the x position under
the click (or tap). Without one, nothing is interactive.

`selected: (row, index) => boolean` shows what a `select` handler stored (a drill-down or
cross-filter value): rows get a tint and an accent, their button `aria-pressed`; bar charts fade the
other bars, line charts draw a band behind the picked x, donuts fade the other segments.

```vue
<UiDashboardBarChart
  :source="dashboard.daily"
  :selected="(row) => row.day === dashboard.filters.day"
  @select="({ row }) => (dashboard.filters.day = row.day)"
  ...
/>
```

`rowActions: (row, index) => DashboardRowAction[]` (List, Bars, Alerts, Feed, Table) adds actions at
the end of each row: Nuxt UI dropdown items in a `⋮` menu, or icon buttons with `inline: true`. They
sit above the row's select button, so both stay clickable; the table gives them a last column.

```vue
<UiDashboardTable
  :row-actions="
    (row) => [
      { icon: 'i-lucide-eye', label: 'Preview', inline: true, onSelect: () => preview(row) },
      { icon: 'i-lucide-external-link', label: 'Open', to: `/accounts/${row.id}` },
      { type: 'separator' },
      { icon: 'i-lucide-archive', label: 'Archive', color: 'error', onSelect: () => archive(row) },
    ]
  "
  ...
/>
```

## Number Formats

Every `format` prop (stats, charts and their axes, lists, bars, tables, totals…) takes:

- a preset, in the dashboard locale: `'number'` (the default: grouped, one decimal at most, compact
  from 10,000), `'integer'`, `'decimal'`, `'compact'`, `'percent'` (a share out of 100: `57` →
  `57%`), `'ratio'` (a share out of 1), `'delta'` (signed percent change), `'points'` (signed
  difference of percentages: `+2.1 pts`), `'signed'` (`+3`)
- `Intl.NumberFormat` options; a `currency` without a `style` formats whole amounts in that
  currency: `{ currency: 'EUR' }` → `12 345 €`, `{ currency, notation: 'compact' }` for an axis
- a function `(value: number) => string`

```vue
<UiDashboardStat :source="summary" label="Units" :value="(s) => s.units" format="integer" />
<UiDashboardBarChart ... :format="{ currency: consumption.filters.currency }" />
```

`useDashboardFormat()` (auto-imported) returns the same formatters for your own text, so captions
and labels read like the blocks: `number`, `integer`, `decimal`, `compact`, `percent`, `ratio`,
`delta`, `points`, `signed`, `currency(value, code, options?)` (rounded to units unless `options`
say otherwise), `month(1–12 | Date, 'short' | 'long')` (capitalized: "Mar"), and
`resolve(format)` (any `format` value → a function). Number formatters print "—" for `null`,
`undefined`, and `NaN`, like `UiDashboardTotal` does for a missing `value`, so templates need no
fallback: `format.ratio(summary.rates.completion)`.

```ts
const format = useDashboardFormat()
const caption = (s: Summary) => `${format.integer(s.previous)} in ${year - 1}`
```

Formatters follow the ui-tools locale (Nuxt UI's by default) and are built once per locale. Digit
groups use no-break spaces, so values never wrap and never lose their spacing in bold fonts.

## Card Menu, Freshness, And Expand

`menu` adds a `…` button to the card header:

- `true`: every built-in action the block supports: `table` (switches the content to a data table
  and back), `csv` (downloads the same data; `;` and decimal commas for locales that write `1,5`), and
  `expand` (opens the card in a large dialog: charts draw taller, `limit` is lifted).
- an array picks and orders built-ins and mixes in Nuxt UI dropdown items:
  `:menu="['csv', 'expand', { label: 'All accounts', icon: 'i-lucide-external-link', to: '/accounts' }]"`.
- a function builds that array from the block's context:
  `{ title, table(), download(), expand() }`, so custom items can reuse the block's data (`table()`
  is the same tabular data the `table` and `csv` actions use, `undefined` until content shows):
  `:menu="(card) => ['csv', { label: 'Copy', onSelect: () => copy(card.table()) }]"`. On a grid, it
  runs once per block.
- `false` removes it (also overrides the grid).

`actions` puts buttons on the card: in the header next to the menu (default), or full width under
the content with `placement: 'footer'`. Each takes Nuxt UI button props (`label`, `icon`, `to`,
`onClick`, `variant`, `trailingIcon`…); header buttons default to `xs` outline, footer ones to
outline. They show in every phase.

```vue
<UiDashboardTable
  :actions="[
    { icon: 'i-lucide-download', label: 'Export', onClick: exportAll },
    {
      label: 'All accounts',
      to: '/accounts',
      placement: 'footer',
      trailingIcon: 'i-lucide-arrow-right',
    },
  ]"
  ...
/>
```

Set it once for a whole grid: `<UiDashboardGrid menu freshness>`; blocks inherit what they do not set,
nested grids inherit from their parent. Blocks without data to tabulate (a stat) show no menu unless
you pass items of your own. Built-in actions stay disabled until the source is ready.

`freshness` prints when the source was last fetched, kept current by one shared 30-second clock.
For a page-level line, bind `dashboard.updatedAt` (the oldest fetch time on screen):

```vue
<p>Updated <UiDashboardRelativeTime :value="dashboard.updatedAt" /></p>
```

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

- nothing at all while the source is `disabled` (its `enabled` condition does not hold, see
  schema.md): the block leaves the grid, which closes up around it
- skeleton while `idle` / `loading`, shaped like the block (bars, lines, ring, rows, funnel…); one
  highlight sweeps across it, animated on the compositor, and real values are not in the DOM
- a retryable error scoped to the block, and an empty state (`empty` prop)
- a thin progress bar at the top whenever a request is in flight, whatever the block shows: a
  refetch of its data (values stay readable), a retry after an error (the retry button spins until
  it settles), or the first load
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
drop their own border and radius.

Rows close up. A cell takes the width its `size` spans, and rows break where the columns say; a row
that is not full (a short last row, or a block hidden because its source is `disabled`) shares the
free width between its cells in proportion to their span. A five-tile KPI strip that loses one tile
shows four equal tiles; an `8 + 4` row that loses the `4` gives the `8` the whole row. A grid whose
blocks all render nothing collapses. `fill: false` keeps every cell at its span instead.

`columns` and `size` use the responsive string syntax (`"a md:b xl:c"`), resolved through
`nuxt-viewport` breakpoints.

**Split cards.** A nested `panels` grid is one card split in panes, each pane a block with its own
header, menu, and states; panes stack on small screens through their `size`:

```vue
<UiDashboardGrid>
  <UiDashboardGrid variant="panels" columns="12" size="12 lg:8">
    <UiDashboardBarChart size="12 md:8" ... />
    <UiDashboardStats size="12 md:4" columns="1" ... />
  </UiDashboardGrid>
  <UiDashboardGauge size="12 lg:4" ... />
</UiDashboardGrid>
```

**Tabs.** `UiDashboardTabs` is a tab strip bound with `v-model`, typed from its items. Bound to a
widget param, it switches what a block fetches: the tab lands in the URL and the block refreshes in
place. Bound to a local ref, it switches between blocks: render only the active one (`v-if`), so the
others' deferred queries stay idle.

```vue
<UiDashboardTable :source="dashboard.accounts" ...>
  <template #toolbar>
    <UiDashboardTabs
      v-model="dashboard.accounts.filters.segment"
      :items="[
        { value: 'all', label: 'All' },
        { value: 'company', label: 'Companies', count: companies },
      ]"
    />
  </template>
</UiDashboardTable>
```

Items: `{ value, label, icon?, count?, disabled? }`. `variant: 'pill' | 'link'`, `size`, `full`
(stretch over the width).

## Blocks

`UiDashboardStat` — KPI tile.
`value: (data) => number | string` (numbers go through `format`), `delta: (data) => number | null`
(percent by default; `deltaFormat` to change, e.g. points), `invertDelta` (a decrease is good news),
`caption: string | (data) => text` (wraps under the delta when space runs out), `icon`, `label`.
The delta reads `▲ +12 %` / `▼ −3 %`: the mark shows the direction, the color says good or bad.
Variants, all optional:

- `trend: (data) => number[]` — a sparkline under the value (oldest first; `null` leaves a gap),
  colored by `trendColor` (default `'series-1'`).
- `goal: (data) => number` — a progress bar toward a target, with `Goal 1 500` and the completion.
  Needs a numeric `value`; the bar takes `--nut-dash-up-mark` once the goal is reached.
- `status: (data) => { color, label? } | null` — a colored dot and label on the title row
  (`'success' | 'warning' | 'error' | 'info' | 'neutral'`).
- `trendType: 'area' | 'line' | 'bars'` — how `trend` is drawn (bars start at zero; the latest one
  is solid).
- `compare: (data) => number | null` — the same measure over the comparison period. It gives the
  default `delta` (the change from it) and caption ("vs 1,204 previous period"); `compareLabel`
  replaces that caption, as text or `(previous) => text` from the formatted previous value.
  `compareMode="difference"` compares by difference instead of relative change: `+12` accounts, or
  `+2.1 pts` when `format` is `'percent'` / `'ratio'` (`deltaFormat` still wins).

Slots `#value`, `#caption`. `ui` parts: `label`, `value`, `meta`, `delta`, `mark`, `caption`,
`status`, `trend`, `progress`, `goal`.

`UiDashboardBarChart` — `x: (row, index) => label`, `series: [{ key, label, value, color? }]`,
`comparison` (dashed line over the bars), `stacked`, `yAxis: { format, min, max, ticks }`,
`format`, `reference: { value, label?, position?: 'start' | 'end' }` (or an array), `height`,
`legend`, `xFormat`, `points` (x positions the skeleton draws before data arrives). Every row is an
x position, so return `null` values to keep empty months on the axis. Negative values get an axis
whose bounds and ticks stay round, with `0` always a tick.

- `highlight: 'max' | 'min' | 'last' | (row, index) => boolean` — bars drawn at full strength; the
  others take a faded tone of their color (`max` / `min` read each group's total; ties light the
  first). Best on single-series charts; `selected` wins over it.
- `labels` — prints each group's value above its bars (the stack total when `stacked`), in the axis
  format.
- A series' `compare: (row, index) => number | null` adds the same measure over the comparison
  period, right after it: a faded bar (a dashed line for line and area series), in the legend,
  tooltip, table view, and CSV. `compareLabel` names it (default "<label> (previous period)").
- `totals` (bar, line, and combo charts) — footer totals of the solid series, formatted like their
  axis: `true` / `'sum'` adds each series up, `'average'` averages it. Footer slot content follows
  them.

**Series picked by a filter.** On bar and line charts, `series` also takes the control of a
multiple filter: each option it picks becomes a series (keyed and labelled by the option, colored in pick
order), valued by `seriesValue(row, option)`. The chart then draws the picker in its header ("+ Add"
lists the options, "Presets" applies the filter's presets) and one removable chip per series, in the
series' color, in place of the legend. Removing every pick shows the empty state.

```vue
<UiDashboardLineChart
  :source="usage"
  title="Tracked products"
  :x="(row) => format.month(row.month)"
  :series="usage.controls.tracked"
  :series-value="(row, product) => row.units[product]"
  format="integer"
/>
```

`UiDashboardLineChart` — same as bars (without `highlight` and `labels`), plus `area` (fill under
every series; comparison areas are fainter). Solid series get point markers; `dashed: true` (or
`comparison`, or a series' `compare`) draws a thin dashed line. Lines stop at `null` values instead
of dropping to zero.

`UiDashboardComboChart` — mixed series: `type: 'bar' | 'line' | 'area'` and `axis: 'left' | 'right'`
per series; `y2Axis` configures the right axis, whose labels take the right series' color.
`highlight`, `labels`, and `selected` apply to its bars.

`UiDashboardDonutChart` — `label`, `value`, `color?`, `text: (row, share) => text` (legend values;
share in percent by default), `center: (rows) => value`, `centerLabel`, `layout: 'side' | 'stacked'`,
`legendColumns` (stacked layout), `diameter`, `thickness`, `gap` (px between segments),
`selected` (the other segments and legend entries fade).

`UiDashboardList` — ranked rows: `label`, `description`, `value` + `format`, `percent`, `delta`,
`leading: 'avatar' | 'code' | 'ring'` with `leadingText`, `icon`, `limit`, `rowKey`, and
`to: (row, index) => RouteLocationRaw` (each row is a link: it navigates, and opens in a new tab with
the usual keys). `ring` draws a
progress ring filled to `percent`, the share inside it, colored by `color: (row, index) => color`
(palette order by default). Slots `#item`, `#trailing`. `ui` parts: `row`, `avatar`, `code`, `ring`,
`label`, `description`, `share`, `delta`, `value`.

`UiDashboardBars` — horizontal bars: `label`, `tag` (small monospace suffix), `value`, `meta`
(right text), `max`, `color`, `emphasis: 'all' | 'first'` (only the leading row is colored),
`limit`. With `selected`, the selected rows keep `color` and the others fade.

`UiDashboardPairedBars` — a value inside a total per row: `label`, `total`, `value`, `totalLabel` +
`valueLabel` (header legend), `format`, `colors`, `limit`.

`UiDashboardFunnel` — `label`, `value`, `format`, `colors`; shows each step's share of the previous one.

`UiDashboardStackBar` — one stacked bar with a legend: `label`, `value`, `text: (row, share) => text`,
`color`, `legendColumns: 1 | 2`.

`UiDashboardAlerts` — what needs attention: `severity: (row) => 'error' | 'warning' | 'info' |
'success'`, `label`, `description`, `value` + `format` (a count or amount), `icon` (defaults to the
severity's), `action: (row) => { label, icon?, to?, onClick? } | null` (a button at the end of the
row), `order: 'severity' | 'source'` (default: most severe first, ties in source order), `limit`.
An empty source says "Nothing needs attention" with a check icon (override with `empty`). `ui`
parts: `row`, `icon`, `label`, `description`, `value`, `action`.

`UiDashboardFeed` — recent activity on a timeline: `label`, `description`,
`time: (row) => Date | number | string` (shown as `3 min ago`, `yesterday`, then the date, with
the full date as a tooltip), `icon`, `color` (tint of the icon or dot), `avatar` (image URL),
`groupBy: 'day'` (`Today` / `Yesterday` / date headings), `limit`. `ui` parts: `group`, `item`,
`marker`, `label`, `description`, `time`.

`UiDashboardTable` — a compact sortable table:

```vue
<UiDashboardTable
  v-model:sort="sort"
  :source="dashboard.accounts"
  title="Accounts"
  :limit="8"
  :columns="[
    { key: 'name', label: 'Account', value: (row) => row.name },
    { key: 'sessions', label: 'Sessions', type: 'bar', value: (row) => row.sessions },
    { key: 'success', label: 'Success', type: 'percent', value: (row) => row.success },
    { key: 'change', label: 'Change', type: 'delta', value: (row) => row.change },
  ]"
>
  <template #cell-name="{ row, value }"><AccountChip :account="row" :label="value" /></template>
</UiDashboardTable>
```

Column `type`: `text` (default), `number`, `delta` (signed percent colored by sign; `invert` for
good decreases), `percent`, `bar` (the number with an inline bar scaled to the column maximum or
`max`, colored by `color`). Also `format`, `align`, `width`, `sortable` (default `true`), `class`.
Header clicks cycle a column through its natural direction (numbers descending, text ascending),
the opposite one, then source order; `v-model:sort` (`{ key, direction } | null`) keeps it in
your state — bind it to query filters to put it in the URL. Sorting happens before `limit`; nulls
sort last. `maxHeight` (px) scrolls the rows under a sticky header. The menu offers `csv` and
`expand` (the table is already a table). `ui` parts: `wrapper`, `table`, `head`, `th`, `row`, `td`,
`bar` (the card's "view as table" uses the same `table` classes).

`UiDashboardStats` — several figures from one source in one card (a period summary, a
breakdown, the side pane of a split card):

```vue
<UiDashboardStats
  :source="dashboard.summary"
  title="This period"
  variant="tiles"
  :items="[
    {
      key: 'income',
      label: 'Income',
      icon: 'i-lucide-wallet',
      value: (d) => d.income,
      delta: (d) => d.incomeChange,
      progress: (d) => d.incomeGoalShare,
    },
    {
      key: 'expense',
      label: 'Expense',
      value: (d) => d.expense,
      color: 'warning',
      status: (d) => (d.expense > d.budget ? { color: 'error', label: 'Over budget' } : null),
    },
  ]"
/>
```

Item fields: `key`, `label`, `value` + `format`, `delta` + `invertDelta`, `caption`, `icon`, `color`
(icon tile and bar; palette order by default), `progress` (percent, a bar under the value),
`status` (a badge next to the value). `columns` (responsive; default one per item up to 4, two on
small screens), `variant: 'plain' | 'divided' | 'tiles'`. The menu's table lists label, value,
change. `ui` parts: `grid`, `item`, `icon`, `label`, `value`, `meta`, `delta`, `caption`, `progress`,
`status`.

`UiDashboardGauge` — one value on a scale: `value`, `min` / `max` (numbers or `(data) => number`;
default `0`–`100`), `target: (data) => number` (a tick across the ring, and "Goal …" under it),
`format`, `caption` (under the value, inside the ring), `color` (a color, or
`(value, share) => color` to change past a threshold), `variant: 'arc' | 'ring'` (a 240° gauge with
its bounds under it, or a full ring), `diameter`, `thickness`. Slot `#center` replaces the text in
the middle. It is a `meter` for assistive tech. `ui` parts: `ring`, `value`, `caption`, `scale`.

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
`'funnel'`, `'stack'`, `'paired'`, `'feed'`, `'table'`, `'stats'`, `'gauge'`), or pass a `#skeleton`
slot.
`tabulate: (data) => { columns, rows }` enables the `table` and `csv` menu actions; the default
slot receives `expanded` (rendered in the expand dialog).

`UiDashboardCard` — the chrome alone (title, legend, header-right, footer, states, menu) for fully
custom cards; pass `source` to get its states, `isEmpty` to flag emptiness, `tabulate` for the
table and CSV actions, `expandable` / `viewAsTable` to turn those actions off.

`UiDashboardLegend` (`items: { key, label, color, dashed? }[]`) and `UiDashboardTotal`
(`label`, `value`, `format`: numbers are formatted, text shows as is) are the header and footer
pieces used by the blocks:

```vue
<template #footer>
  <UiDashboardTotal label="Billed" :value="summary.billed" :format="{ currency }" />
</template>
```

`UiDashboardRelativeTime` (`value: Date | number | string | null`) renders a `<time>` relative to
now, kept current, with the full date as its title.

`UiDashboardRefresh` — the refresh control of a dashboard header: `:dashboard` (the object from
`useDashboard`), a refresh button, an auto-refresh menu (`intervals` in seconds, default
`[0, 30, 60, 300, 900]`; it writes `dashboard.autoRefresh`, kept in the URL), and "Updated 3 min ago"
(`updated`, default `true`). `label` shows the button text from the `sm` breakpoint up, `size` sizes
both buttons. `UiDashboardPage` renders it for you.

Chart blocks take `xLabel` for the category column of the table view and CSV (default: "Category").

## Colors And Theming

Series `color` accepts a palette slot (`'series-1'` … `'series-6'`), a Nuxt UI color
(`'primary'`, `'success'`, `'warning'`, `'error'`, `'info'`, `'neutral'`), or any CSS color.
`'neutral'` resolves to the muted text gray (Nuxt UI has no single neutral variable).

Omitted colors follow the palette order. The palette is a set of CSS variables mapped on Nuxt UI
tokens, so charts follow the theme and dark mode without any setup: primary, neutral gray,
secondary, a primary tint, warning, and a secondary tint. It skips success and info on purpose,
because stock Nuxt UI makes them the same hue as primary (green) and secondary (blue). Tints use a
fixed lightness, so they stay apart from their base color even when primary is black or white.
Override the slots in your CSS:

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

Sections: `card` (also `menu` and `freshness` parts), `grid`, `stat`, `legend`, `total`, `list`,
`bars`, `pairedBars`, `funnel`, `stackBar`, `donut`, `alerts`, `feed`, `table`, `state` (empty /
error content), `filter`, `filters`, `viewTabs` (see filters.md).

## Motion And Performance

- Charts respect `prefers-reduced-motion`, render only on the client (the server paints the
  skeleton), and load unovis lazily the first time a chart mounts.
- Deferred sources are activated through one IntersectionObserver shared by every block; blocks
  bound to a non-deferred query register nothing.
- Number formatters are built once per locale and shared by every block.
- Skeleton shimmer, the refresh bar, and the content fade-in only animate `transform` / `opacity`.
  Under `prefers-reduced-motion` the shimmer and fade-in stop and the refresh bar slows down.
