---
name: nuxt-ui-tools-form
description: Use this skill when working with the nuxt-ui-tools form runtime as a package consumer. It covers schema-driven forms, the provider-backed form API, inline rendering, overlay rendering, form pages with a section navigation, choice cards, and typed submit results.
---

# nuxt-ui-tools Form

Use this skill when a consumer wants to render or control schema-driven forms.

The V1 form runtime is schema-driven and fully typed:

- define schemas with `defineFormSchema`
- render inline forms with `<NutForm>`
- wrap app or route content with `<NutFormProvider>` when using `useFormApi`
- open provider-owned overlays with `formApi.createForm(schema, options)`
- lay a form out as a page of sections with `defineFormPageSchema` and `<NutFormPage>`

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
import { email, withMessage } from '@regle/rules'
import { defineFormSchema, useForm } from '#ui-tools/form'

const accountForm = defineFormSchema({
  formKey: 'account',
  title: 'Account',
  fields: [
    {
      key: 'profile.email',
      type: 'text',
      label: 'Email',
      required: true,
      validators: {
        email: withMessage(email, 'Enter a valid email address.'),
      },
    },
  ],
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

Validation is implemented with Regle. Set `required` and `requiredMessage` directly on the field,
and provide native `@regle/rules` entries through `validators`. `validators` may also be a
dependency callback, so cross-field rules can use resolved `deps` without creating a second
validator tree. The runtime owns async completion, collection (`array-list`, `array-table`, and
variants) paths, and stable field error mapping. Use `validation.trigger` only when a field should
start validating on `input` or wait until `submit`; the default is `blur`.

Mounted field callbacks can read `api.validation.pending()`. It is derived directly from the
Regle field and rule status, so it is `true` only while that field's asynchronous rules are
running, including nested array paths, and returns to `false` for both resolved and stale runs.
Built-in text, number, select, autocomplete, tree, switch, and button controls pass this state to
their Nuxt UI loading chrome; synchronous rules never flash a loader. Errors from an async run are
revealed after the promise settles, not while it is pending.

The renderer uses a native form submit event. Pressing Enter from a focused single-line control
runs the same validation and submit lifecycle as the built-in submit action, while Enter in a
textarea keeps its normal newline behavior. Use Tab to move through the form's focusable controls,
including checkboxes.

`validate` accepts `true`, `false`, `'required'`, or `'validators'`. `syncInput` accepts `true` or a
list of paths; when omitted, later input changes do not replace local edits.

Schema `controls` can set `dirtyCheck`, `autoFocus`, `confirmNavOnDirty`, `syncInput`, and
`validate`. A successful submit makes the submitted values the new baseline, so `isDirty` turns
false and `confirmNavOnDirty` stops asking; a navigation made by `onSubmit` itself never asks. Stateful fields can define `watch`, `onDependencyChange`, `onRendered`,
`stateEffect`, `ignore`, `dirtyCheck`, and collapsible behavior.

Use `labelExtra` for rich content beside a field label, such as a password-recovery link. It
accepts renderable Vue content and takes precedence over the field's text-only `hint`.

Submit handlers receive typed external-error controls through `api.setError(path, message)` and
`api.clearError(path?)`. Map expected server failures to their owning fields and return
`{ success: false }`; use one application-level toast only when the failure is not mapped. Editing
a field clears its own external error automatically. External errors remain visible but do not
participate in validation or block a later submission attempt. When one error belongs to multiple fields,
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

Radio and checkbox card fields, including group fields with `variant: 'card'`, show a
selected outer ring through the Nuxt UI `item` slot. The ring does not change card dimensions;
override `ui.item` in the field's `props` to customize it.

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

## Form Pages

A form page is one form laid out as a page of sections: a card per section, a navigation that
follows the section in view, and a header with the title and the actions. Define it with
`defineFormPageSchema` and render it with `<NutFormPage :form />`.

Write each section as a plain typed function with `defineFormPageSection`, so sections can live in
their own files and take the context they need as params. Every text accepts a function, so it can
be translated:

```ts
import { regex, withMessage } from '@regle/rules'

export function identitySection() {
  const { t } = useI18n()
  return defineFormPageSection({
    key: 'identity',
    label: () => t('account.sections.identity'),
    description: () => t('account.sections.identityHint'),
    fields: [
      { key: 'name', type: 'text', label: () => t('account.name'), required: true },
      {
        key: 'siren',
        type: 'text',
        label: 'SIREN',
        // `country` belongs to the address section: a page is one form, one state.
        dependencies: ['country'],
        validators: ({ deps }) =>
          deps.country === 'FR' ? { siren: withMessage(regex(/^\d{9}$/), '9 digits') } : {},
      },
    ],
  })
}

export function accountFormSchema({ account }: { account?: Account } = {}) {
  return defineFormPageSchema({
    header: { title: account ? 'Edit account' : 'New account', description: account?.name },
    controls: { dirtyCheck: Boolean(account), confirmNavOnDirty: true },
    actions: [
      { key: 'cancel', label: 'Cancel' },
      { key: 'submit', icon: 'i-lucide-check', label: account ? 'Save' : 'Create account' },
    ],
    navigation: { title: account ? 'Sections' : 'Creation' },
    sections: account
      ? [identitySection(), accountTypeSection(), addressSection()]
      : [accountTypeSection(), identitySection(), addressSection()],
  })
}
```

```vue
<script setup lang="ts">
const form = useForm({
  schema: accountFormSchema({ account }),
  input: account,
  onSubmit: ({ formData }) => updateAccount(account.id, formData),
})
</script>

<template>
  <NutFormPage :form @cancel="navigateTo('/accounts')" />
</template>
```

`defineFormPageSchema` returns a normal form schema: its `fields` are card fields generated from
the sections. A card adds no path segment, so `formData` stays flat (`{ name, siren, country }`),
fields of different sections can depend on and validate against each other, and the same schema
opens with `formApi.createForm(...)` as a stack of cards.

A section takes:

- `key`: the navigation entry, the scroll target, the URL hash (`#identity`), and the section
  element `id`, so keep it unique on the page. It does not prefix field keys.
- `label` and `description`: text or a function returning text.
- `layout`: the grid of its fields (`columns`, `fieldSpan`, `gap`, label placement), merged over
  the schema `layout`.
- `condition` with `dependencies`: hides the section, its navigation entry, and its fields.
- `optional`: marks the section optional, for sections whose required fields are all filled by
  defaults. A section without a required field is optional already.

### What the navigation shows

Each entry has a status:

- **complete** (a check): every required field has a value and no field shows an error. An optional
  section also needs a value the user entered or the form `input` provided; defaults alone do not
  count.
- **invalid** (a `!`): a field of the section shows an error, for example after a failed submit.
- **pending** (an empty circle): anything else.

Optional sections read "optional" and are not counted in the summary under the entries ("3 sections
left to complete", then "Everything is ready").

With `controls.dirtyCheck: true` (typically on edit pages), a modified section gets a ring and a
**Reset** button that puts its values back, its entry gets a dot, the header shows an "Unsaved
changes" badge, and the summary counts the modified sections. A successful submit saves the values
as the new baseline, so the rings clear. `confirmNavOnDirty` asks before leaving unsaved changes, but
not for navigations your `onSubmit` makes after saving.

### Scrolling and layout

The page scrolls on its own: give it a height, such as `h-full` or `flex-1 min-h-0` in a layout that
sizes its main area. Clicking an entry scrolls its section to just below the pinned header, moves
focus to the section title, and replaces the URL hash (`#billing`) without a new history entry.
Opening the page with a hash lands on that section. Set `:hash="false"` to leave the URL alone.

The current entry follows the scroll position, except when a field takes focus: its section becomes
current and stays so through the scroll the focus causes. When a failed submit focuses the first
invalid field, the navigation points at that field's section, even while the section above still
covers the top of the page. The next scroll hands the navigation back to the scroll position.

From 768px of page width, the navigation is a pinned column beside the sections (200px, 230px from
1024px) and the header stays pinned. Below, the navigation is one row of chips that scrolls sideways
and keeps the current section in view.

### Composing the page

`NutFormPage` owns the form and renders a default layout from public parts: `NutFormPageHeader`
(which holds `NutFormPageActions`), `NutFormPageNavigation`, and `NutFormPageSections`. Put parts
in its default slot to compose another layout; they read the page they render in:

```vue
<NutFormPage :form>
  <MyPageHeader>
    <template #actions><NutFormPageActions /></template>
  </MyPageHeader>
  <div class="grid grid-cols-[minmax(0,1fr)_240px] gap-6 p-6">
    <NutFormPageSections />
    <NutFormPageNavigation />
  </div>
</NutFormPage>
```

To change one part of the default layout, use the slots `NutFormPage` forwards:
`header-leading`, `header-eyebrow`, `header-title`, `header-description`, `header-actions`,
`navigation-title`, `navigation-item` (`{ section, active, select }`), `navigation-footer`
(`{ sections, remaining, modified }`), and `section-actions` (`{ section }`):

```vue
<NutFormPage :form>
  <template #navigation-footer>
    <AccountSummary :account />
  </template>
</NutFormPage>
```

Style the page through the `page` part of the form UI config (app config, schema `ui`, or the `ui`
prop): `root`, `body`, `header`, `title`, `meta`, `navigation`, `navigationItem`,
`navigationIndicator`, `section`, `sectionTitle`, `sectionBody`, and more. Entries carry
`data-active` and `data-state` (`complete`, `invalid`, `pending`), and modified sections and entries
carry `data-dirty`:

```ts
export default defineAppConfig({
  nuxtUiTools: {
    form: {
      page: {
        ui: {
          root: 'min-h-0 flex-1 bg-(--app-canvas)',
          section: 'rounded-lg',
          navigationItem: 'data-[active]:font-bold',
        },
      },
    },
  },
})
```

When you place your own pinned header above the page content, set `--nut-form-page-offset` on an
ancestor to its height plus the gap, so sections scroll to just below it.

## Choice Cards

`radio-card` and `checkbox-card` share these props:

- `columns`: a fixed grid of equal columns, with breakpoints: `3`, `'2 xl:3'`, or `'1 md:2 lg:3'`.
  The unprefixed value covers every width below the first breakpoint you name, so start prefixes
  at `md`. Without `columns`, cards flow along `orientation`.
- `indicator`: `start` (default), `end`, `hidden`, or `corner`, a check in the top corner of
  selected cards only.
- `icon`: where an option `icon` shows, `inline` before its label (default) or `tile`, in a square
  above it that takes the selection color.

```ts
{
  key: 'plan',
  type: 'radio-card',
  options: [
    { value: 'starter', label: 'Starter', description: 'One team getting started.', icon: 'i-lucide-sprout' },
    { value: 'team', label: 'Team', description: 'Shared projects and roles.', icon: 'i-lucide-users' },
  ],
  props: { columns: '1 md:3', icon: 'tile', indicator: 'corner' },
}
```

Style the parts the engine renders through `ui.tile` and `ui.check`, next to the Nuxt UI slots of
the group (`item`, `label`, `description`, and so on). For every radio card of an app:

```ts
nuxtUiTools: {
  form: {
    fields: {
      'radio-card': {
        ui: {
          item: 'has-data-[state=checked]:bg-primary/10',
          tile: 'data-[selected]:bg-default',
        },
      },
    },
  },
}
```

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
