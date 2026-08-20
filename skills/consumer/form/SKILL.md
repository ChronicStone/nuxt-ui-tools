---
name: nuxt-ui-tools-form
description: Use this skill when working with the nuxt-ui-tools form runtime as a package consumer. It covers schema-driven forms, the provider-backed form API, inline rendering, overlay rendering, and typed submit results.
---

# nuxt-ui-tools Form

Use this skill when a consumer wants to render or control schema-driven forms.

The V1 form runtime is schema-driven and fully typed:

- define schemas with `defineFormSchema`
- render inline forms with `<NutForm>`
- wrap app or route content with `<NutFormProvider>` when using `useFormApi`
- open provider-owned overlays with `formApi.createForm(schema, options)`

Alpha select is intentionally not part of this package; use `select` or `tree-select` instead.

## V1 Field Set

The registry includes text, password, textarea, number, checkbox, switch, radio, select,
autocomplete, checkbox/radio cards and groups, slider, color, OTP, rating, tags, phone, file,
upload, date, time, datetime, date/month/datetime ranges, month, year, tree-select, cascader,
tree, hidden, info, divider, button, custom component, object, input-group, group, card, column,
array-list, array-tabs, array-table, discriminated array-variant, and matrix.

Matrix columns are normal form fields, so their values and validations are inferred for every row:

```ts
const permissionsForm = defineFormSchema({
  fields: [
    {
      key: 'permissions',
      type: 'matrix',
      rows: [
        { key: 'catalog', label: 'Catalog' },
        { key: 'orders', label: 'Orders' },
      ],
      fields: [
        { key: 'enabled', type: 'switch', label: 'Enabled' },
        { key: 'scope', type: 'select', options: ['own', 'all'] },
      ],
    },
  ],
})
```

The output is `{ permissions: { catalog: { enabled, scope }, orders: { enabled, scope } } }`.

Discriminated arrays use `variantKey` and keep each variant's output narrowed:

```ts
{
  key: 'contacts',
  type: 'array-variant',
  variantKey: 'kind',
  variants: [
    { key: 'email', label: 'Email', fields: [{ key: 'address', type: 'text' }] },
    { key: 'phone', label: 'Phone', fields: [{ key: 'number', type: 'phone-number' }] },
  ],
}
```

Array fields also support `headerTemplate`, `transformOnCreate`, `virtualFields`, conditional
base/custom actions, delete confirmation, extra-property preservation, tabs/list/table display,
and reordering. Virtual fields are included in inferred output, including variant-specific
virtual fields. Action callbacks receive the row `index`, `item`, full `items`, form `ctx` and
`deps`, plus row-relative `getValue`, `setValue`, and `getOptions` helpers.

## Inline Form

```vue
<script setup lang="ts">
import { defineFormSchema, useForm } from '#ui-tools/form'

const accountForm = defineFormSchema({
  formKey: 'account',
  title: 'Account',
  fields: [{ key: 'profile.email', type: 'text', label: 'Email' }],
})

const form = useForm({
  schema: accountForm,
  syncInput: ['profile.email'],
  validate: true,
  onSubmit: ({ formData }) => saveAccount(formData),
})

async function validateAndFocus() {
  await form.validate({ focus: true })
}
</script>

<template>
  <NutForm :form="form" />
</template>
```

`key: 'profile.email'` writes nested state and output at `profile.email`.

`form.validate({ focus: true })` runs validation and focuses the first focusable invalid
field. The same focus behavior is used by the built-in next/submit actions.

Fields validate live after their first blur/touch by default, so initial focus does not show
errors before the user has interacted with the field.

Validation is implemented with Regle internally. The runtime owns the Regle tree, required and
authored rule execution, async completion, collection (`array-list`, `array-table`, and variants)
paths, and stable field error mapping; consumers only author the existing `validation` config and
do not need to create a second validator or pass a Standard Schema adapter.

Mounted field callbacks can read `api.validation.pending()`. It is derived directly from the
Regle field and rule status, so it is `true` only while that field's asynchronous rules are
running, including nested array paths, and returns to `false` for both resolved and stale runs.
Built-in text, number, select, autocomplete, tree, switch, and button controls pass this state to
their Nuxt UI loading chrome; synchronous rules never flash a loader. Errors from an async run are
revealed after the promise settles, not while it is pending.

