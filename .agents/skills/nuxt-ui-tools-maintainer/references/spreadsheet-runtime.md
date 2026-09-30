# Spreadsheet Runtime

`src/runtime/spreadsheet` owns Excel, CSV, and pasted-row imports: the schema, the headless runtime,
and the UI parts. Consumer usage lives in `skills/consumer/spreadsheet/SKILL.md`.

## Principles

- Exact or ask: headers and values match declared names after `normalizeSpreadsheetText` (case,
  accents, spaces, a trailing `*`). No similarity scoring anywhere; column suggestions are offered,
  never applied.
- The schema is data only. Steps, headings, and pickers live in the UI.
- Headless first: every part reads the public `SpreadsheetImporter`, never composable internals.

## Types and inference (`types/`)

- `columns.ts`: the chained builder. Each method returns a builder whose `TRow` gains the column
  (`SpreadsheetWith`); a column's callbacks get `SpreadsheetScope` as `row`: the row so far, the
  outer row plus the group so far inside `.group`, the outer row in a `.dynamic` factory. Value
  generics are inferred from return types (`parse`, `default`, `when`) and literal options; the
  computed value types are wrapped in `NoInfer` so the contextual return type cannot feed them
  back. `rules` use `NoInfer<TItem>` so a rule cannot change the column type. `SpreadsheetNewKey`
  makes a repeated key a type error; `from` is a `SpreadsheetFieldPath` of the scope, so it can only
  name a column above.
- `schema.ts`: `defineSpreadsheetSchema<Ctx>()({…})` (curried for the explicit context) and the
  plain overload; `columns(c)` returns the builder and the row type is read from it. Callbacks are
  method signatures: any schema then fits `SpreadsheetRuntimeSchema`, the erased shape composables
  use. Its `columns` takes only `{ '~entries' }`, because a typed builder is invariant in its
  context; method bivariance does the rest. Never add a non-callback property whose type depends
  on the row: TypeScript fixes it early and rows collapse to `unknown`. That is why `rows.key` is a
  function.
- `schema/builder.ts`: the runtime builder records `SpreadsheetEntry` values (`column`, `group` with
  its children, `dynamic` with `items` and `column`) in `'~entries'`; overloads carry the types.
- `importer.ts`: public models; functions are methods so a typed importer fits `SpreadsheetImporter`.
- `test/spreadsheet/schema-types.test.ts` and the type assertions in `engine.test.ts` and
  `dependencies.test.ts` guard all of this; run them after any type change.

## Pipeline (`composables/`)

`useSpreadsheetImport` wires, in order, each receiving whole upstream composables:

1. `context`: values, refs, getters, or TanStack queries (`useSpreadsheetQueries`).
2. `file`: reads workbooks (`utils/workbook.ts`: xlsx with typed raw values, CSV/TSV with separator
   and encoding detection, empty rows dropped with their file row numbers kept) and pasted text.
3. `fields`: `resolveSpreadsheetFields` flattens groups, builds dynamic columns, applies `when`,
   resolves labels, headers, `defaultOf`, `rulesOf` (rules functions declaring a second parameter
   run per row). Options reading the row become `select.rowOptions`: the resolver runs once on a
   recording row (`recordSpreadsheetRowReads`) to know the fields it reads (`dependsOn`). Empty
   until the context is ready.
4. `layout`: detection (`utils/layout.ts`), schema `file.sheet` / `file.headerRow`, preview rows.
5. `columns`: exact header matching with manual assignments (reset when header texts change).
6. `options`: per select field, lists, queries, or remote loaders (`resolveLabels`, else one search
   per distinct value). `optionsOf(field, row)` resolves row options for a row; rows with the same
   list share one indexed entry and one scope id (a hash of the list), cached until fields change.
7. `answers` (user answers store, keyed by `spreadsheetAnswerKey`: the scope id prefixes the value
   when options depend on the row) → `rows`: `parseSpreadsheetRow` per row, field by field in
   declared order, passing the row so far to `parse`, `defaultOf`, `optionsOf`, and `rulesOf`
   (errors thrown there become row issues); a cache keyed by the row array and its edit object; `validate` cached per parsed row; keys, duplicates, stored records
   (one lookup query for the distinct keys), modes, diffs, discards, server rejections.
8. `values`: questions from unmatched tokens of rows not discarded for another reason than a
   value answer, one per field, scope, and value, with the scope's `dependsOn` values and
   `choices`; recognized values.
9. `review`: view state shared by the table, toolbar, and inspector.
10. `submit`: creates values answered `create`, builds `output` payloads, batches, rejections.

`useSpreadsheetSteps` is separate and optional: built-in presets (`spreadsheetSteps.*`) and custom
steps share one shape; visited `when-needed` steps stay done.

## UI (`components/`)

`spreadsheet-import-root.vue` provides the importer and steps. `parts/` hold one part per model;
`steps/` the stepper, current step, and navigation; `internal/` rows, editors, badges.
`spreadsheet-import.vue` is the ready composition, built only from public parts.

Test hooks: `data-spreadsheet-step`, `-next`, `-submit`, `-field` (+ `data-status`), `-value`
(+ `data-state`), `-row` (+ `data-status`), `-cell`, `-inspect`, `-inspector`, `-dropzone`,
`-column-mapping`, `-value-mapping` (+ `-value-scope` headings), `-table`, `-stats`. Select editors
take the cell's `choices`, which follow the row.

## Maintenance surface

- Registration: `src/imports.ts` (`defineSpreadsheetSchema`, `useSpreadsheetImport`,
  `useSpreadsheetSteps`, `spreadsheetSteps`), `src/components.ts`, package exports, and
  `test/public-surface.test.ts`.
- Copy: `spreadsheet.*` in `i18n/types.ts` and both locales (issues, template, steps, parts).
- `resolveLabels` belongs to the shared `defineRemoteOptions` loader (`src/runtime/shared`).
- Tests: `test/spreadsheet/*` (types and engine on real xlsx files), `test/dom/spreadsheet/*` (the
  wizard through the UI, a single-page composition).
- Playgrounds: `playground/app/pages/spreadsheet/*` (V1 wizard, one page, option sources, row
  identity, large file) and `playground-table/app/pages/assessments/import.vue` (the ExAssess page).
