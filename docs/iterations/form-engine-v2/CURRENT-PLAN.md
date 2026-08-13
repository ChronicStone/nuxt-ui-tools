# Current Plan

This is the living plan for the `src/runtime/form` implementation.

Last updated: 2026-05-12.

## Current Goal

Build the form runtime as a port-plus-cleanup of the legacy `tars-shared-ui` form engine.

The first real migration target is `exassess-app-cloudflare`. Tars Profile remains a useful stress-test/reference app, but Exassess field usage should drive V1 field scope.

Preserve the legacy product model and primary authoring style:

- literal schema object DX
- `defineFormSchema`, `defineFormField`, and `defineFormFields`
- registry-driven field behavior
- lazy field runtime through mounted field context
- nested form state
- stepped forms
- modal form API
- field options, option creation, and option refresh
- input/output transform pipeline
- real renderer vertical slices early

Do not switch to a per-field builder DX.

## Main Redesign Targets

- tighter field property ownership
- smarter field definitions grouped by field kind
- form-scoped typed context
- inferred context dependency tracking for option loading
- clearer option async model with TanStack Query support
- clearer layout naming
- overhauled form and field APIs
- Regle-based validation with i18n support
- detailed public JSDoc across meaningful types, properties, and methods

## Public Authoring Direction

The primary API remains literal schema objects:

```ts
const schema = defineFormSchema({
  context: {
    items: () =>
      queryOptions({
        queryKey: ['items'],
        queryFn: () => api.items.list(),
      }),
  },
  fields: [
    {
      key: 'item',
      type: 'select',
      label: 'Item',
      options: ({ ctx }) => ctx.items.value,
    },
  ],
})
```

`defineFormField` and `defineFormFields` remain inference helpers for extracted field groups.

## Form-Scoped Context

Context is declared on the form schema and is fully typed everywhere it is consumed.

Context shape is free. The public `ctx` should expose the actual normalized context result in a way that preserves strong typing without forcing every context value into one generic wrapper shape.

Context entries do not depend on other context entries. This avoids hard-to-type dependency graphs and keeps context inference predictable.

Field callbacks that previously received `{ deps, api }` now receive `{ ctx, deps, api }`.

## Field Options

Option-based fields support three official modes:

```ts
// Static options, no context dependency.
options: ['A', 'B']

// Synchronous local derivation from form context.
options: ({ ctx }) => ctx.items.value.map(toOption)

// Field-owned async query or promise depending on form context.
options: ({ ctx }) =>
  queryOptions({
    queryKey: ['children', ctx.parent.value],
    queryFn: () => api.children.list(ctx.parent.value),
    enabled: Boolean(ctx.parent.value),
  })
```

The field option runtime owns its own async state when `options` returns a query or promise.

The loader state is inferred by runtime access tracking. No manual dependency declaration surface should be exposed for context usage.

Loading should be smart:

- show loading when there is no usable option data yet
- show loading during an explicit user-triggered refresh
- do not show disruptive loading for normal cache background refresh when existing data is usable

Context or option errors should be handled gracefully:

- disable or soften the option field when required data is unavailable
- expose a field-level option error state
- allow a refresh affordance when refresh is available
- validation should fail only through normal field validation rules, such as a required field with no valid value

## Field Definition Organization

Use a per-field folder so all parts of one field kind are colocated:

```txt
src/runtime/form/fields/select/
  component.vue
  config.ts
  types.ts
  index.ts
```

This accepts repeated `component.vue` names in exchange for strong locality. Field folders are the searchable unit.

Renderer/layout shell components still belong under `src/runtime/form/components`.

## Field Configuration Model

Prefer one generic field-definition/config helper with structured configuration over many visible capability type intersections.

The config should explicitly declare field behavior and feature toggles in a smart, type-driving way.

Example direction:

```ts
export const selectField = defineFormFieldKind({
  type: 'select',
  state: 'stateful',
  ui: {
    label: true,
    description: true,
    hint: true,
  },
  layout: {
    item: true,
  },
  options: {
    enabled: true,
    multiple: ({ props }) => props.multiple === true,
  },
  validation: true,
  transform: true,
  component: () => SelectField,
})
```

The authored field type should be derived from this field-kind configuration so irrelevant properties are rejected.

Examples:

- `hidden` does not get label, description, hint, or layout UI properties
- `card` and `column` get children but no output state
- `select` gets options
- `text` does not get options
- object/array fields get container layout properties

## Field Kinds

Preserve the legacy field set where useful.

Important current decisions:

- `card` and `column` remain passthrough structural fields
- `array-list`, `array-tabs`, and `array-variant` remain separate field kinds for now
- array UI/config may be refined for more control
- legacy `group` should likely become `input-group`

`input-group` means several input/button-like controls rendered as one field block, backed by Nuxt UI `UFieldGroup`.

Nuxt UI FieldGroup reference: <https://ui.nuxt.com/docs/components/field-group>

`object` means a literal nested object grouping unrelated fields. It may support layout variants such as plain/card/section/fieldset, including a variant where children render as if they were not visually grouped.

The Exassess-focused field migration scope is tracked in [07-field-migration-scope.md](./07-field-migration-scope.md).

Current Exassess V1 target:

- foundation slice: `text`, `select`, `checkbox`, `number`, `hidden`, `info`, `divider`, `input-group`, `object`, `custom-component`
- core scalar fields: `password`, `textarea`, `radio`, `date`
- file lifecycle: separate local `file` and remote `upload` fields
- array/container completion: `array-list`, `array-tabs`, `array-variant`
- late simple fields if still needed: `slider`, `tag`, `button`

Fields deferred for Exassess V1 unless a current screen proves otherwise:

- `card`
- `column`
- `switch`
- `checkbox-group`
- `radio-card`
- `auto-complete`
- `tree-select`
- `phone-number`
- `one-time-code`

## Layout Naming

Move toward a `layout` object.

Example:

```ts
{
  key: 'firstName',
  type: 'text',
  layout: {
    span: 2,
  },
}

{
  key: 'address',
  type: 'object',
  layout: {
    variant: 'card',
    columns: '1 md:2',
    span: 'full',
  },
  fields: [],
}
```

`layout.span` replaces the legacy field placement meaning of `size`.

`layout.columns` replaces the legacy container meaning of `gridSize`.

Allowed layout keys depend on the field kind.

## Transforms

Move the legacy transform pipeline into a grouped object:

```ts
transform: {
  input: (raw, api) => internal,
  output: (internal, api) => submitted,
}
```

Legacy mapping:

- `preformat` becomes `transform.input`
- `transform` becomes `transform.output`

Dependency reads use current internal form state, not transformed submit output.

## API Direction

Completely overhaul the form and field APIs.

Prefer namespaced APIs over one large flat bag of overloaded methods.

Example direction:

```ts
api.value.get()
api.value.set(value)

api.form.get(path)
api.form.set(path, value)

api.options.get()
api.options.refresh()
api.options.create()

api.validation.validate()
api.validation.setError(message)
api.validation.clearError()

api.navigation.next()
api.navigation.previous()

api.lifecycle.close()
```

Raw string paths remain supported. Fully typed path helpers are not required for the first port.

The state target split must be explicit:

- field-local value operations
- form internal state operations
- external form API operations
- transformed output state

The first form-level controller API is now `useForm`.

Primary usage:

```ts
const form = useForm({
  schema,
  onSubmit: ({ formData }) => saveProfile(formData),
})
```

```vue
<NutForm :form="form" />
```

The exposed controller shape is organized by domain:

- `form.state`: internal/output values and raw path operations
- `form.meta`: mounted binding state and dirtiness
- `form.validation`: errors, validity, validation controls, and error controls
- `form.submission`: pending action, submit state, and submit handlers
- `form.navigation`: step snapshots and step controls
- `form.context`: fully typed schema context resources

Do not add a second controller-level `form.api` facade that repeats these namespaces.
Callback-level `api` objects still exist where they are scoped and useful, such as field
callbacks and submit lifecycle callbacks.

The old event mirror pattern is no longer the intended API for normal usage:

```vue
@submit @update:state @update:output @update:dirty @update:dirty-paths
```

`useFormSubmit` remains available as a lower-level explicit target helper, but `useForm` should drive the default DX.

## Validation

Use Regle for the new validation runtime.

Keep the overall validation architecture close to the legacy system:

- field-driven validation
- required validation
- rule validation
- custom errors
- validation status exposed to renderers and APIs
- i18n-aware default messages and overrides

Public validation contracts may wrap Regle where useful, but Regle-native usage should be supported.

Regle references:

- <https://reglejs.dev/>
- <https://nuxt.com/modules/regle>

## JSDoc Standard

Public form types must be heavily documented.

Add concrete JSDoc on meaningful:

- schema properties
- field properties
- context contracts
- option source types
- transform hooks
- validation hooks
- form API methods
- field API methods
- renderer/controller composables

JSDoc should include examples when they materially improve discoverability.

Write docs for package users, not maintainers.

## First Implementation Milestone

Build a vertical slice early:

- schema/context/options typing: in progress, initial extraction tests passing
- dependency runtime and inline callback dependency typing: initial pass implemented
- validation trigger control: initial `blur` / `input` / `submit` surface implemented
- mounted option runtime: initial static/promise/query-backed option state implemented
- controller form API: initial `useForm` implementation with typed state/output/context/submission/navigation implemented
- field-kind config helper: initial version implemented
- field instance API: initial registry-backed `type` / `state` / `capability` check surface implemented
- field registry: initial per-field config registry implemented
- initial fields:
  - text
  - select
  - checkbox
  - number
  - hidden
  - input-group
  - object
  - info
  - divider
  - custom-component
- Regle validation shell
- form renderer and field context: first renderer/runtime slice implemented
- state/output/validation/submit ownership split: implemented as first composable pass
- playground route: first runnable `/form` route implemented
- focused tests for inference, context options, dependencies, loader behavior, and output transforms: inference/output/dependency tests started; option loader playground coverage started

Then expand to arrays and the remaining field kinds.

Current implementation progress is tracked in [08-implementation-progress.md](./08-implementation-progress.md).

## Current Open Threads

- exact field-kind config helper shape
- whether `createFormFieldInstance` should remain an exported utility or become runtime-internal only
- exact public `ctx` shape for query resources while keeping free context shape
- exact API namespace names
- typed path helper design for `form.state.get/set`
- exact object layout variants
- exact array layout/action property names
- migration tolerance for legacy `size`, `gridSize`, `group`, `preformat`, and flat API names
