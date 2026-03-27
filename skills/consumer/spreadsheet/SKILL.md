---
name: nuxt-ui-tools-spreadsheet
description: Use this skill when building or debugging spreadsheet import usage with nuxt-ui-tools as a package consumer. Covers defineSpreadsheetSchema, useSpreadsheetImport, SpreadsheetImport, column matching, references, review flow, and practical import patterns.
---

# nuxt-ui-tools Spreadsheet

Use this skill for package-consumer tasks involving:

- `defineSpreadsheetSchema(...)`
- `useSpreadsheetImport(...)`
- `SpreadsheetImport`
- spreadsheet column definitions
- matching and manual mapping
- reference reconciliation
- review and submit payload preparation

## `SpreadsheetImport` Close Controls

`SpreadsheetImport` can expose a close button for parent-controlled shells such as modals, slideovers, or fullscreen flows.

Example:

```vue
<script setup lang="ts">
const open = ref(true)
const spreadsheet = useSpreadsheetImport(schema)
</script>

<template>
  <UiSpreadsheetImport
    v-if="open"
    :spreadsheet="spreadsheet"
    closable
    @close="open = false"
  />
</template>
```

Behavior:

- `closable` shows a close button in the import header
- `@close` fires when that button is clicked
- the component does not hide itself automatically; the parent owns open/closed state

## Read This Skill With

- `skills/consumer/package/SKILL.md`
- `skills/consumer/package/references/overview.md`

This surface is public and should be treated as a real package-consumer API.

## Strict Option Parsing With `option`

Static spreadsheet option columns support three option source shapes:

1. a plain array of primitives like `['Draft', 'Done']`
2. a plain array of standard `{ label, value }` options
3. a function that receives `{ context }` and returns either of those shapes

Example:

```ts
const schema = defineSpreadsheetSchema({
  importKey: 'assessment.results',
  context: [
    {
      key: 'products',
      query: () => ({
        queryKey: ['products'],
        queryFn: async () => [
          { id: 'prod_1', name: 'Business English 4 Skills' },
          { id: 'prod_2', name: 'Reading Placement Test' },
        ],
      }),
    },
  ],
  columns: {
    static: (column) => [
      column.option('productId', {
        match: {
          headers: ['Product'],
        },
        options: ({ context }) =>
          context.products.map(product => ({
            label: product.name,
            value: product.id,
          })),
      }),
      column.option('selectedProductId', {
        match: {
          headers: ['Selected product'],
        },
        options: ({ context }) =>
          context.products.map(product => ({
            label: product.name,
            value: product.id,
          })),
      }),
    ],
  },
})
```

Primitive options use the same value for both display and parsing. Object options use `label` for display and `value` for the parsed row.

When the spreadsheet cell text matches the option label or the option value, the parsed row receives the resolved option value. If no option matches, the row gets an `option.not_found` error for that column.

Use `column.option(...)` when the spreadsheet value itself must already be one of the allowed values.

This is strict parsing, not smart reconciliation:

- the spreadsheet cell must directly match an option label or value
- the parsed row receives the option value immediately
- there is no reconciliation session for unresolved values

## Column-Level `resolve`

Use column-level `resolve` when the imported column should end up as the canonical field value and you do not need to keep the raw imported value afterward.

Supported column kinds today:

- `column.text(...)`
- `column.number(...)`

Example:

```ts
column.text('productId', {
  match: {
    headers: ['Product'],
  },
  resolve: {
    options: ({ context }) =>
      context.products.map(product => ({
        label: product.name,
        value: product.id,
      })),
  },
  rules: v => [
    v.required({
      message: 'A product match is required before import',
    }),
  ],
})

column.number('centerId', {
  match: {
    headers: ['Center code'],
  },
  resolve: {
    options: [
      { label: '1201', value: 1201 },
      { label: '1202', value: 1202 },
    ],
  },
})
```

Behavior:

- the cell is parsed first by the base column kind, including `multiple` parsing when present
- the parsed value is then matched against canonical options
- if a match is found, the final field receives the canonical option value
- if no match is found, the final field stays unset
- column `rules` run on the resolved final field value, not on the raw imported text
- in review and submit payloads, the raw imported source value is not kept for that field

## Top-Level `references` For Derived Canonical Fields

Use top-level `references` when you want to preserve the raw imported field and derive an additional canonical field from it.

Example:

```ts
defineSpreadsheetSchema({
  importKey: 'assessment.results',
  columns: {
    static: (column) => [
      column.text('productLabelRaw', {
        match: {
          headers: ['Product'],
        },
      }),
    ],
  },
  references: reference => [
    reference.select('productId', {
      source: 'productLabelRaw',
      options: ({ context }) =>
        context.products.map(product => ({
          label: product.name,
          value: product.id,
        })),
      rules: v => [
        v.required({
          message: 'A product match is required before import',
        }),
      ],
    }),
  ],
})
```

