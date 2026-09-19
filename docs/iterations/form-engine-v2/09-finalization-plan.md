# Form Engine Finalization Plan

Date: 2026-09-19. Branch: `feat/runtime-composition-and-prefetch`.

Goal: bring `src/runtime/form` to production parity with the tars-monorepo V1 engine, keep the refined V2 schema API, polish every field to the Atelier design language, and prove it by rendering every form of the Atelier maquettes (`identity4.html`) in `playground-table/`, inline and as modal, more or less pixel perfect.

## Sources

| Role | Path |
| --- | --- |
| V1 engine (reference behaviours) | `AGORASTORE/NEW_STACK/tars-monorepo/packages/shared-ui/src/runtime/lib/form` (167 files, ~15k lines) |
| V1 contract docs | `tars-monorepo/.agents/skills/tars-form-engine/` (SKILL + 3 references) |
| V1 tests | `tars-monorepo/packages/shared-ui/test/form/` (24 files, incl. `remote-options.test.ts` 41k, `remote-tree-options.test.ts` 18k) |
| V2 engine (target) | `src/runtime/form` (~16.5k lines, 47 field folders) |
| V2 tests | `test/form/*.test.ts` (15 unit files, no DOM harness) |
| Atelier maquettes | `exassess-app-cloudflare/tmp/admin-ui-exploration/src-identity4/*.js`, built by `build-identity4.sh` |
| Table-phase tooling to reuse | `test/dom/harness.ts`, stubs in `test/dom/stubs/nuxt-ui/*`, `shot.mjs` / `measure.mjs` / `pxdiff.mjs` in the exploration folder |

## V1 → V2 gap matrix

### Field kinds

| Kind | V1 | V2 | Action |
| --- | --- | --- | --- |
| `alpha-select` | full (mobile drawer, letter groups, quick nav) | missing | add, mobile-first |
| `array-collapse` | full (accordion, summaryTemplate, defaultExpanded, draggable) | missing | add |
| `array-primitive` | full (single item field, preview, unique) | missing | add; needed for chip lists (metadata levels, affiliation values) |
| `array-tabs` | component | types + config only | add component (UTabs, lazyPanels, tabActionTemplate) |
| `array-variant` | component | types + config only | add component (variantKey, tabs or list) |
| `cascader` | component | types + config only | add (UPopover + column browser) |
| `tree-select`, `tree` | component, lazy remote children, `resolveSelected` paths, `selectionControl`, `showChildrenCount`, `expandParentOnClick` | shared `hierarchy/component.vue` eager only | port remote lazy loading + paginated roots + selection controls |
| `datetime`, `daterange`, `datetimerange`, `month`, `monthrange`, `year` | one `DateField.vue` with Naive picker + maskito manual input | `date-family/component.vue` shared, no config for the 6 sibling kinds beyond types | finish siblings, verify manual input, shortcuts, ranges |
| `rich-text` | absent in V1 | absent | new kind on `UEditor` (TipTap) with toolbar config and custom nodes (resource card, @mention); maquette uses it in 6 forms |
| all others (text, password, textarea, number, select, checkbox, switch, radio, radio-card, checkbox-group, checkbox-card, switch-group, matrix, slider, tag, rating, color-picker, one-time-code, phone-number, auto-complete, file, upload, object, group, input-group, info, divider, card, column, button, hidden, custom-component, array-list, array-table) | present | present | polish pass + parity props |

### Options runtime (biggest gap)

V2 `use-field-options.ts` (468 lines) handles static, sync, promise, query sources, `create`, `clearOnInvalid`, `revalidateFieldOptions`. Missing versus V1 `useFieldOptions.ts` (36k):

- `mode: 'remote'` with `pagination: { type: 'page' | 'cursor', size, prefetchDistance }` and `source({ search, page, deps, api })`
- debounced `search` with `minLength`, stale-run rejection, abort of superseded runs
- `resolveSelected` hydration for values outside the loaded page, never clearing the model on pending/error
- `refreshOn` aliases and `externalDependencies` (locale refs)
- `hasMore` / `loadNextPage` / `loadingNextPage` / `retryOptions` exposed to components, infinite scroll in select and tree-select
- keep previous options usable during background refresh, no dropdown scroll reset
- remote tree: `parentOption` in the source context, `loadChildren`, `allowCheckingNotLoaded`, `cascade` defaults

