# Changelog

## v1.6.4

[compare changes](https://github.com/ChronicStone/nuxt-ui-tools/compare/v1.6.3...v1.6.4)

The filter reset action appears only when table filters are active. Search text keeps its own clear control and remains in place when filters are reset.

## v1.6.3

[compare changes](https://github.com/ChronicStone/nuxt-ui-tools/compare/v1.6.2...v1.6.3)

Table summary rows stay at the bottom of a filled table and disappear when its query fails. The last data row and summary footer share one separator. A dynamic filter remains open when it is the only available filter.

## v1.6.2

[compare changes](https://github.com/ChronicStone/nuxt-ui-tools/compare/v1.6.1...v1.6.2)

Columns can declare `summary: [{ render, condition? }]` to render typed, multi-row footers from the raw query response, page rows, locally available rows, selection, and current request context. The existing summary API remains available. Declared cells remain visible when the current page is empty, including when the response summarizes a larger filtered set.

## v1.6.1

[compare changes](https://github.com/ChronicStone/nuxt-ui-tools/compare/v1.6.0...v1.6.1)

Table summary resolvers now receive the typed table request context, so remote filtered totals can reuse the same filters and search as the list query.

## v1.6.0

[compare changes](https://github.com/ChronicStone/nuxt-ui-tools/compare/v1.5.0...v1.6.0)

Tables keep the widths you declare, draw placeholders shaped like their cells, and refresh without moving rows around.

### Migration notes

- A column's authored `width` now wins over the header-label floor. Columns that relied on the floor to widen past their `width` render at that width; widen the `width` where a label must stay fully visible.
- Spare horizontal space goes to a trailing filler column instead of stretching every column proportionally.
- Active filter tags no longer honor a `bg-*` utility in `filterTags.ui.activeRoot`; set `[--nut-dl-tag-bg:<color>]` instead.
- Filter tag editors now default to `commitMode: 'auto'`: option and boolean rows apply on click, date picks apply and close, and typed text, number, and date values apply after a short pause, on Enter, or when the popover closes. Set `behavior.commitMode: 'manual'` on a filter to keep the `Clear all / Apply` footer.
- Every filter tag editor opens with the same header (filter label plus `Clear`); text, number, date, and boolean editors accept the `header` prop and emit `back` like the option editor already did.
- Tables virtualize columns once more than 12 unpinned columns are visible (previously 32). Off-screen cells are no longer in the DOM; scroll the column into view before querying its cells.

### Enhancements

- Register `<UiDataListErrorState>` as a public part and give it `title`, `description`, `reference`, and `icon` props plus an `actions` slot, so applications render their own error copy and support reference inside the shared layout. Table and grid renderers now share this one error state and expose it through the `error` slot with `error` and `retry`.
- Center the empty and error states in the remaining body height when a table or grid fills its container, instead of parking them under the header.
- Give active filter tags a slight hover (a 6% ink tint and an accented ring). The background reads `--nut-dl-tag-bg`, which applications override through `filterTags.ui.activeRoot`, for example `[--nut-dl-tag-bg:var(--ui-bg-muted)]`.
- Accept a `skeleton` config (`{ kind, lines, avatar, width, count }`) besides the kind string, and add the `icon` and `progress` kinds, so first loads mirror the cells they replace: caption lines, round or square avatars, per-row width ranges, and badge counts.
- Show a loading line along the bottom edge of the header whenever rows are already on screen and a new page, sort, filter, or refresh is pending.
- Keep existing rows in place while a replacement query runs, dimming them only when the wait is noticeable, instead of animating rows in and out on every search, sort, or page change.

- Add a clear button to the search input; it appears once a term is typed and `Escape` clears too. Style it through `search.ui.clear`.
- Render each body row as a keyed component, so rows already on screen do not re-render while the virtual window slides. The previous `v-memo` on the row loop cached by list position and missed on every slide. Column headers receive props built once per sorting, pinning, or sizing change instead of fresh menu arrays and resize handlers on each render, and row heights come from resize observer entries instead of forced layouts.
- Label the summary row with its scope (`Page`, `Selection`, or `Total`) and a row count, and switch the totals to the selected rows while a selection exists when `selection` is one of the configured `scopes`.
- Keep the loading line visible for at least 600 ms once it appears, so a refresh that completes in a few milliseconds still registers. Its sweep now takes 0.8 s and restarts from the start on every activation and every refresh request, which the table data exposes as `refreshes`.
- Open filter popovers without focusing the header's `Clear` button: searchable option editors focus their search field on devices with a fine pointer, and other editors focus the popover itself so `Tab` enters it.
- Localize the date editor captions (`table.filters.date.*`), the search clear label (`table.controls.clearSearch`), and the summary row unit (`table.summaries.rowOne`, `table.summaries.rowOther`).

### Fixes

- Remove the doubled border above the table header.
- Show the option editor's empty state again when a search matches nothing; it names the term that found no option.
- Keep the sort menu's direction control inside the popover and give it an explicit focus ring.
- Toggle a column from anywhere on its row in the column panel, not only from the checkbox or label.
- Make boolean filter rows selectable across their whole width.
- Request embedded facets once per filter context, instead of repeating them on the next page or sort request.
- Align summary totals and the summary label with the cells above them; footer cells now share the body cell padding.
- Apply a number typed in a number filter after a pause, on Enter, and when the editor closes. The number field only commits its value on blur, so Enter and closing used to drop it; the editor now reads the typed text with the locale's separators and respects `maximumFractionDigits`.
- Keep a value typed in an editor embedded in the add-filter picker or the mobile filter sheet when the picker or sheet closes before the pause ends.
- Keep option rows within the editor width, so long labels end with an ellipsis and show in full on hover; the multiple-choice list's `truncate` prop now defaults to `true` as intended instead of being cast to `false` when omitted.
- Keep the add-filter trigger dashed, like a dormant tag, while a filter is selected and its value is being chosen, instead of rendering its label as bare text.

## v1.5.0

[compare changes](https://github.com/ChronicStone/nuxt-ui-tools/compare/v1.4.0...v1.5.0)

Version 1.5.0 lets one typed remote options loader serve dashboard filters, table filters, and form fields. Mobile table filters also keep persistent tags visible beside a single panel filter control, with the tag wrapping below the toolbar controls when space runs out.

### Migration notes

- No public loader API is removed. Inline dashboard, table, and form remote definitions remain valid, and a field can still define its own loader.
- `<UiDataListFilterTags />` now renders tag filters inline on mobile by default. Set `mobile="sheet"` to keep the previous bottom sheet. To show optional filters in the panel on mobile and as tags on desktop, set their location to `panel md:tag`.

### Enhancements

- Add `defineRemoteOptions(queries, config)` from `#ui-tools/shared`. Define `load` and optional `resolveSelected` endpoint query options once, map their responses to options, then pass the loader to dashboard `f.remote(users, ...)`, table `source: { remote: users }`, or form `options: { mode: 'remote', loader: users }`.
- Keep `remoteTableOptions(query, config)` for endpoints using the table request protocol. It returns the same reusable loader contract and exposes page and selected lookup query keys.
- Let page and selected lookup keys follow their own reactive inputs. Restored dashboard, table, and form selections update their labels when lookup-only scope changes, and a searched form selection retains its label after the list reloads.
- Keep persistent mobile tags in the toolbar while search, the icon-only panel trigger, sort, and refresh stay together on the first row. The panel trigger keeps a visible label when its configured icon is empty. Every option row accepts clicks across its full width.

### Tests and examples

- Add `/dashboard/remote-options` to the playground. One users loader is used by a dashboard filter, table filter, and form select; a second table-protocol loader demonstrates workspace-scoped dashboard search.
- Cover loader keys, selected hydration, search, pagination, form selection retention, mobile filter presentation, and full-width option row clicks in unit and DOM tests. Verify the mobile layout and option row click target manually in Chromium.

### Contributors

- THAO-Cyprien

## v1.4.0

[compare changes](https://github.com/ChronicStone/nuxt-ui-tools/compare/v1.3.0...v1.4.0)

Version 1.4.0 adds form pages: one form laid out as a page of sections, with a navigation that follows the section in view and shows where each section stands, and a ring around every section an edit changed. A page is declared like any form schema, from plain section functions, and renders from public parts you can recompose and restyle. Radio and checkbox cards gain a fixed grid, icon tiles, and a check in the corner.

### Migration notes

- No public API is removed.
- **A successful submit saves the baseline:** dirty state (`isDirty`, `dirtyPaths`, the field reset buttons) clears after a successful submit instead of comparing with the values the form opened with. `reset()` still goes back to the form input.
- **Navigation guard:** `confirmNavOnDirty` no longer asks on a navigation that only changes the hash, nor on one made while a submit is pending, such as an `onSubmit` that navigates after saving.
- **Schema label placement:** `layout.labelPosition` and `layout.labelWidth` set on a schema or a step now reach its fields; they were dropped before.
- **Autofocus:** `controls.autoFocus: true` focuses the first field that renders, including one inside a container.
- **Visual changes:**
  - Fields leave 6px between a top label and its control (was 4px), with a gap instead of a margin.
  - Radio and checkbox cards sit 10px apart and use the default border color.

### 🚀 Enhancements

#### Form pages

- Add `defineFormPageSchema` and `defineFormPageSection`. A page schema takes `sections` (each a key, a label, an optional description, a layout, a condition, and fields) and returns a normal form schema whose fields are cards generated from the sections: `useForm`, validation, dependencies across sections, and the typed `formData` work as for any schema, and the same schema opens in a modal or drawer as a stack of cards. Every text accepts a function, so it can be translated.
- Add `UiFormPage` and its parts `UiFormPageHeader`, `UiFormPageNavigation`, `UiFormPageSections`, and `UiFormPageActions`. The page renders a default layout from the parts; put parts in its default slot to compose another layout, or change one part through the slots it forwards (`navigation-footer`, `header-actions`, `section-actions`, and more).
- The navigation shows each section as complete, invalid, or pending, marks optional sections, and sums up the sections left to complete. It follows the section in view, and the section of a field that takes focus, such as the first invalid field on submit. A click scrolls the section under the pinned header, focuses its title, and records it in the URL hash, which also opens the page on that section.
- With `controls.dirtyCheck`, modified sections get a ring, a reset button, and a dot in the navigation, and the header shows an unsaved-changes badge.
- From 768px of page width, the navigation is a pinned column (200px, 230px from 1024px) beside the sections; below, it is a row of chips that scrolls sideways.
- Style every part through `ui.page.ui` (app config, schema `ui`, or the `ui` prop), with `data-active`, `data-state`, and `data-dirty` for states, and `--nut-form-page-header` and `--nut-form-page-gap` for the pinned offset.
- Add English and French messages for the page chrome.

#### Choice cards

- `radio-card` and `checkbox-card` take `columns` (a fixed grid with breakpoints, such as `'2 xl:3'`), `indicator: 'corner'` (a check in the corner of the selected cards), and `icon: 'tile'` (the option icon in a tile above the label). `ui.tile`, `ui.tileIcon`, `ui.optionIcon`, `ui.check`, and `ui.checkIcon` style the parts the engine renders.

### 🩹 Fixes

- **form:** Keep schema-level `labelPosition` and `labelWidth` in the resolved layout.
- **form:** Stop checkbox cards from rendering option icons as their check mark.
- **form:** Clear dirty state after a successful submit, and let `onSubmit` navigate without the unsaved-changes prompt.

### 🧪 Tests

- Cover page schema inference, section states, conditions across sections, invalid marking, dirty rings and resets, the saved baseline, section grids, scrolling and the hash, the section of a focused field, and custom compositions in unit and DOM tests, along with choice card grids, tiles, and checks.
- Measure the page in Chromium, Firefox, and WebKit: the two-column layout, the pinned header offset, the scrollspy, a navigation click, the section of a focused field, the mid-width column, and the row of chips.

### 📖 Documentation

- Document form pages and choice cards in the consumer form skill, and the form root, the page runtime, and the choice card family in the maintainer reference.
- The table playground gets account create and edit pages built from section functions; the main playground adds `/form/page`, whose texts are all translated through lazy callbacks.

### ❤️ Contributors

- THAO-Cyprien

## v1.3.0

[compare changes](https://github.com/ChronicStone/nuxt-ui-tools/compare/v1.2.0...v1.3.0)

Version 1.3.0 lets dashboard code declare business logic only. A dashboard is composed from plain functions that take what it is about (an id, the audience) and return a schema or a view, with filters declared inline; `useDashboard` rebuilds it when that input changes. The engine ships the page, the filter bar and pills, the view tabs, and the controls charts and blocks render. One schema can serve several audiences: views, queries, and filters take lazy `enabled` conditions, and grids close up around whatever an audience cannot see.

### Migration notes

- **Breaking release:** each removal below has a direct replacement.
- **Params are filters.** Rename the `params` key of schemas, views, and queries to `filters`, the `params` of the `queries` and `derive` contexts and of a query's scope to `filters`, and `dashboard.params` to `dashboard.filters`. `DashboardParam*` types become `DashboardFilter*`.
- **Option handles are controls.** `options` on the dashboard, view handles, and resources becomes `controls`, and `DashboardOptionsHandle` and `DashboardOptionsHandles` become `DashboardFilterControl` and `DashboardFilterControls`. `DashboardOptionParamKeys` is removed: every filter has a control, so `keyof` the filter map names them.
- **Views are a map.** Replace the `views: (view) => ({ … })` builder with `views: { consumption: consumptionView() }`, each view declared with `defineDashboardView`. A view reads its own filters: declare the ones it reads (a `year` declared by the root and by a view is one filter), and pass context as params of the function that builds it.
- **URL keys:** view filters are no longer prefixed with the view key (`?currency=USD`, not `?consumption.currency=USD`), so links saved with the old keys open on the defaults. Query filters keep `<query>.<filter>`.
- **Reserved keys:** a query, derived value, or view can no longer be named `filters`, `controls`, `filtered`, or `resetFilters`; `params` and `options` are free.
- **Grids are wrapping flex rows:** spans keep the widths a CSS grid gives them, and the responsive `columns` / `size` syntax (`"2 md:3 xl:5"`) is unchanged. A row that is not full, because a block is hidden or the last row is short, now stretches its cells in proportion to their spans. Set `fill={false}` on `UiDashboardGrid` to keep every cell at its span.
- **`rows` is removed** from blocks: a flex row has no row spans. Stack blocks in a nested `UiDashboardGrid` instead.
- **The form's `FormRemote*` aliases are removed:** use `RemoteOptionsPage`, `RemoteCursorOptionsPage`, `RemoteOptionsResult`, `RemoteOptionsPagination`, and `RemoteOptionsSearch` from the shared types.
- **Visual changes:**
  - Cards draw their progress bar whenever a request is in flight, including while an errored block retries.
  - Missing numbers print "—" in formatters, totals, and stat values.
  - Chart axes over whole-number data use whole-number ticks.
  - `UiDashboardViewTabs` renders nothing while fewer than two views are enabled.
  - Inline forms no longer draw a divider or add top padding between their fields and their actions; overlay footers keep their border.
  - Selected radio and checkbox cards show a ring in a light tint of the primary color.
- **Contributors:** `bun run test` now includes a `browser` project that runs in Chromium, Firefox, and WebKit. Install the browsers once with `bunx playwright install chromium firefox webkit`.

### 🚀 Enhancements

#### Schemas and views as functions

- Add `defineDashboardView`: one view (tab) with its label, `enabled` condition, filters, queries, and derived values. `defineDashboardSchema` takes a map of views.
- Compose a dashboard from plain functions that take its context as typed params, the way form schemas compose fields: `accountSchema({ accountId })` returns a schema built from `activityView(params)` and `invoicesView(params)`.
- `useDashboard` takes a schema or a function returning one. The function runs in setup, and again when what it reads changes: the dashboard rebuilds behind the same objects (the dashboard, view handles, and every descendant's handle), filters keep their values, queries whose key changed load, and the previous build stops. It keeps the locale of the component that created it, including in the formats the function creates with `useDashboardFormat()`.
- Add `useDashboardView(view)` and `injectDashboard(schema)`: typed handles in any descendant, without props. `UiDashboardPage` scopes each view slot, so a component finds the view it renders in. `InferDashboard` and `InferDashboardView` name the types.

#### Filters and controls

- Declare filters inline with the `f` builder in the schema, a view, or a query. A filter key names one state across the dashboard: two views declaring `year` share its value, so it survives a tab change, and declaring it two different ways fails with an error naming both.
- Filter definitions expose their current `value`, so a sibling's lazy options can read it: `format: (on) => (on ? String(year.value - 1) : 'None')`.
- Give every filter a control: a writable `value`, `label`, `display` ("All", a label, "3 selected"), `items`, `selected`, `isSelected()`, `toggle()`, `reset()`, `changed`, `enabled`, the state of a remote list (`search`, `loading`, `hasMore`, `loadMore()`), and `menu` bindings for `USelectMenu`. The dashboard and view handles expose `filtered` and `resetFilters()`.
- Add filter options:
  - presentation: `label`, `placeholder`, `format`, `columns` (menu grid), `max` (multiple cap), and `presets` (shortcuts that set the whole value);
  - behaviour: `headless` (state only), `enabled`, and `sync` to the URL (default), memory, a ref, or a read-only getter.
- Add list filters (`f.string({ multiple: true })`, `f.number({ multiple: true })`), getter defaults that follow data (such as the top three products of a loaded list), and `f.remote(source, options)` for reusable remote sources.
- Add `remoteTableOptions(query, { option, search, sort, valueKey })`, which builds table-protocol requests (search fields, cursor pages, selected values) for dashboard filters, table filters, and form remote options, and accepts generated client query options such as Tuyau's `queryOptions()`.

#### Page and controls

- Add `UiDashboardPage`, the whole page: the title over today's date and the update time, page actions and the refresh control, the tabs and the filter bar pinned while the page scrolls, and the current view from the slot named after it. A page only instantiates the dashboard and binds it.
- Add `UiDashboardFilters` (the bar, in declaration order, with a reset while any filter differs from its default, `only` / `exclude`, and slots per filter), `UiDashboardFilter` (one pill: dense menus, a multiple-choice grid, presets, searchable remote lists that load ahead of the scroll, a clear button, and a `button` variant), and `UiDashboardViewTabs` (underline tabs that scroll sideways and keep the current tab in view).
- A bar or line chart takes a multiple filter's control as its `series`: one series per picked option (`series-value`), with the picker (add, presets) and removable chips in the series colors.
- A block's `filters` lists the drill-down filters narrowing it as removable chips.
- A header action with a `to` reads as a text link with a chevron. `UiDashboardList` rows take `to`.

#### Queries and conditions

- Add `select` on queries: several typed resources over one shared request, one per block. The selector runs again when a filter it reads changes.
- `requires` follows the resources it reads: `loading` while they load, then `ready` with the `defaultValue` when the requirement stays empty.
- Add `enabled` on views, queries, and filters, a lazy callback (`enabled: () => can('margin')`):
  - **A disabled query** never fetches and reports `disabled`, and every block bound to it renders nothing; dashboard states and background stages leave it out.
  - **A disabled view** has no tab and is never the current view; a URL naming it falls back to an enabled one.
  - **A disabled filter** leaves every filter bar, reads its default, and ignores writes, so queries never send it.

#### Blocks, grid, and formats

- Grids lay cells out as wrapping flex rows: each cell starts at its span's width and a short row shares its free width by span (`fill`, on by default), so rows close up around hidden blocks, including blocks left out with `v-if`. A grid whose blocks all render nothing collapses.
- Add the `fetching` flag on sources: cards draw their progress bar while any request is in flight, and the retry button spins until the request settles.
- Add chart `totals` (`true`, `'sum'`, or `'average'`): footer totals per series in the chart's format. `UiDashboardTotal` accepts numbers and a `format`.
- Add `DashboardValueFormat` everywhere a block takes a `format`: a preset (`number`, `integer`, `decimal`, `compact`, `percent`, `ratio`, `month`), `Intl.NumberFormatOptions`, `{ currency }` for whole amounts in a currency, or a function. The locale-bound formatters are public through `useDashboardFormat()`, and print "—" for missing numbers.
- Add the stat `compare-mode="difference"` (absolute deltas, in points for percentages) and delta presets.

### 🩹 Fixes

- **dashboard:** Collapse emptied grids. The grid's inline `display: flex` overrode `empty:hidden`, so an emptied panels grid kept its border as a 2px strip.
- **dashboard:** Keep whole-number data on whole-number axis ticks. An axis over zeros printed `0, 0, 1, 1, 1`.
- **dashboard:** Run a query's `select` again when a filter it reads changes.
- **dashboard:** Report a schema error thrown in setup once: `UiDashboardPage` renders nothing without a dashboard instead of failing again on it.
- **dashboard:** Keep header links to the height of the title beside them.
- **dashboard:** Ring the whole filter pill on keyboard focus.
- **table:** Accept generated client query options in `remoteTableOptions`.
- **form:** Drop the divider and top padding between inline fields and their actions. Overlay footers keep their border.
- **form:** Ring selected radio and checkbox cards, including the card variants of radio and checkbox groups, with a 4px tint of the primary color. The ring is a shadow, so selecting a card never moves it; `ui.item` classes override it.
- **form:** Read a field's focus from its own document, so a focus check that settles after its document is gone no longer throws.

### 🧪 Tests

- Add a `browser` Vitest project. It mounts real grids with the shipped Tailwind classes in Chromium, Firefox, and WebKit (Playwright) and measures:
  - span widths, row breaks, and proportional fill as blocks hide and show;
  - `fill: false`, short rows, and responsive columns and spans;
  - a phone layout, and a sweep of widths, gaps, and column counts for rounding wraps;
  - panel rules, equal row heights, and the collapse of emptied and nested grids.
- Cover schema functions (rebuilds behind the same objects, the previous build stopped, the locale kept), shared filter keys and their conflicts, conditions, controls, injection, and the page shell in DOM tests, and the inference of functions, filters, and handles in type tests.
- CI and the release workflow install the browsers.
- Give the WebKit grid sweep, which forces about 28,000 layouts, a 60 s timeout.

### 📖 Documentation

- Document schema and view functions, inline filters and their controls, injection, the page, presets, remote pickers, formats, conditions, and the grid model in the consumer dashboard skill. The maintainer references cover the runtime and its tests.
- Compose both playgrounds' dashboards from view functions with inline filters; each page only instantiates a dashboard and binds `UiDashboardPage`.
- Document the form keyboard contract: Enter submits from a single-line field through the form lifecycle, and Tab moves through every focusable control, including checkboxes.

### ❤️ Contributors

- THAO-Cyprien

## v1.2.0

[compare changes](https://github.com/ChronicStone/nuxt-ui-tools/compare/v1.1.0...v1.2.0)

Version 1.2.0 lets table option filters load their options page by page from the server, the way the form engine's remote options already do, and fixes two layout issues found while reviewing the dashboard playground.

### Migration notes

- **Additive release:** no existing public API changes behaviour. `source.query` keeps loading the whole option list in one request.
- **Scrollbars:** the module's global scrollbar styles now use the standard `scrollbar-width` / `scrollbar-color` properties where the browser supports them. Platforms with overlay scrollbars (macOS) draw them over the content again instead of reserving an 11px gutter in every scroll container, so layouts that compensated for that gutter can drop the compensation.

### 🚀 Enhancements

#### Table filters

- Add `source.remote` on option filters: `load({ search, page })` returns a query definition for one page (`{ options, hasMore }` or `{ options, nextCursor }`, the shared `RemoteOptionsResult` contract), with server-side search (`search.debounce`, `search.minLength`) and page or cursor `pagination`. It takes precedence over `options` and `query`.
- Load the next page ahead of the scroll (three viewport heights by default, `pagination.prefetchDistance` in pixels to tune), with inline loading rows and an inline retry instead of a load-more button.
- Add `resolveSelected({ values })` for committed values the loaded pages do not contain: a table-level registry labels them in tags, panel chips, and the mobile filter sheet, and `prefetchTable` warms the query for values in the URL. Picked values stay listed at the top of the editor, even when the current search does not return them.
- Count paged options through the filter's own `source.facet.query`, once per loaded page, with that page's values in the new facet descriptor field `values`. Remote tables no longer take these counts from the main request, which cannot count options it never lists; rows show a placeholder until their page is counted.

#### Shared and playgrounds

- Move the page/cursor next-page helper to `shared/utils/remote-options.ts`; the dashboard's remote params use it.
- Page the default playground's remote company filter over 64 demo companies, with local endpoints for paged options, selected labels, and per-page counts.
- Redesign the custom playground dashboard controls: a pinned filter bar of uniform "Name value" pills with a reset, page actions in the title row (icon buttons on phones), view tabs that scroll instead of wrapping, and dense filter menus.

### 🩹 Fixes

- **shared:** Draw scrollbars over the content instead of reserving a gutter (see migration notes).
- **dashboard:** Frame feed events evenly on hover: rows pad 8px above and below, the timeline rail runs through the padding, and the skeleton matches.

### ❤️ Contributors

- THAO-Cyprien

## v1.1.0

[compare changes](https://github.com/ChronicStone/nuxt-ui-tools/compare/v1.0.1...v1.1.0)

Version 1.1.0 adds the dashboard engine, the third runtime domain next to forms and tables. A dashboard is declared once as a typed schema (URL-synced params, staged queries, derived values, optional views) and composed in the template from generic blocks that bring their own loading skeleton, scoped error with retry, empty state, refresh indicator, card menu, and actions. Typing flows from each query result to the accessors written in the template, so a wrong field is a compile error.

### Migration notes

- **Additive release:** no existing public API changes behaviour.
- **Charts:** the chart blocks render with unovis, a new optional peer dependency. Install `@unovis/vue` and `@unovis/ts` (`>=1.6.0`) to use `BarChart`, `LineChart`, `ComboChart`, and `DonutChart`; every other block works without them.
- **Shared contracts:** the form's `FormRemoteOptionsPage`, `FormRemoteCursorOptionsPage`, `FormRemoteOptionsResult`, `FormRemotePagination`, and `FormRemoteSearch` types are now deprecated aliases of the shared `RemoteOptions*` contract, and `TableQueryDefinition` aliases the shared `QueryDefinition`. Existing imports keep working.

### 🚀 Enhancements

#### Dashboard schema and runtime

- Add `defineDashboardSchema(...)` and `useDashboard(...)` (auto-imported, `nuxt-ui-tools/dashboard` entrypoint): a facade with no `.value`, where params are writable `v-model` targets and every query or derived value can be bound to a block.
- Add typed, URL-synced params: `string`, `number`, `boolean`, `date`, `dateRange`, `enum`, `options`, `remote` (searchable, paginated, with selected-value hydration), `comparison`, and `custom` codecs, with `multiple`, `defaultValue` narrowing, `urlKey`, `omitDefault`, and `historyMode`. Option-backed params expose handles ready for `USelect` / `USelectMenu`.
- Add staged queries: `essential` (drives the dashboard state), `background` (waits for essentials to settle), and `deferred` (fetches when a block nears the viewport, on mount, or manually), with `requires` gating that narrows dependent queries, `enabled`, `defaultValue`, and previous-data retention.
- Add derived values: each entry is a resource whose state follows the sources it actually read.
- Add optional views (tabs) with their own params and queries: a view's queries stay idle until it opens once, then stay warm; the current view is in the URL and in history.
- Add widget-scoped params on queries, URL-synced under the query (`<view>.<query>.<param>`), for per-card state such as a table sort or a segment tab.
- Add readable URL keys named after the schema (`year`, `view`, `consumption.currency`), `urlPrefix` for several dashboards on one page, and compile-time plus runtime guards against reserved or colliding keys.
- Add `updatedAt` on every resource, derived value, view, and the dashboard (the oldest fetch on screen), single-flight `refresh()`, and `autoRefresh`: a schema default, a writable facade member kept in the URL (`refresh`), applied as a `refetchInterval` on every active query and paused in background tabs.
- Add comparison periods: `p.comparison()` (`'previous' | 'year' | 'none'`, localized option labels) and `resolveDashboardComparisonRange(range, mode)` (calendar days, Feb 29 falls back to Feb 28).

#### Dashboard blocks

- Add `DashboardGrid` with responsive column and row spans, `cards` and `panels` variants (joined cells separated by rules), and nested grids for split cards; grids pass `menu` and `freshness` to their blocks.
- Add `DashboardStat` with deltas (direction and good/bad color), captions, sparklines as area, line, or mini bars, goal progress, status badges, and `compare` (default delta and "vs … previous period" caption); `DashboardStats` for several figures from one source (deltas, progress, badges; plain, divided, or tile layouts); and `DashboardGauge` (arc or ring, target tick, threshold colors).
- Add unovis charts behind an async renderer seam: `DashboardBarChart`, `DashboardLineChart`, `DashboardComboChart` (bars and lines on two value axes), and `DashboardDonutChart`, with accessor-based series, stacking, areas, reference lines, comparison lines, per-series comparison periods (faded bars or dashed lines), `highlight`, value `labels`, and round axes for negative values.
- Add `DashboardList` (avatars, codes, icons, progress rings, shares, deltas), `DashboardBars`, `DashboardPairedBars`, `DashboardFunnel`, and `DashboardStackBar`.
- Add `DashboardAlerts` (severity-sorted rows with actions and an all-clear state), `DashboardFeed` (a timeline with day headings and live relative times), and `DashboardTable` (text, number, delta, percent, and inline bar columns, `v-model:sort`, sticky header, `#cell-<key>` slots).
- Add `DashboardWidget` for custom content with the same states, `DashboardCard` for fully custom cards, `DashboardTabs` (a typed tab strip for widget params or local switches), `DashboardRefresh` (refresh button, auto-refresh menu, "Updated …"), `DashboardRelativeTime`, `DashboardLegend`, and `DashboardTotal`.
- Add automatic states on every block: shaped skeletons (values never in the DOM while loading), a retryable error scoped to the block, empty states, and a background refresh bar that keeps stale values readable.

#### Dashboard cards and interaction

- Add card menus: a data table view, CSV export (locale-aware separators and decimals), an expand dialog, custom Nuxt UI items, or a function of the block's context (`title`, `table()`, `download()`, `expand()`).
- Add card `actions` (header buttons, or full-width buttons under the content) and a `freshness` line ("Updated 3 min ago") on one shared clock.
- Add `select` on every row and chart block (charts select by click or tap position), `selected` to show the stored value (row tint and accent, faded bars and segments, a band on line charts), and `rowActions` (inline icon buttons and a `⋮` menu) on list, bars, alerts, feed, and table rows.
- Add theming through `--nut-dash-*` tokens mapped onto Nuxt UI (a default palette that stays distinct on the stock theme, dark mode included) and class overrides layered library defaults → `appConfig.nuxtUiTools.dashboard` → the block's `ui` prop.
- Add English and French messages for every dashboard string.

#### Shared, docs, and playgrounds

- Share the query definition and remote-option contracts between the form, table, and dashboard runtimes.
- Add the dashboard consumer skill (schema, params, blocks) and the maintainer runtime reference.
- Add dashboard examples to the playground (analytics with two views, a single-view schema, and an operations dashboard on the stock theme) and reproduce the identity4 analytics design in `playground-table`, with an Opérations tab for the operational features.

### ❤️ Contributors

- THAO-Cyprien

## v1.0.1

[compare changes](https://github.com/ChronicStone/nuxt-ui-tools/compare/v1.0.0...v1.0.1)

### Enhancements

- **form:** Add live, localized password requirement feedback without replacing native Regle validation ownership.

### Fixes

- **form:** Use native Regle validators as the single validation contract and skip masking for native inputs that do not configure a mask.
- **table:** Keep runtime context out of remote transport payloads while preserving row inference for inline and external query functions.
- **table:** Resolve facet-backed options once, hide unavailable facet counts, restore layout-specific sorting, and render row scope through Vue slots.
- **table:** Preserve responsive controls, selection context, independently wrapped filter tags, and list chrome when replacement queries fail.
- **table:** Keep the background progress line visible beneath populated table headers and let refresh icons complete their current rotation when loading finishes.

### Contributors

- THAO-Cyprien

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
