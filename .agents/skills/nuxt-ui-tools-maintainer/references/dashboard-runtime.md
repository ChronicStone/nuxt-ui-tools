# Dashboard Runtime

`src/runtime/dashboard/` — schemas and views built by consumer functions that take their context as
params, filters declared inline (URL, memory, or store-synced) with their controls, staged queries,
derived resources, views, and a generic block library. Public entrypoints:
`defineDashboardSchema`, `defineDashboardView`, `useDashboard`, `useDashboardView`,
`injectDashboard`, `useDashboardFormat`, and the `Dashboard*` components registered in
`src/components.ts`. `defineRemoteOptions` lives in shared runtime and maps arbitrary endpoint
query definitions into one reusable option loader. `remoteTableOptions` remains the table-protocol
builder for that same loader contract; it infers rows through `TableSourceQueryResult` /
`TableSourceRow` (`table/types/source.ts`). Generated clients (Tuyau `queryOptions()`) may type
`queryFn` as `MaybeRefDeep<QueryFunction | skipToken>`, so the shared query mapper checks that the
runtime value is callable. The table builder also checks that responses contain `rows`. A reusable
loader supplies a query-key function based on its endpoint's first-page request, so dashboard
option caches follow changes in search and external scope.

Vocabulary: **filters** are the state the user controls, read as values
(`dashboard.filters.year`); **controls** drive them (`dashboard.controls.year`: label, items,
toggle, reset, menu bindings); **params** are the arguments of the consumer's schema and view
functions (what the dashboard is about). The engine never syncs context into filters.

## Layout

```
types/        filters (filter kinds, options, sync, definitions, the `f` builder type), controls
              (filter controls, bar target), resource, schema (+ inferred DashboardApi,
              InferDashboard, InferDashboardView, schema / view inputs that may be functions),
              blocks (formats), charts, ui, page;
              runtime.ts (erased shapes, the option-list contract) is internal and not re-exported
schema/       defineDashboardSchema, defineDashboardView (identities + compile-time key guards;
              results are `NoInfer` so inline views do not infer the contextual map)
utils/        builders/dashboard-filters.ts (the `f` builder; definitions carry a `value` getter
              bound to their state), codecs.ts, environment.ts (what a dashboard captures in setup:
              the locale; the per-build URL-key registry), schema.ts (erase generics once, run
              `filters` callbacks), resource.ts (slot-backed facade), tracker.ts (read tracking
              for derive and requires), state.ts (state combine, conditions, refresh, URL
              prefixes), options.ts, filters.ts (listed kinds, pill classes, headless rule, value
              text), format.ts (per-locale presets and Intl caches, month names), remote.ts
              (settles a remote result: promise or query definition), charts.ts (palette, series,
              nice max / tick count, axis), chart-frame.ts (tooltip HTML, chart → data table),
              ui.ts (resolveDashboardClasses, app config reader, table and selectable-row
              classes), visibility.ts (one shared IntersectionObserver), export.ts (data cells,
              CSV, file download), time.ts (relative time, day headings), sparkline.ts (stat trend
              paths and mini bars), comparison.ts (resolveDashboardComparisonRange, exported)
composables/  use-dashboard (entry: a schema, or a getter rebuilt on change; provides the
              dashboard) → use-dashboard-scope (root + one per view) → use-dashboard-filter-scope
              (storage per sync mode, values facade, URL-key registry) → use-dashboard-filter-control
              (one control) → use-dashboard-options (static list, or use-dashboard-remote-options);
              use-dashboard-resource (one useQuery); use-dashboard-derived; use-dashboard-views;
              use-dashboard-api (facade only); use-dashboard-context (dashboards provided by
              ancestors, the view a page slot renders);
              use-dashboard-block, use-dashboard-chart, use-dashboard-series-picker (series from a
              control + its chips), use-dashboard-format (public formatters + `resolve`),
              use-dashboard-time (one shared clock), use-dashboard-ui (app config + grid context)
              (blocks)
components/   dashboard-page.vue (the page: header, date line, actions + refresh, the pinned
              band of tabs and filters with its stuck marker, the current view's slot wrapped in
              block/dashboard-view-scope.vue), dashboard-card.vue (block shell: chrome, phases,
              menu, actions with the header link default, drill-down filter chips, table view,
              expand dialog, freshness), blocks,
              controls: dashboard-filters.vue (bar), dashboard-filter.vue (pill / button) +
              filter/dashboard-filter-menu.vue (list), dashboard-view-tabs.vue,
              dashboard-tabs.vue, dashboard-refresh.vue,
              block/ (state, skeleton, data-table, ring, row-actions, chips, series-picker,
              view-scope),
              charts/renderer.ts (the only seam allowed to import unovis) + charts/unovis/*
              (xy-layers.ts resolves one axis into unovis inputs; dashboard-xy-marks.vue draws
              an axis' areas, lines, markers, and references)
```

