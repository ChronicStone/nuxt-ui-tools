# Form Runtime

`src/runtime/form` is a V1 runtime domain with a curated field-kind registry.

## Current Rule

Do not treat its current minimal state as permission to invent a different architecture style.
For existing form-engine capabilities, this runtime is a port-and-refinement of the latest
`shared-ui` form engine, not a greenfield implementation.

Build it from the same basis as the stronger domains:

- clear public entry
- canonical types
- schema-friendly surface
- composables for orchestration
- utils for pure logic
- components for rendering

## Shared-UI Baseline Rule

Before implementing, refactoring, or simplifying an existing form feature, inspect the
corresponding `shared-ui` implementation first.

Treat the `shared-ui` structure as the default architecture to preserve for:

- provider-owned form APIs
- inline/modal/drawer/fullscreen layout split
- layout cleanup and transition lifecycle
- form actions and submit controls
- state and output inference
- field config and field-owned type resolution
- field runtime APIs
- context/dependency/query orchestration
- validation and i18n wiring

Adapting is allowed only when the Nuxt UI version has a concrete reason:

- a different primitive with a better ownership boundary
- stronger type inference
- clearer runtime ownership
- less reactive waste without losing capability
- a simpler public API that keeps the same power
- removal of a Naive UI-specific workaround

Invalid reasons to diverge:

- fewer files
- shorter code
- temporarily avoiding a difficult lifecycle problem
- collapsing renderer, layout, provider, actions, and cleanup into one component
- moving field-owned logic into broad global engine files

When in doubt, preserve the `shared-ui` split first. Simplify only after proving the replacement
keeps the same capability, separation, and extension path.

## Required Form Folder Split

Every non-trivial part of the form engine should live in an isolated concern folder.

Use this shape as the default:

```txt
src/runtime/form/
  components/
    root/
    renderer/
    layout/
    actions/
    provider/
    utils/
  composables/
  fields/<field-kind>/
  types/
  utils/
```

Do not put provider lifecycle, layout shell, field rendering, actions, and runtime orchestration
into one component just because the current implementation is young.

## Long-Term Goal

It should become easy to maintain and easy to adopt in the same way as the table/query-state surfaces.

When adding form features, bias toward:

- the same placement rules
- the same inference-first public API style
- the same example-driven consumer skill standard

## Current V1 Ownership

- `fields/index.ts` is the field-kind capability registry; alpha-select is intentionally excluded.
- Each field kind owns its types and config, while shared visual implementations live in focused
  family folders such as `date-family/` and `hierarchy/`.
- `utils/state.ts` owns recursive defaults, validation, and output for objects, groups, arrays,
  discriminated variants, and matrices.
- `use-field-options.ts` and `use-form-context-resources.ts` pass complete TanStack Query options
  into observers; never reconstruct or manually invoke a query function.
- `use-form-option-registry.ts` and `use-form-upload-registry.ts` bridge mounted field work into
  field APIs without moving option or upload ownership into the runtime facade.
- Repeated fields reconcile cloned item content into stable reactive array slots through
  `utils/array.ts`; replacing an index-addressed array while controls are mounted can let stale
  controlled input state overwrite a moved row on the next Vue render.
- `components/layout/` owns overlay-specific configuration; the provider and root renderer only
  coordinate lifecycle.
- `types/ui.ts`, `utils/ui.ts`, and `use-form-ui.ts` own the presentation contract. Preserve the
  app config, schema, rendered-form, then field `props` precedence; every new structural renderer
  must expose named UI slots and every Nuxt UI control must inherit the shared control size.
- Group and input-group renderers use `UFieldGroup` with bare child renderers so intermediate
  field nodes collapse through `display: contents`. Matrix and array-table own their semantic
  table slots and center or contain nested controls instead of leaking cell layout into field kinds.

- `use-form-root.ts` owns a rendered form's root: it creates the runtime and binds it to the
  controller, provides the runtime and the UI config, guards dirty navigation (not for hash-only
  navigations, nor for navigations made while a submit is pending), autofocuses, and owns submit,
  cancel, and the context loading states. `components/root/form.vue` and
  `components/page/form-page.vue` both render from it; do not re-grow that logic in a component.