Behavior:

- `productLabelRaw` stays on the row as the imported source field
- `productId` is added separately as a derived canonical field
- unresolved values can still continue past the references step
- reference `rules` run on the derived resolved target field value

## Choosing Between `option`, Column `resolve`, And Top-Level `references`

Use `option` when:

- the spreadsheet value should already be one of the allowed values
- you want strict parsing with no smart reconciliation flow

Use column `resolve` when:

- the spreadsheet input is messy or uncontrolled
- the final field itself should become canonical
- you do not need the raw imported field after resolution

Use top-level `references` when:

- you want to keep the raw imported field
- you also want a second canonical field derived from it

## Multiple Values In Static Columns

Static column kinds support built-in multi-value parsing through `multiple`.
Common normalization can be expressed with column `modifiers` and `multiple.itemModifiers`, so you only need `parse` for real escape-hatch logic.

Validation rules use a local builder callback, so you do not import built-in spreadsheet rules in every schema. Reusable custom rules are created once with `createSheetRule(...)`.

Example:

```ts
const allPassing = createSheetRule<number[], [], {}>({
  name: 'allPassing',
  validator: (value) => value.every(score => score >= 50),
  message: 'All scores must be at least 50',
})

column.text('tags', {
  modifiers: ['trim'],
  multiple: true,
})

column.number('scores', {
  modifiers: ['trim'],
  multiple: {
    separator: ';',
  },
  rules: v => [
    allPassing(),
  ],
})

column.option('productIds', {
  options: ({ context }) =>
    context.products.map(product => ({
      label: product.name,
      value: product.id,
    })),
  multiple: {
    separator: ',',
    matchBy: 'label',
    itemModifiers: ['trim', 'lowercase'],
  },
})
```

Behavior:

- top-level `modifiers` run on the raw cell text before parsing
- `multiple: true` uses `,` as the default separator
- `multiple: { separator: ';' }` lets you change the token separator
- `multiple.itemModifiers` runs on each split token after tokenization
- `rules` stays singular and follows the final parsed value type such as `string[]`, `number[]`, or `ProductId[]`
- built-in parsing validates each token by column kind, so invalid numbers, enums, or options produce row issues without needing a custom `parse`

When `multiple` and `resolve` are combined on `text` or `number`, the source tokens are resolved in order and the final output keeps that order. Unresolved source items are simply omitted from the resolved output array.

## Validation Relations

Use `.refine({ relations })` for row-aware validation that depends on other parsed fields, references, dynamic outputs, or `buildRow` output.

Example:

```ts
defineSpreadsheetSchema({
  importKey: 'assessment.results',
  columns: {
    static: (column) => [
      column.text('status'),
      column.number('scores.general'),
    ],
  },
}).refine({
  relations: [
    {
      column: 'scores.general',
      condition: row => row.status === 'Done',
      rules: (v) => [
        v.required({
          message: 'General score is required when status is Done',
        }),
      ],
    },
  ],
})
```

Behavior:

- `rules: v => [...]` on a column runs as base field validation
- `.refine({ relations })` runs after parsing, dynamic columns, and references have been resolved
- if `buildRow` exists, relation paths and `row` are typed against the `buildRow` output
- otherwise, relation paths and `row` are typed against the resolved import row
- base `v.required()` affects row type inference
- relation `v.required()` is runtime-only and does not make the field statically non-optional

## Validation Ownership And Review Validity

Column `rules`, top-level reference `rules`, and `.refine({ relations })` all use the same validation contracts and issue format.

Example:

```ts
defineSpreadsheetSchema({
  importKey: 'assessment.results',
  columns: {
    static: (column) => [
      column.text('examNameRaw'),
    ],
  },
  references: reference => [
    reference.select('productId', {
      source: 'examNameRaw',
      options: [
        { label: 'Business English 4 Skills', value: 'prod_1' },
      ],
      rules: v => [
        v.required({
          message: 'A product match is required before import',
        }),
      ],
    }),
  ],
})
```

Behavior:

- unresolved smart matches do not block navigation on their own
- unresolved outputs stay unset on the row
- row validity is decided in review by validation issues, not by a hardcoded unresolved-reference blocker
- `rules` on a column with `resolve` run after resolution on the final canonical field value
- `rules` on a top-level reference run after resolution on the derived target field value
- if the source field is multi-value, the resolved reference output is inferred as an array and reference rules receive that array type