## Ownership

- `useDashboard` accepts a schema or a getter. A schema builds once in the component's setup. A
  getter is read through a `computed` (first run in setup, so composables at the top of the
  consumer's functions work), and every later change rebuilds the whole dashboard inside a fresh
  detached `effectScope`, run with `app.runWithContext` so `inject()` (router, query client) keeps
  working; the previous scope stops after the next one runs, so shared cache entries never drop.
  The returned object and each view handle are stable proxies (`createStableFacade`) over the
  current build; reads track the current build, so templates follow a rebuild. The locale is read
  once in setup and handed to every control through `DashboardEnvironment`: `useUiToolsLocale()`
  outside a component falls back to English.
- `useDashboardScope` owns declaration: it calls `queries(ctx)` once, synchronously. Stage
  `.query()` returns a facade immediately (keys are unknown until the builder returns), then the scope
  instantiates each resource in returned-object order and assigns the facade's `slot`. Facade reads
  before instantiation track the slot shallowRef, so dependent `requires` gates stay reactive.
- `useDashboardResource` owns exactly one `useQuery`, the deferred `activated` latch, and the query's
  own filters. Gating rewrites `enabled` on a stable definition; a gated resource never evaluates its
  factory. Stage gates: essential → scope active; background → scope `settled` (no essential
  loading); deferred → `activate()`. `requires` runs through the tracker (resource and derived
  facades record their `data` reads): while it is nullish the resource follows the sources it
  read (loading / error / idle), then `ready` on its `defaultValue` (`idle` without one); `refresh`
  refetches those sources. `select` runs in the resource's `data` computed, on top of the
  definition's own TanStack `select`, so what it reads (a filter, another resource) is tracked and
  re-selects without a refetch; resources on one factory share the TanStack cache entry.
- `useDashboardFilterScope` owns where values live: one `useQueryStates` for the URL-synced filters
  of a scope (root and views: no prefix, so a key is one state across scopes; query filters
  `<query>.<filter>`), a `shallowRef` per memory filter, and the external ref or getter of
  store-synced ones (a getter is read-only, so its filter is headless). It registers every URL key
  in the build's registry, which throws when two scopes declare one key differently (kind, single
  or multiple, default). It builds the get/set values facade, binds each definition's `value` to
  its getter, creates one control per filter, and owns `changed()` / `reset()` over its
  non-headless controls. No filters → nothing allocated. Defaults go through
  `definition.resolveDefault()`: a getter default is read while the value is unset, and writing a
  value equal to the current default stores it unset, so it stays out of the URL and keeps
  following the getter.
- `useDashboardFilterControl` builds one control: label / placeholder / display text, `changed`
  (codec serialization compared with the default's), `toggle` (multiple values kept in item order,
  capped by `max`), `reset`, and the option list from `useDashboardOptions`. Static and remote lists
  return the same `DashboardRuntimeOptionList` shape; fixed items are normalized to getters by the
  builders, so the list reads data-driven items (`f.options(() => …)`) the same way.
