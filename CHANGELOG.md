# Changelog

## v1.0.0

[compare changes](https://github.com/ChronicStone/nuxt-ui-tools/compare/v0.1.3...v1.0.0)

Version 1.0.0 promotes the form and table engines from their initial public runtime to the stable package contract. It consolidates more than 200 commits across the runtime, public types, tests, consumer skills, and two integration playgrounds.

### Migration notes

- **Runtime baseline:** Raise the supported stack to Nuxt `>=4.5.2`, Nuxt UI `>=4.10.0`, Vue `>=3.5.41`, Vue Router `>=4.6.4`, TanStack Vue Query `>=5.101.4`, Tailwind CSS `>=4.3.3`, and TypeScript `>=5.9.0`.
- **Form schemas:** Move Nuxt UI control-specific options into each field's `props` object. Field behavior, layout, validation, option loading, and presentation remain schema-owned through their dedicated contracts.
- **Form controller:** Replace the ref-driven `useFormSubmit(...)` helper with `useForm(...)`, which now owns typed submission state, handlers, validation, navigation, and rendered runtime binding through one controller.
- **Table schemas:** Adopt the rebuilt data-list, column, filter, action, selection, summary, layout, and locale contracts. Define sources inline with `source: tableSource({ ... })` so query results drive row inference without manual source annotations; consumers using low-level runtime internals should migrate to the public schema builders, `useTable(...)`, composed DataList components, and exposed table API.
- **Components:** Keep the public Nuxt component names stable while normalizing internal component files to kebab-case and expanding the composed DataList component family.
- **Publishing:** Add the `query-prefetch` package entrypoint and auto-imports. The spreadsheet engine remains internal and is not part of the public 1.0.0 surface.

### 🚀 Enhancements

#### Form engine

- Add Regle-backed validation with field-level `required` flags, native and async validators, pending state, blocking custom errors, submit integration, and validation triggers that respect interactive overlays.
- Add field-scoped form APIs, awaited reset with tracked effects, dependency synchronization that ignores unchanged values, and state/output inference across nested, repeated, and variant fields.
- Rebuild remote option ownership around Query options with search, pagination, selected-value hydration, previous-data retention, explicit loading/error states, dedicated creation flows, and viewport-driven prefetching.
- Add lazy remote hierarchy roots and children, scroll-driven pagination, selection controls, selected-path hydration, and stable option ordering while editors are open.
- Rebuild the date family on Nuxt UI calendar and time primitives: date, range, month, month range, year, datetime, datetime range, manual entry, masks, presets, default times, and min/max validation.
- Expand repeated fields with `array-collapse`, `array-primitive`, list, tabs, steps, variants, and table presentations; configurable actions; drag/reorder; append-and-activate; invalid-item reveal; sticky table actions; click-to-edit primitive previews; and stable active panes.
- Add the tabs and section container kinds, schema eyebrow/description/header controls, left-label layouts, field widths, tooltip/modal descriptions, and consistent full-row ownership for structural fields.
- Expand input contracts with text masks and case tokens, prefixes/suffixes, number formatting, textarea sizing/counts, radio variants, option icons, select limits, info options, and password/phone refinements.
- Rebuild file and upload controls with dropzones, replaceable single-file rows, custom rows, previews, downloads, deletion, progress, and overlay-safe focus behavior.
- Add modal size presets, shared control sizing, scroll shadows, overlay veils, inset scrollbars, and consistent Nuxt UI `props` passthrough for every field kind.

#### Table engine

- Rebuild the DataList schema, locale, runtime state, root configuration merge, TanStack adapter, and public API inference around composable table, grid, and mobile surfaces.
- Add the inline `tableSource(...)` inference boundary so client and remote query results propagate through columns, filters, actions, and page context without separately typed source constants.
- Add first-class local, remote offset, and cursor/infinite data modes with exact counts, embedded facets, previous-data retention, initial skeleton rows, non-destructive refresh/loading states, and contained virtualization.
- Add schema-owned row, toolbar, and bulk actions; selection scopes; public action state/execution APIs; dropdown/toolbar renderers; and a floating selection action bar.
- Add summaries, virtualized table and grid renderers, stable row heights, sticky headers, contained horizontal scrolling, and row/card motion during sort and filter transitions.
- Add route-aware `prefetchTable(...)` coverage for layout, pagination, sorting, search, filters, facets, option queries, runtime context, and page-context data.
- Rebuild filter tags, triggers, pickers, match modes, live/staged panels, the slideover flow, facet counts, result counts, and text/number/date editors, including mobile filter sheets.
- Rebuild sort, column, layout, and row-action controls with mobile sheets, shared sort panels, persistent open-state behavior, accessible titles, and responsive layouts.
- Persist column order, visibility, pinning, and widths in a cookie, while retaining schema defaults and keeping pin/resize/header geometry aligned with body cells.
- Introduce XS/SM/MD/LG/XL sizing across search, tags, panels, menus, headers, rows, grids, pagination, and composed controls.

#### Query prefetch, module, and playgrounds

- Add route-aware query prefetch plans, staged dependencies, automatic NuxtLink integration, `prefetchPage(...)`, and a public `query-prefetch` runtime entrypoint.
- Fix Nuxt app imports and runtime Tailwind source registration for current Nuxt UI CSS generation.
- Replace the original playground switcher with hierarchical navigation and focused form, validation, settings, table data-mode, filter, action, and composition routes.
- Add a second Atelier-style table/form playground with accounts and audit scenarios, responsive/mobile acceptance surfaces, and reference captures.
- Back remote table demos with Drizzle ORM, SQLite, and `drizzle-resource`, including offset and cursor/infinite examples.
- Tighten the internal spreadsheet schema, row parsing, validation, reference resolution, import orchestration, review, and preview contracts without publishing the spreadsheet entrypoint.

### 🩹 Fixes

- **form:** Stabilize focus and overlay ownership so popovers, drawers, modals, and provider overlays no longer trigger premature validation or lose focus unexpectedly.
- **form:** Fix remote option load-more ownership so menus fetch from their scroll viewport, preserve open-session option order, and do not let stale or unchanged dependency values restart work.
- **form:** Fix password visibility configuration typing, text-mask enforcement, date bounds, grouped/array child rendering, and nested layout ownership.
- **form:** Fix single-file dropzones so replacement stays inside the field row instead of overlaying the page.
- **table:** Keep existing rows visible during page/filter/sort/search changes and use Nuxt UI's built-in loading indicator instead of replacing populated tables with skeletons.
- **table:** Fill initial table loading space with the correct number of skeleton rows and use a non-destructive bottom loader for infinite mode.
- **table:** Fix sticky headers by making the DataList viewport the scroll owner, stabilize row heights during horizontal scrolling, and keep virtualized table/grid content contained.
- **table:** Correct `isNot` client filtering, option-count visibility, selection pressed state, filter-tag leave layout, sort-menu interaction, page-size width, and mobile sheet height.
- **table:** Honor schema-owned responsive header controls and pagination visibility flags across the default composed DataList surface.
- **table:** Hydrate cursor-prefetched data under the infinite-query cache key and shape consumed by the runtime, including page-context rows.
- **table:** Align sortable headers with cell content while retaining padded hover affordances, and keep column order and pinned option placement stable during interaction.
- **module:** Fix runtime Tailwind source injection against current Nuxt UI CSS generation.
- **module:** Restore public component registration after normalizing source filenames to kebab-case.
- **query-prefetch:** Import the Nuxt plugin helper from the correct application boundary.
- **tests:** Keep pure runtime utilities isolated from Nuxt app-only imports so the test projects run cleanly under Nuxt 4.5+.
- **tests:** Typecheck both integration playgrounds in local and CI release gates.

### 🧰 Developer experience

- Strengthen query-state inference, typed locale contracts, shared runtime predicates, form/table/spreadsheet boundaries, and public API inference to reduce widening and unsafe casts.
- Add a DOM Vitest project, Nuxt UI stubs, and dedicated table/form harnesses covering runtime internals, renderers, summaries, filters, selection, layouts, submission, dependencies, arrays, and overlays.
- Adopt the Ultracite Oxlint preset and repository-specific type-safety rules, then normalize component/test naming and canonical formatting.
- Expand consumer skills for form validation/options, table actions/selection/filters/data modes, and query prefetching; add internal playground routing guidance.

### ❤️ Contributors

- THAO-Cyprien

## v0.1.3

[compare changes](https://github.com/ChronicStone/nuxt-ui-tools/compare/v0.1.2...v0.1.3)

### 🩹 Fixes

- **table:** Treat filter defaults as baseline ([f1f518b](https://github.com/ChronicStone/nuxt-ui-tools/commit/f1f518b))

### ❤️ Contributors

- THAO-Cyprien

## v0.1.2

[compare changes](https://github.com/ChronicStone/nuxt-ui-tools/compare/v0.1.1...v0.1.2)

### 🩹 Fixes

- **table:** Keep renderer states exclusive ([0ae58a5](https://github.com/ChronicStone/nuxt-ui-tools/commit/0ae58a5))

### ❤️ Contributors

- THAO-Cyprien

## v0.1.1

[compare changes](https://github.com/ChronicStone/nuxt-ui-tools/compare/v0.1.0...v0.1.1)

### 🚀 Enhancements

- **table:** Expose composable data list styling ([eb08d53](https://github.com/ChronicStone/nuxt-ui-tools/commit/eb08d53))
- **table:** Polish data list filters and runtime integration ([4674867](https://github.com/ChronicStone/nuxt-ui-tools/commit/4674867))

### 🩹 Fixes

- **form:** Polish field behavior and semantics ([c49ca2d](https://github.com/ChronicStone/nuxt-ui-tools/commit/c49ca2d))

### ❤️ Contributors

- THAO-Cyprien

## v0.1.0

This is the first public release of `nuxt-ui-tools`.

### Features

- Add a schema-driven table runtime with local and remote data, typed query state, filters, facets, selection, pagination, grid rendering, and row actions.
- Add a schema-driven form runtime with typed state and output inference, validation, layouts, provider overlays, actions, dynamic options, repeatable fields, hierarchy selection, matrix inputs, and polished Nuxt UI field components.
- Add typed runtime translations, responsive breakpoint helpers, typed URL state, curated Nuxt auto-imports and components, consumer skills, and an integration playground.
- Publish explicit `form`, `i18n`, `query-state`, `shared`, and `table` runtime entrypoints while keeping the spreadsheet import engine internal.

### Fixes

- Keep pure table utilities isolated from Nuxt runtime entrypoints so the full test suite can run without loading application-only modules.
