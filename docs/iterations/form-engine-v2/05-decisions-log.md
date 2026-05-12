# Decisions Log

## 2026-04-08

### Active decisions

- the legacy form engine in `tars-shared-ui` is the canonical feature and architecture reference for V2 discovery
- the V2 goal is to preserve the real product model, not to port the legacy string API verbatim
- the strongest part of the legacy architecture to preserve is the field config/registry model
- the largest DX gap to solve first is dependency typing
- the async contract should support both:
  - TanStack Query-based resolvers
  - direct promise-returning resolvers
- V2 dependency design should bias toward:
  - parent and ancestor references
  - previously declared local fields only
  - explicit typed aliasing
  - explicit typed scope helpers
- V2 should introduce a first-class global field property/default layer
- V2 should tighten field property ownership so irrelevant properties stop leaking onto unrelated field kinds
- `typed-xlsx` path/accessor typing is a reference for the dependency redesign approach, especially:
  - typed path accessors
  - one coherent context model
  - avoiding selective cleverness that is hard to teach
- `src/runtime/form` should be built from the same architectural basis as table/query-state:
  - types
  - schema
  - composables
  - utils
  - components

### Current open direction

- exact dependency DSL is still open
- exact scope helper vocabulary is still open
- exact group/object/array v2 surface is still open
- implementation should not begin by copying legacy files mechanically

## 2026-05-11

### Implementation decisions

- keep literal schema object authoring as the primary implementation target
- use per-field folders under `src/runtime/form/fields/{type}/config.ts`
- expose form helpers from `#ui-tools/form` and auto-import `defineFormSchema`, `defineFormField`, and `defineFormFields`
- preserve dotted-path state/output inference from the legacy engine
- support stepped schemas at the type layer, including `showStepper: false` and optional step `root` output nesting
- replace legacy broad output omission with `submit.omit`
- make conditional field output optional while keeping internal state required
- keep runtime state/composable work blocked behind a clearer typed API boundary, to avoid porting the legacy mirrored field-state model unchanged