- `use-dashboard-context.ts` provides the ancestors' dashboards (source, current schema, stable api,
  view lookup) and, under `UiDashboardPage`, the view whose slot renders the component
  (`provideDashboardView`, from `block/dashboard-view-scope.vue`). `useDashboardView(viewFunction)`
  resolves to that view, else the view on screen; a view object resolves by identity.
  `injectDashboard(schemaFunction)` returns the nearest dashboard; a schema object resolves by
  identity.
- `useDashboardDerived` is one computed that evaluates and records reads through the shared tracker;
  state = combined state of the recorded sources.
- Conditions: `enabled` is always a lazy callback (`resolveDashboardCondition`) on queries, filters,
  and views. A resource is `available` when its scope and its own condition hold; otherwise its
  state is `disabled`, its data the default, and `refresh` a no-op. `combineDashboardStates` leaves
  `disabled` out and is `disabled` only when every input is, so derived values, dependents, and
  scope states never wait on a disabled source. A disabled filter's getter returns the resolved
  default and its setter does nothing; controls expose `enabled`, and `changed` / `reset` and the
  filter bar skip disabled controls.
- `useDashboardViews` owns the `view` query state (push history) and a warm `opened` latch per view,
  and rejects a filter whose URL key would shadow `view`. Each view's `enabled` is a computed over
  its callback; `current` is a computed over the stored key that resolves a disabled view to the
  default (else first enabled) view and ignores writes of disabled ones, and a disabled view's scope
  is inactive with `enabled` false, so its resources report `disabled`. URL keys are always readable
  names (`year`, `view`, `productLines.tracked`); `urlPrefix` namespaces them. Do not abbreviate.
- `useDashboardApi` is a facade: plain objects with getters over owned refs, `markRaw`, no refs
  exposed. It must not own behaviour. The dashboard's `filtered` / `resetFilters()` cover the root
  and the current view; a view handle's cover its own filters.
- The auto-refresh interval is one `useQueryState` per build (URL key `refresh`, seconds, default
  `schema.autoRefresh`), turned into a `refetchInterval` computed (ms, `0` off) that every scope
  hands to its resources. Resources put it before the query's own options, so a query's
  `refetchInterval` wins. A filter using the URL key `refresh` throws, like `view`.
