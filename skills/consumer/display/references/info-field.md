# The form `info` field

An `info` field holds no value and never reaches the output. It draws either a display block
(`display` + `props`) or a notice (`content`).

## A display block

```ts
{
  key: 'summary',
  type: 'info',
  display: 'facts',
  props: { layout: 'inline', items: [{ label: 'Contract', value: 'CT-2026-0148' }] },
}
```

`props` is typed by `display`: a wrong prop or a missing required one is a type error.

Like other stateless fields, an info field spans the full row unless its `layout.span` says
otherwise, and `condition` hides it.

## Props that follow the form

Declare the paths you read in `dependencies`, then return the props from a callback. It runs again
when one of them changes.

```ts
{
  key: 'credits',
  type: 'info',
  display: 'meter',
  dependencies: ['seats'],
  props: ({ deps }) => ({
    label: 'Contract credits',
    max: contract.credits,
    value: contract.used + deps.get<number>('seats'),
    thresholds: { warning: 70, error: 90 },
  }),
}
```

The callback receives `{ ctx, deps, api }`, the same parameters as other field callbacks.

## Props that load

Return a promise, or TanStack Query options, when the block needs data the form does not hold.

```ts
import { queryOptions } from '@tanstack/vue-query'

{
  key: 'accountNote',
  type: 'info',
  display: 'text',
  label: 'Account note',
  dependencies: ['accountId'],
  props: ({ deps }) =>
    queryOptions({
      queryKey: ['accounts', deps.get<string>('accountId'), 'note'],
      queryFn: () => fetchAccountNote(deps.get<string>('accountId')),
      select: (note) => ({ appearance: 'quote', text: note.body, author: note.author }),
    }),
}
```

- The block's skeleton shows until the props arrive.
- When loading fails, a compact line says so with a « Retry » button.
- Query options are cached under their `queryKey`, so two fields or two forms asking for the same
  key share one request. `select` maps the cached data to props, so the cache keeps the raw data.
  Retries and stale times follow the app's `QueryClient` defaults.
- A promise runs again when a dependency changes; an answer to an older run is dropped, so a slow
  request never overwrites a newer one.

```ts
props: ({ deps }) =>
  fetchHeldCertifications(deps.get<string>('centerId')).then((held) => ({
    variant: 'stack',
    heading: 'Held certifications',
    items: held.map((item) => ({
      title: item.name,
      meta: item.validUntil,
      icon: 'i-lucide-badge-check',
    })),
  }))
```

## Acting on the form

`api.form` sets values, submits, or closes the form, so a block's actions can do what a button in
the form would:

```ts
props: ({ api, deps }) => ({
  layout: 'inline',
  items: [{ label: 'Address', value: deps.get<string>('address') }],
  actions: [
    {
      label: 'Edit the address',
      icon: 'i-lucide-pencil',
      onClick: async () => {
        await api.form.close()
        await navigateTo(`/accounts/${id}/address`)
      },
    },
  ],
})
```

`api.form.close()` closes the form the way its Cancel action does: it asks to discard unsaved
changes when the schema asks for it, then closes the modal, drawer or page form. It resolves
without doing anything for a form rendered without a cancel handler.

## The label shell

Give the field a `label` (or `description`, `hint`, `help`) to draw it in the standard field
wrapper, like an input, for a read-only value that belongs in the form grid:

```ts
{
  key: 'webDocument',
  type: 'info',
  display: 'code',
  label: 'Web document link',
  hint: 'Read only',
  layout: { span: 1 },
  props: { variant: 'value', value: invoice.webdocUrl, icon: 'i-lucide-link', href: invoice.webdocUrl },
}
```

Without any of them the block sits on its own, as wide as its span.

## Presets

`preset` names default props from `appConfig.nuxtUiTools.display.presets[display]`; the field's
props win over them, and its `ui` merges over the preset's `ui` slot by slot.

```ts
// app.config.ts
nuxtUiTools: { display: { presets: { facts: { dialog: { layout: 'ledger', surface: 'muted' } } } } }

// a schema
{ key: 'recap', type: 'info', display: 'facts', preset: 'dialog', props: { items } }
```

## The notice

Without `display`, an info field draws its `content` in an alert, styled by `props`:

```ts
{ key: 'hint', type: 'info', content: 'Prices exclude VAT.', props: { color: 'info', title: 'Pricing', variant: 'soft', icon: 'i-lucide-receipt' } }
```

`content` may be text, a lazy translation, a VNode, a render function, or a callback receiving
`{ ctx, deps, api }`. Prefer `display: 'alert'` for new fields: it adds items, lists, details,
actions and every appearance.
