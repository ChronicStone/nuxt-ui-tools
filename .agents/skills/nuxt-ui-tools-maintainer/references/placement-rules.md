# Placement Rules

This reference answers the question:

"Where should this code go?"

## Top-Level Runtime Domain Choice

### `src/runtime/shared`

Put code here only if it is genuinely cross-domain.

Good fits:

- generic utility types
- generic predicates
- generic reusable helpers
- shared composables with no table/form-specific assumptions

Bad fits:

- logic that only table uses today and is unlikely to be reused
- domain helpers pretending to be generic

### `src/runtime/query-state`

Put code here when it is about URL/query-param state as a reusable primitive.

Good fits:

- codecs
- generic URL-state abstractions
- grouped or dynamic query-state machinery
- client/router integration

Bad fits:

- table-specific query-state shaping that belongs in a table adapter layer

### `src/runtime/table`

Put code here when it is specifically about the table/data-list runtime domain.

Good fits:

- schema-driven table behavior
- table-specific types
- table state orchestration
- table rendering
- table adapters over generic primitives

Current note:

- this is the richest runtime domain today
- but do not design it as if table is the only serious future surface
- shared patterns should remain reusable by form and excel-import where appropriate

### `src/runtime/form`

Put code here when the feature is truly form-domain logic.

Current note:

- this area is early
- build it from the same architectural basis rather than inventing a completely different internal philosophy

## Within A Runtime Domain

### `types/`

Put canonical domain types here.

Use for:

- public type contracts
- normalized domain types
- builder input/output contracts

Do not put:

- runtime execution logic
- random helper functions

### `schema/`

Put schema-definition entrypoints and schema-facing composition here.

Use for:

- define-schema entrypoints
- schema normalization entry boundaries
- schema-facing builder consumption

### `composables/`

Put reactive orchestration here.

Use for:

- state wiring
- reactive composition
- domain orchestration
- integration between lower-level primitives

Do not put:

- heavy pure transformation logic that could live in `utils/`
- component-specific rendering logic

### `utils/`

Put pure or mostly pure logic here.

Use for:

- normalization
- resolution
- transformation
- registry/config pipelines
- helper logic that can be tested outside component rendering
- variant-specific implementations behind stable contracts

### `utils/builders/`

This is the preferred long-term home for builder helpers.

Current transitional note:

- some code still lives under top-level `builders/`
- when touching or growing builder code, prefer moving toward `utils/builders/`

### `components/`

Put rendering and view-layer composition here.

Use for:

- view shells
- renderers
- UI composition

Do not put:

- heavy domain brain logic
- feature behavior that should have been prepared by composables/utils

## Split Early For Non-Trivial Features

Do not wait for a feature to become messy before structuring it.

If a feature has:

- multiple kinds
- a clear internal pipeline
- multiple responsibilities

split it early.

Examples:

- `utils/filters/preview/*`
- `utils/columns/*`

That is the direction to keep following.

## Practical Placement Checklist

Before adding a file, answer these in order:

1. is this cross-domain or domain-owned?
2. is this public schema/API shaping, reactive orchestration, pure transformation, or rendering?
3. is this a new variant that should sit behind an existing config/registry pipeline?
4. would placing it elsewhere hide ownership and make the feature harder to evolve?