### Base field properties

| V1 | V2 | Action |
| --- | --- | --- |
| `labelPosition: 'left' \| 'top'`, `labelWidth` | absent | add `layout.labelPosition` + width; account form and settings use top labels, array-table rows need bare inputs |
| `description` as `{ type: 'tooltip' \| 'modal' }` | plain text | add tooltip/modal description variants |
| `showHint`, `requiredLabel` | absent | add or fold into `hint` config |
| `width` | absent | `layout.width` |
| text `mask`, `prefix`, `suffix`, `clearable`, `showCount`, `maxlength` | `inputType` only | add (maskito or nuxt-ui mask), prefix/suffix slots (maquette: `€`, `tests`, `1 USD =`) |
| number `precision`, formatting, suffix | `min`, `max`, `step` | add locale formatting, suffix, `mono` |
| textarea `autosize`, `rows`, `showCount` | none | add |
| select `max`, `maxTagCount`, `renderTag`, `renderLabel`, `virtualScroll`, `fallbackOption` | `multiple`, `searchable`, `clearable`, `createItem` | add `max`, tag rendering slots, avatar-chip variant (`cchip` in maquette), virtualization |
| upload progress, preview, download | handler + onDelete | add progress + preview/download hooks, dropzone variant (`filez`) |
| form `layout.scale`, `textOverrides`, `accessKeys`, `apps` | `ui` config | `ui` covers scale; access rules out of scope |
| schema `title` render fn, `testId` | `title`, `formKey` | keep V2 |

### Layout and shells

- V2 has inline, modal, drawer, fullscreen shells and stepped forms. Missing: modal `eyebrow` (small uppercase over title), modal `tabs` (news, product, profile modals), section blocks (`msec`: uppercase caption + hairline), inline note (`mnote`), sticky section nav (`fnav`) for long page forms, wizard rail (`wz`) for the import flow, `size: 'md' | 'lg' | 'xl'` presets (600 / 760 / 920 px).
- Fields as rows inside a table (`array-table` with bare inputs, select + number + checkbox per row) must match `cfp-row` / `.t.airy.cfp`.

### Tests

- V2 form has only unit tests. Build `test/dom/form/` on the existing happy-dom harness (`mountForm`) with the same stub factory, and port the V1 behavioural suites: remote options, remote tree options, dependency reset/state, array mutation, array-tab lifecycle, dirty navigation, stepped form, sync-input, submission, output shaping, file/phone/textarea/checkbox fields.

## Maquette form inventory (target renders)

Every entry below must render through `NutForm`, inline and as modal where applicable, from a `defineFormSchema` in `playground-table/app/forms/*`.

### Page forms (inline, section nav)

| Page key | Form | Notable fields |
| --- | --- | --- |
| `accountNew` / `accountForm` | account create/edit, 6 sections, sticky `fnav` with done/optional state | radio-card type picker (`tcards`), select, checkbox with hint, text with mono/icon, file (image + PDF), 3-col contacts, contact chips (array-primitive of remote select), address block |
| `contractForm` | contract create/edit, 4 sections + readiness checklist | remote account picker, date ×3, select ×4, conditional agent block, array-table of products (select, select mono, number €, number €, computed margin, checkbox, remove), array-list targets (text, number suffix, date, date), array-list documents (select + dropzone) |
| `demandSend` | 3 numbered sections + recap rail | radio-card templates, radio group `fp-opts`, chips with popover picker, select, checkbox-group reminders with computed dates |
| `demandTemplate` / `formEditor` | builder: outline + canvas + inspector | inspector = inline form with locale segment, textarea, switches, options array-primitive; canvas rendered by the engine from a dynamic schema |
| `assessImport` | 4-step wizard rail | select, checkbox, dropzone, validation table, per-row select mapping |
| `settings` | 5 sections | switch rows (`fe-sw`), flags list, team table with select per row, notification matrix (checkbox matrix) |
| `login` | card-less login | text, password with toggle, checkbox, link |

