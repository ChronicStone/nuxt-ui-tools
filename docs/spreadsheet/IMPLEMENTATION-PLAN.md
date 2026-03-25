# Spreadsheet Implementation Plan

This is the ordered implementation plan for the spreadsheet import runtime.

It is intentionally shaped around the architecture we now want, not around the old implementation.

Core goals:

- schema-first and inference-first
- same public mental model as table:
  define schema -> create runtime -> render UI
- dynamic runtime columns as a first-class feature
- built-in reference reconciliation for external labels -> internal entities
- inline renderer first
- imperative API preserved from the beginning through a shared session core

## Final target model

Desired public surface:

- `defineSpreadsheetSchema(...)`
- `useSpreadsheetImport(...)`
- `SpreadsheetImportFlow`
- `createSpreadsheetTemplate(...)`
- `$spreadsheetApi.start(...)`

Desired runtime stages:

1. source/upload
2. sheet resolution
3. header resolution
4. column matching
5. reference reconciliation
6. row review
7. submit

## Phase 0: Freeze the design

Goal:

- stop API drift before writing runtime code

Tasks:

- finalize `docs/spreadsheet/CONTEXT.md`
- finalize `docs/spreadsheet/API-PROPOSAL.md`
- finalize `docs/spreadsheet/ARCHITECTURE.md`
- treat this implementation plan as the ordered roadmap

Decisions to freeze before coding:

- top-level schema sections
- dynamic builder direction
- references/reconciliation as a first-class schema section
- normalized row model
- session-first runtime model

Exit criteria:

- no unresolved debate about whether dynamic columns and reference matching are core features
- no unresolved debate about inline vs imperative architecture

## Phase 1: Create the runtime domain skeleton

Goal:

- establish the spreadsheet runtime domain with the same organizational quality as table

Create:

- `src/runtime/spreadsheet/index.ts`
- `src/runtime/spreadsheet/schema/`
- `src/runtime/spreadsheet/types/`
- `src/runtime/spreadsheet/composables/`
- `src/runtime/spreadsheet/utils/`
- `src/runtime/spreadsheet/components/`

Initial file targets:

- `schema/index.ts`
- `composables/use-spreadsheet-import.ts`
- `composables/use-spreadsheet-internals.ts`
- `types/schema.ts`
- `types/session.ts`
- `types/rows.ts`
- `types/source.ts`
- `types/references.ts`

Rules:

- keep public layer clean
- keep internals modular from the start
- do not let `use-spreadsheet-internals.ts` become a dumping ground

Exit criteria:

- domain compiles
- public entrypoint exists
- file ownership is obvious

## Phase 2: Define the schema model and normalization contracts

Goal:

- get the public schema shape and resolved internal schema shape correct before runtime logic expands

Implement:

- `defineSpreadsheetSchema(...)`
- schema normalization pipeline
- core resolved schema types

Public schema sections to support first:

- `importKey`
- `input`
- `source`
- `sheet`
- `header`
- `matching`
- `context`
- `columns`
- `references`
- `pipeline`
- `review`

Important design rules:

- consumer writes concrete config, not type gymnastics
- resolved schema should normalize defaults aggressively
- dynamic columns and references must normalize into explicit runtime structures

Normalized schema should include:

- resolved source policy
- resolved step policy
- resolved context queries
- resolved static column definitions
- resolved dynamic column builders
- resolved reference definitions
- resolved pipeline callbacks
- resolved review policy

Inference tasks:

- infer normalized row shape from static columns
- preserve clean types for nested paths like `scores.general`
- define how dynamic outputs are represented without destroying static inference
- define submit payload inference from `pipeline.submit`

Exit criteria:

- consumer examples typecheck
- normalized schema can drive runtime without using raw builder input

## Phase 3: Build the source and workbook ingestion layer

Goal:

- establish file ingestion and workbook parsing as a standalone concern

Implement:

- file acceptance policy
- max size / max record guards
- CSV and XLSX parsing
- workbook model normalization
- sheet extraction helpers

