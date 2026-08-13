# nuxt-ui-tools Agent Guide

This is the canonical operating guide for AI agents working in this repository.

The goal is simple:

- an agent should be able to handle a request with minimal repo scanning
- an agent should know how this repository is structured
- an agent should know how features are designed here
- an agent should know what must be maintained beyond the implementation itself

## 1. Canonical Sources During The Current Transition

Use this order of truth:

1. `AGENTS.md` for how to operate in this repository
2. the code for implementation truth
3. tests and playground behavior for validated behavior
4. consumer-facing package skills in `skills/consumer/` for package usage guidance
5. existing `docs/` only as temporary historical/reference material unless explicitly promoted

Do not treat the current `docs/` directory as canonical product documentation.

Use the skill system intentionally:

- `AGENTS.md` gives the shared operating model
- `.agents/skills/` gives deeper internal implementation guidance
- `skills/consumer/` gives deeper package-consumer guidance

Current important internal skills include:

- `.agents/skills/nuxt-ui-tools-maintainer/`
- `.agents/skills/nuxt-ui-tools-typescript/`
- `.agents/skills/nuxt-ui-tools-reactivity/`
- `.agents/skills/nuxt-ui-tools-config-driven/`

Internal and consumer guidance must stay strictly separated:

- `.agents/skills/` explains how this repository is built and maintained
- `skills/consumer/` explains only what package consumers write, configure, and get back

## 2. Core Repository Goal

This repository should be optimized so an agent can receive a feature request without a long surrounding explanation and still:

- understand where to work
- understand the philosophy behind the relevant area
- implement the feature in the expected style
- update the full maintenance surface

Avoid broad exploratory scans unless the task-routing guidance below is insufficient.

## 3. Core Engineering Philosophy

This repository is built around:

- modularity
- composability
- standardization
- type-safety
- config/registry-driven design whenever relevant

Config/registry-driven design is a core philosophy of this module. It should shape both internals and public APIs whenever the domain benefits from it.

Prefer:

- config-driven or registry-driven structures over sprawling conditionals
- standardized input/output contracts over ad hoc variant handling
- isolated feature parts over giant files or giant functions
- clean, evolvable modules over short-term convenience

Avoid:

- giant branching functions
- giant multi-responsibility files
- dumping unrelated logic into broad directories
- feature code that mixes normalization, orchestration, rendering, and API shaping in one place

If a domain has multiple kinds or variants, move toward a standardized config/registry-based structure early.

## 4. Repo Map

### `src/module.ts`

Purpose:

- Nuxt module entrypoint
- package integration boundary

Belongs here:

- module setup
- top-level Nuxt integration concerns

Does not belong here:

- runtime feature logic
- feature-specific orchestration

### `src/imports.ts`

Purpose:

- curated Nuxt auto-import registration for public function APIs

Belongs here:

- `addImports(...)` registration for public package functions
- one root registration list grouped by domain with comment blocks
- only the functions that should feel like first-class consumer entrypoints

Does not belong here:

- internal helpers
- raw directory scanning or broad "export everything" style registration
- component registration

### `src/components.ts`

Purpose:

- curated Nuxt component registration for public components

Belongs here:

- explicit `addComponent(...)` registration for public components
- one root registration list grouped by domain with comment blocks
- component names that respect the module prefix behavior

Does not belong here:

- internal component families
- broad component directory registration for internal subcomponents
- function auto-import registration

### `src/runtime/shared`

Purpose:

- shared primitives
- cross-feature helpers
- generic reusable utilities and composables

Belongs here:

- helpers with real cross-domain value
- foundational utility types and predicates

Does not belong here:

- table-specific or form-specific logic disguised as shared logic

### `src/runtime/query-state`

Purpose:

- typed URL/query-state abstraction
- reusable query param codecs and state helpers

Philosophy:

- query state should be lean
- state abstractions should minimize reactive waste
- avoid layering derivation on top of derivation on top of derivation
- prefer one clear state instantiation over multiple intermediate wrappers/computed bridges when the abstraction can support it directly

Belongs here:

- codecs
- URL state abstractions
- reusable query-state orchestration

Does not belong here:

- domain-specific table shaping unless it is a thin adapter

### `src/runtime/table`

Purpose:

- schema-driven data/table runtime
- the most mature current product surface

Philosophy:

- config/registry-driven design is the default when relevant
- schemas, builders, types, composables, rendering, and utilities should be clearly separated
- feature variants should be isolated behind consistent contracts
- public APIs should preserve inference and avoid forcing consumer-side workaround typing

Belongs here:

- table runtime
- schema-driven table features
- table UI/runtime orchestration

