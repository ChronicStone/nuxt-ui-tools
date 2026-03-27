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

## Read This Skill With

- `skills/consumer/package/SKILL.md`
- `skills/consumer/package/references/overview.md`

This surface is public and should be treated as a real package-consumer API.

## Context-Backed Option Columns

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

## References And Review Validity

Top-level `references` derive canonical fields from imported fields. They can now use the same rules builder shape as columns.

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

- the references step is now permissive: unresolved matches do not block navigation on their own
- unresolved reference outputs stay unset on the row
- reference `rules` run after resolution on the final reference output value
- row validity is decided in review by validation issues, not by a hardcoded unresolved-reference blocker
- if the source field is multi-value, the resolved reference output is inferred as an array and reference rules receive that array type
