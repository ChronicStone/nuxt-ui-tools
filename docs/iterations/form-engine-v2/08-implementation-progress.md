# Implementation Progress

This file records the concrete form-runtime slices as they land.

## 2026-05-11

### Type-Layer Foundation

Implemented the first `src/runtime/form` foundation around literal schema authoring rather than a per-field builder DX.

Current public helpers:

- `defineFormSchema`
- `defineFormField`
- `defineFormFields`

Current public extraction types cover:

- form-scoped context resources
- authored fields
- authored steps
- internal form value
- submitted form output
- individual field internal/output values

### Field Kind Registry

Added a per-field folder structure under `src/runtime/form/fields/*/config.ts`.

The initial registry covers:

- foundation fields: `text`, `select`, `checkbox`, `number`, `hidden`, `info`, `divider`, `input-group`, `object`, `custom-component`
- scalar fields: `password`, `textarea`, `radio`, `date`
- file lifecycle fields: `file`, `upload`
- array/container fields: `array-list`, `array-tabs`, `array-variant`
- late/simple fields currently represented in the type layer: `slider`, `tag`, `button`

The field-kind config currently records state model, UI chrome, layout ownership, option support, upload support, validation support, and transform support. This is the seed for deriving field-specific authored properties from field-kind capabilities later.

### Ported And Refined Type Behaviors

Implemented dotted-path output inference:

```ts
{ key: 'profile.name', type: 'text' }
```

infers:

```ts
{
  profile: {
    name: string | null
  }
}
```

Implemented stepped-schema output inference, including no-stepper schemas and root mapping:

```ts
defineFormSchema({
  showStepper: false,
  steps: [
    {
      key: 'credentials',
      fields: [],
    },
  ],
})
```

```ts
defineFormSchema({
  steps: [
    {
      key: 'metadata',
      root: 'meta.extra',
      fields: [],
    },
  ],
})
```

Implemented output-only omission through:

```ts
submit: {
  omit: true,
}
```

This replaces the legacy broad `omit` shape with a more explicit submit/output namespace while keeping the field present in internal form state.

Implemented conditional-field output optionality:

```ts
{
  key: 'erpId',
  type: 'text',
  condition: () => true,
}
```

infers:

```ts
{
  erpId?: string | null
}
```

### Context And Options

Added the first typed context resource model:

- plain context values expose a stable `.value`
- promise/query-backed context values expose `.value | undefined`
- field callbacks receive `{ ctx, deps, api }`
- option sources can be static arrays, sync callbacks, promises, or TanStack Query options

This is only the type contract. Runtime context/query orchestration and magic loading propagation are still pending.

### Current Validation

Focused checks passing:

```sh
bun run test test/form/schema-inference.test.ts test/form/output-inference.test.ts test/form/stepped-output-inference.test.ts test/form/field-kind.test.ts
./node_modules/.bin/oxlint src/runtime/form test/form src/imports.ts
```

`bun run typecheck` currently reaches the form files cleanly, then fails on unrelated spreadsheet review/import issues already present in the worktree.

### Known Compromise

No-context stepped schemas currently preserve literal step/field output strongly. Context-aware stepped schemas are typed through the stricter schema contracts, but the exact field-callback contextual typing for every nested step/field still needs a stronger source-first helper model.

This should be revisited when the dependency/API layer is implemented, rather than patched with broad casts or duplicated schema types.

### Next Slice

The next implementation slice should focus on the typed callback/API boundary:

- define the namespaced form API and field API contracts in more detail
- separate field-local value operations, internal form-state operations, external form API operations, transformed output, options, upload, and validation
- introduce dependency source/result types without over-committing to typed raw paths yet
- add inference tests for callback `api`, option item values, context resource values, and submit/output values across those API namespaces

Runtime state ownership should come after this slice, so the composables are built from the corrected API model instead of inheriting the legacy mirrored-state shape.

### Renderer And Playground Base

Added the first runnable renderer slice:

- public `NutForm` / `UiForm` component registration
- lean runtime state/controller composable
- dotted-path state reads and writes
- internal state initialization from defaults and input
- submitted output building with step roots, object nesting, `input-group` passthrough children, `submit.omit`, conditions, and `transform.output`
- basic required validation
- form-level reset, previous, next, and submit controls
- per-field `component.vue` files for:
  - `text`
  - `password`
  - `textarea`
  - `number`
  - `checkbox`
  - `select`
  - `radio`
  - `date`
  - `hidden`
  - `info`
  - `divider`
  - `object`
  - `input-group`
  - `custom-component`
  - array placeholder renderer

The playground route at `playground/app/pages/form.vue` now renders a stepped account form with:

- form layout columns and field spans
- step root output nesting
- dotted state paths
- context-derived select options
- nested object layout
- input-group rendering
- hidden/internal fields omitted from output
- transformed submit output preview

Validation after this slice:

