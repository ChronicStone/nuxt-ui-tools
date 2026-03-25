# Spreadsheet Schema Spec

This document freezes the schema-first public surface for the spreadsheet runtime before runtime implementation begins.

The goal is the same discipline used for table:

- freeze public schema shape first
- freeze inference expectations first
- add schema/inference tests first
- only then build runtime orchestration and UI

## Core public entrypoints

Initial schema-only entrypoints:

- `defineSpreadsheetSchema(...)`
- types from `#ui-tools/spreadsheet/types`

Runtime entrypoints come later:

- `useSpreadsheetImport(...)`
- `SpreadsheetImportFlow`
- `$spreadsheetApi.start(...)`

## Top-level schema sections

The top-level schema shape is:

```ts
defineSpreadsheetSchema({
  importKey: '...',
  source: { ... },
  sheet: { ... },
  header: { ... },
  matching: { ... },
  context: [ ... ],
  columns: {
    static: (column, group) => [ ... ],
    dynamic: ({ dynamic, context }) => [ ... ],
  },
  references: [ ... ],
  pipeline: {
    submit: ({ row, context }) => ({ ... }),
  },
  review: { ... },
})
```

## Schema section responsibilities

### `context`

Owns:

- async metadata queries used by schema/runtime stages

Examples:

- `affiliationGroups`
- `products`
- `testCenter`

Inference expectation:

- `context[*].key` becomes a typed property on extracted context data
- query result type is inferred from `queryFn`

### `columns.static`

Owns:

- stable row fields known at schema-definition time

Inference expectation:

- nested keys like `scores.general` become nested row objects
- column `parse` controls field output type
- `required: true` keeps fields required
- optional columns become optional row properties

### `columns.dynamic`

Owns:

- runtime-resolved columns generated from async or schema-factory-driven source data

First-class builder to support first:

- `dynamic.optionGroups(...)`

Inference expectation:

- static row inference stays precise
- dynamic sections get a strong but generic type
- first builder target:
  `Record<string, TValue[]>` under the configured output key

### `references`

Owns:

- reconciliation of imported external labels into internal platform ids/entities

Examples:

- exam name -> product id
- school name -> school id

Inference expectation:

- resolved reference output fields become part of the row type
- output field value type comes from `target.optionValue(...)`

### `pipeline.submit`

Owns:

- final payload shaping

Inference expectation:

- if present, `ExtractSpreadsheetSubmitPayload<typeof schema>` uses this return type
- otherwise submit payload defaults to extracted row type

## Initial builder surface

### Static column builders

Initial schema-only builder signatures:

- `text`
- `email`
- `number`
- `date`
- `boolean`
- `enum`
- `option`

These are enough to lock the main inference model.
More specialized builders can be added later.

### Group builder

Initial grouping helper:

- `group(key, columns)`

Purpose:

- UI/runtime organization
- no effect on row output type beyond flattening contained columns

### Dynamic builders

Initial dynamic builder:

- `dynamic.optionGroups(...)`

This is the first dynamic builder because it directly covers:

- org-driven affiliation groups
- remote enum options
- CSV-like multi-value cells
- grouped output collection

## Initial extractor types

These are the public type helpers we want immediately:

- `ExtractSpreadsheetContextData<TSchema>`
- `ExtractSpreadsheetRow<TSchema>`
- `ExtractSpreadsheetSubmitPayload<TSchema>`
- `SpreadsheetQueryDefinition<TData>`

These should be enough to test the schema surface before runtime exists.

## Assessment use-case expectations

For the assessment import use case:

- `context.affiliationGroups` is inferred from async query result
- `columns.static` produces fields like:
  `testCenterId`, `examNameRaw`, `scores.general`
- `columns.dynamic.optionGroups({ output: { into: 'affiliations' }})` adds:
  `affiliations?: Record<string, string[]>`
- `references` can add:
  `productId?: string`
- `pipeline.submit` can reshape final payload independently of normalized row type

## Type-test coverage we want now

We should immediately add tests for:

1. context query result inference
2. static nested row inference
3. dynamic option-group output inference
4. reference output field inference
5. submit payload inference
6. public package surface checks

## Non-goals for this schema phase

This phase should not implement:

- workbook parsing
- header detection runtime
- matching engine runtime
- reconciliation UI
- session navigation

Only the schema contracts and extraction types should ship in this phase.
