# Agent Rules First Draft

This document is a proposal for the repository's future Codex / Claude agent rules.

It is intentionally broader than the current [`CLAUDE.md`](/Users/cyprienthao/Documents/DEV/ORGANISATIONS/PERSO/packages/nuxt-ui-tools/CLAUDE.md): the goal is to capture both hard rules and the engineering philosophy behind them before we compress the final version into a high-signal agent instruction file.

## 1. What This Repository Is

Based on the current repository structure, this package is not "just components":

- `src/module.ts` is the Nuxt module entrypoint.
- `src/runtime/table` is the main runtime system and currently the architectural center of gravity.
- `src/runtime/query-state` is a reusable typed URL/query-state subsystem.
- `src/runtime/shared` contains cross-cutting helpers and composables.
- `src/runtime/form` exists as a sibling runtime area.
- `playground` is a real Nuxt app used as the integration surface for local validation and demos.
- `test/table` already shows a useful testing shape: runtime behavior, schema inference, resolved filters, and public surface tests.

This matters because the rules should optimize for:

- long-term maintainability
- schema-heavy type safety
- stable public APIs
- incremental feature growth
- clean separation between reusable runtime code and playground-only code
- fast task routing for AI agents with minimal exploratory scanning

## 2. Recommended Documentation Shape

Instead of putting everything in a single giant agent file, the repo should likely have two layers:

- `CLAUDE.md`:
  Short, strict, high-priority rules that should always be followed by coding agents.
- `docs/engineering/rules.md`:
  Longer rationale, examples, repo structure explanation, and nuanced exceptions.
- optional supporting skills:
  Focused workflow guidance for specialized or fragile tasks.

The short file should be optimized for enforcement.
The long file should be optimized for clarity and onboarding.
Skills should be optimized for repeatable task-specific execution.

Important current-state note:

- the existing `docs/` directory should not currently be treated as canonical product documentation
- much of it is temporary iteration material
- proper repository/package documentation will be rebuilt later

This draft is closer to the second category.

## 3. Core Engineering Philosophy

The repository should favor:

- modularity over convenience
- composition over monoliths
- configuration/builders over giant branching functions
- type inference over repetitive manual annotation
- explicit boundaries over implicit coupling
- maintainability and evolvability over short-term implementation speed

The practical meaning is:

- do not centralize unrelated logic into giant files or giant functions
- isolate concerns by purpose, not by accident
- prefer standard input/output contracts for feature sub-parts
- keep the public API small and intentional
- let complex types exist where they unlock a better API, but do not duplicate or manually restate what TypeScript can already infer

The filter preview split is a good reference point:

- bad direction: one giant function handling every filter kind inline
- preferred direction: a normalized contract plus one implementation per filter kind

## 4. TypeScript Rules

### 4.1 Non-negotiables

- `any` is effectively forbidden.
- `as` casting is effectively forbidden.
- If `any` or `as` seems necessary, it should be treated as a design failure first, not as the solution.
- Any use of `any` or unsafe casting should be a last resort and should require explicit developer validation.
- These rules apply everywhere: runtime, playground, tests, and support code.

### 4.2 Preferred typing style

- Everything should be fully typed.
- Prefer inferred types over manually declared types.
- Do not add explicit return types to normal functions when TypeScript can infer them correctly.
- Use explicit function return types only when they provide real value, such as recursive functions, important public contracts, or places where inference becomes misleading.
- Derive types from values, builders, schemas, and helpers instead of declaring parallel manual types.
- Avoid declaring the same concept twice in different forms.

Examples of the intended direction:

- good: derive unions from `as const` arrays or builder output
- good: library APIs should preserve literal inference so user code does not need `as const` just to satisfy schemas/builders
- good: derive row/context/filter types from schema definitions
- bad: manually restate a type that can already be inferred from the source value
- bad: add verbose explicit types everywhere "just to be safe"

### 4.3 Refs are the exception

Refs should always be explicitly typed.

- preferred: `const value = ref<boolean>(true)`
- not preferred: `const value = ref(true)`

This should apply consistently to:

- `ref`
- nullable refs
- collection refs
- DOM refs
- state refs in composables and components

Reasoning:

- refs are durable state containers
- their type should be obvious at declaration site
- explicit generic refs reduce widening, drift, and accidental reactive shape changes

### 4.4 When explicit types are good

Explicit types are still useful in targeted places:

- ref generics
- recursive functions
- computed values when the annotation acts as a constraint
- exported public API contracts
- complex helper boundaries where inference would otherwise leak `unknown`, `never`, or an unstable internal detail

The rule is not "never annotate".
The rule is "annotate intentionally, not defensively."

For exported functions and composables:

- prefer inferred return types by default
- add an explicit return type only when it improves the public contract, prevents leaking internal implementation details, or inference is insufficient