- `utils/controls.ts` reads schema `controls` and `ui`; reuse it instead of re-reading the schema.
- `use-form-actions.ts` resolves the action list (the default `slot` comes from the caller) and
  `use-form-action-buttons.ts` turns actions into buttons: visibility, disabled and loading states,
  links, and what a click runs. The form footer and `FormPageActions` both render from them.
- A successful submit rebaselines the state in the runtime, so dirty tracking restarts from the
  saved values.
- Form pages: `schema/page.ts` generates one `card` field per section and keeps `sections` on the
  schema, so the runtime, validation, dependencies, and output inference see a normal schema.
  `utils/page.ts` pairs sections with their cards and resolves each section's state (status,
  missing, optional, dirty paths) from the runtime. `use-form-page.ts` shares the page state and
  actions through provide/inject, and `use-form-page-scroll.ts` owns the scrollspy, scrolling to a
  section, and the URL hash. `components/page/` holds the root and its public parts;
  `form-page-section.vue` scopes the section grid by providing a runtime copy whose
  `currentLayout` is the section layout, the way a step scopes it. Every element a page part
  renders takes a `FormPageUi` slot; keep it that way when adding one. Sections and the pinned
  navigation read `--nut-form-page-header` (set by `FormPage` from the measured header) plus
  `--nut-form-page-gap`, resolved where they are used so a wrapper can override either.
- Section status is `invalid | pending | complete | optional`, decided by the pure
  `resolveFormPageSectionStatus` in `utils/page.ts`. It is honest on purpose (UX audit): an optional
  section nobody entered a value in is `optional`, never `pending`, and the navigation counts only
  the statuses in `BLOCKS_SUBMIT` (`invalid`, `pending`) as left to complete. `invalid` needs no
  extra rule because `runtime.errors` only holds errors of touched or submitted paths. The
  `form.page.status.*` messages serve the screen reader text and the visible "Optional" tag, so a
  new status needs its message, its `BLOCKS_SUBMIT` entry, and its indicator style together.
- Page surface and navigation threshold: `ui.page.surface` (`FormPageUiConfig`, merged through
  `mergePart`, whose spread also carries `surface`) selects an entry of the `FORM_PAGE_SURFACES`
  table in `utils/page-surface.ts`. Its strings are the default classes of the root background, the
  sections stack, a section, its description, and the skeleton, and `useFormPage` exposes
  `surface` and `surfaceClasses` to every part. `navigation.minSections` is read by
  `getFormPageNavigationMinSections` and drives `navigationVisible` (visible sections, so
  conditions count), which `FormPageNavigation` (it renders nothing) and the `FormPage` body
  (a single centered column) both follow. A new surface or layout is a table entry, not a branch in
  a component.
- `use-field-control.ts` exposes the authored `placeholder` only. The `shared-ui` baseline
  restored a generic default ("Enter a value") through i18n; that default is removed on purpose
  (UX audit: it repeats the label and reads like pre-filled noise for non-technical users), so a
  control shows a placeholder only when the schema authors one and no
  `form.fields.text.defaultPlaceholder` key exists. Date-family, color-picker, and one-time-code
  keep their own format and visual hints because those are not generic prompts.
- `utils/disabled.ts` owns the author-driven part of disabling: `isFieldDisabledByCallback` feeds
  `useFieldControl`, and `resolveFieldDisabledReason` feeds `FormFieldShell`, which renders the
  reason in the `UFormField` `help` slot (after the help copy, with the string `help` prop kept so
  Nuxt UI still wires `aria-describedby`). Engine-driven disabling (pending action, loading
  options) never carries a reason. Items of a primitive array render bare, so `disabledReason` is
  part of `ItemFieldChrome` there.