Does not belong here:

- playground-only glue
- logic that should have been extracted to shared runtime

### `src/runtime/form`

Purpose:

- form runtime area

Philosophy:

- this area is not complete yet
- this area is a port-and-refinement of the latest `shared-ui` form engine, not a greenfield rewrite
- for existing form-engine capabilities, `shared-ui` is the architectural baseline and must be inspected before implementation
- it should grow from the same architectural basis as the stronger runtime domains, while preserving the hard-won structure already solved in `shared-ui`
- build it with the same modular, config-driven, schema-friendly approach used elsewhere
- split every non-trivial concern early: schema/type engine, field config, field component, renderer, layout, actions, provider, runtime orchestration, and pure utilities must stay isolated

Mandatory form-runtime rule:

- before implementing, refactoring, or simplifying an existing form feature, inspect the corresponding `shared-ui` implementation and identify the structure it used
- treat `shared-ui` component/code breakdown as the default shape to preserve, especially for layout, actions, provider APIs, state/output inference, field config, validation, and field runtime APIs
- adapt only when there is a concrete Nuxt UI, type-safety, reactivity, ownership, or public API reason
- if diverging from `shared-ui`, make the new ownership model more explicit and more maintainable than the original, not merely shorter
- never collapse multiple form-engine responsibilities into one file or component because the current slice feels small
- do not drop existing shared-ui capability unless it is explicitly out of V1 scope or replaced by a stronger design

Does not belong here:

- one-off layout/provider code that bypasses the shared-ui layout architecture without an explicit reason
- field-specific type logic inside global output/state engine files
- broad renderer components that also own layout shell, provider lifecycle, actions, and cleanup
- shortcuts that work in the playground but weaken long-term form-engine structure

### Future Core Areas

The target core repository shape is not just table.
Think in terms of a growing core around:

- shared
- table
- form
- excel-import

Do not over-optimize around table as if it will remain the only serious runtime domain.

### `playground`

Purpose:

- integration surface
- demo surface
- manual validation surface

Belongs here:

- feature demos
- integration-only glue
- validation routes

Does not belong here:

- the only real implementation of reusable runtime behavior
- package logic that should live under `src/runtime`

### `test`

Purpose:

- validate runtime behavior
- validate public API surface
- validate type inference and regressions

Current test emphasis already includes:

- runtime behavior
- schema inference
- resolved filter behavior
- public surface checks

### `.agents/skills`

Purpose:

- internal AI workflow skills for working on this repository

Belongs here:

- repo-maintainer workflows
- internal implementation guidance
- specialized internal task procedures

Does not belong here:

- consumer-facing package usage guidance

### `skills/consumer`

Purpose:

- canonical consumer-facing AI guidance for package usage

Belongs here:

- package usage guidance
- feature-focused consumer workflows
- package-facing examples and caveats
- concrete API usage
- concrete option/value shapes
- concrete result shapes
- code examples wherever they materially help understanding

Does not belong here:

- playground-specific implementation guidance
- internal file-routing meant only for maintainers
- temporary integration details that real package consumers should not rely on
- vague maintainer-language about what the package "should" do instead of what users actually write and get
- internal architecture explanations unless they directly change consumer usage

Maintenance rule:

- if a feature changes package usage in a user-relevant way, create or update the relevant skill as part of the task

## 5. Structure Rules

Use top-level architectural folders only for real concerns such as:

- `types`
- `composables`
- `components`
- `utils`

Builder helpers belong under:

- `utils/builders/`

Current transitional note:

- some existing builder code may still live under top-level `builders/`
- when touching that area, prefer moving/growing it toward `utils/builders/` rather than reinforcing the old layout

Structure is a growth model:

- do not create ceremony for tiny features
- once a feature becomes non-trivial, split it early
- do not wait until files become large and messy before creating structure

Split by concern early when needed:

- subdirectories
- one builder/helper per file when logic is real
- one variant implementation per file when a domain has multiple variants

### Composable Dependency Rules

- pass whole composable outputs downstream when one composable depends on another composable
- do not destructure a composable return just to immediately re-bundle a subset into another ad hoc object
- do not introduce adapter interfaces when `ReturnType<typeof useX>` is the real dependency
- if a downstream composable depends on upstream state or behavior, prefer `ReturnType<typeof upstreamComposable>` over manually restating its shape
- if a piece of state logically belongs to one composable, define it inside that composable instead of allocating it in a higher orchestration layer
- orchestration layers should wire owned composables together, not create duplicate local ownership for their internal state

### Table Runtime Assembly Rules