### 4.5 How to handle complex schema types

This codebase already has schema-heavy and builder-heavy typing in areas like:

- `defineTableSchema(...)`
- filter builders
- table source/query contracts
- query-state schema definitions

For these areas:

- complexity is acceptable when it improves the external API
- complexity is not acceptable when it only compensates for duplicated or poorly factored internal types
- type machinery should be centralized instead of re-implemented in multiple files
- generic abstractions should preserve inference, not destroy it

Preferred patterns:

- derive from source schema types
- expose helper utility types from one canonical place
- normalize types once and reuse the normalized form
- use `unknown` plus narrowing when data is genuinely unknown
- prefer small reusable type helpers over large one-off generic blocks

Avoid:

- `Record<string, any>` on reusable surfaces
- repeated `as unknown as ...` bridges
- helper APIs that force consumers to manually specify types that the library already knows
- reintroducing parallel "resolved" and "raw" types unless there is a clear architectural reason

### 4.6 Public API documentation

JSDoc is valuable on exported public API surfaces, especially for:

- schema builders
- composables
- utility contracts
- complex generic helpers
- behavior that is easy to misuse without context

JSDoc should explain:

- what the API is for
- the important behavioral rules
- what should be inferred by the caller
- any edge cases or lifecycle expectations

JSDoc should not become noise on trivial internals.

## 5. Vue Reactivity Rules

### 5.1 General approach

Use Vue reactivity deliberately, not casually.

- prefer `computed` for pure derivation
- prefer `watch` only for side effects, synchronization, or bridging to external systems
- prefer small focused composables over large stateful components
- keep reactive graphs shallow and understandable

### 5.2 Repository-specific direction already visible in the codebase

The current repo already hints at some good patterns:

- `query-state` uses `shallowRef` internally to avoid unnecessary deep proxying
- stateful table logic is split across composables instead of being shoved into components
- feature behavior is often pushed into runtime helpers and utilities

Those should become explicit rules:

- use `shallowRef` when storing opaque external objects, client instances, or payloads that do not benefit from deep reactivity
- do not use watchers when a computed derivation would be enough
- keep side-effectful reactivity near the system boundary
- avoid large chains of state mutation across multiple watchers

### 5.3 Reactive boundaries

Good boundaries:

- component: view wiring
- composable: reactive orchestration
- utility/helper: pure transformation

Preferred direction:

- reactive inputs come in through composables
- pure business/data transforms stay outside Vue when possible
- components should assemble behavior, not own all of it

### 5.4 Derived state

Do not store what can be derived.

- if a value can be expressed as `computed`, it should usually not also exist as mutable state
- do not keep duplicated reactive state that must be manually synchronized
- avoid "mirror refs" unless there is a clear UX need such as draft input state

## 6. Feature Structure Rules

### 6.1 Structural expectations

Features should be decomposed by responsibility.

- create subdirectories when they clarify ownership
- prefer folders with a clear purpose over broad dumping grounds
- avoid giant files
- avoid giant functions
- isolate feature variants behind shared contracts

Bad examples:

- one directory containing unrelated feature code because "it was convenient"
- one giant render/transform function handling every feature variant
- one file mixing schema definition, reactive orchestration, rendering details, and normalization helpers

Preferred examples:

- `types/` for canonical types
- `composables/` for reactive orchestration
- `utils/` for pure or mostly pure logic
- `utils/builders/` for builder helpers and construction utilities
- subfolders per concern when a domain grows, such as `filters/preview/*`

This structure should be treated as a growth model:

- do not create ceremony for tiny features
- once a feature becomes non-trivial, grow it into a clear structure early
- do not wait until files become large or messy before splitting by concern

### 6.2 Standardization over ad hoc growth

When the same category of feature has multiple kinds, require a standard contract.

For example:

- each filter kind should have a normalized input/output contract
- each implementation should live in its own dedicated file once the logic is non-trivial
- registry/config dispatch is preferred over sprawling conditionals once the domain grows

### 6.3 File and function size philosophy

There is no single line-count limit, but the bias should be:

- if a file starts carrying multiple responsibilities, split it
- if a function branches heavily by mode/kind, split it
- if a utility needs scrolling to understand the data flow, it is a candidate for extraction

The goal is not "many tiny files at all costs."
The goal is "clear ownership and low cognitive load."

## 7. Public Surface and Internal Surface

This repo exports a library surface, not just app code.

That means:

- exported entrypoints should be intentional
- barrel files should stay curated
- internal helpers should not automatically become public just because they exist
- breaking changes should be treated carefully, especially around schema and builder APIs

Suggested rule:

- default to keeping helpers internal unless there is a clear consumer-facing reason to export them

## 8. Playground Philosophy

The playground is important, but it is not the product source of truth.

