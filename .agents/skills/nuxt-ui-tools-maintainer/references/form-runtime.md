# Form Runtime

`src/runtime/form` is an early runtime domain.

## Current Rule

Do not treat its current minimal state as permission to invent a different architecture style.
For existing form-engine capabilities, this runtime is a port-and-refinement of the latest
`shared-ui` form engine, not a greenfield implementation.

Build it from the same basis as the stronger domains:

- clear public entry
- canonical types
- schema-friendly surface
- composables for orchestration
- utils for pure logic
- components for rendering

## Shared-UI Baseline Rule

Before implementing, refactoring, or simplifying an existing form feature, inspect the
corresponding `shared-ui` implementation first.

Treat the `shared-ui` structure as the default architecture to preserve for:

- provider-owned form APIs
- inline/modal/drawer/fullscreen layout split
- layout cleanup and transition lifecycle
- form actions and submit controls
- state and output inference
- field config and field-owned type resolution
- field runtime APIs
- context/dependency/query orchestration
- validation and i18n wiring

Adapting is allowed only when the Nuxt UI version has a concrete reason:

- a different primitive with a better ownership boundary
- stronger type inference
- clearer runtime ownership
- less reactive waste without losing capability
- a simpler public API that keeps the same power
- removal of a Naive UI-specific workaround

Invalid reasons to diverge:

- fewer files
- shorter code
- temporarily avoiding a difficult lifecycle problem
- collapsing renderer, layout, provider, actions, and cleanup into one component
- moving field-owned logic into broad global engine files

When in doubt, preserve the `shared-ui` split first. Simplify only after proving the replacement
keeps the same capability, separation, and extension path.

## Required Form Folder Split

Every non-trivial part of the form engine should live in an isolated concern folder.

Use this shape as the default:

```txt
src/runtime/form/
  components/
    root/
    renderer/
    layout/
    actions/
    provider/
    utils/
  composables/
  fields/<field-kind>/
  types/
  utils/
```

Do not put provider lifecycle, layout shell, field rendering, actions, and runtime orchestration
into one component just because the current implementation is young.

## Long-Term Goal

It should become easy to maintain and easy to adopt in the same way as the table/query-state surfaces.

When adding form features, bias toward:

- the same placement rules
- the same inference-first public API style
- the same example-driven consumer skill standard
