# Table runtime rewrite — working plan

Goal: nuxt-ui-tools table runtime at parity with tars shared-ui data-list, proven by `playground-table` (Accounts list + Audit trail) as a pixel-perfect replica of the ExAssess prototype (`reference/*.png`, `prototype-list.css`, `prototype-atelier.css`).

## Decisions

- Keep: schema/type layer, builders (moved to `utils/builders`), `client-query`, query-state URL scheme, prefetch, facets contract, FilterPopoverShell/FilterStageTransition, Root + parts composition, i18n.
- Replace: table renderer (own `<table>` on TanStack Table v9 + vue-virtual X/Y, pinned columns as padding, overlay scrollbars, sticky header/footer, skeleton first load, background bar), loading overlays, selection bar (dark floating bar, scope toggle selection/all, overflow ⋯ above 70 % width), customization API (generic part config: `size`, `ui` classes, `props` per Nuxt UI primitive), mobile (cards only, filter tags + columns + sort as bottom sheets, filter panel mobile-only).
- Add: summaries (column `summary` derivable kinds or async resolver, source-level `summaries`, scopes page/filtered/selection, footer toggle, skeleton cells), animations (control cluster, bands, rows when not virtualized, chips, layout switch), cursor infinite table with virtualization.
- Defer: presets, quick-filter rail, column drag reorder, DB adapters.

## Phases

1. Playground shell + Accounts on current runtime (baseline, dev server running).
2. New TableRenderer (v9, virtualization, pinning, column menu, resize, sticky header/footer, skeleton).
3. Toolbar/tags restyle, mobile sheets, cards view, mobile layout.
4. Selection bar redesign + `all` scope.
5. Summaries API + footer.
6. Animations, perf (10k rows), audit infinite page.
7. Customization `props`, tests, consumer skill docs, cleanup.

## Perf budget

10 000 client rows, all 24 columns: filter/sort/page change < 50 ms main thread; horizontal scroll without layout thrash; memory flat across page switches.

## Status (2026-09-19)

Done: TanStack v9 renderer with row + column virtualization, measured (variable) row heights, pinned columns with 1px seams, gutter tokens (20 px), 42 px header / 44 px rows / 14 px cell padding, summaries API (derived kinds + async resolvers + table-level resolve, sticky tfoot with skeletons), cursor auto-load in the table scroller, grid renderer rewrite (virtualized contained mode, CSS transitions), mobile: cards-only via `table.enabled: 'false md:true'`, filter/sort/row-action bottom sheets, compact footer, `ui.mobile` overrides; `props` layer on every part (variant/size/color per sub-control, merged app config → root → part); selection bar redesign (scope switch Sélection/Tous les résultats, overflow, absolute docking); columns panel, column menu, add-filter picker and option editor restyled to the prototype; tag previews rendered as plain text with option `color` dots; audit trail page with mocked cursor remote.

Measured at 10 000 client rows (1440×900, headless Chrome): next page 71 ms, search 120 ms, page size 182 ms, sort via menu 375 ms (includes 150 ms menu wait), 20 scroll steps 698 ms, heap 147 MB.

Known gaps: selection bar is centered on the content area (prototype centers on the whole window); empty state keeps a one-line message where the prototype is blank; column drag reorder in the panel is kept from the previous implementation; no vitest coverage yet for summaries and the props merge.

### Polish pass (2026-09-19, later)

- Rows grow with content: cells wrap, clamped to 3 lines by default (`lines` per column, `ellipsis: true` for one line), 6 px vertical padding keeps single-line rows at 44 px.
- Designed empty state (icon tile, contextual copy, reset-filters action) shared by table and grid; per-column skeleton shapes (`skeleton: 'avatar' | 'dot' | 'check' | 'number' | 'badge'`), staggered shimmer, card skeletons, footer boot state.
- Mobile: breakpoint synced from matchMedia before the first layout evaluation (no table flash), forced layouts are derived and never written to the URL, filter sheet ordered by schema, sheet header owns back + Effacer, boolean labels localized.
- Editors: option editor header (← title · Effacer) in popovers and in the add-filter picker; picker chevrons centered; resize handle kept inside its header cell (drag now works from the visible handle).
- Summary footer matches the prototype: 40 px, light weight via `--nut-dl-table-foot-weight`, thousands separators as regular no-break spaces.
- Tablet (768–1023): 24 px page gutter, toolbar right group stays on one line.
- Grid renderer: cursor auto-load near the last virtual row (contained mode) and on scroll (flow mode), with a loading row; icon-only buttons centered via square compound variants; option/picker rows carry focus-visible rings; mobile sheets use the prototype's 10 px gutter, 46 px / 15 px rows, 14 px icons and ink-colored values.