Based on the current docs, the correct role is:

- integration testing surface
- demo surface
- manual validation surface

Rules for playground work:

- shared runtime logic belongs under `src/runtime`, not inside the playground
- playground code may include demo-only helpers and route-specific glue
- new features should usually be demonstrated in the playground
- playground code should not quietly become the only implementation of reusable behavior

The playground should help validate architecture, not replace it.

## 8.5 Consumer-Facing AI Skills

This repository should also treat AI skills as a real product/documentation surface for consumers of the package.

That means:

- if a feature adds or changes package usage in a way that matters to consumers, the relevant skill should be updated
- skills should explain how to use the package, not just how to modify the repo
- skills should be kept aligned with the actual package API and architecture
- stale skills should be treated as stale documentation

Recommended rule:

- when working on features, agents should evaluate whether consumer-facing skills must be created or updated as part of the change

## 9. Testing Philosophy

The existing tests already point to a good structure:

- inference tests
- surface tests
- behavior tests

Suggested rules:

- add tests for type inference when public builder/schema ergonomics change
- add runtime behavior tests for query/filter/data logic
- add regression tests for normalization/resolution helpers
- do not rely only on playground validation for core runtime behavior

For schema-heavy features, "it compiles" is not enough.
Type-level ergonomics should be verified intentionally.

## 10. Tooling and Workflow

Current repo signals:

- existing `CLAUDE.md` says to use `bun`
- current package scripts still expose `npm run ...`
- linting uses `oxlint`
- formatting uses `oxfmt`
- typechecking uses `vue-tsc`

Proposed direction:

- standardize on one package-manager instruction for agents
- keep formatting/lint/typecheck workflows explicit in agent rules
- require agents to validate changes with the narrowest relevant checks before finishing when feasible

This area needs alignment because the human-facing docs and the current agent file are not fully saying the same thing yet.

## 10.5 Task Routing

The shared root rules file should include compact task-routing guidance so agents do not need a broad initial scan to begin working correctly.

Recommended routing examples:

- schema and type-system work:
  inspect schema, type, and builder-related runtime files first
- reactive runtime behavior:
  inspect composables and runtime utilities first
- UI behavior:
  inspect runtime components plus the playground route that exercises them
- consumer usage and package guidance:
  inspect consumer-facing package skills first, then relevant package entrypoints
- integration or debugging work:
  inspect playground surfaces and related tests first

The goal is to reduce repeated exploration and make first-pass execution more reliable.

## 11. Draft Candidate For Final `CLAUDE.md`

This is a compressed version of the likely end-state, not the final wording.

### Architecture

- Build features as modular systems, not monoliths.
- Prefer composable/config-driven structures over large branching implementations.
- Split code by responsibility into purposeful files and directories.
- Shared runtime logic belongs in `src/runtime`; the playground is for integration and demos only.

### TypeScript

- `any` is forbidden unless explicitly approved by the developer.
- `as` casting is forbidden unless explicitly approved by the developer, except `as const`.
- Preserve literal inference so consumers should not need `as const` to use schemas/builders correctly.
- Prefer inference over explicit annotation.
- Prefer inferred return types, including on exported APIs.
- Add explicit return types only when inference is insufficient or the explicit type materially improves the public contract.
- Derive types from values, schemas, and builders instead of restating them manually.
- Avoid duplicate type declarations for the same concept.
- Refs must always declare an explicit generic type.

### Vue

- Use `computed` for derivation and `watch` for side effects.
- Avoid duplicated reactive state.
- Prefer focused composables for orchestration and pure utilities for transforms.
- Use shallow reactive primitives deliberately for opaque external objects or payloads.

### Public API

- Keep exports intentional and curated.
- Add JSDoc to public APIs when context improves safe usage.
- Preserve inference quality on public builders and schema helpers.

## 12. Gaps To Resolve Before Finalizing

The repo already contains several patterns that conflict with the intended direction, so final rules should answer how strict you want to be about remediation:

- should we codify naming and folder conventions beyond general modularity guidance?
- what exact folder taxonomy should be preferred once a feature grows?
- should builder helpers live under `utils/builders/*` rather than a top-level `builders/` folder?
- should we keep one shared agent rules file, or split between a short shared root file plus reusable skills/guides?
- where should consumer-facing package skills live, and how should agents discover/update them?
- what should be considered canonical during the transition period while `docs/` remains temporary?

## 13. My Current Recommendation

Move in three steps:

1. Agree on philosophy and exceptions.
2. Convert the final non-negotiables into one short shared root rules file used by both Codex and Claude.
3. Add a longer engineering rules doc for rationale, examples, and repo-specific guidance.
4. Add skills only for specialized workflows that benefit from procedural guidance.

That would keep core agent instructions strict and fast, while still documenting the "why" for humans and future contributors.