Suggested files:

- `utils/source/read-file.ts`
- `utils/source/parse-workbook.ts`
- `utils/source/map-sheet.ts`
- `types/source.ts`
- `composables/use-spreadsheet-source.ts`

Source state should track:

- selected file
- workbook
- sheet names
- selected sheet
- raw matrix rows
- loading/error state

Important rule:

- parsing should produce a simple normalized matrix early
- later stages should not depend on SheetJS-specific data structures

Exit criteria:

- runtime can ingest CSV and XLSX into a normalized matrix
- sheet selection inputs are available for the next stages

## Phase 4: Build sheet and header resolution

Goal:

- support auto, fixed, and user-selected sheet/header steps

Implement:

- sheet state composable
- header state composable
- row scoring for header detection
- step skip logic for fixed/auto-resolved cases

Suggested files:

- `composables/use-spreadsheet-sheet-state.ts`
- `composables/use-spreadsheet-header-state.ts`
- `utils/header/detect-header-row.ts`
- `utils/header/normalize-header.ts`

Supported sheet strategies:

- fixed
- selection
- auto

Supported header strategies:

- fixed row
- first row
- selection
- detected

Important rule:

- step policy belongs to runtime state, not UI
- UI only reflects whether a step is needed

Exit criteria:

- session can resolve sheet/header automatically or require user choice when needed

## Phase 5: Implement static column definitions and base row normalization

Goal:

- make simple imports work end-to-end before dynamic columns and reference stages

Implement:

- static column builders:
  `text`, `email`, `number`, `date`, `boolean`, `enum`, `option`, `array`, `custom`
- cell parsing/coercion
- nested path writing
- row issue recording

Suggested files:

- `schema/columns.ts`
- `utils/columns/normalize-column.ts`
- `utils/rows/write-path.ts`
- `utils/pipeline/parse-cell.ts`
- `types/rows.ts`

Row model should support:

- raw cell values
- normalized row values
- field issues
- row issues
- metadata for source/header/match provenance

Important rule:

- output row state should be explicit and inspectable
- do not collapse “parsed value”, “resolved value”, and “submitted value” into one ambiguous blob

Exit criteria:

- static-column imports can parse rows into typed normalized output with issues

## Phase 6: Implement column matching engine

Goal:

- replace simplistic header matching with a strategy system

Implement:

- normalized header tokens
- matching strategies:
  exact, normalized, aliases, regex, template, function
- confidence scoring
- conflict/tie handling
- duplicate assignment handling

Suggested files:

- `utils/matching/engine.ts`
- `utils/matching/strategies/`
- `composables/use-spreadsheet-matching.ts`

Runtime outputs:

- matched columns
- unresolved columns
- duplicate/conflicted matches
- confidence metadata

Important rule:

- engine concepts must stay generic
- no domain-specific strategy names in the public API

Exit criteria:

- matching works for both static columns and future dynamic columns

## Phase 7: Implement dynamic column builders

Goal:

- make runtime-resolved columns first-class without leaking low-level plumbing to consumers

Implement first-class dynamic builder support:

- `columns.dynamic`
- built-in dynamic builders for common patterns

First builder to ship:

- `dynamic.optionGroups(...)`

Why this first:

- it directly covers the affiliation-group use case
- it exercises runtime column generation, grouped output, option resolution, and matching

`dynamic.optionGroups(...)` must own:

- source collection iteration
- group key and label resolution
- target key generation
- header resolution strategy
- option resolution
- label-to-option mapping
- multi-value parsing
- grouped normalized output

It must not force consumers to:

- manually `map(...)` source arrays into raw columns
- hand-author repetitive regex lists
- hand-wire option-label matching for every group

Suggested files:

- `schema/dynamic-columns.ts`
- `utils/columns/dynamic/resolve-option-groups.ts`
- `utils/columns/dynamic/output.ts`
- `composables/use-spreadsheet-column-groups.ts`

Important design questions to settle here:

- how dynamic outputs appear in normalized row state
- how dynamic groups contribute to inference
- how dynamic groups expose review metadata

