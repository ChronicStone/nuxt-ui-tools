# Display kinds

Every example is the `props` of a block: write it as `{ display: '<kind>', props }` in a form, or
`<UiDisplay display="<kind>" :props="props" />`. Text props accept a string, a lazy translation, a
VNode or a render function. Every kind also takes `loading` and `ui`.

## heading

Titles a group of fields.

| Prop           | Type                   | Notes                                               |
| -------------- | ---------------------- | --------------------------------------------------- |
| `title`        | content                | required                                            |
| `description`  | content                | under the title                                     |
| `variant`      | `'title' \| 'eyebrow'` | `eyebrow`: small uppercase label followed by a rule |
| `size`         | `'sm' \| 'md' \| 'lg'` | `lg` sets the icon in a tinted tile                 |
| `icon`, `tone` |                        | tile tone, `primary` by default                     |
| `count`        | text                   | pill after the title                                |
| `action`       | action                 | link-style button at the end                        |
| `level`        | `2…6`                  | heading element, `3` by default                     |

```ts
{ title: 'Payment terms', description: 'Applied to the next invoices.', icon: 'i-lucide-receipt', size: 'lg' }
```

## text

| Prop                 | Notes                                                                   |
| -------------------- | ----------------------------------------------------------------------- |
| `appearance`         | `body` (default), `lead`, `muted`, `caption`, `quote`, `legal`, `prose` |
| `text`, `paragraphs` | one block, then more                                                    |
| `title`, `icon`      | `legal` heading; `icon` also leads a `caption`                          |
| `author`, `meta`     | `quote` attribution line                                                |
| `tone`               | `quote` bar and `legal` rule                                            |
| `maxLines`           | clamps with a « Read more » toggle when the text overflows              |

`prose` styles rich content (links, lists, bold, inline code) passed as VNodes or render functions.

## alert

| Prop                     | Notes                                                                                                                               |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------- |
| `tone`                   | `info` by default                                                                                                                   |
| `appearance`             | `soft` (default), `outline`, `subtle`, `solid`, `callout` (accent bar), `inline` (no box), `banner` (icon tile, actions at the end) |
| `icon`                   | defaults to the tone's icon from `appConfig.ui.icons`; `false` hides it                                                             |
| `title`, `message`       |                                                                                                                                     |
| `items`                  | `{ icon?, text }[]`, one icon per line                                                                                              |
| `list`                   | bulleted lines                                                                                                                      |
| `details`, `defaultOpen` | folded text behind « Show details »                                                                                                 |
| `actions`                | buttons                                                                                                                             |

Warning and error alerts are `role="status"`, so a notice appearing while the user edits is read out.

```ts
{ tone: 'error', title: '3 rows rejected', list: ['Row 4: invalid email', 'Row 9: duplicate'], details: 'Row 12: birth date missing.' }
```

## facts

| Prop                | Notes                                                                                                                |
| ------------------- | -------------------------------------------------------------------------------------------------------------------- |
| `layout`            | `ledger` (rows, value at the end; default), `grid` (caption over value), `inline`, `columns` (label column), `tiles` |
| `items` or `groups` | `groups: [{ title?, aside?, items }]`                                                                                |
| `surface`           | `bordered` for `ledger`, `plain` otherwise                                                                           |
| `columns`           | `grid`/`tiles` column count, else as many as fit                                                                     |
| `labelWidth`        | `columns` label width, `8rem` by default                                                                             |
| `actions`           | buttons under the facts                                                                                              |
| `empty`             | shown with no facts                                                                                                  |

A fact: `{ label, value?, hint?, tone?, chip?, copy?, mono?, emphasis?, icon?, to?, loading? }`.
An empty value draws a dash; `chip` draws the value as a badge; `copy: true` copies a text value
(or pass the string to copy); `loading` draws a placeholder bar in place of the value.

```ts
{
  groups: [
    { title: 'Contract', aside: '2026', items: [{ label: 'Reference', value: 'CT-2026-0148', mono: true, copy: true }] },
    { title: 'Billing', items: [{ label: 'Committed', value: '€9,840.00', emphasis: true }, { label: 'Pending', loading: true }] },
  ],
  actions: [{ label: 'Edit the contract', icon: 'i-lucide-pencil', onClick: openEditor }],
}
```

## stat

| Prop                                                                   | Notes                                                                                                 |
| ---------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `variant`                                                              | `hero` (centred, default), `price` (status line), `row` (2–4 figures), `trend` (change and sparkline) |
| `label`, `value`, `unit`, `caption`, `chip`, `tone`, `size`, `surface` |                                                                                                       |
| `status`                                                               | `{ icon?, text, tone? }`                                                                              |
| `delta`                                                                | `{ value, direction?: 'up' \| 'down' \| 'flat', tone? }`, success up and error down by default        |
| `trend`                                                                | sparkline points                                                                                      |
| `items`                                                                | `row`: `{ label, value, caption?, tone? }[]`                                                          |

## breakdown

| Prop                                                            | Notes                                                                           |
| --------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| `mode`                                                          | `open` (default), `collapsible` (total until unfolded), `compare` (two columns) |
| `title`, `lines`, `total`, `footnote`, `defaultOpen`, `surface` |                                                                                 |
| `columns`                                                       | `compare` headings                                                              |

A line: `{ label, value?, values?: [a, b], detail?, subtotal?, tone?, muted? }`. The total takes a
`chip`. Long labels wrap rather than run under the value.

## meter

