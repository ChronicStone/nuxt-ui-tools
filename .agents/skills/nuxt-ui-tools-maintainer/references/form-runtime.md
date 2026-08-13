# Form Runtime

`src/runtime/form` is a V1 runtime domain with a curated field-kind registry.

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

## Current V1 Ownership

- `fields/index.ts` is the field-kind capability registry; alpha-select is intentionally excluded.
- Each field kind owns its types and config, while shared visual implementations live in focused
  family folders such as `date-family/` and `hierarchy/`.
- `utils/state.ts` owns recursive defaults, validation, and output for objects, groups, arrays,
  discriminated variants, and matrices.
- `use-field-options.ts` and `use-form-context-resources.ts` pass complete TanStack Query options
  into observers; never reconstruct or manually invoke a query function.
- `use-form-option-registry.ts` and `use-form-upload-registry.ts` bridge mounted field work into
  field APIs without moving option or upload ownership into the runtime facade.
- Repeated fields reconcile cloned item content into stable reactive array slots through
  `utils/array.ts`; replacing an index-addressed array while controls are mounted can let stale
  controlled input state overwrite a moved row on the next Vue render.
- `components/layout/` owns overlay-specific configuration; the provider and root renderer only
  coordinate lifecycle.
- `types/ui.ts`, `utils/ui.ts`, and `use-form-ui.ts` own the presentation contract. Preserve the
  app config, schema, rendered-form, then field `props` precedence; every new structural renderer
  must expose named UI slots and every Nuxt UI control must inherit the shared control size.
- Group and input-group renderers use `UFieldGroup` with bare child renderers so intermediate
  field nodes collapse through `display: contents`. Matrix and array-table own their semantic
  table slots and center or contain nested controls instead of leaking cell layout into field kinds.

When adding a field, update the local type/config/component, assembled union, registry, renderer,
value/output inference, recursive state ownership where relevant, tests, playground, and consumer
skill as one maintenance surface.
