# Changelog

## Unreleased

### 🚀 Enhancements

- **query-prefetch:** Add route-aware query prefetch plans and automatic NuxtLink prefetch integration, with staged dependencies and a table-aware `prefetchTable(...)` helper.
- **form:** Add Regle-backed validation with async rules, pending state, submit integration, and less eager validation triggers for interactive controls.
- **form:** Rebuild date and time inputs around Nuxt UI calendar/time primitives, including date ranges, month/month ranges, year, datetime/datetime ranges, manual input, bounds, masking, presets, and consistent popover behavior.
- **form:** Expand repeatable array fields with configurable actions, append-and-activate behavior, drag/reorder support, custom actions, variant switching, and directional transitions for tabs/steps.
- **form:** Improve async option loading and creation flows across select/autocomplete controls, including loading/error states, search-and-create and dedicated-create patterns.
- **form:** Refine grouped, matrix, password, phone, upload/file, checkbox/radio/card, slider/rating, and other field controls for more consistent sizing and composition.
- **table:** Add schema-owned toolbar/bulk actions and composed selection controls with public action state and execution APIs.
- **table:** Add first-class remote offset and cursor/infinite result handling, embedded facets, exact counts, and previous-data retention during query changes.
- **table:** Add route-aware table prefetching for layout, pagination, sorting, search, filters, facets, option queries, context, and page-context data.
- **table:** Introduce universal XS/SM/MD/LG/XL control sizing across searches, filter tags, panels, table headers, row controls, grids, pagination, and composition surfaces.
- **table:** Refine filter presentation with staged/live panels, concise match-mode controls, improved option/tree pickers, facet counts, dynamic tags, and more polished date/number/text editors.
- **table:** Improve column header composition, resize/pin interactions, hover geometry, alignment, and public schema/API inference.
- **playground:** Replace the flat playground switcher with a shared hierarchical navigation shell and focused routes for form fields, validation, settings, table data modes, and distinct table compositions.
- **playground:** Add Drizzle ORM + SQLite + `drizzle-resource` remote table demos, including paged and cursor/infinite examples.
- **spreadsheet:** Tighten schema, row, validation, reference-resolution, and import runtime contracts while polishing review and preview surfaces.

### 🩹 Fixes

- **form:** Stabilize focus and overlay ownership so popovers, drawers, modals, and provider overlays no longer trigger premature validation or lose focus unexpectedly.
- **form:** Fix password visibility configuration typing and preserve custom labels/icons through the public field contract.
- **form:** Fix grouped/array child rendering and layout ownership so nested controls compose without extra wrappers or broken sizing.
- **table:** Keep existing rows visible during page/filter/sort/search changes and use Nuxt UI's built-in loading indicator instead of replacing populated tables with skeletons.
- **table:** Fill initial table loading space with the correct number of skeleton rows and use a non-destructive bottom loader for infinite mode.
- **table:** Fix sticky headers by making the DataList viewport the actual scroll owner, including fixed-height and infinite tables.
- **table:** Align sortable header labels exactly with cell content while retaining padded hover affordances.
- **module:** Fix runtime Tailwind source injection against current Nuxt UI CSS generation.
- **tests:** Keep pure runtime utilities isolated from Nuxt app-only imports so unit tests run cleanly under Nuxt 4.5+.

### 🧰 Developer experience

- Strengthen query-state inference, shared runtime predicates, form/table/spreadsheet boundary types, and public API inference to reduce widening and unsafe casts.
- Add anti-slop Oxlint rules for unsafe dictionary usage, widening, runtime `typeof` narrowing, chained assertions, reflection helpers, and other weak typing patterns.
- Raise supported runtime/tooling versions to the Nuxt 4.5 / Nuxt UI 4.10 generation and expose the new `query-prefetch` package entrypoint.
- Expand consumer skills/documentation for form validation/options, table actions/selection/filters/data modes, and query prefetching.

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