```sh
bun run dev:prepare
bun run test test/form/schema-inference.test.ts test/form/output-inference.test.ts test/form/stepped-output-inference.test.ts test/form/field-kind.test.ts
./node_modules/.bin/oxlint src/runtime/form src/components.ts src/imports.ts test/form playground/app/pages/form.vue
bun run typecheck
bun run typecheck:playground
```

`bun run typecheck` and `bun run typecheck:playground` are form-clean but still fail on unrelated spreadsheet import/review issues in the current worktree.

The dev server was started successfully on:

```txt
http://localhost:3010/form
```

Server smoke check:

```sh
curl -I http://localhost:3010/form
```

returned `200 OK`.

Known runtime gaps for the next passes:

- async context/query resources are represented and can execute simple query functions, but TanStack Query integration and magic option loading propagation are not complete
- dependency typing/runtime remains skeletal (`deps` is still empty at runtime)
- field/form API namespaces are still only a base shape

## 2026-05-12

### Provider Form API And Overlay Layouts

Added the first provider-owned form API slice:

- public `<NutFormProvider>` component registration
- public `useFormApi` auto-import/export
- `$formApi`-style controller returned by `useFormApi`
- typed `createForm(schema, options)` with schema output inference
- typed submit result inference from `onSubmit`
- external controls for active provider-owned forms:
  - `getForm`
  - `isOpen`
  - `closeForm`
  - `submitForm`
  - `destroyAll`
  - `getController`

Provider-owned forms now register mounted runtime controls so external `closeForm` and `submitForm` go through the mounted overlay lifecycle instead of bypassing the visible UI.

Overlay rendering currently supports:

- `modal`
- `drawer`
- `fullscreen`
- responsive display mode values such as `drawer md:modal`
- close cleanup delayed until after the visible transition window

The responsive display mode uses the shared `useResponsiveValue` helper rather than re-implementing breakpoint resolution in the form runtime.

The playground route at `playground/app/pages/form.vue` now exposes the same account schema in:

- inline mode through `<NutForm :form="form" />`
- modal mode through `formApi.createForm(accountForm, { mode: 'modal' })`
- drawer mode through `formApi.createForm(accountForm, { mode: 'drawer' })`
- responsive overlay mode through `formApi.createForm(accountForm, { mode: 'drawer md:modal' })`

Consumer-facing guidance was started in:

## 2026-05-13

### Shared-UI Action Defaults And Action Split

Aligned the form action layer with the shared-ui baseline instead of keeping hardcoded root footer buttons.

Added:

- `types/actions.ts` for built-in and custom form action contracts
- `composables/use-form-actions.ts` for default/overridden action resolution
- `components/actions/FormActions.vue` for rendering and action dispatch

Default behavior now matches shared-ui:

- simple forms default to `submit`
- stepped forms default to `previous`, `next`, `submit`
- built-in defaults use the same label keys, width (`fill md:fit`), modal/inline slot behavior, conditions, and disabled behavior
- no decorative default icons are added by V2

### Focus And Validation Polish

Invalid-field focusing now calls `focus({ preventScroll: true })` before smooth scrolling the registered field wrapper into view.
This avoids the browser's instant focus jump taking over the intended smooth scroll behavior.

Submit/forward navigation now marks the relevant mounted stateful field paths as touched before validation display, including nested object and input-group descendants.

### Option Runtime Parity

Moved the mounted option runtime closer to shared-ui:

- `allowOptionsRefresh` controls whether option fields render the refresh affordance
- `disableOnLoading` defaults to enabled unless explicitly set to `false`
- `clearOnInvalid` clears selections that disappear from resolved options unless explicitly disabled
- `onOptionsChange` receives resolved options and field callback params
- created options support `selectOnCreation` and `revalidateFieldOptions`
- field APIs expose `api.options.refreshable()`

Option refresh still refreshes the inferred context resources first, then the field option source.

### Expanded Field Kind Coverage

Added structured per-kind folders for:

- `auto-complete`
- `radio-card`
- `checkbox-card`
- `switch-group`
- `rating`
- `time`

Each field has the standard `component.vue`, `config.ts`, `types.ts`, and `index.ts` split, and the field-owned output types are wired into the global output dispatch.

Focused tests now cover output inference for these field kinds:

```sh
bun run test test/form/output-inference.test.ts test/form/field-kind.test.ts
```

The playground showcase now renders the new fields and keeps the current live internal state, output, context resources, submitted output, and overlay result panels.

### Overlay Header And Passthrough Containers

Overlay layouts now use the Nuxt UI `content` slot as pure shells so visible header/content/footer chrome is owned by `FormRoot`.
This avoids duplicate visible titles while still passing a dialog title to the underlying primitive for accessibility.

`FormRoot` now owns the overlay close button in the same bordered header as the form title, matching the shared-ui responsibility split where layout primitives host the shell and form chrome owns title/stepper/actions.

Added shared-ui passthrough structural field kinds:

- `card`
- `column`

