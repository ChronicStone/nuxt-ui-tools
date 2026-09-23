# Dashboard Runtime

`src/runtime/dashboard/` — typed params (URL, memory, or store-synced) with filter handles and
controls, staged queries, derived resources, views, and a generic block library. Public
entrypoints: `defineDashboardSchema`, `defineDashboardFilter(s)`, `defineDashboardView`,
`useDashboard`, `useDashboardView`, `injectDashboard`, `useDashboardFormat`, and the `Dashboard*`
components registered in `src/components.ts`. `remoteTableOptions` lives in the table domain
(`table/utils/remote-table-options.ts`) and feeds dashboard, table, and form remote options. Like
`tableSource`, it infers the whole query definition and reads rows through `TableSourceQueryResult`
/ `TableSourceRow` (`table/types/source.ts`): generated clients (Tuyau `queryOptions()`) type
`queryFn` as `MaybeRefDeep<QueryFunction | skipToken>`, which a strict `QueryDefinition` rejects.
Its runtime checks the `queryFn` is callable and the response has `rows`.

## Layout

```
types/        params (param options, sync, entries), filters (filter handles, bar target),
              resource, schema (+ inferred DashboardApi, InferDashboard, InferDashboardView),
              blocks (formats), charts, ui;
              runtime.ts (erased shapes, the option-list contract) is internal and not re-exported
schema/       defineDashboardSchema (identity + compile-time key and shared-param guards),
              defineDashboardFilter(s), defineDashboardView (identities)
utils/        builders/dashboard-params.ts (the `p` builder; DashboardParamBuilder = typeof it)
              params/codecs.ts, schema.ts (erase generics once, resolve params inputs and filter
              factories), resource.ts (slot-backed facade), tracker.ts (read tracking for derive
              and requires), state.ts (state combine, refresh, URL prefixes), options.ts,
              filters.ts (listed kinds, pill classes, headless rule, value text), format.ts
              (per-locale presets and Intl caches, month names), remote.ts (settles a remote
              result: promise or query definition), charts.ts (palette, series, nice max / tick
              count, axis), chart-frame.ts (tooltip HTML, chart → data table), ui.ts
              (resolveDashboardClasses, app config reader, table and selectable-row classes),
              visibility.ts (one shared IntersectionObserver), export.ts (data cells, CSV, file
              download), time.ts (relative time, day headings), sparkline.ts (stat trend paths
              and mini bars), comparison.ts (resolveDashboardComparisonRange, exported)
composables/  use-dashboard (entry, provides the instance) → use-dashboard-scope (root + one per
              view) → use-dashboard-param-scope (storage per sync mode, values facade)
              → use-dashboard-filter (one handle) → use-dashboard-options (static list, or
              use-dashboard-remote-options); use-dashboard-resource (one useQuery);
              use-dashboard-derived; use-dashboard-views; use-dashboard-api (facade only);
              use-dashboard-context (provide / inject by declaration object);
              use-dashboard-block, use-dashboard-chart, use-dashboard-format (public formatters +
              `resolve`), use-dashboard-time (one shared clock), use-dashboard-ui (app config +
              grid context) (blocks)
components/   dashboard-card.vue (shell: chrome, phases, menu, actions, table view, expand
              dialog, freshness), blocks, controls: dashboard-filters.vue (bar),
              dashboard-filter.vue (pill / button) + filter/dashboard-filter-menu.vue (list),
              dashboard-view-tabs.vue, dashboard-tabs.vue, dashboard-refresh.vue,
              block/ (state, skeleton, data-table, ring, row-actions),
              charts/renderer.ts (the only seam allowed to import unovis) + charts/unovis/*
              (xy-layers.ts resolves one axis into unovis inputs; dashboard-xy-marks.vue draws
              an axis' areas, lines, markers, and references)
```

## Ownership

- `useDashboardScope` owns declaration: it calls `queries(ctx)` once, synchronously. Stage
  `.query()` returns a facade immediately (keys are unknown until the builder returns), then the scope
  instantiates each resource in returned-object order and assigns the facade's `slot`. Facade reads
  before instantiation track the slot shallowRef, so dependent `requires` gates stay reactive.
- `useDashboardResource` owns exactly one `useQuery`, the deferred `activated` latch, and widget
  params. Gating rewrites `enabled` on a stable definition; a gated resource never evaluates its
  factory. Stage gates: essential → scope active; background → scope `settled` (no essential
  loading); deferred → `activate()`. `requires` runs through the tracker (resource and derived
  facades record their `data` reads): while it is nullish the resource follows the sources it
  read (loading / error / idle), then `ready` on its `defaultValue` (`idle` without one); `refresh`
  refetches those sources. `select` runs in the resource's `data` computed, on top of the
  definition's own TanStack `select`, so what it reads (a param, another resource) is tracked and
  re-selects without a refetch; resources on one factory share the TanStack cache entry.
