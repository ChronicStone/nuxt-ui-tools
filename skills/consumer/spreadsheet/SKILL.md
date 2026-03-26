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

1. a plain array of standard `{ label, value }` options
2. a function that receives `{ context }` and returns standard `{ label, value }` options
3. an object with `resolve`, `optionLabel`, and `optionValue` when the source items are custom objects

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
        options: {
          resolve: ({ context }) => context.products,
          optionLabel: product => product.name,
          optionValue: product => product.id,
        },
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

When the spreadsheet cell text matches the option label or the option value, the parsed row receives the resolved option value. If no option matches, the row gets an `option.not_found` error for that column.

## Multiple Values In Static Columns

Static column kinds support built-in multi-value parsing through `multiple`.

Example:

```ts
column.text('tags', {
  multiple: true,
})

column.number('scores', {
  multiple: {
    separator: ';',
  },
  rules: {
    allPassing: sheetRules.validate({
      name: 'allPassing',
      validator: (value: number[]) => value.every(score => score >= 50),
      message: 'All scores must be at least 50',
    }),
  },
})

column.option('productIds', {
  options: {
    resolve: ({ context }) => context.products,
    optionLabel: product => product.name,
    optionValue: product => product.id,
  },
  multiple: {
    separator: ',',
    matchBy: 'label',
  },
})
```

Behavior:

- `multiple: true` uses `,` as the default separator
- `multiple: { separator: ';' }` lets you change the token separator
- `rules` stays singular and follows the final parsed value type such as `string[]`, `number[]`, or `ProductId[]`
- built-in parsing validates each token by column kind, so invalid numbers, enums, or options produce row issues without needing a custom `parse`