- `f.comparison()` is an option filter of kind `comparison` (values `previous | year | none`).
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
  `createReusableTemplate` by either trigger. `UiDashboardFilters` reads the target's controls, then
  the current view's (`dashboard[dashboard.view.current].controls`), keeping the first control of a
  key, and renders filters of listed kinds always, free ones only while `changed`. Remote pages load ahead of the scroll (three list
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

- Inference order matters: `filters` → `queries` → `derive` (intra-expression inference).
- `defineDashboardSchema` and `defineDashboardView` return `NoInfer<…>` generics: a view declared
  inline in `views: { … }` would otherwise take the contextual `DashboardViewMap` as a return-type
  inference candidate, and a view without queries would infer the open map instead of an empty one.
- A filter reading another filter goes through the definition's `value` (bound at runtime), not
  through a context argument of the `filters` callback: that argument would be typed by the map the
  same callback returns, which TypeScript cannot infer.
- Guards that reference inferred generics in _parameter_ positions break inference. Key collision
  and default-value checks live in _return_ types (`DashboardKeyError`), except the root
  `DashboardScopeGuard`, which works because the root generics are not nested.
- `defaultValue` is its own unconstrained generic; checking it against `TQuery` inside the argument
  fixes `TQuery` too early when `defaultValue` precedes `query`.
- `f.*` builders infer the whole options object (`const TOptions extends <union of shapes>`) and
  derive the value from it (`FilterValue`), with a separate no-options signature. Overloads per
  shape (multiple / single / defaulted) broke getter options: a getter's result is contextually
  typed once, by the first overload tried, so `defaultValue: () => 2026` widened to `number`. The
  shape union is discriminated by `multiple`, which keeps `format` and getters typed.
- `DashboardSchemaLike` is a structural interface, not an instantiation (`keyof TViews` would make
  the variance check reject real schemas).
- `select` results are `NoInfer<TSelected>` in the stage return types: otherwise the contextual
  `DashboardSourceLike` of `queries` becomes a return-type inference candidate and `data` widens to
  `unknown`.
- Blocks are `<script setup generic="TData">` / `generic="TRow"` with
  `source: DashboardSourceLike<readonly TRow[] | undefined>`; ready data is `TData & ({} | null)`,
  which is what `!== undefined` narrowing produces, so no casts are needed.
- `DashboardSchemaInput` / `DashboardViewInput` accept an object or a function returning one;
  `DashboardSchemaOf` / `DashboardViewOf` unwrap them, so `InferDashboard<typeof accountSchema>`
  and `useDashboardView(consumptionView)` type from the function's return.
- The only casts are `resolveDashboardRuntimeSchema` (schema → erased runtime) and the two injection
  returns in `use-dashboard-context.ts`, all with `SAFETY:` comments.

## Tests

- `test/dashboard/schema-inference.test.ts` — filters of the root, views and queries, defaults,
  `requires`, derive, views, controls, guards.
- `test/dashboard/definitions-inference.test.ts` — schema and view functions, `InferDashboard` /
  `InferDashboardView` from functions, `useDashboard` / `injectDashboard` / `useDashboardView`
  return types, lazy-only conditions, a filter reading another's `value`, `select` data, `sync`
  typing, getter defaults and presets.
- `test/dom/dashboard/functions.test.ts` — a getter rebuilding on change behind stable objects,
  filters kept across rebuilds, the previous build stopped, the locale kept, descendants' handles
  following rebuilds under `UiDashboardPage`.
- `test/dom/dashboard/filters.test.ts` — controls (display, toggle order, `max`, reset), sync modes,
  headless, a filter reading another's `value`, data-driven items and defaults, remote definitions.
- `test/dom/dashboard/composition.test.ts` — `select` sharing one request, dependent `requires`
  states, a key shared across views, `filtered` / `resetFilters`, injection of view functions and
  view objects.
- `test/dom/dashboard/controls.test.ts` + `fixtures/controls-*` — the bar, pills (single, multiple
  grid, remote), view tabs, a filter kept across tabs, slots, the button variant;
  `controls-host.vue` pins `only` typing.
- `test/table/remote-table-options.test.ts` — requests, page mapping, selected resolution, Vue Query
  options with `skipToken`, fit with dashboard, table, and form remote options.
- `test/table/remote-option-loaders.test.ts` — generic endpoint mapping, selected labels, query
  identity, and structural fit with dashboard and table filters.
- `test/dom/dashboard/engine.test.ts` — staging, views, URL keys (one per filter key, reserved
  keys, conflicting declarations), derive state, refresh, controls, auto-refresh (URL, schema
  default, `refetchInterval`), comparison filters.
- `test/dom/dashboard/conditions.test.ts` — `enabled` on queries, views, and filters, the tab strip
  of a single enabled view, blocks of disabled sources rendering nothing.
- `test/dom/dashboard/page.test.ts` — the page: header, date line, actions, refresh, tabs only for
  two views or more, the filter bar, the current view's slot and the default slot, opt-outs, view
  functions resolved from their slot.
- `test/dom/dashboard/block-controls.test.ts` — chart series picked by a filter (chips in series
  colors, picker buttons, removal, empty state), drill-down filter chips, header link defaults, and
  list row links.
- `test/browser/dashboard/page-layout.test.ts` (three engines) — the page scrolls on its own, pins
  the band, and flips `data-stuck` both ways.
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
trends / goals / status, alerts, feed, sortable table with its sort in query filters, chart
drill-down into a view filter, grid-level `menu` and `freshness`, `dashboard.updatedAt` in the
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
`skills/consumer/dashboard/` (SKILL.md, schema, filters, controls, blocks).