The renderer uses a native form submit event. Pressing Enter from a focused single-line control
runs the same validation and submit lifecycle as the built-in submit action, while Enter in a
textarea keeps its normal newline behavior.

`validate` accepts `true`, `false`, `'required'`, or `'rules'`. `syncInput` accepts `true` or a
list of paths; when omitted, later input changes do not replace local edits.

Schema `controls` can set `dirtyCheck`, `autoFocus`, `confirmNavOnDirty`, `syncInput`, and
`validate`. Stateful fields can define `watch`, `onDependencyChange`, `onRendered`,
`stateEffect`, `ignore`, `dirtyCheck`, and collapsible behavior.

Use `labelExtra` for rich content beside a field label, such as a password-recovery link. It
accepts renderable Vue content and takes precedence over the field's text-only `hint`.

Submit handlers receive typed external-error controls through `api.setError(path, message)` and
`api.clearError(path?)`. Map expected server failures to their owning fields and return
`{ success: false }`; use one application-level toast only when the failure is not mapped. Editing
a field clears its own external error automatically. When one error belongs to multiple fields,
declare those fields as dependencies and clear the sibling error from `onDependencyChange`.

In stepped forms, the built-in `Next` action validates only the visible step, then awaits
`onBeforeNext`. `actionPending` stays `'next'` for that entire transaction, so the Next button
shows its loader and other actions are disabled; duplicate calls return `false`. An async
`onBeforePrevious` hook similarly uses `'previous'` while the Previous action awaits. A stepped
submit also runs `onBeforeNext` after validation, then continues through `onBeforeSubmit` and
`submit`; its pending action changes from `'next'` to `'submit'` at that boundary. Return `false`
from `onBeforeNext` to cancel; a `void` result continues for compatibility with the Nuxt schema
contract. Next commits touched/error state for every invalid field in the visible step before it
focuses the first invalid control.

## Provider-Owned Overlays

Wrap the consumer app, layout, or route once:

```vue
<template>
  <NutFormProvider>
    <NuxtPage />
  </NutFormProvider>
</template>
```

Then open a form from anywhere under that provider:

```ts
const formApi = useFormApi()

const result = await formApi.createForm(accountForm, {
  id: 'account-create',
  mode: 'drawer md:modal',
  input: {
    profile: {
      email: 'ada@example.com',
    },
  },
  onSubmit: async ({ formData }) => {
    const account = await saveAccount(formData)
    return { success: true, data: account }
  },
})

if (result.isCompleted) {
  result.formData
  result.submitData
}
```

`mode` accepts `modal`, `drawer`, `fullscreen`, or a responsive value such as `drawer md:modal`.

Overlay forms keep their header and action footer outside the scrollable field viewport. Drawer
close resolution waits for the Nuxt UI close animation before completing or cancelling the provider
promise, and submit/close controls are disabled while an action is pending.

Schema-level `modal`, `drawer`, and `fullscreen` objects control sizing, placement, outside-click
dismissal, close-button visibility, and drawer resizing.

Every schema that can render as a modal should set an intentional `modal.maxWidth` and layout. Short
linear forms usually work best as one column around `500px`; wider modals should be reserved for
content that is genuinely easier to scan in multiple columns. Express changing grids with responsive
values so mobile drawers and fullscreen forms stay linear:

```ts
defineFormSchema({
  modal: { maxWidth: 720 },
  layout: {
    columns: '1 md:2',
    fieldSpan: '1 md:2',
  },
  fields: [
    { key: 'name', type: 'text', label: 'Name' },
    { key: 'description', type: 'textarea', label: 'Description' },
    { key: 'country', type: 'select', label: 'Country', layout: { span: 1 } },
    { key: 'city', type: 'text', label: 'City', layout: { span: 1 } },
  ],
})
```

Checkboxes, switches, upload controls, and other visually dominant fields should normally span the
full modal row instead of being paired with an unrelated text field merely because space exists.

TanStack `queryOptions(...)` objects can be used directly for context or field options. The form
observer retains the full query configuration, including `select`, retry/cache settings, meta,
initial/placeholder data, and query-function cancellation signals.