- `useDashboardParamScope` owns where values live: one `useQueryStates` for the URL-synced params of
  a scope (root: no prefix, view `<view>`, widget `<scope>.<query>`), a `shallowRef` per memory
  param, and the external ref or getter of store-synced ones (a getter is read-only, so its param is
  headless). It builds the get/set values facade and one filter handle per param, and owns
  `changed()` / `reset()` over its non-headless handles. No params → nothing allocated.
  Defaults go through `definition.resolveDefault()`: a getter default is read while the value is
  unset, and writing a value equal to the current default stores it unset, so it stays out of the
  URL and keeps following the getter.
  `mergeDashboardParamScopes` exposes root + view scopes as one (builders' `params`, view handles).
- `useDashboardFilter` builds one handle: label / placeholder / display text, `changed` (codec
  serialization compared with the default's), `toggle` (multiple values kept in item order, capped
  by `max`), `reset`, and the option list from `useDashboardOptions`. Static and remote lists return
  the same `DashboardRuntimeOptionList` shape; fixed items are normalized to getters by the builders,
  so the list reads data-driven items (`p.options(() => …)`) the same way.
- Params inputs resolve once per scope (`resolveDashboardParams`): the callback form receives the
  builder and the shared values; map entries that are factories (`defineDashboardFilter`) run with
  the builder, in setup. A view param reusing a root key throws.
- `use-dashboard-context.ts` (`provideDashboardInstances`) maps each declaration object (the schema, and
  each view's declared object) to its facade / handle; `useDashboardView` and `injectDashboard`
  inject by identity, so builder-form views are reached through `injectDashboard(schema).<view>`.
- `useDashboardDerived` is one computed that evaluates and records reads through the shared tracker;
  state = combined state of the recorded sources.
- Conditions: `enabled` (boolean or getter, `resolveDashboardCondition`) on queries, params, and views
  (views get `{ params }`). A resource is `available` when its scope and its own condition hold;
  otherwise its state is `disabled`, its data the default, and `refresh` a no-op.
  `combineDashboardStates` leaves `disabled` out and is `disabled` only when every input is, so
  derived values, dependents, and scope states never wait on a disabled source. A disabled param's
  getter returns the resolved default and its setter does nothing; handles expose `enabled`, and
  `changed` / `reset` and the filter bar skip disabled handles.
- `useDashboardViews` owns the `view` query state (push history) and a warm `opened` latch per view,
  and rejects a root param whose URL key would shadow `view`. Each view's `enabled` is a computed
  over the root params; `current` is a computed over the stored key that resolves a disabled view
  to the default (else first enabled) view and ignores writes of disabled ones, and a disabled
  view's scope is inactive with `enabled` false, so its resources report `disabled`. URL keys are always readable names
  (`year`, `view`, `consumption.currency`); `urlPrefix` namespaces them. Do not abbreviate.
- `useDashboardApi` is a facade: plain objects with getters over owned refs, `markRaw`, no refs
  exposed. It must not own behaviour.
- `useDashboard` owns the auto-refresh interval: one `useQueryState` (URL key `refresh`, seconds,
  default `schema.autoRefresh`), turned into a `refetchInterval` computed (ms, `0` off) that every
  scope hands to its resources. Resources put it before the query's own options, so a query's
  `refetchInterval` wins. A root param using the URL key `refresh` throws, like `view`.
- `p.comparison()` is an option param of kind `comparison` (values `previous | year | none`).
  `useDashboardOptions` localizes its item labels through the library messages
  (`dashboard.compare.*`), so they follow the locale; the codec and URL form are an enum's.

## Blocks And Rendering

- Every block renders `DashboardCard`, which owns chrome, phases, skeleton, empty/error, toolbar,
  footer ghost, and the refresh bar. Blocks only compute their rows, pass a `#skeleton` shaped like
  themselves (`block/dashboard-skeleton.vue`, one `kind` per family, seeded geometry), and forward
  `#header-right`, `#toolbar`, and `#footer`.
- Deferred activation goes through `utils/visibility.ts` (one observer, one-shot callbacks). Blocks
  only register when their source can wait for activation: a `deferred` query, or a derived value.
- The shimmer is one `::after` overlay per skeleton animated with `transform`; never animate
  `background-position` on individual ghosts (it repaints every shape every frame).
- Blocks format through `useDashboardFormat().resolve(format, fallbackPreset)`: presets and
  `Intl.NumberFormat` options resolve to formatters cached per locale (`utils/format.ts`); do not
  build `Intl.NumberFormat` instances inside blocks. U+202F is normalized to U+00A0.
- Controls: the pill menu is `filter/dashboard-filter-menu.vue`, rendered once through
  `createReusableTemplate` by either trigger. `UiDashboardFilters` reads the current view's handle
  (`dashboard[dashboard.view.current]`, which merges root filters) and renders filters of listed
  kinds always, free ones only while `changed`. Remote pages load ahead of the scroll (three list
  heights). Menus stay dense (28px rows, 13px text; taller only on coarse pointers).
- Class resolution: `resolveDashboardClasses(defaults, appUi.<section>, props.ui)` (tailwind-merge,
  later wins). Block `ui` props are `DashboardBlockUi & <Block>Ui`; part names must not collide with
  the card's (`root`, `header`, `title`, `subtitle`, `actions`, `body`, `footer`). The card root is
  merged separately so panel cells can drop border/radius after the app's `card.root`.
- `DashboardGrid` provides a context (`provideDashboardGrid`): `panels` switches cards to panel
  chrome; `menu` and `freshness` are defaults for blocks that do not set their own (nested grids
  inherit from their parent); `columns`, `gap`, and `fill` are the geometry cells read.
- Grids are wrapping flex rows, not CSS grids: `resolveDashboardCellStyle` gives each cell (block
  or nested grid, read from the parent context before providing its own) the basis of its span's
  track run minus a hair, and `flex-grow` equal to its span when `fill` is on, so a short row shares
  its free width by span. A block whose source is `disabled` renders nothing (`v-if` on the card
  root; the component stays mounted), and `empty:hidden` collapses a grid left with only comment
  nodes. Row spans do not exist in this model: stack blocks in a nested grid instead.
- Boolean props are cast to `false` when absent. Blocks spread `...block` into the card, so each
  block destructures `card = true`, `menu = undefined`, `freshness = undefined` and forwards them;
  otherwise `card` arrives as `false` and `menu` / `freshness` can no longer inherit from the grid.
  `= undefined` compiles to a default, which is what stops the cast.
- The card owns the menu. Blocks pass `tabulate` (a function, read only when an action runs), and
  opt out with `expandable` / `viewAsTable`. The default slot renders a second time inside the
  expand dialog with `{ expanded: true }`: charts draw taller, lists lift `limit`.
- `select` is declared as an `onSelect` prop (not an emit) so blocks know whether anyone listens.
  Destructure it: left in `...block` it would reach the card root as a native `select` listener.
  Rows become selectable with a stretched button (`DASHBOARD_ROW_BUTTON`) over a `relative` row,
  so the list keeps its semantics; controls inside a row sit above it (`z-[1]`). The row box never
  moves: the hover / selected tint is a `::before` reaching 8px past both edges (`isolate` keeps it
  behind the content), so row dividers stay aligned with the card content. Do not bring back
  negative margins on rows. Table rows use `DASHBOARD_TABLE_ROW_BUTTON`, which stays inside the
  row because the table may scroll sideways.
- The card header is `[title + actions, wrapping] [menu]`: the menu keeps the top-right corner,
  wrapped actions align to the end, and a subtitle that does not fit goes under the title.
- XY selection maps the click position through the container's margins, padding, and x domain;
  it does not depend on hover, so taps work.
- `selected` / `highlight` / `labels` are resolved in `useDashboardChart`: the frame carries
  `emphasis` (per datum, `null` when none; a selection wins over a highlight), `selection`
  (indexes, drawn as an x band on line-only charts), and `valueLabels`. Bars fade outside the
  emphasis through their unovis color accessor (called with the datum and the series index);
  value labels are HTML spans placed with the same margins and domains as the container.
- A series' `compare` expands in `resolveDashboardSeries` into a `<key>:compare` series right
  after it (a faded bar, or a dashed line), so the legend, tooltip, table view, and CSV get it
  for free.
- Row actions (`block/dashboard-row-actions.vue`) render `inline` items as icon buttons and the
  rest in a `⋮` menu, above the stretched row button. Selected rows use `DASHBOARD_SELECTED_ROW`
  (same inset as a selectable row) and set `aria-pressed` on the row button.
- `menu` may be a function of `DashboardMenuContext` (title, table(), download(), expand()); the
  card tells it from an entries array with `Array.isArray`. `actions` (Nuxt UI button props plus
  `placement`) render in the header or as a footer row, in every phase.
- Narrow "value or callback" props by the value side (`isString`, `isNumber`, literal checks):
  `isFunction` does not narrow unions of values and callbacks usefully.
- `VisCrosshair` declares only `data` and forwards its other attributes to unovis as written:
  pass its config as a camelCase object (`v-bind`), never as kebab-case attributes.
- Relative times read one module-level clock (`use-dashboard-time.ts`): one interval while any
  consumer is mounted, refreshed on every setup so SSR and new blocks never show a stale time.
  `<time>` elements carry `data-allow-mismatch="text"`.
- `--nut-dash-*` defaults are declared under `:where(:root)`: module CSS loads after app CSS, so a
  plain `:root` default would override the app's tokens.
- unovis child components ignore their own `data` when the container provides one. The XY renderer
  passes `data` per component (never on `VisXYContainer`), so areas and point markers can use only
  the defined points of their series. `xDomain` / `yDomain` and tick values come from the frame.
- The XY renderer resolves each axis once per frame (`resolveDashboardXyLayer`), so accessors and
  filtered data keep their identity across renders. Bars always draw on the left axis; the right
  axis is a second container overlaid on the first and only draws lines and areas.
- `charts/renderer.ts` loading components receive the async component's props; they declare them
  (`inheritAttrs: false`) and only reserve the final box.

## Typing Rules Specific To This Domain

- Inference order matters: `params` → `queries` → `derive` → `views` (intra-expression inference).
- Inline `views: { … }` cannot infer per-view generics; views go through the `view(...)` builder.
- Guards that reference inferred generics in _parameter_ positions break inference. Key collision
  and default-value checks live in _return_ types (`DashboardKeyError`), except the root
  `DashboardScopeGuard`, which works because the root generics are not nested.
- `defaultValue` is its own unconstrained generic; checking it against `TQuery` inside the argument
  fixes `TQuery` too early when `defaultValue` precedes `query`.
- `p.*` builders infer the whole options object (`const TOptions extends <union of shapes>`) and
  derive the value from it (`ParamValue`), with a separate no-options signature. Overloads per
  shape (multiple / single / defaulted) broke getter options: a getter's result is contextually
  typed once, by the first overload tried, so `defaultValue: () => 2026` widened to `number`. The
  shape union is discriminated by `multiple`, which keeps `format` and getters typed.
- `DashboardSchemaLike` is a structural interface, not an instantiation (`keyof TViews` would make
  the variance check reject real schemas).
- Params inputs are `DashboardParamEntries<TParams>` (a homomorphic mapped type: each entry is the
  param or a factory returning it). Reverse-mapped inference types `p` in inline map factories
  and keeps `TParams` the resolved map; a naked `TParams | factory` union would leave `p` untyped.
  `DashboardParamOf` unwraps entries wherever values or handles are derived from stored inputs.
- `select` results are `NoInfer<TSelected>` in the stage return types: otherwise the contextual
  `DashboardSourceLike` of `queries` becomes a return-type inference candidate and `data` widens to
  `unknown`.
- The shared-param check of views maps (`DashboardSharedGuard`) sits in the parameter intersection
  of `defineDashboardSchema`, like the other root guards.
- Blocks are `<script setup generic="TData">` / `generic="TRow"` with
  `source: DashboardSourceLike<readonly TRow[] | undefined>`; ready data is `TData & ({} | null)`,
  which is what `!== undefined` narrowing produces, so no casts are needed.
- The only casts are `resolveDashboardRuntimeSchema` (schema → erased runtime), the facade return
  in `useDashboard`, and the two injection returns in `use-dashboard-context.ts`, all with `SAFETY:`
  comments.

## Tests

- `test/dashboard/schema-inference.test.ts` — params, defaults, `requires`, derive, views, guards.
- `test/dashboard/definitions-inference.test.ts` — standalone filters / groups / views, shared
  params on view handles, `select` data, `sync` typing, getter defaults and presets, shared-param
  guard, `useDashboardView`.
- `test/dom/dashboard/filters.test.ts` — handles (display, toggle order, `max`, reset), sync modes,
  headless, factories and the params context, data-driven items and defaults, remote definitions.
- `test/dom/dashboard/composition.test.ts` — `select` sharing one request, dependent `requires`
  states, merged view params, `filtered` / `resetFilters`, injection, shared-param runtime check.
- `test/dom/dashboard/controls.test.ts` + `fixtures/controls-*` — the bar, pills (single, multiple
  grid, remote), view tabs, slots, the button variant; `controls-host.vue` pins `only` typing.
- `test/table/remote-table-options.test.ts` — requests, page mapping, selected resolution, Vue Query
  options with `skipToken`, fit with dashboard, table, and form remote options.
- `test/dom/dashboard/engine.test.ts` — staging, views, URL keys, derive state, refresh, filter
  handles, auto-refresh (URL, schema default, `refetchInterval`), comparison params.
- `test/dom/dashboard/conditions.test.ts` — `enabled` on queries, views, and params, the tab strip
  of a single enabled view, blocks of disabled sources rendering nothing.
- `test/browser/dashboard/grid-layout.test.ts` (Chromium, Firefox, WebKit) — the grid measured in a
  real engine: span widths against the CSS-grid model, row breaks, proportional fill when blocks
  hide (and back), `fill: false`, short rows, responsive columns and spans, full-row fallbacks, no
  rounding wrap across a sweep of widths, gaps and panel rules between cells and rows, equal row
  heights, wide content, collapse of emptied and nested grids, and a query condition end to end.
  `layout.ts` holds the helpers (`testSource` drives a block's state; `spanWidth` / `filledWidths`
  give the expected widths).
- `test/dashboard/charts.test.ts` — axis bounds and ticks, colors, series axes, per-locale
  formatters, class layering, XY layer resolution.
- `test/dashboard/data.test.ts` — CSV per locale, chart tables, relative times and day headings,
  oldest `updatedAt`, sparkline paths and mini bars, comparison ranges.
- `test/dom/dashboard/blocks.test.ts` + `fixtures/` — phases, retry, lists, widget slots, charts,
  card vs panel chrome (the `card` boolean-casting regression), toolbar and footer ghost, card
  menu (table view, CSV, expand), grid menu inheritance, `select`, alerts, feed, table sorting,
  stat variants, actions and function menus, row actions and selection, chart emphasis and
  labels, stat groups, gauges, tabs, stat `compare`, the refresh control;
  `fixtures/template-inference.vue` pins template typing with `@vue-expect-error`.
  The DOM harness runs in French (`fr` locale).
- unovis is aliased to `test/dom/stubs/unovis-*.ts` in `vitest.config.ts`.

## Playground

`playground-table/app/pages/dashboard.vue` is the acceptance page: both identity4 tabs in the
Atelier theme, plus an "Opérations" tab showing every operational block and card feature (stat
trends / goals / status, alerts, feed, sortable table with its sort in widget params, chart
drill-down into a view param, grid-level `menu` and `freshness`, `dashboard.updatedAt` in the
header, comparison period, auto-refresh control, split pane with a stat group, gauge, labeled
chart, segment tabs, row actions, selection mirrored between the table and a ring list). Schema in
`app/dashboards/analytics.ts`, mock data in `app/data/dashboard.ts`, header
controls in `app/components/dash-*.vue`, theme in `app.config.ts` and `app/assets/main.css` (use
its tokens, not hex colors, so dark mode follows). The playground is pinned to French
(`detectBrowserLanguage: false`). The unovis entries are listed in its `vite.optimizeDeps.include`.

`playground/app/pages/dashboard/analytics.vue` is the engine demo (English, default theme);
`sales.vue` is the single-view example; `operations.vue` shows the operational blocks and every
card feature (split pane, stat group, gauge, tabs, row actions, selection, comparison,
auto-refresh) on the stock theme with inline mocks. Mock data for the first two lives in `playground/app/lib/demo-dashboard-api.ts`.
Check theme changes there: the default playground pins primary to black / white, which is where
palette collisions show.

## Default Palette

`tokens.css` maps the six slots to primary, neutral-400/500, secondary, a primary tint, warning,
and a secondary tint. Success and info are left out because stock Nuxt UI gives them the same hue
as primary (green) and secondary (blue). Tints use relative color syntax (`oklch(from …)`) with a
fixed lightness, so they differ from their base even when primary is monochrome. A `color-mix`
fallback covers browsers without relative colors. Nuxt UI has no `--ui-neutral`, so
`resolveDashboardColor('neutral')` returns `var(--ui-text-muted)`.

## Keep In Sync

`src/imports.ts`, `src/components.ts`, `publicRuntimeDomains` in `src/module.ts`, the package.json
`imports` / `exports` / `typesVersions` triple, `UiToolsDashboardMessages` in both locales
(`dashboard.filters.*`, `dashboard.format.*`), the `--nut-dash-*` tokens in
`shared/styles/tokens.css` (including `--nut-dash-filter-*` and `--nut-dash-row-hover`), and
`skills/consumer/dashboard/` (SKILL.md, schema, params, filters, blocks).