- `useTableApi` is a facade, not an owner of table runtime behavior
- table behavior should be owned by the relevant composables such as state, layout, data, columns, selection, pagination, filters, or controls
- `useTableApi` may group and expose existing behavior, but it must not re-implement domain logic that already exists elsewhere
- in table internals, create `const tableApi = shallowRef<TableApi | null>(null)` near the beginning only when a late-bound facade is actually needed
- instantiate `tableApi.value = useTableApi(...)` only after the other owning composables have been created
- do not build feature behavior inside `useTableApi` when it should live in the owning composable
- do not define feature-owned reactive state in `use-table-internals.ts` when it belongs in a child composable

## 6. TypeScript Rules

### Hard Rules

- `any` is forbidden unless explicitly approved by the developer
- `as` casting is forbidden unless explicitly approved by the developer, except `as const`
- `as unknown as ...` is a forbidden anti-pattern
- `Record<string, any>` is forbidden on reusable/public surfaces
- these rules apply everywhere in this repo: runtime, playground, tests, support code

### Default Style

- everything must be fully typed
- prefer inference over manual annotation
- derive types from values, schemas, builders, and helpers instead of restating them manually
- do not declare the same concept twice in parallel forms unless there is a clear architectural reason
- if data is genuinely unknown, use `unknown` and narrow it properly
- do not create pointless alias types that only rename an existing exported type without adding meaning
- do not create parallel public/internal type names for the same concept unless there is a real architectural boundary

### Type Placement Rules

- public and reusable types belong in the relevant `types/` directory
- composable files may define their local params type and little else
- do not define public contract types inside composable files
- do not define reusable structural object types inline inside composables when they belong in `types/`
- if a type can be derived from a real function or composable return, derive it instead of restating it
- prefer `ReturnType<typeof useX>` for composable-to-composable contracts
- if a type exists only to duplicate the shape of a function return, remove it unless it provides a real public or architectural contract

### Public API Expectations

- preserve literal inference so consumers should not need `as const` just to use schemas/builders correctly
- prefer inferred return types, including on exported functions and composables
- add explicit return types only when they materially improve the public contract, prevent internal type leakage, or inference is insufficient
- add JSDoc on important exported APIs when it improves safe usage or context
- do not add noisy JSDoc to trivial internals
- for abstraction-heavy areas, prefer JSDoc on:
  - exported functions/composables whose behavior is not obvious from the signature alone
  - exported config/schema types and complex property-level options where consumers or maintainers need behavioral guidance
  - defaults, omit/remove behavior, inference narrowing, and any URL/result shape that is easy to misuse
- when a function accepts a complex options object, document the individual properties on the options type whenever those properties carry behavioral meaning
- for important exported abstraction functions/composables, include a small usage example in the JSDoc when it materially improves discoverability
- keep JSDoc behavior-first:
  - explain what the caller writes, what happens, and what important defaults or edge cases matter
  - do not restate the type in prose when the signature already says it clearly
  - do not document every internal helper just for completeness
- schema-driven user-facing text must be translation-friendly by default
- labels and user-facing copy should allow at least lazy text values such as `string | (() => string | number)` unless there is a strong reason not to
- use richer render functions only on surfaces where real rendered content is relevant, not as the default for every text field

### Refs

Refs must always declare an explicit generic type.

Preferred:

```ts
const value = ref<boolean>(true)
```

Not allowed as style:

```ts
const value = ref(true)
```

This same rule applies to `shallowRef`.

Preferred:

```ts
const api = shallowRef<TableApi | null>(null)
```

## 7. Vue Reactivity Rules

- use `computed` for derivation
- use `watch` for side effects, synchronization, or external bridging
- do not store what can be derived
- avoid duplicated reactive state that must be manually kept in sync
- prefer a lean reactivity model
- avoid derivation of derivation of derivation when the abstraction can be simplified
- do not hesitate to refactor reactive architecture when it is wasteful
- current table/query-state code has areas that need cleanup and optimization; prefer simplification over layering more reactive glue
- do not wrap an already-owned reactive source in another `computed` just to pass it to another composable
- when an upstream composable already owns the reactive source, pass the whole composable output instead of building a bridge `computed`
- do not recreate fallback logic for the same state in multiple places; define the resolved value once in the owning composable and reuse it everywhere
- if a mapper is needed, prefer a plain function returning a plain object; only wrap it in `computed` at the exact callsite that needs reactivity
- do not create public-state helpers that return computed wrappers by default when a plain mapper is sufficient
- no duplicated reactivity means no mirrored state, no bridge refs, and no repeated fallback computations unless there is a hard external integration reason
- if `undefined` in a public state type causes downstream replicas, fallback computeds, or writable wrapper state, fix the source API typing instead of adding local cleanup state
- query-state defaults must narrow consumer-facing types when a non-`undefined` default is provided; do not reintroduce local `resolvedX` or bridge state to compensate for a weak query-state contract

