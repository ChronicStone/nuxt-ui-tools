---
name: nuxt-ui-tools-form
description: Use this skill when working with the nuxt-ui-tools form runtime as a package consumer. It covers schema-driven forms, the provider-backed form API, inline rendering, overlay rendering, and typed submit results.
---

# nuxt-ui-tools Form

Use this skill when a consumer wants to render or control schema-driven forms.

The form runtime is still being built, but the current public direction is:

- define schemas with `defineFormSchema`
- render inline forms with `<NutForm>`
- wrap app or route content with `<NutFormProvider>` when using `useFormApi`
- open provider-owned overlays with `formApi.createForm(schema, options)`

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

The `formData` passed to `onSubmit` is inferred from the schema output. The resolved `submitData` is inferred from the successful submit result.

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
