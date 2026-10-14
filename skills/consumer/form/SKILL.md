---
name: nuxt-ui-tools-form
description: Use this skill when working with the nuxt-ui-tools form runtime as a package consumer. It covers schema-driven forms, the provider-backed form API, inline rendering, overlay rendering, form pages with a section navigation, rich options (icon, avatar, chip, description, suffix, grouped menus, and renderOption/renderValue render functions on select, auto-complete, radio, and checkbox group), choice cards, and typed submit results.
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

Rows can carry a `description`, and `{ type: 'section', label, description? }` entries open
full-width row groups. Sections are optional and hold no value: they render as `rowgroup` headers
and never appear in the output.

```ts
rows: [
  { type: 'section', label: 'Conversations' },
  { key: 'threads', label: 'New thread', description: 'Threads you take part in' },
  { key: 'messages', label: 'New message' },
  { type: 'section', label: 'Billing', description: 'Sent to the account manager' },
  { key: 'overdue', label: 'Overdue invoice' },
]
```

The output keeps only the row keys: `{ threads: {...}, messages: {...}, overdue: {...} }`.

`props.rowHeaderLabel` names the row label column in the header corner, for example `'Event'`.

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

A field's `help`, `hint`, and `description` accept text, a function returning text, or a callback
that receives `{ ctx, deps, api }` like `placeholder`, so the copy around a control can follow the
fields it depends on. A `description` callback may also return `{ text, display, title }`. The copy
updates as those dependencies change. `label` stays text or a function returning text, because
labels also name fields in table columns and matrix headers.

`placeholder` is authored copy only: a field that declares none renders none, so there is no
generic "Enter a value" prompt repeating the label. Author one only when it adds information the
label does not, such as an example value (`prenom@exemple.fr`) or a format. Select-like controls
keep the search prompt Nuxt UI localizes for searchable lists, and date, color-picker, and
one-time-code controls keep their own format hints.

A field's `disabled` callback locks it; add `disabledReason` to say why and what unlocks it. The
reason renders under the control in muted text with a small lock icon, and only while that
`disabled` callback holds, so it never explains the disabling the engine does itself (a pending
submit, options still loading). It takes text, lazy text, or a `{ ctx, deps, api }` callback that
returns nothing when no reason applies. It sits after the field's `help`, shows wherever the field
renders its wrapper (not in bare table cells or primitive array items), and is announced with the
control. Style it through `ui.field.ui.disabledReason` and `ui.field.ui.disabledReasonIcon`.

```ts
{
  key: 'center',
  type: 'select',
  label: 'Centre de test',
  options: centers,
  dependencies: ['account'],
  disabled: ({ deps }) => !deps.get('account'),
  disabledReason: 'Choisissez d’abord un compte',
}
```

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

In a Nuxt app the module creates one form API for the whole app: components read it with
`useFormApi()`, and code that runs outside setup — an entity action called from a click handler, a
store — reads it with `useNuxtApp().$formApi`. `<NutFormProvider>` renders the forms either one
opens.

```ts
export async function inviteUser(account: { id: string }) {
  const { $api, $formApi } = useNuxtApp()
  const result = await $formApi.createForm(invitationForm(), {
    mode: 'drawer md:modal',
    onSubmit: async ({ formData }) => ({
      success: true,
      data: await $api.invite(account.id, formData),
    }),
  })
  return result.isCompleted
}
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

`layout.newRow: true` starts a field on a new row, at the first column, whatever the fields before
it left free. It sets only where the field starts, so a responsive `span` still decides its width at
each breakpoint:

```ts
{ key: 'firstName', type: 'text', layout: { span: '1 md:2' } },
{ key: 'lastName', type: 'text', layout: { span: '1 md:2' } },
{ key: 'email', type: 'text', layout: { span: '1 md:3', newRow: true } },
```

TanStack `queryOptions(...)` objects can be used directly for context or field options. The form
observer retains the full query configuration, including `select`, retry/cache settings, meta,
initial/placeholder data, and query-function cancellation signals.

Option fields accept arrays, synchronous callbacks, promises, and TanStack query options.

When several fields or other package surfaces pick from the same remote list, use a
`defineRemoteOptions` loader from `#ui-tools/shared` instead of copying its paging and selected
lookup into each field:

```ts
{ key: 'ownerId', type: 'select', options: { mode: 'remote', loader: users } }
```

The loader carries search, pagination, and selected-value hydration. Field-specific settings such
as `refreshOn`, `create`, and `clearOnInvalid` stay alongside `loader`. See
[Reusable Remote Options](../shared/references/remote-options.md) for a complete definition.
Inline `{ mode: 'remote', source, pagination, resolveSelected }` remains valid, including remote
tree sources that load a selected parent's children.

Use a local option config for refreshable or creatable options:

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
tree, tree-select, matrix (including `rowLabel`, `rowDescription`, `section`, `sectionHeader`,
`sectionLabel` and `sectionDescription`), array list/table, and modal/drawer/fullscreen slots. Override precedence is
app config, then schema `ui`, then `<NutForm :ui>`. A field's `props` are applied last, so
`props: { size: 'lg', ui: { base: 'rounded-none' } }` remains the narrow escape hatch for one
underlying Nuxt UI control.

Use `fields` for package-wide defaults on any registered field kind. Its `size`, `class`, and
underlying Nuxt UI `ui` slots merge after the shared `control` defaults, while the authored
field's `props` still wins for one-off exceptions.

Text fields take a Maska pattern through `props.mask`: a string such as `'### ### ###'`, or Maska
options with custom `tokens`. `#` is a digit, `A` a letter shown in upper case, and `!` escapes a
literal character. The field stores the masked text, or the unmasked characters with
`maskOutput: 'raw'`. Return the mask from a `props` callback to follow another field; when the
callback stops returning one, the field accepts free text again:

```ts
{
  key: 'registration',
  type: 'text',
  dependencies: ['country'],
  props: ({ deps }) => (deps.get('country') === 'FR' ? { mask: '### ### ### #####' } : {}),
}
```

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
    // Drawn in a tile before the title (`ui.page.ui.sectionIcon`), so each section of a long
    // page reads at a glance.
    icon: 'i-lucide-id-card',
    fields: [
      { key: 'name', type: 'text', label: () => t('account.name'), required: true },
      {
        key: 'siren',
        type: 'text',
        label: 'SIREN',
        // `country` belongs to the address section: a page is one form, one state.
        dependencies: ['country'],
        help: ({ deps }) =>
          deps.get('country') === 'FR'
            ? 'The 9 digits of your SIREN'
            : 'Your local registration number',
        validators: ({ deps }) =>
          deps.get('country') === 'FR' ? { siren: withMessage(regex(/^\d{9}$/), '9 digits') } : {},
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

Each entry has one of four statuses, which `section.status`, `data-state`, and the text read by
screen readers share:

- **complete** (a check, "Completed"): every required field has a value and no field shows an
  error. An optional section also needs a value the user entered or the form `input` provided;
  defaults alone do not count.
- **invalid** (a `!`, "To fix"): a field of the section shows an error. Errors appear once the user
  left a field or tried to submit, so a section nobody touched is never invalid: it waits as
  pending.
- **pending** (an empty circle, "To complete"): a required field has no value yet.
- **optional** (a dashed circle and an "Optional" tag, also on the section card): an optional
  section nothing was entered in. It never reads "To complete" as well.

The summary under the entries ("3 sections left to complete", then "Everything is ready") counts
the sections that keep the form from being submitted: pending and invalid ones. Optional sections
nobody touched are left out. One the user started and left incomplete or invalid is counted and
loses its "Optional" tag, since it blocks the submit.

Required fields inside array items count too: a row added to an `array-table` with an empty required
cell leaves its section pending. They never make a section required; only the section's own fields
decide whether it reads "optional".

With `controls.dirtyCheck: true` (typically on edit pages), a modified section gets a ring and a
**Reset** button that puts its values back, its entry gets a dot, the header shows an "Unsaved
changes" badge, and the summary counts the modified sections. A successful submit saves the values
as the new baseline, so the rings clear. `confirmNavOnDirty` asks before leaving unsaved changes, but
not for navigations your `onSubmit` makes after saving.

### Plain sections, and pages without a navigation

By default each section is a bordered card on a gray canvas (`surface: 'card'`). Set the page
`surface` to `'plain'` to draw sections with no box: the heading with its description under it, then
the fields, on the page background, with spacing and a hairline between one section and the next. A
modified section (with `controls.dirtyCheck`) gets a bar in the margin instead of a ring. `surface`
is a form UI option, so it layers like the others: app config, then the schema `ui`, then the `ui`
prop of `NutFormPage`, and a layer that only restyles slots keeps the surface of the layers below.

```ts
// app.config.ts: every form page of the app
export default defineAppConfig({
  nuxtUiTools: { form: { page: { surface: 'plain' } } },
})

// One page, over the app default
defineFormPageSchema({
  ui: { page: { surface: 'card' } },
  sections: [identitySection(), addressSection()],
})
```

### Panels, sections side by side, and section status

`surface: 'panel'` draws each section as a card whose heading sits in a bar across its top, with
the fields padded below. Pick it when sections are compact blocks the user scans as objects (an
account: profile, identity, address, billing); keep `card` or `plain` for long single-topic pages.

A section `span` (out of twelve columns) lets short sections share a row once the sections area is
48rem wide: a `span: 4` profile next to a `span: 8` identity. Sections fill the rows in order and
the ones on a row stretch to the same height. Without a `span` a section takes the whole row, and
a page where no section sets one keeps its single column. Set spans only where the sections are
short and related; a stack of full rows is the right layout for most forms.

`page.status: true` shows where each section stands at the end of its heading: "2 sur 3" while
required fields are missing, "Complété", or "À corriger" once a field shows an error. An optional
section with nothing entered shows its "Facultatif" tag in that same place. Style it with `ui.page.ui.sectionStatus`
(`data-form-page-status` carries the status).

```ts
defineFormPageSchema({
  ui: { page: { surface: 'panel', status: true } },
  sections: [
    defineFormPageSection({ key: 'profile', label: 'Profil', span: 4, fields: [/* … */] }),
    defineFormPageSection({ key: 'identity', label: 'Identité', span: 8, fields: [/* … */] }),
    defineFormPageSection({ key: 'contacts', label: 'Contacts', fields: [/* … */] }),
  ],
})
```

A side navigation next to two short sections only adds noise. `navigation.minSections` shows the
navigation only when the page has at least that many visible sections. Below it, the page is one
focused column: the sections fill a centered column, the title and actions of the header line up
with that column (the header band itself still spans the page), and `NutFormPageNavigation`
renders nothing, its summary included. Without `minSections`, the navigation always shows. The count follows section
`condition`s, so a page gains its navigation when a choice reveals more sections.

```ts
defineFormPageSchema({
  navigation: { title: 'Creation', minSections: 3 },
  sections: [identitySection(), addressSection()],
})
```

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

Style the page like the rest of the form engine, through the `page` part of the form UI config:
app config first, then the schema `ui`, then the `ui` prop of `NutFormPage`. Every element the page
renders has a slot:

- page: `root`, `body`
- header: `header`, `headerRow`, `headerContent`, `heading`, `eyebrow`, `title`, `meta`, `unsaved`, `actions`
- navigation: `navigation`, `navigationGroup`, `navigationTitle`, `navigationList`,
  `navigationEntry`, `navigationItem`, `navigationIndicator`, `navigationIndicatorIcon`,
  `navigationIndicatorMarker`, `navigationLabel`, `navigationOptional`, `navigationDirty`,
  `navigationFooter`, `navigationSummary`, `navigationSummaryCount`
- sections: `sections`, `sectionSkeleton`, `section`, `sectionHeader`, `sectionIcon`, `sectionTitle`,
  `sectionDescription`, `sectionOptional`, `sectionActions`, `sectionReset`, `sectionBody`

The action buttons take the `actions` part (`ui.actions.ui.button`) and each action's `class`, as in
any form. Entries and section cards carry `data-state` (`complete`, `invalid`, `pending`,
`optional`), the current entry carries `data-active`, and modified sections and entries carry
`data-dirty`:

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

Sections land, and the navigation pins, below `--nut-form-page-header` plus `--nut-form-page-gap`.
The page sets the first to the height of its pinned `NutFormPageHeader`; the second is `24px`. To
change the gap, set it on the root, for example with `ui.page.ui.root: '[--nut-form-page-gap:32px]'`.
When your own pinned header replaces `NutFormPageHeader`, set `--nut-form-page-header` to its height
on an element around the navigation and the sections.

## Rich Options

`select`, `auto-complete`, `radio`, `checkbox-group`, `switch-group`, `tree-select`, and `cascader`
read more than a label from each option. Every key is optional, and an option without them renders
exactly as before:

- `icon`: an Iconify name drawn before the label.
- `avatar`: `{ src?, alt?, text? }`, for people and organisations. `alt` defaults to the label, and
  `text` is the fallback shown when there is no picture (without it, the initials of `alt`).
- `chip`: `{ color? }`, a colored dot for statuses and categories (`primary` by default, or
  `secondary`, `success`, `info`, `warning`, `error`, `neutral`).
- `description`: a second line under the label.
- `suffix`: text at the end of the option, such as a code or a count. Text, or a function returning
  text like `label`.

Only one leading visual shows, the first of `icon`, `avatar`, `chip`.

The chosen value carries the visual too. A single select, auto-complete, tree select or cascader
draws the chosen option's visual at the start of the control. A multiple select, tree select or
cascader shows each chosen option as a token with its visual, the way a multiple auto-complete shows
its tags; tokens wrap onto more lines when they do not fit, and one row keeps the control as tall as
the inputs beside it. Tokens keep the labels when the field sets `renderValue`, which stays a
single-selection display.

```ts
{
  key: 'currency',
  type: 'select',
  label: 'Currency',
  options: [
    { value: 'EUR', label: 'Euro', suffix: 'EUR' },
    { value: 'USD', label: 'US dollar', suffix: 'USD' },
  ],
}

{
  key: 'owner',
  type: 'auto-complete',
  label: 'Owner',
  options: [
    { value: 'camille', label: 'Camille Durand', avatar: { src: '/people/camille.jpg' } },
    { value: 'louis', label: 'Louis Martin', avatar: { text: 'LM' }, description: 'Test center manager' },
  ],
}

{
  key: 'status',
  type: 'select',
  label: 'Status',
  options: [
    { value: 'published', label: 'Published', chip: { color: 'success' } },
    { value: 'review', label: 'In review', chip: { color: 'warning' } },
  ],
}

{
  key: 'plan',
  type: 'radio',
  label: 'Plan',
  options: [
    { value: 'starter', label: 'Starter', icon: 'i-lucide-rocket', description: 'One workspace.', suffix: '0 €' },
    { value: 'scale', label: 'Scale', icon: 'i-lucide-users', description: 'Several teams.', suffix: '49 €' },
  ],
}
```

What you get without writing any rendering:

- In the menu of a select or auto-complete, the leading visual (a 16px icon in muted ink, an `xs`
  avatar, or the dot) comes before the label, the description sits under it in muted smaller text,
  and the suffix is right-aligned in dimmed text with tabular numbers, before the selected check.
- In the closed control of a single select, the chosen option's leading visual takes the control's
  leading slot, and its suffix follows the label, dimmed. An auto-complete shows its leading visual
  the same way, and draws a suffix over the text of its input while it rests. An empty field keeps
  its placeholder. Multiple selection keeps the comma-separated labels.
- In a radio or checkbox list, the leading visual comes before the label, the description stays
  under it (lined up with the label), and the suffix ends the row.
- Search, remote and async sources, creatable options, the load-more row, and `clearable` behave as
  before. The choice cards read `icon` only.

An option's `icon` on a `checkbox-group` is its leading visual, not the check mark.

### Render functions

When the defaults are not enough, declare a render function on the field, next to `options`. It
returns anything a Vue render function returns (`h(...)`, JSX, a string).

- `renderOption({ option, item, selected, disabled })` replaces the content of each option: the
  label, the description, the leading visual, and the suffix. The control keeps its own selection
  indicator (the check mark, the radio dot, the checkbox) and its keyboard behavior. Available on
  all four fields.
- `renderValue({ option, item })` replaces how the chosen option reads in the closed control of a
  `select` or `auto-complete`, in single selection. Multiple selection keeps its labels.

`option` is the resolved option (`label`, `description`, `icon`, `avatar`, `chip`, `suffix`,
`value`, `disabled`). `item` is the option exactly as you wrote it or your source returned it,
untouched, so it carries any data of your own.

```ts
import { h } from 'vue'
import type { FormOption, FormOptionRenderContext, FormOptionValueRenderContext } from 'nuxt-ui-tools/form'

interface Currency extends FormOption<'EUR' | 'USD'> {
  symbol: string
}

{
  key: 'currency',
  type: 'select',
  label: 'Currency',
  options: [
    { value: 'EUR', label: 'Euro', suffix: 'EUR', symbol: '€' },
    { value: 'USD', label: 'US dollar', suffix: 'USD', symbol: '$' },
  ],
  // Each row: symbol, name, code.
  renderOption: ({ item, option }: FormOptionRenderContext<Currency>) =>
    h('span', { class: 'flex items-baseline gap-2' }, [
      h('span', { class: 'w-4 text-center font-medium' }, item.symbol),
      h('span', option.label),
      h('span', { class: 'text-dimmed' }, option.suffix),
    ]),
  // The closed control reads "€ EUR".
  renderValue: ({ item, option }: FormOptionValueRenderContext<Currency>) =>
    h('span', `${item.symbol} ${option.suffix}`),
}
```

In an inline schema the option type is not inferred into the callback, so annotate its parameter
with `FormOptionRenderContext<YourOption>` (or `FormOptionValueRenderContext<YourOption>`) to read
your own data typed. A field you type yourself, `FormSelectField<Ctx, Deps, Value, YourOption>`,
passes that option type to both functions. Return a flat, compact row: the option keeps the height
of its menu item, and the load-more row of a remote list is never passed to `renderOption`.

### Grouped menus

`select` and `auto-complete` list options under headings with the same contract as the choice
cards (see Grouped options below): inline options group by `group`, the records a function,
promise, or query returns group only when the field's `groupKey` names the property, and
`groupKey: false` lists every option together. Each heading is drawn by the menu above its group,
and a search keeps a heading only while its group still has a match.

```ts
{
  key: 'accountType',
  type: 'select',
  label: 'Account type',
  options: [
    { value: 'school', label: 'École', icon: 'i-lucide-school', description: 'Lycées et universités', group: 'Organisation cliente' },
    { value: 'company', label: 'Entreprise', icon: 'i-lucide-building-2', description: 'Employeurs privés', group: 'Organisation cliente' },
    { value: 'reseller', label: 'Revendeur', icon: 'i-lucide-handshake', description: 'Revend les licences', group: 'Partenaire' },
    { value: 'center', label: 'Centre de test', icon: 'i-lucide-map-pin', description: 'Organise les sessions', group: 'Centre de test' },
    { value: 'demo', label: 'Démonstration', icon: 'i-lucide-flask-conical', description: 'Démos commerciales', group: 'Compte de test' },
  ],
  props: { searchable: true },
}
```

## Choice Cards

`radio-card` and `checkbox-card` share these props:

- `columns`: a fixed grid of equal columns, with breakpoints: `3`, `'2 xl:3'`, or `'1 md:2 lg:3'`.
  The unprefixed value covers every width below the first breakpoint you name, so start prefixes
  at `md`. Without `columns`, cards flow along `orientation`.
- `indicator`: `start` (default), `end`, `hidden`, `corner`, a check in the top corner of
  selected cards only, or `switch`, a switch in the top corner of every card that turns on with
  the selection, for cards that enable something.
- `icon`: where an option `icon` shows, `inline` before its label (default) or `tile`, in a square
  above it that takes the selection color.
- `density`: `default`, or `compact` for a long list of options: smaller cards where the icon (or a
  smaller tile) sits beside a one-line title over a one-line description, both truncated with an
  ellipsis and keeping the full text in their tooltip. The selection mark centers on the row.

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

### Grouped options

Give options a `group` to list them under headings: options that share one are listed together,
headings follow the order in which they first appear, and options without a group stay together
without a heading. `group` takes text or a function returning text, like `label`. A list without
any `group` renders exactly as before.

Grouping is opt-in for computed options. Options written inline in the schema group by their
`group`, as below. The records a function, a promise, or a query returns are your own data, so a
`group` they already carry for another purpose is not read until the field's `groupKey` names the
property that holds the heading. Without it they render as one list. `groupKey` sits on the field
next to `options`, not in `props`:

```ts
{
  key: 'plan',
  type: 'radio-card',
  // Rows from the API: { value, label, section }
  options: () => queryOptions({ queryKey: ['plans'], queryFn: fetchPlans }),
  groupKey: 'section',
}
```

`groupKey` also maps inline options: a list that sets `groupKey: 'section'` groups by `section` and
ignores any `group` it carries, and `groupKey: false` lists every option together, even inline
options that carry a `group`. Options keep the same heading rules whatever the property is
called. The choice cards, `select`, and `auto-complete` are the fields that group their options (a select
or auto-complete draws the headings as menu group labels, see Rich Options); `groupKey` has no
effect elsewhere.

```ts
{
  key: 'accountType',
  type: 'radio-card',
  options: [
    { value: 'school', label: 'Établissement', description: 'Lycée, collège, université', icon: 'i-lucide-school', group: 'Organisation cliente' },
    { value: 'company', label: 'Entreprise', description: 'Entreprise ou association', icon: 'i-lucide-building-2', group: 'Organisation cliente' },
    { value: 'reseller', label: 'Revendeur', description: 'Revend les tests', icon: 'i-lucide-store', group: 'Partenaire' },
    { value: 'center', label: 'Centre agréé', description: 'Fait passer les tests', icon: 'i-lucide-map-pin', group: 'Centre de test' },
  ],
  props: { columns: '1 md:2', density: 'compact', icon: 'tile', indicator: 'corner' },
}
```

Each heading is the `legend` of its own group of cards, so assistive technology announces it. A
`radio-card` therefore renders one radio group per heading, with one tab stop each and arrow keys
that stay inside a group; the selection lives in the group of the chosen option and the others
show none. A `checkbox-card` keeps every group independent and merges them into the one array
value, in the order the boxes were ticked. Style the heading with the Nuxt UI `ui.legend` slot and
the stack of groups with `ui.groups`.

Style the parts the engine renders through `ui.tile`, `ui.tileIcon`, `ui.optionIcon`, `ui.check`,
`ui.checkIcon`, `ui.switch`, and `ui.switchThumb`, next to the Nuxt UI slots of the group
(`fieldset`, `item`, `label`, `description`, and so on). The tile and the switch carry the option
value as `data-value`, so one option can take its own colors, for example
`tile: 'data-[value=billing]:bg-info/10 data-[value=billing]:text-info'`. Set them for one field in
its `props.ui`, or for every card of a kind in the app config:

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

## Array Tables

`array-table` renders one row per item and one column per child field. Column `layout.width`
sets a column's width (`number` in pixels or any CSS length), and `props.minWidth` sets the table's
minimum width before it scrolls horizontally.

Cells keep their row compact when a value is invalid: the control takes the error color and
`aria-invalid`, and the message opens in a tooltip on hover, staying open while the cell has
focus. Style that tooltip through `ui.arrayTable.ui.error`.

The actions column takes the width of the buttons its rows show (drag handle, delete, custom
actions), so a `table-fixed` layout never clips them. When the table is wider than its frame, the
empty state and the add button stay pinned to the visible part while the rows scroll sideways.

## Upload Fields

An `upload` field uploads each selected file through your `upload.handler` as soon as it is picked,
and stores what the handler returns. Set `output: 'url'` when the handler returns a string and
`output: 'object'` when it returns an object. With `props.multiple`, the value is an array and the
handler still runs once per file, so every file gets its own progress, cancel, and retry.

```ts
{
  key: 'agreement',
  label: 'Signed agreement',
  type: 'upload',
  output: 'object',
  props: { accept: 'application/pdf' },
  upload: {
    // Runs once per file. `signal` aborts when the user cancels or removes the file.
    handler: async ({ files, onProgress, signal }) => {
      const staged = await stageUpload(files[0], { onProgress, signal })
      return { token: staged.token, name: files[0].name, size: files[0].size, type: files[0].type }
    },
    // Turns a value that is already set into display data for the list.
    resolve: async ({ value }) => {
      const file = await api.contractFiles.show(value.id)
      return { name: file.label, size: file.size, type: 'application/pdf' }
    },
    // Opens a stored file, for example through a short-lived download link.
    open: async ({ value }) => window.open(await api.contractFiles.downloadUrl(value.id)),
  },
}
```

What you get:

- Stored values render as a file row with their name, type, size, and an open action. Without
  `resolve`, a string value uses its last URL segment as the name and opens itself; an object value
  reads its `name`, `size`, `type`, `url`, and `thumbnail` keys. `resolve` may be async: the row shows
  a placeholder until it settles, and falls back to the default display if it throws.
- Without an `open` hook, opening a file previews the field's files as a gallery when a
  `<UiFilePreviewProvider>` is mounted (see the file preview skill), and opens the resolved `url` in
  a new tab otherwise. Files uploaded in the current session preview from the browser's copy, even
  before they have a URL. Return `openable: false` from `resolve` for values that cannot be opened
  yet, such as files uploaded to staging but not saved.
- A file uploaded in the current session keeps its local preview, name, size, and type once it is
  stored, so `resolve` only needs to describe values it knows more about. Image thumbnails fit
  inside their box on a white ground, which suits logos.
- Single fields show a replace action on the stored file. A successful replacement calls
  `upload.onDelete` with the previous value; removing a file calls it too.
- `props.autoUpload: false` queues selected files until the user starts them from the row.
- `props.max` caps stored plus pending files for `multiple` fields.
- `props.variant: 'button'` renders a compact picker and rows that fit in a table cell.
- Submitting waits for uploads that are running. If a file is still queued or failed, the submit
  is blocked and the field shows an error until the file is uploaded or removed.

When a stored value is an object your API understands, such as a saved file id, and a new upload
returns a different shape, such as a staged-upload token, both can live in the same field: `resolve`
only runs for values that are already set, and the handler decides what a new upload stores.

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