Exit criteria:

- assessment-style affiliation columns can be generated entirely from async context data using one built-in builder

## Phase 8: Implement async context layer

Goal:

- let schema/runtime depend on async domain data in the same way table uses query-based context

Implement:

- query-definition-based `context`
- loading, error, refresh behavior
- context availability before dynamic columns/references initialize

Suggested files:

- `composables/use-spreadsheet-context.ts`
- `types/context.ts`

Rules:

- context resolves before any stage that depends on it
- dynamic columns can depend on context
- references can depend on context
- context API should mirror table’s query-definition mindset

Exit criteria:

- `context.affiliationGroups` and similar async dependencies can drive runtime behavior

## Phase 9: Implement reference reconciliation stage

Goal:

- bake in the “match imported external labels to internal platform entities” workflow as a core runtime feature

This is the stage for things like:

- exam names -> internal products
- school labels -> internal schools
- partner labels -> internal partner ids

Implement:

- `references` schema section
- unique source value extraction
- auto-suggestion engine
- manual unresolved mapping state
- application of resolved mappings back to all affected rows

Suggested files:

- `types/references.ts`
- `utils/references/extract-distinct-values.ts`
- `utils/references/match-reference-options.ts`
- `composables/use-spreadsheet-references.ts`

Reference definition should support:

- source field
- remote/local target options
- auto-match strategy
- manual resolution requirement
- output field mapping

Critical behavior:

- reference reconciliation acts on distinct values, not on every row independently
- one chosen mapping propagates to all matching rows

Exit criteria:

- assessment exam-name -> product reconciliation works inside the import flow without external modals or side systems

## Phase 10: Implement row and table pipeline stages

Goal:

- support transforms and validation at the right ownership layers

Implement stages:

1. cell parse/coercion
2. row transform/validation
3. reference application
4. table transform/validation
5. submit transform

Suggested files:

- `utils/pipeline/run-row-stage.ts`
- `utils/pipeline/run-table-stage.ts`
- `utils/pipeline/run-submit-stage.ts`
- `composables/use-spreadsheet-pipeline.ts`

Important rule:

- row-local logic stays row-local
- cross-row logic stays table-level
- submit shaping is separate from normalized row state

Exit criteria:

- normalized rows, reviewed rows, and final submit payload are clearly separated

## Phase 11: Implement session model and public runtime API

Goal:

- create one session core that powers both inline and imperative usage

Implement:

- session state machine
- current step
- skip rules
- pending/error state
- navigation actions
- submit action

Suggested files:

- `types/session.ts`
- `composables/use-spreadsheet-session.ts`
- `composables/use-spreadsheet-internals.ts`
- `composables/use-spreadsheet-import.ts`

The session should expose:

- current step
- resolved rows
- summary
- matches
- references
- issues
- actions:
  next, previous, goTo, submit, refreshContext, downloadTemplate, downloadInvalidRows

Important rule:

- session logic owns progression
- components do not invent flow transitions

Exit criteria:

- inline renderer and imperative API can both run from the same session core

## Phase 12: Implement the inline UI

Goal:

- ship the first complete user-facing implementation as an inline flow

Implement:

- `SpreadsheetImportFlow.vue`
- step components:
  upload, select-sheet, select-header, match-columns, references, review, completed

Suggested files:

- `components/SpreadsheetImportFlow.vue`
- `components/steps/UploadStep.vue`
- `components/steps/SelectSheetStep.vue`
- `components/steps/SelectHeaderStep.vue`
- `components/steps/MatchColumnsStep.vue`
- `components/steps/ReferenceMatchStep.vue`
- `components/steps/ReviewStep.vue`

Reference match UI must support:

- one row per distinct imported source value
- suggested target matches
- searchable remote option selection
- bulk resolution visibility

Review UI must support:

- invalid rows
- row issues
- field issues
- filtered review
- correction and revalidation

Exit criteria:

- the full flow works inline end-to-end for the assessment import case

## Phase 13: Implement the imperative API