### Modals (55 registered, grouped by pattern)

| Pattern | Modals |
| --- | --- |
| Sectioned CRUD (`msec` + `mrow`) | contact, group, rate, testcenter, location, memo, memoEdit, productLine, versionType, product (tabs), news (tabs), presetForm (xl), consumption, invoice, assessEdit, webhook, apiKey, profile (tabs), support |
| Confirm with options | cReady (checklist + checkbox), cSign, cTerminate (danger), cAmend, cDuplicate, dRelaunch (chips + rich text), dReturn, dApprove, dCancel, dClarify, dConfirmSend, certForce (danger), certAbandon, accStatus, confirm |
| Radio list (`fp-opts` / `md-list.pick`) | billedBulk, certSync, exportAccount, preset, dSaveFile, memoAddUser, pickResource |
| Checkbox list (`fp-opts`) | accSync, accActivate, apiKey scopes, webhook events |
| Array editors | cTarget (rows), cProducts (xl table), cFiles (rows + dropzone), metadata (sortable chips), affGroup (chips), userAccounts (list with select per row) |
| Read-only | certHistory, certReport (filters) |

Field patterns to add for parity with the maquette: `eyebrow`, `tabs`, `section` container variant with caption, `note` info variant, option-card radio/checkbox groups (`fp-opt`), avatar chips, sortable chips, dropzone file variant, computed read-only cell in array-table, danger submit action, disabled submit with checklist.

## Delivery phases

1. **Foundation**: DOM form harness + stubs, port V1 behaviour suites as failing specs, `playground-table` forms section (nav, `/forms` index, one page per maquette form, modal launcher).
2. **Options runtime**: remote pagination (page + cursor), search, `resolveSelected`, `refreshOn`, `externalDependencies`, infinite scroll in select and tree-select, remote lazy tree. Green on ported V1 remote suites.
3. **Missing kinds**: alpha-select, array-collapse, array-primitive, array-tabs, array-variant, cascader components, date siblings, rich-text.
4. **Parity props**: labelPosition, description variants, text mask/prefix/suffix, number formatting, select max/tags, upload progress, form sizes, eyebrow, tabs, sections, notes.
5. **Design polish**: every field at md/sm/lg against Atelier tokens (7px radius, hairlines, orange focus ring 3px, 34px controls, 12.5px labels, 11.5px hints), light and dark, desktop and 390px.
6. **Maquette forms**: build all schemas, shoot each vs `identity4.html` with `goFull(page)` / `openModal(kind)`, pxdiff, iterate.
7. **Gates**: typecheck 0, vitest green, oxlint green on touched files, granular commits.

## Decisions (2026-09-19)

1. `rich-text` is a real field kind on `UEditor`. It must be extensible from the app: custom TipTap extensions, custom node renderers, custom toolbar actions passed through the field definition and app config.
2. The engine ships a JSON-to-schema adapter so user-authored form definitions (form builder, demand templates) render through `NutForm`.
3. `accessKeys` / `apps` stay in the app layer.
4. Keep curated V2 props, but expose real control and power: every Nuxt UI primitive prop that matters (pickers, selects, editors, uploads) gets a typed field property or a typed `props` passthrough. Never leave a behaviour reachable only by forking the component.
5. The sticky section navigation on long page forms is app-level composition, not an engine feature. The engine only guarantees stable section anchors and inline `NutForm` blocks that share one controller.
7. Keep V2's field-scoped property typing (no shared properties leaking onto kinds that cannot use them). Parity means behaviours and features, not V1's type shapes.
8. Custom errors set through the API are non-blocking by default and block submit only when set with `blocking: true`. A value change clears them.
9. Accessibility and keyboard behaviour are part of parity: Enter submits from any single-line control, invalid submit focuses the first invalid field and announces its error, every control is labelled (aria-labelledby or aria-label), overlays trap and restore focus, option menus and trees are fully keyboard operable. Covered by a dedicated DOM spec.
6. Pixel comparison against `identity4.html` with `shot.mjs` / `pxdiff` when the render can be isolated; otherwise side-by-side screenshots.
