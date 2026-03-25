# Spreadsheet Architecture Proposal

## Public consumer flow

The desired public usage flow is:

1. define schema with `defineSpreadsheetSchema(...)`
2. create runtime with `useSpreadsheetImport(...)`
3. render with `SpreadsheetImportFlow`

This mirrors the table runtime and keeps consumer ergonomics predictable.

Parallel imperative flow:

1. define schema with `defineSpreadsheetSchema(...)`
2. start a session with `$spreadsheetApi.start(...)`
3. render via the app shell or return completion data

## Internal ownership layers

The spreadsheet domain should be split early.

## 1. Public layer

Owns:

- `src/runtime/spreadsheet/index.ts`
- `src/runtime/spreadsheet/schema/*`
- `src/runtime/spreadsheet/composables/use-spreadsheet-import.ts`

Responsibilities:

- stable consumer entrypoints
- schema builder surface
- public runtime API

## 2. Orchestration root

Own:

- `src/runtime/spreadsheet/composables/use-spreadsheet-internals.ts`

Responsibilities:

- wire together the domain
- no business logic dumping ground

Like table, this file should be the runtime map, not the domain brain.

## 3. Domain composables

Proposed slices:

- `use-spreadsheet-session.ts`
- `use-spreadsheet-source.ts`
- `use-spreadsheet-column-groups.ts`
- `use-spreadsheet-sheet-state.ts`
- `use-spreadsheet-header-state.ts`
- `use-spreadsheet-matching.ts`
- `use-spreadsheet-pipeline.ts`
- `use-spreadsheet-review.ts`
- `use-spreadsheet-submit.ts`

Each should own one runtime concern.

## 4. Utils / registries

Proposed areas:

- `utils/parsers/*`
- `utils/header/*`
- `utils/columns/*`
- `utils/matching/*`
- `utils/pipeline/*`
- `utils/template/*`
- `utils/export/*`

Registry-heavy domains:

- dynamic column/group resolvers
- column kind resolvers
- matcher resolvers
- parser/coercion resolvers
- issue/validation resolvers

This is exactly the kind of domain that benefits from config/registry-driven internals.

## 5. Components

Proposed UI areas:

- `components/SpreadsheetImportFlow.vue`
- `components/steps/*`
- `components/review/*`
- `components/shared/*`

Rules:

- components render prepared runtime state
- step behavior should not be invented in components
- UI should be replaceable by a custom consumer shell

## Proposed schema normalization model

Normalization should produce one resolved schema shape:

- resolved source policy
- resolved step policy
- resolved static and dynamic column groups
- resolved column definitions
- resolved matcher definitions
- resolved pipeline definitions
- resolved review policy

The runtime should consume normalized structures, not raw builder inputs everywhere.

## Dynamic columns are a first-class architecture concern

Some imports are not fully known at build time.

Examples:

- org-specific affiliation groups
- per-tenant custom fields
- backend-driven import templates

This means the architecture must support:

- runtime column resolution
- grouping and labeling of dynamic columns
- inference that preserves known static output while representing dynamic sections cleanly
- domain-shaped submit transforms so dynamic columns do not force ugly flat output

The wrong direction is:

- "just append generated field objects to an array"

The better direction is:

- resolve normalized column groups
- give each dynamic group its own identity and matching policy
- provide dedicated dynamic builders for common patterns such as option groups
- let pipeline/submit stages reshape them into the final payload

The API should not force consumers to:

- `map(...)` runtime arrays into raw column definitions by hand
- hand-author repetitive header regex lists
- hand-wire label-to-option resolution for every dynamic collection

Those are exactly the kinds of repeated patterns the library should absorb.

## Matching engine design

Matching is a real subsystem and should not stay simplistic.

The engine should combine multiple scorers:

- exact string match
- normalized string match
- alias match
- regex match
- custom function match
- sample-value heuristic match
- optional async/domain hint match

Each scorer returns either:

- `null`
- or a numeric confidence

Then the engine resolves:

- best candidate
- confidence
- tie state
- conflict state
- duplicate state

This is much easier to extend than one distance-based function.

## Pipeline design

The pipeline should have explicit stages:

1. raw cell extraction
2. column-level parse / coercion
3. row-level mapping
4. row-level validation / enrichment
5. table-level validation / enrichment
6. review edits revalidation
7. submit payload shaping

Important rule:

- no single callback should own all of this

## Async design

Async behavior should follow the table query model where useful.

Use query-definition style for:

- context loading
- remote option lookups
- async enrichment reference data
- remote duplicate checks
- maybe sheet metadata if needed

That keeps the domain aligned with existing repository patterns.

## Output model

The runtime should keep multiple row states, not just "all rows".

We need:

- typed resolved rows
- valid rows
- invalid rows
- warnings
- row issues by field
- import summary
- original/raw provenance

The review layer should be able to inspect and edit against this normalized row state.

## Headless-first rule

Even if we ship a default UI, the runtime should be headless-first in architecture.

Meaning:

- the session can run without the stock component
- step state is inspectable
- actions are callable from custom UI
- row/issue state is not locked inside a component

This is also what makes the imperative `$spreadsheetApi.start(...)` path viable.

## Session API direction

The runtime should expose a reusable session object.

That session should power both:

- `useSpreadsheetImport(...)`
- `$spreadsheetApi.start(...)`

Meaning the same underlying session can be:

- mounted into an inline renderer
- mounted into a modal/drawer/fullscreen host
- driven entirely imperatively

This keeps the UI shell separate from the import engine itself.

## Naming direction

Prefer `spreadsheet` as the runtime domain name, not `excel-reader`.

Reason:

- broader than Excel
- closer to user intent
- better fit for CSV + XLSX + future structured tabular imports

Possible public names:

- `defineSpreadsheetSchema`
- `useSpreadsheetImport`
- `SpreadsheetImportFlow`
- `createSpreadsheetTemplate`

## Maintenance surface once implementation starts

When this becomes code, the task is not done after runtime compiles.

We will need:

- runtime tests
- inference tests
- playground route
- consumer-facing spreadsheet skill/docs
- internal spreadsheet maintainer guidance

That should be planned from the beginning instead of bolted on later.