Both are registered as passthrough fields and do not create state/output nesting under their own keys.
Runtime traversal and type inference now treat `input-group`, `card`, and `column` as flat passthrough containers while keeping `object` as a nested object container.

### Stepped Lifecycle Hooks

Added the shared-ui stepped lifecycle hooks to the schema contract and runtime navigation:

- `onBeforeNext`
- `onBeforePrevious`
- `skipStep`
- `onStepSkipped`

Forward navigation validates the current step, runs `onBeforeNext`, then skips configured steps.
Backward navigation runs `onBeforePrevious` and skips configured previous steps.

Navigation pending state now feeds the form action pending surface for `next` and `previous` in addition to submit pending state.

- `skills/consumer/form/SKILL.md`

Focused validation after this slice:

```sh
bun run test test/form/output-inference.test.ts test/form/schema-inference.test.ts test/form/field-kind.test.ts
bunx vue-tsc --noEmit 2>&1 | rg "(src/runtime/form|playground/app/pages/form|test/form/output-inference|src/imports|src/components)"
```

The filtered form typecheck is clean. The full `vue-tsc` command still fails on unrelated non-form issues in the current worktree.

## 2026-05-13

### Overlay Split And Playground Entry

Refined the provider-owned overlay slice to match the `shared-ui` layout responsibility split more closely:

- `components/provider/FormProvider.vue` owns provider registration and active instances
- `components/provider/FormOverlayHost.vue` selects the current overlay layout
- `composables/use-form-overlay-controller.ts` owns mounted form controller binding, submit/cancel resolution, and runtime controls
- `composables/use-form-overlay-layout.ts` owns responsive display-mode resolution through shared `useResponsiveValue`
- `components/layout/ModalLayout.vue`, `DrawerLayout.vue`, and `FullscreenLayout.vue` own Nuxt UI layout shell and close-complete events
- the previous broad `FormOverlayRenderer.vue` path was removed

The playground now exposes the form runtime from the visible home surface and shell navigation:

- `/` home card: Form playground
- shell component navigation entry: Form Playground
- `/form` route: inline form plus modal, drawer, and responsive overlay buttons

Live browser validation was performed in the Codex in-app browser:

- opened `http://localhost:3010/`
- confirmed the Form playground card is visible
- opened `/form` through the card
- confirmed the inline form and live state/output panels render
- opened and closed modal overlay
- opened and closed drawer overlay
- opened and closed responsive overlay
- confirmed no browser console errors after the interaction pass

Focused validation after this slice:

```sh
bun run test test/form/output-inference.test.ts test/form/schema-inference.test.ts test/form/field-kind.test.ts
bunx vue-tsc --noEmit 2>&1 | rg "(src/runtime/form|playground/app/(app|pages/form|pages/index|composables/usePlaygroundNavigation)|playground/i18n|test/form/output-inference|src/imports|src/components|skills/consumer/form)"
./node_modules/.bin/oxlint src/runtime/form src/components.ts src/imports.ts test/form playground/app/app.vue playground/app/pages/form.vue playground/app/pages/index.vue playground/app/composables/usePlaygroundNavigation.ts playground/i18n/locales/en.json playground/i18n/locales/fr.json docs/iterations/form-engine-v2/09-structure-guidelines.md .agents/skills/nuxt-ui-tools-maintainer/references/form-runtime.md
```

The filtered form/playground typecheck is clean. The `rg` command exits `1` because it finds no matching errors.

Known remaining gaps after this slice:

- array rendering is intentionally a placeholder
- layout supports numeric columns/spans and `full`; responsive layout tokens need a dedicated pass
- validation is a basic required-rule shell, not Regle yet

### Focus, Live Validation, And Shared-UI Layout Defaults

Refined the validation and focus behavior against the shared-ui baseline:

- field validation messages now display only after the field has been touched/blurred, while external field errors remain immediately visible
- live validation continues after the first blur/touch, matching the previous Vuelidate-style interaction model
- `validate({ focus: true })` is supported on the form controller, form instance API, and callback `api.validate`
- `Next`, forward `goToStep`, and submit focus the first focusable invalid field
- mounted fields register a public focus boundary with the runtime, so focus is a first-class field/runtime capability rather than an ad hoc document query
- field APIs now expose `api.focus()`
- default placeholders are restored through i18n (`Enter a value` / `Saisissez une valeur`)
- the playground password confirmation now validates against the password field through typed dependencies

Aligned grid/item/subgrid sizing defaults with shared-ui:

- root form grid defaults to `8` columns
- field item span defaults to `8 md:4`
- nested object grids inherit the active form/step grid unless the object layout overrides `columns`
- grid and span resolution now use shared `useResponsiveValue`
- form/step layout merging preserves form-level layout values when a step only overrides part of the layout

Drawer overlay rendering was refined so the form header/content/footer are separate shell regions and footer controls stay pinned at the bottom while the field body scrolls.

Browser validation was performed on `http://localhost:3010/form`:

- focusing a field does not show validation errors
- blurring a touched invalid field shows the error
- `Next` focuses the first invalid field
- submit focuses the password confirmation field when it fails the match rule
- default placeholders render on fields without explicit placeholders
- drawer form footer remains fixed at the bottom in the visible overlay

Focused validation after this slice:

```sh
bun run test test/form/output-inference.test.ts test/form/schema-inference.test.ts test/form/field-kind.test.ts
bunx vue-tsc --noEmit --project tsconfig.json 2>&1 | rg "src/runtime/form|playground/app/pages/form|src/runtime/i18n"
./node_modules/.bin/oxlint src/runtime/form/composables/use-form-runtime.ts src/runtime/form/composables/use-form.ts src/runtime/form/composables/use-form-focus.ts src/runtime/form/composables/use-form-validation.ts src/runtime/form/composables/use-field-control.ts src/runtime/form/composables/use-form-layout.ts src/runtime/form/utils/focus.ts src/runtime/form/utils/layout.ts src/runtime/form/components/root/Form.vue src/runtime/form/components/renderer/FormFieldRenderer.vue src/runtime/form/components/renderer/FormFieldShell.vue src/runtime/form/components/layout/DrawerLayout.vue src/runtime/form/components/provider/FormOverlayHost.vue src/runtime/form/fields/object/component.vue playground/app/pages/form.vue src/runtime/i18n/types.ts src/runtime/i18n/locales/en.ts src/runtime/i18n/locales/fr.ts
```

### Field Surface And Option Dropdown UX

Expanded the shared-ui field surface with Nuxt UI-backed field folders:

- `switch`
- `checkbox-group`
- `color-picker`
- `one-time-code`

Each field has the standard local split:

- `component.vue`
- `config.ts`
- `types.ts`
- `index.ts`

Refined existing field UI/runtime behavior:

- date calendar now opens as an overlaid popover instead of rendering inline
- input-group now renders grouped child controls without nested field labels
- password/text/number/select support a dedicated grouped/bare rendering path
- modal/drawer/fullscreen form shells keep header/footer fixed while only field content scrolls
- the playground no longer overrides the root `8 md:4` field-span default

Option-backed select controls now expose dropdown actions:

- query/context-backed option refresh is visible inside the select dropdown
- `options.refresh()` refreshes tracked context resources first, then the field option query/source
- `options.create(label)` passes the user-entered label to the field create handler
- created options are appended to the mounted field option state and selected immediately

The playground was reorganized as a labelled showcase rather than a single scenario:

- Core inputs
- Options, context, and creation
- Layout and composed fields
- Collections and files
- Validation and transforms

The showcase now includes artificial async delays for context/options, a creatable query-backed select, dropdown option refresh, context refresh, checkbox-group, switch, color-picker, one-time-code, file/upload, array-list, input-group, and live state/output panels.

Focused validation after this slice:

```sh
bun run typecheck
bun run test test/form/output-inference.test.ts test/form/field-kind.test.ts
```

Live browser validation on `http://localhost:3010/form` confirmed:

- labelled showcase sections render
- date calendar opens as an overlay
- select dropdown displays the refresh action
- selecting refresh refetches the option query
- modal layout pins bottom actions while field content scrolls

## 2026-05-12

### Structure Correction Pass

Added `09-structure-guidelines.md` as the hard porting rule for the form engine.

Key decisions recorded there:

- `shared-ui` remains the architectural baseline, but not a frozen blueprint
- divergence is allowed only when it has a clear Nuxt UI, type-safety, ownership, or public API reason
- working behavior is not sufficient when type ownership or concern boundaries are degraded
- `types/output.ts` must stay engine-only
- field-specific value inference belongs with the field kind
- reusable runtime contracts belong in `types/`, not composables
- generic reusable utilities belong in `src/runtime/shared`

Concrete cleanup landed:

- moved public/runtime controller contracts out of composables into `src/runtime/form/types/controller.ts`
- moved internal runtime contracts into `src/runtime/form/types/runtime.ts`
- moved option runtime state/query contracts into `src/runtime/form/types/options-runtime.ts`
- moved concrete validation error shape into `src/runtime/form/types/validation.ts`
- moved generic path/object helpers into `src/runtime/shared/utils/path.ts`
- kept form-named path aliases in `src/runtime/form/utils/path.ts` as compatibility/clarity exports
- moved root/renderer components into concern folders:
  - `components/root/Form.vue`
  - `components/renderer/FormFieldRenderer.vue`
  - `components/renderer/FormFieldShell.vue`
- split field-specific output inference into field folders:
  - `fields/text/types.ts`
  - `fields/select/types.ts`
  - `fields/object/types.ts`
  - `fields/array-list/types.ts`
  - and the other currently registered field kinds
- moved authored field schema interfaces into each `fields/<kind>/types.ts`
- reduced `types/field.ts` to the public union and field type re-exports
- added `fields/<kind>/index.ts` files so each field folder has a stable local entrypoint
- reduced `types/field-output.ts` to the field-output dispatch layer
- kept `types/output.ts` focused on collection/step/path/root/internal-output engine assembly
- removed internal/output mode from field-owned output types
- moved output transform application up into `types/output.ts`, so mode-specific behavior stays in the graph engine