Option fields accept arrays, synchronous callbacks, promises, and TanStack query options. Use an
option config when options can refresh or be created:

```ts
{
  key: 'skill',
  type: 'select',
  createItem: true,
  options: {
    source: [{ label: 'TypeScript', value: 'typescript' }],
    allowOptionsRefresh: true,
    create: {
      handler: ({ label }) => ({ label, value: label.toLocaleLowerCase() }),
    },
  },
}
```

`createItem: true` enables the select or autocomplete's native typed-create row. Without it, the
same create handler is exposed as an explicit footer action, which is useful when creation opens a
nested form. A successfully created option is merged without duplicates and selected by default;
set `selectOnCreation: false` to keep the current value.

The `formData` passed to `onSubmit` is inferred from the schema output. The resolved `submitData` is inferred from the successful submit result.

## UI Configuration

The form engine uses one control size for all Nuxt UI inputs and triggers, including select,
tree-select, date, time, grouped controls, matrix cells, and nested array fields. Set it with a
density or an explicit size:

```ts
export default defineAppConfig({
  nuxtUiTools: {
    form: {
      density: 'compact',
      control: {
        size: 'sm',
        ui: { base: 'rounded-sm' },
      },
      fields: {
        select: { class: 'max-w-96', ui: { base: 'rounded-md' } },
        upload: { class: 'min-h-36' },
      },
      field: {
        ui: { label: 'font-semibold', description: 'text-xs' },
      },
      matrix: {
        ui: { columnHeader: 'bg-elevated', cell: 'p-3' },
      },
    },
  },
})
```

`FormUiConfig` covers root/header/viewport/footer, field chrome, actions, grouped controls, inline
tree, tree-select, matrix, array list/table, and modal/drawer/fullscreen slots. Override precedence is
app config, then schema `ui`, then `<NutForm :ui>`. A field's `props` are applied last, so
`props: { size: 'lg', ui: { base: 'rounded-none' } }` remains the narrow escape hatch for one
underlying Nuxt UI control.

Use `fields` for package-wide defaults on any registered field kind. Its `size`, `class`, and
underlying Nuxt UI `ui` slots merge after the shared `control` defaults, while the authored
field's `props` still wins for one-off exceptions.

```ts
const form = defineFormSchema({
  ui: {
    control: { size: 'md' },
    treeSelect: { ui: { trigger: 'max-w-96' } },
    matrix: { ui: { control: 'max-w-56' } },
  },
  fields: [],
})
```

Group fields render through Nuxt UI `UFieldGroup`; nested renderer wrappers collapse with
`display: contents`, so adjacent inputs share borders and the configured size. Tree-select uses a
normal control-sized trigger and renders an accessible searchable `UTree` inside its popover.

Inline `tree` fields render directly in the form without input-style outer chrome. Both `tree` and
`tree-select` share the same selection contract: single selection shows radio controls by default,
while `multiple: true` shows checkboxes. Use `cascade: true` to select descendants and reconcile
parent and indeterminate state in both directions, or configure `propagateSelect` and
`bubbleSelect` independently. `selectionControl: 'none'` keeps row selection without a visible
radio or checkbox, and `selectionBehavior` accepts `toggle` or `replace`.

Hierarchy options can use custom object keys through `valueKey`, `labelKey`, and `childrenKey`.
Search only filters what is displayed; cascade and parent reconciliation still run against the
complete option tree, so selecting a filtered child cannot accidentally select hidden siblings.

## External Controls

Provider-owned forms can be controlled by stable id or schema `formKey`:

```ts
formApi.isOpen('account-create')
formApi.closeForm('account-create')
await formApi.submitForm('account-create')
formApi.getController('account-create')
```

`closeForm` and `submitForm` use the mounted overlay lifecycle when the form is rendered, so close transitions and submit pending state stay aligned with the visible UI.

## Layout Defaults

Form layout follows the shared-ui defaults:

```ts
defineFormSchema({
  layout: {
    columns: 8,
    fieldSpan: '8 md:4',
    gap: 16,
  },
  fields: [],
})
```

When omitted, root grids use 8 columns and fields span the full width on the smallest
breakpoint, then 4 columns from `md` upward. Object subgrids inherit the active form or step
grid unless the object field sets `layout.columns`.