Use `shallowRef` deliberately for:

- opaque external objects
- client instances
- payloads that do not benefit from deep reactive proxying

VueUse is available and should be considered proactively.
Do not manually reinvent reactive utilities when VueUse already provides a clean solution.

## 8. Performance And Simplification Bias

Do not preserve wasteful structure just because it already exists.

If the current implementation is too layered, too reactive, too branch-heavy, or too expensive:

- simplify it
- reorganize it
- reduce unnecessary wrappers
- reduce unnecessary computed bridges
- reduce unnecessary state duplication
- reduce duplicated values, duplicated types, duplicated fallback logic, and duplicated public-state shaping
- if the same concept appears in multiple files, first ask which layer truly owns it and collapse toward one source of truth

This repository values clean architecture and good performance over preserving a messy status quo.

## 8.5 Code Style

- do not introduce braces for a single-line `if` statement
- prefer single-line `if` statements when the condition and statement stay readable on one line
- if a conditional body needs braces, keep it because the statement is multi-line or readability would suffer
- if a statement can stay clear on one line, prefer the one-line form
- do not expand tiny statements into multi-line ceremony
- keep code visually compact when that does not hurt readability
- follow existing local style when it is stricter, but never violate the single-line no-braces rule above for trivial `if` statements
- in Vue SFCs, when a child component is exposing state for `v-model`, use `defineModel` instead of separate `defineProps` / `defineEmits` declarations for `modelValue` or `update:*`
- prefer named `defineModel` bindings such as `defineModel('searchQuery')` when the parent uses `v-model:search-query`
- do not hand-roll `modelValue` / `update:modelValue` or `update:foo` pairs for component models unless there is a hard compatibility constraint

## 8.6 Non-Negotiable Cleanup Rule

- when the developer points out a structural mistake such as duplicated state, duplicated logic, duplicated type definitions, wasteful reactive bridges, wrong ownership, or wrong facade behavior, fix the root ownership model instead of patching around the symptom
- do not preserve a bad abstraction because it currently typechecks or currently works
- do not reintroduce a pattern the developer explicitly rejected elsewhere in the same domain
- once a rule has been made explicit by the developer, enforce it across the touched area instead of applying a one-off local fix

## 8.7 UI Precision Rule

- when the developer gives visual feedback or screenshots, treat each complaint as a hard constraint, not a loose design direction
- map each complaint to a concrete rendered cause before editing, such as a specific width class, forced height, variant choice, slot override, or component theme slot
- do not broaden a UI cleanup into a general restyle unless the developer explicitly asks for that
- if a previous change clearly violated the request, revert that specific change first before adding more edits on top
- prefer small, testable edits tied to each visible symptom over a broad pass that changes multiple visual decisions at once
- when working with Nuxt UI components, inspect the actual rendered slots/theme surface before assuming an override lands on the right element
- if the developer's request implies fit-content behavior, do not replace it with a fixed width; use a content-fitting width with only the necessary min/max guards

## 9. Task Routing

Use this routing before doing a broad scan.

### Schema and type-system work

Inspect first:

- `src/runtime/*/types`
- `src/runtime/*/schema`
- `src/runtime/*/utils/builders`
- current transitional `src/runtime/*/builders`
- relevant public exports
- inference/surface tests
- internal implementation skills when available

### Reactive runtime behavior

Inspect first:

- `src/runtime/*/composables`
- runtime utilities
- query-state abstractions if URL/query state is involved

### UI/runtime behavior

Inspect first:

- runtime components
- relevant composables
- the playground route exercising the feature
- the installed browser agent workflow and relevant skills when the task affects rendered UI, interaction, layout, or visual regressions

UI work should proactively leverage the installed browser automation path.

- use the browser agent and relevant skills to open the real UI
- interact with the actual page instead of relying only on code inspection
- capture screenshots when visual validation matters
- query rendered content and behavior from the live page
- use this flow for real validation of layout, interactions, regressions, and playground behavior when feasible

### Consumer usage and package guidance

Inspect first:

- `skills/consumer/`
- relevant runtime public entrypoints
- playground usage examples if needed

### Internal feature architecture work

Inspect first:

- `.agents/skills/`
- `.agents/skills/nuxt-ui-tools-maintainer/SKILL.md`
- relevant orchestration composables
- relevant utils pipelines
- relevant playground validation route

### Integration and debugging work

Inspect first:

- relevant playground route
- related tests
- runtime entrypoint and orchestration layers