This is intentionally a structure correction, not a feature expansion. It keeps the current playground and inference behavior stable while restoring the field-owned type pattern from `shared-ui`.

Validation after this slice:

```sh
./node_modules/.bin/oxlint src/runtime/form src/runtime/shared src/components.ts src/imports.ts test/form playground/app/pages/form.vue
bun run test test/form/field-kind.test.ts test/form/dependencies.test.ts test/form/schema-inference.test.ts test/form/output-inference.test.ts test/form/stepped-output-inference.test.ts
bunx vue-tsc --noEmit --project tsconfig.json --pretty false 2>&1 | rg "src/runtime/form|test/form|playground/app/pages/form|error TS"
```

The first two commands pass. The `vue-tsc` filtered check reports no form/playground form errors; it only reports the known unrelated spreadsheet errors.

Important type note:

- `types/field-output.ts` still dispatches by the field discriminant (`{ type: 'select' }`, etc.) while importing field-owned output generics. Dispatching against the full field interfaces caused callback-heavy authored fields to fall through to `unknown` because TypeScript function-parameter variance is too strict for schema callbacks. This should be revisited when field capability composition is redesigned, but preserving inference wins for now.

Remaining structural work:

- replace type dispatch based on `{ type: '...' }` with field interface names once callback variance and capability composition are solved without losing inference
- colocate richer field prop types as Nuxt UI-specific field implementations mature
- continue reducing renderer conditional logic through the field instance/capability API

### State, Validation, And Submit Ownership Split

Refined the runtime ownership to better match the shared-ui architecture:

- `use-form-context-resources.ts` owns form-scoped `ctx` resource normalization
- `use-form-state.ts` owns internal state, output state, initialization, reset, and raw path get/set
- `use-form-validation.ts` owns validation errors, field errors, custom field errors, full-form validation, and current-scope validation
- `use-form-submit.ts` owns `actionPending`, `submitHandler`, schema `onBeforeSubmit`, schema `submit`, and the public `useFormSubmit` helper
- `use-form-runtime.ts` is now a facade that wires those owned composables together

The public form component now exposes and emits:

- live internal state
- live output state
- validation errors
- action pending state
- `validate`
- `submit`
- `submitHandler`
- `reset`
- `nextStep`
- `previousStep`

The playground now displays three side panels:

- live internal state
- live output state
- last submitted output

The `Next` action now validates the current step before navigation. Final submit validates the whole form before running the submit lifecycle.

Added inference coverage for `useFormSubmit` so submit handlers receive submitted output, including output transforms, rather than internal state.

Validation after this slice:

```sh
bun run test test/form/schema-inference.test.ts test/form/output-inference.test.ts test/form/stepped-output-inference.test.ts test/form/field-kind.test.ts
./node_modules/.bin/oxlint src/runtime/form src/components.ts src/imports.ts test/form playground/app/pages/form.vue
bun run typecheck
bun run typecheck:playground
```

Targeted tests and targeted lint pass.

`bun run typecheck` and `bun run typecheck:playground` remain form-clean but still fail on unrelated spreadsheet import/review issues in the current worktree. `typecheck:playground` also reports a Vue router Volar plugin resolution warning before the same spreadsheet errors.

Updated remaining gaps:

- Regle integration is still pending; current validation is a required-rule shell plus field-level custom errors
- submit handler maps, modal lifecycle, and action definitions are still pending
- touched/blurred state is still pending
- current-step validation exists, but step status metadata and skipped-step hooks are still pending

### Validation Boundary And Dirty State

Extended the validation shell so it is closer to the future Regle boundary:

- validation is now async-capable
- field `validation.rules` now execute in addition to `validation.required`
- rule results support `true`, `false`, string messages, `null`, and `undefined`
- validation errors and field-level custom errors are tracked separately and exposed as one combined error list
- `api.validation.validate()` now validates the mounted field path
- `api.validation.setError()` and `api.validation.clearError()` update custom field errors
- `Next` validates only the current step/scope
- final submit validates the whole form

Added dirty-state ownership to `use-form-state.ts`:

- initial state snapshot
- live dirty path derivation
- `isDirty`
- `dirtyPaths`

The form component now exposes and emits dirty state:

- `update:dirty`
- `update:dirtyPaths`
- exposed `isDirty`
- exposed `dirtyPaths`

The playground now displays pristine/dirty status and live dirty paths beside internal/output/submitted state.

Validation after this slice:

```sh
bun run test test/form/schema-inference.test.ts test/form/output-inference.test.ts test/form/stepped-output-inference.test.ts test/form/field-kind.test.ts
./node_modules/.bin/oxlint src/runtime/form src/components.ts src/imports.ts test/form playground/app/pages/form.vue
bun run typecheck
```

