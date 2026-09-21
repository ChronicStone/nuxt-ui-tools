# Dashboard Runtime

`src/runtime/dashboard/` — typed URL params, staged queries, derived resources, views, and a
generic block library. Public entrypoints: `defineDashboardSchema`, `useDashboard`, and the
`Dashboard*` components registered in `src/components.ts`.

## Layout

```
types/        params, options, resource, schema (+ inferred DashboardApi), blocks, charts, ui;
              runtime.ts (erased shapes) is internal and not re-exported from types/index.ts
schema/       defineDashboardSchema (identity + compile-time key guards)
utils/        builders/dashboard-params.ts (the `p` builder; DashboardParamBuilder = typeof it)
              params/codecs.ts, schema.ts (erase generics once), resource.ts (slot-backed facade),
              tracker.ts (derive read tracking), state.ts (state combine, refresh, URL prefixes),
              options.ts, charts.ts (palette, series, nice max / tick count, axis, per-locale
              formatters), chart-frame.ts (tooltip HTML), ui.ts (resolveDashboardClasses, app
              config reader), visibility.ts (one shared IntersectionObserver)
composables/  use-dashboard (entry) → use-dashboard-scope (root + one per view)
              → use-dashboard-param-scope (one useQueryStates per scope) → use-dashboard-options
              / use-dashboard-remote-options; use-dashboard-resource (one useQuery);
              use-dashboard-derived; use-dashboard-views; use-dashboard-api (facade only);
              use-dashboard-block, use-dashboard-chart, use-dashboard-format,
              use-dashboard-ui (app config + panels grid context) (blocks)
components/   dashboard-card.vue (shell: chrome + phases), blocks, block/ (state, skeleton),
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
  loading); deferred → `activate()`.
- `useDashboardParamScope` owns one `useQueryStates` per scope (root: no prefix, view `<view>`, widget
  `<scope>.<query>`), a get/set values facade, and option handles. No params → nothing allocated.
- `useDashboardDerived` is one computed that evaluates and records reads through the shared tracker;
  state = combined state of the recorded sources.
- `useDashboardViews` owns the `view` query state (push history) and a warm `opened` latch per view,
  and rejects a root param whose URL key would shadow `view`. URL keys are always readable names
  (`year`, `view`, `consumption.currency`); `urlPrefix` namespaces them. Do not abbreviate.
- `useDashboardApi` is a facade: plain objects with getters over owned refs, `markRaw`, no refs
  exposed. It must not own behaviour.

## Blocks And Rendering

- Every block renders `DashboardCard`, which owns chrome, phases, skeleton, empty/error, toolbar,
  footer ghost, and the refresh bar. Blocks only compute their rows, pass a `#skeleton` shaped like
  themselves (`block/dashboard-skeleton.vue`, one `kind` per family, seeded geometry), and forward
  `#header-right`, `#toolbar`, and `#footer`.
- Deferred activation goes through `utils/visibility.ts` (one observer, one-shot callbacks). Blocks
  only register when their source can wait for activation: a `deferred` query, or a derived value.
- The shimmer is one `::after` overlay per skeleton animated with `transform`; never animate
  `background-position` on individual ghosts (it repaints every shape every frame).
- Formatters come from `resolveDashboardFormats(locale)`, cached per locale; do not build
  `Intl.NumberFormat` instances inside blocks.
- Class resolution: `resolveDashboardClasses(defaults, appUi.<section>, props.ui)` (tailwind-merge,
  later wins). Block `ui` props are `DashboardBlockUi & <Block>Ui`; part names must not collide with
  the card's (`root`, `header`, `title`, `subtitle`, `actions`, `body`, `footer`). The card root is
  merged separately so panel cells can drop border/radius after the app's `card.root`.
- `DashboardGrid variant="panels"` provides a context (`provideDashboardGrid`); cards read it with
  `useDashboardGridContext` and switch to panel chrome.
- Boolean props are cast to `false` when absent. Blocks spread `...block` into the card, so each
  block destructures `card = true` and forwards `:card`; otherwise `card` arrives as `false`.
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
- `DashboardSchemaLike` is a structural interface, not an instantiation (`keyof TViews` would make
  the variance check reject real schemas).
- Blocks are `<script setup generic="TData">` / `generic="TRow"` with
  `source: DashboardSourceLike<readonly TRow[] | undefined>`; ready data is `TData & ({} | null)`,
  which is what `!== undefined` narrowing produces, so no casts are needed.
- The only casts are `resolveDashboardRuntimeSchema` (schema → erased runtime) and the facade
  return in `useDashboard`, both with `SAFETY:` comments.

## Tests

- `test/dashboard/schema-inference.test.ts` — params, defaults, `requires`, derive, views, guards.
- `test/dom/dashboard/engine.test.ts` — staging, views, URL keys, derive state, refresh, options.
- `test/dashboard/charts.test.ts` — axis bounds and ticks, colors, series axes, per-locale
  formatters, class layering, XY layer resolution.
- `test/dom/dashboard/blocks.test.ts` + `fixtures/` — phases, retry, lists, widget slots, charts,
  card vs panel chrome (the `card` boolean-casting regression), toolbar and footer ghost;
  `fixtures/template-inference.vue` pins template typing with `@vue-expect-error`.
- unovis is aliased to `test/dom/stubs/unovis-*.ts` in `vitest.config.ts`.

## Playground

`playground-table/app/pages/dashboard.vue` is the acceptance page: both identity4 tabs in the
Atelier theme (schema in `app/dashboards/analytics.ts`, artifact data and formulas in
`app/data/dashboard.ts`, header controls in `app/components/dash-*.vue`, theme in `app.config.ts`
and `app/assets/main.css`). The unovis entries are listed in its `vite.optimizeDeps.include`.

`playground/app/pages/dashboard/analytics.vue` is the engine demo (English, default theme);
`sales.vue` is the single-view example; mock data lives in `playground/app/lib/demo-dashboard-api.ts`.

## Keep In Sync

`src/imports.ts`, `src/components.ts`, `publicRuntimeDomains` in `src/module.ts`, the package.json
`imports` / `exports` / `typesVersions` triple, `UiToolsDashboardMessages` in both locales, the
`--nut-dash-*` tokens in `shared/styles/tokens.css`, and `skills/consumer/dashboard/`.
