# Spreadsheet Import Context

## What we are actually building

We want a serious spreadsheet import engine, not a modal component with a lot of props.

The product should support:

- CSV and Excel uploads
- optional sheet selection
- optional header-row selection
- smart column matching
- row normalization and coercion
- sync and async validation
- interactive review and correction
- final typed output

This should be a real runtime domain, eventually on the same level as:

- `shared`
- `table`
- `form`
- `excel-import`

## Inputs that matter

### From `react-spreadsheet-import`

Keep:

- the functional flow:
  upload -> sheet selection -> header selection -> column matching -> validation/review -> submit
- the idea that expensive transforms happen in pipeline hooks
- the ability to jump into a later step with prepared state
- the value of an interactive review stage

Do not keep:

- one large component prop surface
- string-key-only field modeling
- simplistic header automatching driven mostly by label distance
- UI-driven feature ownership

### From the legacy `vue-sweettools` excel reader

Keep the good ideas:

- schema-based output typing
- `targetKey` / remapping intent
- transform-driven output coercion
- reference file and invalid-row export as first-class workflow ideas

Do not keep:

- giant field objects mixing label, validation, format, rendering, and import behavior
- weak typing escape hatches
- cast-heavy composables
- "table as validator" architecture

### From the current table runtime

Keep:

- public consumer flow:
  define schema -> create runtime -> render component
- query-definition async contracts
- config/registry-driven internal design
- clean separation between public schema, orchestration composables, utils, and UI
- inference-first philosophy

## Product principles

### 1. Import schema is a target contract, not just a column list

The schema should describe:

- target row shape
- how spreadsheet columns can map into that shape
- how values are read, coerced, validated, enriched, and reviewed

### 2. Steps are runtime concerns, not required public ceremony

Consumers should be able to:

- keep the full flow
- skip non-vital steps
- auto-resolve them
- inject initial state at any stage

Examples:

- skip sheet selection when the file has one sheet
- skip header selection when `header.row = 1`
- skip column mapping when the import template is locked
- skip review when validation is silent and only valid rows are allowed

### 3. Matching must be a strategy system

Header matching cannot be limited to:

- label
- alternate labels
- Levenshtein distance

We need multiple match inputs:

- exact strings
- aliases
- regex
- normalization pipelines
- custom scoring functions
- data-sample-based matching
- "required together" or "never with" constraints
- context-aware async hints when useful

### 4. Parsing, matching, validation, and UI must be split

These are different concerns:

- file ingestion
- workbook/sheet parsing
- header detection
- column matching
- row mapping
- validation and enrichment
- review UI

The old designs blurred these together.
The new one should not.

### 5. Consumers should write concrete code, not negotiate types

The public docs and proposal should show:

- realistic imports
- real schema code
- actual step config examples
- actual matching examples
- actual async resolver examples

Not:

- walls of type definitions
- pseudo-generic surfaces detached from usage

## Main use cases we must design for

### Basic admin CSV import

- single sheet
- first row is header
- simple direct matches
- required fields
- inline review and submit

### Messy vendor file

- unknown sheet name
- title rows before header
- inconsistent header labels
- values needing coercion
- many warnings and a review step

### Locked template import

- consumer controls the exported template
- sheet name is known
- header row is known
- matching can be skipped or enforced automatically

### Enriched import with remote lookups

- spreadsheet contains labels or external references
- import needs async option resolution
- import may need org-specific rules or remote uniqueness checks

### Dynamic org-specific column groups

- the import surface depends on org configuration
- some columns are only known at runtime
- dynamic groups may need custom matching, parsing, and payload shaping
- imported values may need to become nested arrays or records instead of flat fields

This is a primary use case, not an edge case.

### Headless ingestion workflow

- file is uploaded somewhere else
- UI wants to jump directly into review
- import runtime still needs schema, matching, validation, and typed output

### Large operational imports

- expensive cross-row validation
- warning vs blocking errors
- batch review
- export invalid rows / generate feedback file

## Proposed public mental model

The table mental model is:

- `defineTableSchema(...)`
- `useTable(...)`
- `<DataList />`

The spreadsheet mental model should be parallel:

- `defineSpreadsheetSchema(...)`
- `useSpreadsheetImport(...)`
- `<SpreadsheetImportFlow />`

Optional headless path:

- `createSpreadsheetSession(...)`
- custom UI consumes the runtime state

App-level imperative path:

- `$spreadsheetApi.start(schema, options)`
- promise resolves with completion state and typed data

## Things the previous proposal likely got wrong

Even without preserving it, these are the failure modes we must explicitly avoid:

- API centered around internal types instead of usage examples
- schema config shaped by implementation shortcuts
- rigid step model
- not enough matching power
- dynamic columns treated as second-class or shoehorned into flat field arrays
- not enough separation between "field definition" and "flow behavior"
- not enough power for async/context-aware import rules
- surface area that looks configurable but still forces one happy path