## 10. Definition Of Done

A task is not done when the code compiles.

Before closing a task, if the implementation and requested changes appear complete and there are no known open questions, run the lint check as a final closing step and fix any reported lint issues.

When relevant, completion includes:

- implementation
- type safety
- tests
- playground coverage or validation
- consumer-facing skill updates
- any canonical repo guidance affected by the change
- public auto-import/component registration updates when the public surface changed

Agents should proactively maintain the full affected surface, not only the code they directly touched.

## 10.1 Public Auto-Imports And Components

Nuxt public API registration is intentionally curated.

Use:

- `src/imports.ts` for public function auto-imports
- `src/components.ts` for public component registration

Rules:

- keep a single root file for each of these concerns
- organize registrations by domain using comment blocks such as query-state, shared, table, spreadsheet
- register only APIs that should be treated as first-class public surface
- do not auto-import low-level helpers just because they are exported somewhere
- do not auto-register internal component trees just because they exist under `runtime/components`
- if a feature is public but intentionally not auto-imported, keep it out of `src/imports.ts` on purpose

Decision test for auto-importing a function:

- should most consumers reach for this directly?
- does auto-importing it improve adoption without making the public surface noisy?
- is it part of the intended package story, not just technically exported?

Decision test for auto-registering a component:

- is this a top-level component consumers should render directly?
- would auto-registering it help normal usage?
- is it not just an internal child component of a larger public component?

Avoid:

- spreading registration logic back into `src/module.ts`
- creating one file per domain for registration; keep the curated lists visible in the single root registration files
- broad directory-based registration when the goal is to keep the public surface explicit

## 10.5 Consumer Skill Writing Rules

When writing or updating `skills/consumer/*`:

- write for real package users, not maintainers
- explain what users write, what options they can use, and what they get back
- include code examples wherever they help
- prefer concrete URL shapes, schema snippets, and result examples over abstract prose
- show realistic examples over toy placeholders whenever possible
- document edge cases, defaults, and gotchas when they matter to real usage
- prefer explaining actual exported APIs and current behavior over aspirational wording
- do not include playground-specific guidance
- do not leak internal package-maintainer requirements into consumer docs

## 10.6 Internal Skill Writing Rules

When writing or updating `.agents/skills/*`:

- explain how the current repository is actually organized, not an abstract ideal
- make ownership and placement obvious so agents know where code belongs before scanning broadly
- explain how layers relate to each other and where feature work should start
- document current cleanup directions when the architecture is transitional
- call out maintenance surfaces that must stay in sync when a feature changes
- include concrete file paths and current examples when they materially reduce ambiguity

## 10.7 Translation Cleanup Rule

Translation keys are a maintained surface, not disposable implementation residue.

When a refactor, UI change, feature removal, or copy change makes locale entries unused:

- remove the unused translation keys from the owning locale message type
- remove the unused translation keys from locale files
- remove any dead helpers or dead code paths that only existed for those keys

Do not leave stale translation entries behind "just in case".

Unused locale entries make future maintenance harder, make coverage look misleading, and increase the chance that new work reuses the wrong key or outdated copy.

For i18n work, cleanup is part of the implementation, not a nice-to-have follow-up.

## 11. Validation Workflow

Use Bun as the package manager and command runner.
Prefer:

- `bun install`
- `bun run lint`
- `bun run typecheck`
- `bun run test`
- `bun run dev`

Validation rules:

- run the narrowest relevant checks first
- do not default to the full suite when a targeted check is enough to validate the current change
- if a change touches integration behavior, validate the relevant playground route or integration surface when feasible
- if a change touches UI behavior, prefer validating through the installed browser agent and related skills so the agent can drive the page, inspect rendered output, capture screenshots, and verify live interactions
- when reaching the end of a task and everything appears good and clear, run `bun run lint` as the final closing check and fix any issues before handing the task off

## 11.1 Commit Message Policy

Commit messages must follow this exact format:

- `{type}(scope): {message}`

Rules:

- always include a scope
- do not use unscoped commit messages such as `feat: ...` or free-form messages
- choose a scope that reflects the main owning area, such as `table`, `spreadsheet`, `i18n`, `playground`, or `repo`
- keep the message concise and behavior-focused

Examples:

- `feat(table): add embedded remote facets support`
- `refactor(spreadsheet): simplify resolution pipeline`
- `chore(repo): codify final lint check`

## 12. Compatibility File Policy

`AGENTS.md` is the canonical shared root file for this repository.

If a compatibility file such as `CLAUDE.md` exists, it should point back to `AGENTS.md` rather than becoming a second source of truth.