Targeted tests and targeted lint pass. Root typecheck remains form-clean but still fails on unrelated spreadsheet import/review issues.

Updated remaining gaps:

- Regle package/module integration is still pending
- i18n validation messages are not wired yet
- touched/blurred state is still pending
- validation modes such as required-only/rules-only are still pending
- submit handler maps, modal lifecycle, and action definitions are still pending
- step status metadata, skipped-step hooks, and before-next/before-previous hooks are still pending

### Dependency Runtime Baseline

Ported the shared-ui dependency behavior into the new runtime:

- string dependencies resolve from form state and keep their own key as the dependency target
- tuple dependencies support `[source, target]` aliases
- `$root`, `$parent`, and `$parent:n` scoped paths resolve against the mounted field parent path
- dotted dependency paths preserve the engine behavior where dotted keys map to nested state

Replaced the placeholder `{}` deps in callback plumbing:

- field props
- disabled
- condition
- options
- render/content callbacks
- output transforms
- validation required/rules

Added the first dependency type extraction surface:

```ts
type Deps = ExtractFormFieldDependencies<Field, ExtractFormInternalValue<typeof schema>>
```

Absolute paths resolve against the extracted internal state. `$parent` paths currently resolve to `unknown` at type level because their exact value depends on the mounted parent path; this should be refined when mounted field context typing lands.

Important current limitation: inline `defineFormSchema` callbacks still receive the existing contextual `deps` shape from the field union. A recursive schema constraint experiment typed inline deps but degraded literal field inference under `vue-tsc`, so it was intentionally not kept. The extraction type remains the safe baseline until the schema helper can be redesigned without losing ctx/field inference.

Validation after this slice:

```sh
bun run test test/form/dependencies.test.ts test/form/schema-inference.test.ts test/form/output-inference.test.ts test/form/stepped-output-inference.test.ts test/form/field-kind.test.ts
./node_modules/.bin/oxlint src/runtime/form src/components.ts src/imports.ts test/form playground/app/pages/form.vue
bun run typecheck
bun run lint
curl -I http://localhost:3010/form
```

Targeted form tests and targeted lint pass. The playground route still returns `200 OK`.

`bun run typecheck` remains blocked only by unrelated spreadsheet import/review errors. `bun run lint` remains blocked only by unrelated `.claude/worktrees/*` table lint errors.

### Live Validation Baseline

Switched field validation from submit/next-only to live mounted-field validation:

- `useFieldControl` now watches the mounted field value and runs field-scoped validation after the field has become validation-dirty.
- fields become validation-dirty on first blur, matching the old Vuelidate behavior where the first edit does not immediately show an error.
- Submit still validates the whole form and step navigation still validates the current step/scope.
- Field-scoped validation now only replaces errors for the field being validated instead of clearing every sibling under the same parent/root path.
- Async field validation uses a per-scope run guard so stale validation responses from fast input changes cannot overwrite newer field validation results.

The validation trigger is now configurable through `validation.trigger`:

- `blur`: default Vuelidate-style lazy-live behavior
- `input`: immediate live validation on value change
- `submit`: quiet field validation until form/step validation runs

Validation after this slice:

```sh
bun run test test/form/dependencies.test.ts test/form/schema-inference.test.ts test/form/output-inference.test.ts test/form/stepped-output-inference.test.ts test/form/field-kind.test.ts
./node_modules/.bin/oxlint src/runtime/form src/components.ts src/imports.ts test/form playground/app/pages/form.vue
bun run typecheck
curl -I http://localhost:3010/form
```

Targeted form tests and targeted lint pass. The playground route still returns `200 OK`.

`bun run typecheck` remains blocked only by unrelated spreadsheet import/review errors.

## 2026-05-12

### Controller-Based Form API

Introduced `useForm` as the primary typed form action/controller API.

The intended render shape is now:

```vue
<NutForm :form="form" />
```

instead of mirroring internal state through many template events.

The controller owns the public exposed context:

```ts
const form = useForm({
  schema,
  onSubmit: ({ formData }) => saveProfile(formData),
})

form.state.internal
form.state.output
form.meta.isDirty
form.validation.errors
form.submission.isSubmitting
form.navigation.currentStep
```

Current controller namespaces:

- `schema`, `input`, and `context`
- `state`: typed internal value, typed output value, raw path `get`, raw path `set`, and `reset`
- `meta`: mounted binding state, dirty state, and dirty paths
- `validation`: errors, validity booleans, full-form validation, current-step validation, error lookup, and error clearing
- `submission`: pending action, submit pending state, `submit`, and `submitHandler`
- `navigation`: current step, step summaries, first/last/can-move booleans, `next`, `previous`, and `goTo`

The initial controller-level `api` facade was removed after review because it repeated the
same sections and made the exposed context feel broader than it was. Controller consumers
should use the named sections directly. Callback-level `api` objects remain separate and
scoped to their callback context.

The controller is typed from the schema:

- `form.state.internal` uses `ExtractFormInternalValue<typeof schema>`
- `form.state.output` uses `ExtractFormOutput<typeof schema>`
- `form.context` uses `ExtractFormContext<typeof schema>`
- submit handlers receive transformed submitted output

`useFormSubmit` remains available for explicit ref/target-style submission, but the playground now uses the controller API as the main path.

The form runtime also exposes richer navigation controls internally:

- `currentStep`
- `isFirstStep`
- `isLastStep`
- `canGoPrevious`
- `canGoNext`
- `validateCurrentStep`
- `goToStep`

The `/form` playground was updated to use `useForm` and removed the previous event mirror surface:

```vue
@submit @update:state @update:output @update:dirty @update:dirty-paths
```

Browser validation against the running playground confirmed:

- controller-bound live internal state updates
- first edit stays quiet before blur
- first blur shows validation errors
- valid input clears validation errors
- step navigation still validates the current step
- query-backed select disables during first load and renders options once ready

Validation after this slice:

```sh
bun run test test/form/dependencies.test.ts test/form/schema-inference.test.ts test/form/output-inference.test.ts test/form/stepped-output-inference.test.ts test/form/field-kind.test.ts
./node_modules/.bin/oxlint src/runtime/form src/components.ts src/imports.ts test/form playground/app/pages/form.vue
bun run typecheck
```

Targeted form tests and targeted lint pass. Root typecheck remains form-clean but still fails on unrelated spreadsheet import/review errors in the current worktree.

### Field Instance API

Added the first internal field public instance API as a maintainability layer over raw
authored fields and field-kind config.

The goal is to make runtime checks declarative and registry-backed:

```ts
const field = createFormFieldInstance(rawField)

field.type.is('select')
field.type.isAny(['array-list', 'array-tabs', 'array-variant'])

field.state.is('stateful')
field.state.is('stateless')
field.state.is('passthrough')

field.capability.has('options')
field.capability.has('validation')
field.capability.hasAll(['label', 'description'])
```

The instance exposes:

- `raw`: the authored schema field
- `type`: field type value and type checks
- `state`: field-kind state model checks
- `capability`: declarative capability checks from field-kind config
- `config`: resolved field-kind config

This replaces the first mixed `field.is(...)` / `field.has(...)` draft because the
namespaced version is more explicit and avoids mixing type checks with state checks.

Initial consumers now use the field instance:

- form state/output/validation helpers for stateless, passthrough, object, array, and submit checks
- field control validation trigger checks
- option runtime option-capability checks
- field shell label/description/hint/validation checks
- field renderer item-layout checks

`FormFieldRenderer` also moved from a long template `v-if` chain to a component registry map
and a single dynamic component render.

Validation after this slice:

```sh
bun run test test/form/field-kind.test.ts test/form/dependencies.test.ts test/form/schema-inference.test.ts test/form/output-inference.test.ts test/form/stepped-output-inference.test.ts
./node_modules/.bin/oxlint src/runtime/form src/components.ts src/imports.ts test/form playground/app/pages/form.vue
bun run typecheck
```

Targeted form tests and targeted lint pass. Root typecheck remains form-clean but still fails
on unrelated spreadsheet import/review errors in the current worktree.

### Option Runtime Baseline

Added the first mounted-field option runtime:

- `use-field-options.ts` owns option source evaluation for mounted option fields.
- `use-form-option-registry.ts` lets mounted fields register their option state back into the form runtime so `api.options.*` reads the same source as the renderer.
- Static arrays, sync callbacks, promise-backed sources, and basic TanStack Query-backed sources now resolve through the same option state.
- Option state exposes normalized items, pending, fetching, loading, error, refresh, create, and `disableOnLoading`.
- `api.options` now exposes `get`, `pending`, `fetching`, `loading`, `error`, `refresh`, and `create`.
- `select` renders Nuxt UI loading state from option loading and disables itself during first-load when `disableOnLoading` is enabled.
- The playground now includes a query-backed Department select to exercise option loading/disable behavior on `/form`.

### Context Query Store And Loader Propagation

Added the first form-scoped context query runtime:

- query-backed schema context resources now run through TanStack `useQuery`
- context resources expose `value`, `error`, `pending`, `fetching`, `loading`, and `refresh`
- option callbacks are evaluated with tracked `ctx` access
- option fields inherit pending/fetching/error state from the context resources they touch
- query-backed option fields wait for touched context resources before starting their own query
- `api.options.refresh()` refreshes touched async context resources before refreshing the field option source

This supports the intended magic path:

```ts
const schema = defineFormSchema({
  context: {
    countries: () =>
      queryOptions({
        queryKey: ['countries'],
        queryFn: () => api.countries.list(),
      }),
  },
  fields: [
    {
      key: 'country',
      type: 'select',
      options: ({ ctx }) => ctx.countries.value ?? [],
    },
  ],
})
```

The field does not manually declare that it depends on `countries`; the option runtime tracks the
context access and derives the loader state.

The playground now shows:

- live internal state
- live context resources
- live submitted output
- a first-step `Preferred country` select backed by `ctx.countries`
- a `City catalog` select whose query options are derived from context data
- a raw query-backed `Department` select

Browser validation against `http://localhost:3010/form` confirmed:

- the route renders after a clean dev-server restart
- first-step required validation still appears on submit/next
- internal/output panels update from typed controller state
- `ctx.countries` resolves from pending to a typed option payload
- the context-backed select stops showing its blocking loader once the context query resolves

Validation after this slice:

```sh
bun run test test/form/field-kind.test.ts test/form/dependencies.test.ts test/form/schema-inference.test.ts test/form/output-inference.test.ts test/form/stepped-output-inference.test.ts
./node_modules/.bin/oxlint src/runtime/form src/runtime/shared src/components.ts src/imports.ts test/form playground/app/pages/form.vue docs/iterations/form-engine-v2
bunx vue-tsc --noEmit --project tsconfig.json --pretty false 2>&1 | rg "src/runtime/form|test/form|playground/app/pages/form"
bun run typecheck:playground
```

Focused tests and lint pass. The filtered root `vue-tsc` check reports no form errors.
`typecheck:playground` is clear for the form playground, then remains blocked by unrelated
spreadsheet import/review errors already present in the current worktree.

### Field API Refresh Surface

Extended the field callback API with a typed context namespace:

```ts
options: ({ api }) => {
  void api.context.refresh('countries')
  void api.context.refreshAll()
  void api.options.refresh()
}
```

Current behavior:

- `api.context.get(key)` reads a typed form-scoped context resource.
- `api.context.refresh(key)` only accepts async context resource keys.
- `api.context.refreshAll()` refreshes every async context resource available to the form.
- `api.options.refresh()` refreshes every async context resource that the option source touched,
  then refreshes the field option source itself.

Type coverage now asserts:

- `api.context.get('countries').value` preserves the context query result type
- `api.context.refresh` accepts `countries` and promise-backed `session`
- `api.context.refresh` rejects sync `tenant`
- `api.context.refreshAll()` returns `Promise<void>`

Current limitations:

- Query-backed option runtime keeps only the core query shape (`queryKey`, `queryFn`, `enabled`) for now. Rich TanStack options such as stale time, placeholder data, select, retry, and dependent query context should be folded in deliberately.
- Option creation calls the configured handler and appends the returned option locally, but the creation callback does not yet receive the typed raw input label.
- Magic loading across deeper context dependency chains still needs a dedicated pass.

Validation after this slice:

```sh
bun run test test/form/dependencies.test.ts test/form/schema-inference.test.ts test/form/output-inference.test.ts test/form/stepped-output-inference.test.ts test/form/field-kind.test.ts
./node_modules/.bin/oxlint src/runtime/form src/components.ts src/imports.ts test/form playground/app/pages/form.vue
bun run typecheck
curl -I http://localhost:3010/form
```

Targeted form tests and targeted lint pass. The playground route still returns `200 OK`.

`bun run typecheck` remains blocked only by unrelated spreadsheet import/review errors.

### Typed Context And Option Mutation Surface

Extended the field callback API with typed manual mutation helpers:

```ts
options: ({ api }) => {
  api.context.set('session', { id: 'session_2' })
  api.context.update('session', (value) => ({ id: value?.id ?? 'session_2' }))
  api.context.patch('session', { id: 'session_3' })
  api.options.add({ label: 'Spain', value: 'ES' })
}
```

Current behavior:

- `api.context.set(key, value)` replaces the exposed context resource value.
- `api.context.update(key, updater)` derives a new context value from the previous one.
- `api.context.patch(key, patch)` shallow-patches object context values and rejects array/primitive context values at type level.
- query-backed context resources patch TanStack Query cache through the context resource setter.
- sync and promise-backed context resources patch their local resource value directly.
- `api.options.add(option)` appends a local option without calling the configured async create handler.

Type coverage now asserts:

- context `set` and `update` preserve the specific resource value type.
- context `patch` accepts object resources such as `session`.
- context `patch` rejects array resources such as `countries`.
- option `add` preserves the field option item value shape.

Validation after this slice:

```sh
bun run test test/form/field-kind.test.ts test/form/dependencies.test.ts test/form/schema-inference.test.ts test/form/output-inference.test.ts test/form/stepped-output-inference.test.ts
./node_modules/.bin/oxlint src/runtime/form src/runtime/shared src/components.ts src/imports.ts test/form playground/app/pages/form.vue docs/iterations/form-engine-v2
bunx vue-tsc --noEmit --project tsconfig.json --pretty false 2>&1 | rg "src/runtime/form|test/form|playground/app/pages/form|error TS"
curl -I http://localhost:3010/form
```

Focused tests and targeted lint pass. The filtered root `vue-tsc` check reports no form errors.
The playground route still returns `200 OK`.

Root `bun run lint` remains blocked only by unrelated `.claude/worktrees/*` table lint errors.
