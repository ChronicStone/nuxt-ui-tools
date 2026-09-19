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
| `alpha-select` | full (mobile drawer, letter groups, quick nav) | missing | dropped (2026-09-19): not needed in V2 |
| `array-collapse` | full (accordion, summaryTemplate, defaultExpanded, draggable) | done (2026-09-19) | index-based expanded state, invalid items reveal themselves |
| `array-primitive` | full (single item field, preview, unique) | done (2026-09-19) | items validated through a Regle mirror; pending item is `undefined` |
| `array-tabs` | component | shared array-list component | `tabAction` added; panels render the active item only |
| `array-variant` | component | shared array-list component | present |
| `cascader` | component | shared tree popover | dropped (2026-09-19): not needed in V2, the tree popover stays as the fallback renderer |
| `tree-select`, `tree` | component, lazy remote children, `resolveSelected` paths, `selectionControl`, `showChildrenCount`, `expandParentOnClick` | shared `hierarchy/component.vue` eager only | port remote lazy loading + paginated roots + selection controls |
| `datetime`, `daterange`, `datetimerange`, `month`, `monthrange`, `year` | one `DateField.vue` with Naive picker + maskito manual input | `date-family/component.vue` shared: manual input with mask, ranges with draft confirm, time inputs, calendar options | siblings present (2026-09-19); `shortcuts`, `isDateDisabled`, `defaultTime` move to the parity-props phase |
| `rich-text` | absent in V1 | absent | deferred (2026-09-19) to a later iteration; maquette forms use a textarea meanwhile |
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
3. **Missing kinds**: array-collapse, array-primitive, array-tabs polish, array-variant, date siblings. `alpha-select` and `cascader` dropped, `rich-text` deferred.
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

## Progress log

### 2026-09-19

- DOM form harness (`test/dom/form/harness.ts`) with Nuxt UI stubs for every form primitive; ported V1 suites: submission, state, sync input, dependencies, dependency reset, stepped forms, array tables, dirty navigation, remote options, remote trees.
- Field callbacks receive `api.form` (get/set/initial/state/output/focus/errors/steps) with `$parent` and `$root` paths; `transform.input` runs on initial state; dependency and watch effects are tracked so `reset()` awaits them and rebaselines; controls disable while an action is pending; `controls.ignoreDirtyPaths`; sync input catches up when `syncInput` turns on; stepped roots nest their output.
- Custom errors: non-blocking by default, `blocking: true` blocks submit and step navigation, cleared on value change.
- Remote options (`mode: 'remote'`): page and cursor pagination driven by the list scroll within `prefetchDistance` (default one viewport), debounced search with `minLength`, stale-run rejection, next-page failure keeps loaded options and shows a retry line, `resolveSelected` hydration, `refreshOn` + `clearOnInvalid`, lazy tree children (`isLeaf: false`), roots pagination in tree-select. Menu footer hosts refresh and create only.
- Schema `eyebrow` and `description` render in the form header; `section` field kind (uppercase caption + hairline + inline description); `help` text under controls; required marker honours the field-level flag; secondary actions default to neutral outline.
- Module ships thin overlay-style scrollbars for every scroll container (opt-out `scrollbars: false`); table overlay scrollbars share the tokens.
- Playground `/forms` page renders the maquette contact form inline and as a modal with a remote paginated account picker.

- Array kinds: shared `useFormArrayItems` composable behind array-list, array-table, array-tabs, array-variant and the new `array-collapse` (accordion, `defaultExpanded`, `summaryTemplate`, `arrowPlacement`, drag keeps expanded state, invalid items reveal themselves through `FormFieldStatus`). `array-tabs` gained `tabAction`. New `array-primitive` kind: one item field per entry, `preview`, `unique`, pending item (`undefined`) blocks a second add and is dropped from output, item transforms.
- Regle does not create per-item statuses for primitive arrays in rules mode and crashes on a `null` item, so `use-form-validation` runs a second Regle instance on a mirror where each primitive array item is a `{ value }` holder synced in place; the form state, `deps`, `api`, output and sync input keep plain primitives. Item paths (`contacts.1`) resolve to the mirror.
- Engine fix: field value and dependency watches now compare a deep snapshot before acting, because Vue runs a deep watch callback whenever a dependency triggers. A parent re-render passing a fresh path array used to clear the field's error and re-run `watch`/`onDependencyChange`.
- Decision: `alpha-select` and `cascader` dropped (the cascader type keeps rendering through the tree popover); `rich-text` deferred to a later iteration.
- Infinite loading: the "loading more" row is now the last option inside the scrolling list (select, auto-complete) instead of a footer pinned under it; the prefetch window defaults to three viewport heights and the footer rechecks after every page so the buffer fills without scrolling. The table renderer got the same window and its loading row moved to the real end of the virtualized content.
- Array-table: title block, footer add row inside the table, `layout.width` per column doubling as minimum width so narrow screens scroll horizontally, sticky actions column, border moved to an outer frame so the scroll-shadow mask no longer fades it, cell padding matches the input. Array-primitive previews are click-to-edit.
- Parity props slice 1: text `mask` (maska, `maskOutput: 'masked' | 'raw'`), `prefix`/`suffix`, `icon`/`trailingIcon`, `mono`, `clearable`, `maxlength`; number `format` (Intl), `controls`, `prefix`/`suffix` (inline when steppers are off), `mono`; textarea `autoresize`, `rows`, `maxrows`, `maxlength`; `layout.labelPosition: 'left'` with `labelWidth` at field or form level; `description` accepts `{ text, display: 'tooltip' | 'modal', title }`. Playground `parity` demo form.
- Parity props slice 2: `tabs` container kind (UTabs, invalid tab reveal, flat output), radio `variant`/`orientation`/`indicator` with option descriptions, option `icon` carried through to radio-card, select `max`, info `title`/`icon`/`color`/`variant`, file and upload dropzone (`dropzoneLabel`, `dropzoneDescription`, `icon`, `variant`, `fileLayout`, `preview`, `interactive`), upload `onProgress` with a progress bar, custom file rows (thumbnail or type icon, name, type and size, remove) rendered outside the dropzone so drag and drop keeps working.
- Modal chrome aligned with the Atelier modal: `modal.size` presets (600/760/920), 14px radius, maquette shadow and paddings, borderless header, darker eyebrow ink. Playground catalogue now holds contact, arrays, parity, invite, group, rate, testcenter, location, memo; each opens inline and as a modal through shared remote account and contact pickers (`forms/pickers.ts`).

Backlog noted along the way: primitive `preview` resolves remote options only while the item control is registered, native `window.confirm` for array removals pending an engine confirm overlay, typed `deps` in callbacks (currently `{}`), label/description/hint callbacks with dependency params, modal chrome polish (eyebrow ink, borderless close, 14px radius, submit icon), a11y verification in the real browser, `prefetchDistance` naming on the table infinite loader.