| Prop                                             | Notes                                                                                                                                                     |
| ------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `variant`                                        | `bar` (default), `segments` (stacked parts + legend), `split` (two parts labelled at both ends), `ring` (gauge with part bars), `scale` (discrete levels) |
| `label`, `value`, `max`, `valueLabel`, `caption` | `max` is `100`, or the sum of the parts for `segments`/`split`                                                                                            |
| `tone`, `thresholds`                             | `thresholds: { warning: 70, error: 90 }` switch the tone at those percentages                                                                             |
| `parts`                                          | `{ label, value, valueLabel?, tone?, icon?, max? }[]`                                                                                                     |
| `levels`, `current`, `target`                    | `scale`: reached levels tinted, `current` filled, `target` dashed                                                                                         |
| `size`                                           | `ring` diameter                                                                                                                                           |

## chart

`{ variant: 'bars' | 'line' | 'donut' | 'funnel', title?, aside?, data: { label, value, tone? }[], format?, height?, highlight? }`.
Bars highlight the last value by default (`'max'`, an index, or `false`). Colors follow the dashboard
palette (`--nut-dash-s1…s6`); `funnel` shows the rate kept from one step to the next.

## table

`{ columns: { key, label, numeric?, align?, width?, mono? }[], rows, footer?, caption?, note?, maxHeight?, max?, step?, empty?, surface? }`.
With `maxHeight`, the rows scroll under a pinned header and footer. Numeric columns align to the end.

## diff

`{ variant: 'inline' | 'columns', title?, columns?, items: { label, before?, after?, changed?, note? }[], showUnchanged? }`.
`inline` strikes the old value before the new one and hides items with `changed: false` unless
`showUnchanged`, which lists them with their value as is. `columns` dims unchanged rows.

## record

| Prop                                                      | Notes                                       |
| --------------------------------------------------------- | ------------------------------------------- |
| `variant`                                                 | `row` (default), `card`, `compact`, `stack` |
| `reference`, `title`, `meta`, `metaIcon`, `description`   |                                             |
| `image`, `avatar`, `icon`, `tone`                         | a broken image falls back to a tinted tile  |
| `badges`, `chip`, `trailing`, `trailingCaption`           |                                             |
| `to`, `onClick`                                           | makes the record a link or a button         |
| `heading`, `headingIcon`, `items`, `max`, `step`, `empty` | `stack`                                     |

## person

`{ variant: 'user' | 'group' | 'contact', name, description?, avatar?, tone?, chip?, people?, max?, label?, contacts?, size? }`.
Without an avatar image, initials show on a tint picked from the name, stable across the app.
Contacts are `{ icon?, value, href?, copy? }` with a copy button by default.

## list

| Prop                                                | Notes                                                                                    |
| --------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| `variant`                                           | `bullets` (default), `numbered`, `icons`, `checks`, `steps`, `columns`, `files`, `chips` |
| `title`, `items`, `columns`, `max`, `step`, `empty` |                                                                                          |
| `preview`                                           | `files`: open in the file preview when the app provides one, `true` by default           |

An item: `{ text, description?, icon?, tone?, done?, current?, meta?, tooltip?, href?, name?, size?, type? }`.
`files` reads `href` (a URL or a function returning one), `size` in bytes, and the type from the name.

```ts
{ variant: 'files', items: [{ text: 'Notice.pdf', size: 186_000, href: () => api.signedUrl(fileId) }] }
```

## timeline

| Prop              | Notes                                                                                   |
| ----------------- | --------------------------------------------------------------------------------------- |
| `variant`         | `vertical` (default), `log`, `pipeline`, `schedule`                                     |
| `items`           | `{ title, description?, date?, time?, icon?, tone?, actor?, state? }`                   |
| `current`         | `pipeline`: index of the current stage                                                  |
| `now`, `nowLabel` | dates after `now` are planned (dashed); `schedule` draws a « Today » marker before them |
| `dateFormat`      | `Intl.DateTimeFormat` options for times built from dates                                |

## date

`{ variant: 'tile' | 'range' | 'countdown', value, end?, title?, description?, icon?, tone?, time?, deadline?, warnWithin?, now?, label? }`.
`countdown` words the distance (« In 2 days », « Tomorrow »), turns `warning` within `warnWithin`
days (3) and `error` once past when `deadline` (default) reads it as overdue (« 3 days overdue »).

## media

| Prop                                                    | Notes                                                                                         |
| ------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| `variant`                                               | `image` (default), `gallery`, `video`, `document`, `link`                                     |
| `src`                                                   | a URL or a function returning one; `image` and `video` resolve it on mount, `document` on use |
| `images`, `max`                                         | `gallery` tiles before « +N »                                                                 |
| `thumbnail`                                             | video poster, document first page, link image                                                 |
| `title`, `caption`, `description`, `duration`, `aspect` |                                                                                               |
| `name`, `size`, `type`, `pages`                         | `document` card                                                                               |
| `href`                                                  | `link`: a URL or a function returning one                                                     |
| `preview`, `actions`                                    | images and documents open in the file preview; documents default to Open and Download         |

## code

`{ variant: 'block' | 'value' | 'secret', value, language?, label?, icon?, href?, copy?, visible?, maxHeight? }`.
`json` blocks are highlighted. `secret` masks all but the last `visible` characters (4) behind a
reveal toggle.

## empty

`{ variant: 'dashed' | 'plain', icon?, title?, description?, actions?, tone? }`.

## accordion

`{ variant: 'separated' | 'flush', items: { label, icon?, content?, block?, defaultOpen? }[], multiple? }`.
`block` nests a display block: `{ display: 'facts', props: { ... } }`.
