# Context

This file centralizes the current V2 form-engine reset context.

## Legacy Reference

The legacy implementation lives at:

- `/Users/cyprienthao/Documents/DEV/ORGANISATIONS/AGORASTORE/NEW_STACK/tars-shared-ui/src/runtime/lib/form`

It is already a real platform, not a thin form wrapper.

Main preserved structural signals:

- `types`
- `utils`
- `composables`
- `components`
- `config`

Those layers match the target structure for `src/runtime/form` in this repository.

## Consumer Reference

Real-world usage was inspected in:

- `/Users/cyprienthao/Documents/DEV/ORGANISATIONS/AGORASTORE/NEW_STACK/tars-profile-frontend/app/entities`
- `/Users/cyprienthao/Documents/DEV/ORGANISATIONS/AGORASTORE/NEW_STACK/tars-profile-frontend/app/components`

Important observed usage counts:

- `dependencies:` appears 59 times
- `$parent` appears 40 times
- `onDependencyChange` appears 6 times
- `createOption` appears 5 times
- stepped forms appear 8 times

So the dependency system is not a niche feature.
It is one of the core product surfaces.

## Type-Safety Reference

The dependency typing direction should learn from:

- `/Users/cyprienthao/Documents/DEV/ORGANISATIONS/PERSO/packages/typed-xlsx/packages/core/src/core/path.ts`
- `/Users/cyprienthao/Documents/DEV/ORGANISATIONS/PERSO/packages/typed-xlsx/packages/core/src/core/accessor.ts`
- `/Users/cyprienthao/Documents/DEV/ORGANISATIONS/PERSO/packages/typed-xlsx/plans/schema-context-and-structure-refactor.md`

The main lesson is not "copy the spreadsheet API".
The main lesson is:

- make context explicit
- make access paths typed
- avoid clever selective inference that becomes hard to teach
- prefer one coherent context model over multiple special-case path tricks

## Current Source Of Truth

Read in this order:

1. [`CURRENT-PLAN.md`](./CURRENT-PLAN.md)
2. [`06-public-api-proposal.md`](./06-public-api-proposal.md)
3. [`03-v2-direction.md`](./03-v2-direction.md)
4. [`02-dependency-system-analysis.md`](./02-dependency-system-analysis.md)
5. [`01-legacy-analysis.md`](./01-legacy-analysis.md)
6. [`04-api-questions.md`](./04-api-questions.md)
7. [`05-decisions-log.md`](./05-decisions-log.md)
8. [`08-implementation-progress.md`](./08-implementation-progress.md)

## Current repo direction

The V2 form runtime should be built in:

- `src/runtime/form`

And should follow the same internal philosophy as the table and query-state runtimes:

- schema-first public API
- inference-first typing
- config/registry-driven feature organization when variants exist
- composables for orchestration
- utils for pure logic
- components for rendering

Additional direction clarified on 2026-04-08:

- async resolvers should support both:
  - TanStack Query-based resolver flows
  - plain promise-returning resolver flows
- TanStack integration should be a first-class happy path, not a mandatory async contract
- the legacy DX and feature set are broadly strong and should be preserved
- the implementation should be refined where the legacy engine is inconsistent:
  - properties appearing on irrelevant field kinds
  - weak field-specific property ownership
  - no clean global field-property/default layer

Additional direction clarified on 2026-05-11:

- keep literal schema object DX as the primary API
- do not move to a per-field builder pattern
- each form can declare typed form-scoped context
- context shape is free and context entries do not depend on other context entries
- field callbacks receive `{ ctx, deps, api }`
- field option loading must infer context dependency chains automatically
- option loading should show when no usable data exists or during explicit refresh, not ordinary cache background refresh
- use per-field folders with colocated `component.vue`, `config.ts`, and `types.ts`
- prefer a generic field-kind config helper with structured feature toggles over visible capability intersections
- use `layout.span` and `layout.columns` instead of legacy `size` and `gridSize`
- rename legacy `group` toward `input-group`, backed by Nuxt UI `UFieldGroup`
- group legacy `preformat` and `transform` as `transform.input` and `transform.output`
- overhaul form and field APIs with namespaced method groups
- keep raw string paths for now
- use Regle for validation and preserve i18n support
- treat detailed JSDoc examples as part of the public API work

## Current implementation note

`src/runtime/form` now contains the first type-layer foundation:

- schema helpers
- field-kind registry configs
- authored field types
- context and option source contracts
- internal/output extraction types
- tests for context, options, dotted paths, transforms, omitted submit fields, conditional output, and stepped schemas

The next step should continue from the type/API boundary before runtime composables:

- tighten the namespaced form and field APIs
- model dependency result shapes
- preserve fully typed `ctx`, `deps`, and `api` callback params
- only then build the lean runtime state/context/option composables