Goal:

- expose app-driven usage without re-architecting later

Implement:

- Nuxt plugin:
  `$spreadsheetApi`
- `start(schema, options)` API
- instance registry if needed
- promise resolution on close/submit

Suggested files:

- `runtime/plugins/spreadsheet-api.ts`
- `types/api.ts`

Design reference:

- follow the same general spirit as the old form/wizard imperative APIs
- but keep the spreadsheet-specific runtime model

Supported first mode:

- inline host

Future-compatible modes:

- modal
- drawer
- fullscreen

Exit criteria:

- `$spreadsheetApi.start(schema, options)` returns a typed promise result and reuses the same session runtime

## Phase 14: Template generation and invalid-row export

Goal:

- retain the useful workflow wins from the old system

Implement:

- reference template generation
- example row generation
- invalid-row export with issue context

Suggested files:

- `utils/template/create-template.ts`
- `utils/export/export-invalid-rows.ts`

Exit criteria:

- consumers can download a template derived from the schema
- invalid rows can be exported for correction workflows

## Phase 15: Tests

Goal:

- lock down inference and behavior early

Test layers:

- schema typing tests
- dynamic column inference tests
- reference reconciliation behavior tests
- matching engine tests
- session navigation tests
- inline flow integration tests

Suggested targets:

- `test/spreadsheet/schema/*.test-d.ts`
- `test/spreadsheet/runtime/*.test.ts`
- `test/spreadsheet/components/*.test.ts`

Must-have test cases:

- static import with nested output
- dynamic option groups from async context
- exam-name reference reconciliation with repeated row values
- header auto-detection and skip behavior
- template/fixed header strategies
- submit payload shaping

Exit criteria:

- the assessment case and a few generic import cases are covered by both runtime and inference tests

## Phase 16: Playground and validation surfaces

Goal:

- make the runtime explorable and manually verifiable

Add playground routes for:

- simple static import
- dynamic affiliation-group import
- exam-name reference reconciliation
- imperative API example

Important rule:

- playground demonstrates real package usage patterns
- playground does not become the real implementation layer

Exit criteria:

- every major feature can be manually validated in the playground

## Phase 17: Documentation and skills

Goal:

- keep the maintenance and consumer surfaces in sync with the runtime

Update or create:

- consumer-facing spreadsheet skill/docs
- internal maintainer spreadsheet skill/docs
- examples in docs/spreadsheet

Consumer docs must show:

- simple import
- dynamic columns
- references/reconciliation
- imperative API usage

Internal docs must show:

- file ownership
- extension patterns
- where to add dynamic builders
- where to add reference match strategies

Exit criteria:

- both maintainers and package consumers can use the feature without reading source first

## Recommended shipping order

Build in this order:

1. domain skeleton
2. schema normalization
3. source/workbook ingestion
4. sheet/header resolution
5. static columns
6. matching engine
7. async context
8. dynamic option groups
9. reference reconciliation
10. pipeline stages
11. session runtime
12. inline UI
13. imperative API
14. template/export helpers
15. tests
16. playground
17. docs/skills sync

## First milestone

The first serious milestone should be:

- async context
- static columns
- dynamic `optionGroups`
- reference reconciliation
- inline flow
- assessment import working end-to-end

Do not delay the dynamic/reference parts as “later polish”.
They are core product requirements, not optional enhancements.

## Non-goals for the first milestone

Do not try to ship all of this immediately:

- every possible dynamic builder
- full modal/drawer/fullscreen host support
- every export format variant
- every possible advanced review UI convenience

Start with:

- one excellent dynamic builder
- one excellent reference reconciliation stage
- one solid inline runtime

Then expand.

## Next concrete step after this plan

After this plan, the best next implementation task is:

1. define the normalized schema types
2. define the normalized row/session/reference models
3. implement `defineSpreadsheetSchema(...)`
4. implement async context + dynamic `optionGroups(...)`
5. implement references on top of that

That sequence keeps the foundation clean and avoids rebuilding the public API later.