- Rich options: `FormOption` carries `icon`, `avatar`, `chip`, `suffix` next to `label` and
  `description`, and `normalizeOptionItem` resolves them into `ResolvedFormOption` (public, defined in
  `types/options.ts`) with the authored option untouched as `item`. The parts live in
  `components/utils/form-option-*.vue`: `leading` (icon, else avatar, else chip), `suffix`,
  `item-label` (menu label, load-more row, `renderOption`), `choice-label` (radio and checkbox rows),
  `display-value` (closed control), and `value-overlay` (the auto-complete draws a `renderValue`
  or suffix over its input while it rests, copying the input's padding and type).
  `use-option-menu.ts` serves select and auto-complete (menu items, selected option, leading and
  custom value), `use-choice-group-items.ts` serves radio and checkbox group. Both fill the Nuxt UI
  slots (`item-leading`, `item-label`, `item-trailing`, `leading`, the default slot, `label`) and
  never the `item` slot, so the control keeps its own indicator. An empty slot would bring back the
  Nuxt UI default, hence `FormOptionLeading` always rendering a component. The radio and checkbox
  groups get plain items (value, label, description, disabled, `ui.description` indent) because a
  checkbox group binds item keys onto `UCheckbox`, where `icon` is the check mark. `renderOption` and
  `renderValue` are read from the field (not `props`), declared as methods so a callback annotated
  with `FormOptionRenderContext<MyOption>` fits an inline schema. Select and auto-complete have the
  `optionGroups` capability: `toMenuItems` (`utils/options.ts`) turns grouped options into one array
  per group with a `type: 'label'` heading, which Nuxt UI filters group by group on search.
- `fields/choice-card/` is the presentation `radio-card` and `checkbox-card` share: the grid
  (`--nut-choice-columns`), the corner check, and the icon tile, with `ui.tile` and `ui.check` for
  the parts the engine renders. `checkbox-card` strips option icons from the items it hands to
  `UCheckboxGroup`, because a checkbox `icon` is its check mark: for the same reason
  `useChoiceCard` takes the `kind` of group (`ICON_UI`) and only hides the Nuxt UI `icon` slot of
  a radio group, where it is a duplicate of the option icon the card label already draws.
  `ResolvedFormOption.group` carries an option's heading and `choice-card/utils.ts` splits the
  items into headed groups (pure, first-appearance order). Grouping is opt-in through the option
  keys: `normalizeOptionItem` reads a heading only from the property `FormOptionKeys.group` names,
  never from a raw `group`. Only the kinds that declare `options.groups` in their registry config
  (the `optionGroups` capability) get that key, from `resolveOptionGroupKey(field)`: the field's top-level
  `groupKey` (`FormChoiceCardGrouping`, read statically like `labelKey` and `valueKey`; `false` opts out)
  when set, else `'group'` for options written inline in the schema (an array, or a `source`
  array), else none, so the records a function, promise or query returns are never regrouped by a
  `group` they happen to carry. The key is never read from `props`: a dynamic `props` callback may
  read `api.options`, so deriving the option keys from it forms a computed cycle (items, keys,
  props, `api.options`, items) that throws on mount. Nuxt UI's `RadioGroup` and `CheckboxGroup` cannot place a heading between their
  items, so each heading gets its own group with the heading as its `legend`; for `radio-card`
  that means one tab stop per group and a
  selection shown only in the group of the chosen option, which is the accepted cost of keeping
  Nuxt UI's card styling instead of re-implementing the radio group. Every group receives the
  same control attributes, but an `id` names one element: `choiceCardGroupAttrs` keeps the control
  id on the first group and gives each later group `<id>-group-<index>`, a suffix Vue's `useId` never generates (in bare mode, a table or matrix
  cell, the id is always set; in a normal field Nuxt UI generates one per group), while
  `data-form-field` and the accessible name stay on every group so focus moving between groups does
  not leave the field. `density: 'compact'` selects
  the `compact` entry of `LAYOUT_UI` in `use-choice-card.ts` (a two-column label grid) and moves the
  description from the Nuxt UI group (stripped from its items) into `ChoiceCardLabel`. Nuxt UI
  centers the wrapper of a card whose indicator is hidden (`corner`, `switch`, `hidden`), so the
  compact wrapper stretches (`items-stretch`) to keep the label at the card edge.

- `fields/info/` draws read-only blocks: a notice from `content`, or a display block from `display`
  and `props` through the display runtime (see `display-runtime.md`). `use-info-display.ts` owns
  static, derived, promise and query props; a label or supporting copy wraps the block in
  `FormFieldShell`. `FormFieldFormApi.close()` calls the cancel the form root binds with
  `runtime.bindCancel`, so callbacks close the form the way its Cancel action does.

When adding a field, update the local type/config/component, assembled union, registry, renderer,
value/output inference, recursive state ownership where relevant, tests, playground, and consumer
skill as one maintenance surface.
