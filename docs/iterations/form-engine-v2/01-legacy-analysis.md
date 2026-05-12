# Legacy Analysis

## What Exists Today

The legacy form system in `tars-shared-ui/src/runtime/lib/form` is already a complete form platform.

Public entrypoints:

- `defineFormSchema(...)`
- `defineFormField(...)`
- `defineFormFields(...)`
- `defineFieldDescription(...)`
- `useFormController(...)`
- `useFormSubmit(...)`
- `FormProvider`
- `FormRenderer`
- `FormActions`

Main internal areas:

- schema helpers: `utils/schema.ts`
- field and form contracts: `types/*.ts`
- type-level output inference: `types/state.ts`
- field registry/config: `config/index.ts`, `config/field/*`
- state and value mapping: `utils/state.ts`, `utils/property.ts`
- validation: `utils/validation.ts`, `useFormValidation.ts`
- orchestration: `useFormInternals.ts`, `useFormState.ts`, `useFormControls.ts`, `useFormContext.ts`
- field runtime context: `useFieldInternals.ts`, `useFieldContext.ts`, `useFieldOptions.ts`
- rendering: `components/renderer/*`, `components/layout/*`, `components/field/*`

Observed breadth:

- 36 field config files
- 34 field components
- 36 field type files
- 84 test matches across `test/form` and `test/wizard`

This is important because V2 should not start from a "simple form" mental model.
It should start from "headless-ish schema-driven form engine with nested state, async options, layouts, actions, and stepped flows".

## Architectural Shape

### 1. The core model is schema-first

Consumers declare:

- field tree
- stepped flow
- display/layout options
- actions
- validation
- dynamic visibility
- async options
- preformat/transform rules
- dependency-based behavior

That part is strong and should remain the core product direction.

### 2. The field registry is one of the best parts

The field system is organized around `FieldConfigMap`.
Each field type declares runtime behavior:

- `stateful`
- `stateless`
- `passthrough`

And may also declare:

- default value
- renderless behavior
- layout behavior
- option behavior
- component resolver

This is a real config-driven design.
It avoids giant branching render logic and gives a good V2 pattern to preserve.

### 3. The engine has a real state pipeline

There are three distinct value phases:

1. input hydration and `preformat`
2. internal form state
3. output serialization with `transform`

That separation solves real problems:

- backend values that do not match UI values
- grouped/object field local shape
- normalized API submission shape
- hidden or omit-only transport fields

This is worth keeping, but the pipeline should be named and documented more explicitly in V2.

### 4. Nested keys are first-class

The legacy engine supports:

- dotted field keys like `meta.country`
- step roots like `root: 'user.address'`
- nested group/object state
- array item paths
- relative parent traversal through `$parent` and `$parent:n`

So the real abstraction is not "flat field map".
It is "structured document editor with field-local scoped references".

### 5. Stepped forms are built into the runtime

The stepped model supports:

- per-step fields
- per-step actions
- per-step layout overrides
- step roots
- step skipping
- `onBeforeNext`
- `onBeforePrevious`
- `onStepSkipped`
- modal/fullscreen/drawer display

This is deeper than a UI wizard wrapper.
The step system is part of the form engine contract.

## Strong Parts Worth Keeping

### 1. Schema DSL with inference

The type-level output system is ambitious and materially useful.

Examples already supported:

- dotted path fields produce nested output objects
- step roots contribute to nested output shape
- select literals preserve literal union output
- array fields infer item object output
- hidden fields can override output type
- `transform` changes the inferred output type
- conditional fields become optional in the output shape

This is exactly the kind of inference-first direction the new repo wants.

### 2. Field behavior classification

`stateful` vs `stateless` vs `passthrough` is a clean ownership model.

It keeps these concerns separate:

- fields that own stored value
- fields that only render or trigger actions
- structural wrappers that forward child state

V2 should keep this idea.

### 3. Dynamic options model

`FieldOption` supports:

- static arrays
- dependency-aware resolver functions
- loading state
- watch filters
- external dependencies
- clear-on-invalid behavior
- `onOptionsChange`
- creation flow
- options invalidation across fields

This is a real feature surface, not a convenience helper.
It deserves first-class architecture in V2.

### 4. Internal API exposure

The field/form APIs are powerful:

- get/set values
- focus a field
- validate specific field
- read/create options
- navigate steps
- set/clear custom errors
- close modal forms

This is one of the reasons the abstraction can power complex flows.

### 5. Runtime layouts are separate from schema state

The legacy split between:

- form orchestration
- layout resolution
- container selection
- renderer components

is directionally correct.

## Rough Edges And Structural Problems

### 1. Dependency typing is effectively untyped

This is the biggest DX hole.

Current dependency declaration:

- `dependencies?: (string | [string, string])[]`

Current runtime payload:

- `deps: Record<string, any>`

So consumers lose type help exactly where they need it most:

- reading dependency values
- setting related values
- reading related options
- refactoring paths safely

This is the most important V2 redesign area.

### 2. Path semantics are stringly and implicit

The relative-property model is implemented through string conventions:

- `$parent`
- `$parent:1`
- `$root`
- dotted keys
- alias pairs `[source, target]`

That is flexible, but hard to teach, hard to type, and hard to validate statically.

### 3. A lot of power is concentrated in generic callbacks

Many hooks accept broad callbacks over `deps` and `api`:

- `condition`
- `required`
- `props`
- `placeholder`
- `watch`
- `onDependencyChange`
- `options.source`
- `action`

That is powerful, but easy to turn into "unstructured mini-programs inside schema".
V2 should preserve capability while making the typed context more disciplined.

### 4. State ownership is partly clean, partly leaky

Good:

- `useFormState` owns state
- `useFormControls` owns transitions and submit behavior
- field config owns field variant behavior

Less good:

- path resolution is spread across several layers
- field context stores shadow local `value` and syncs it back
- option invalidation uses string path events
- validation currently follows rendered current fields, which is convenient but can hide broader state contracts

### 5. The public API is small, but the real model is large

The entrypoint looks simple.
The actual domain is not.

That means V2 needs better docs and stronger named concepts, otherwise the engine becomes "easy to start, hard to truly understand".

## Real Usage Patterns Observed In The Consumer App

High-signal usage patterns from `tars-profile-frontend`:

- grouped editable wrappers with internal button actions
- hidden transport fields used to refine output type
- async select/autocomplete options with locale or API dependencies
- create-option flows chained across related fields
- step-based verification flows
- nested address editing with search-assisted hydration
- field-level `preformat` and `transform` for phone, email, prices, search payloads
- dependency-driven conditional visibility and requirement
- array-ish nested flows with ancestor lookup via `$parent:1`

Representative cases:

- `user/schema.tsx`: editable group wrapper with `$parent.value` and `$parent`
- `addresses/schema.tsx`: address search writes deeply into parent object and uses multiple dependency sources
- `drafts/schema/item.tsx`: nested dependency traversal with `$parent:1` and chained option creation
- `auth/schema.tsx`: stepped flows with async gatekeeping in `onBeforeNext`

## Legacy Takeaway

The V1 form system proves that the product model is valid.

The V2 task is not:

- strip it down to a basic field renderer

The V2 task is:

- preserve the real feature depth
- preserve schema-first inference
- keep the field registry model
- keep the state/input/output pipeline
- redesign the dependency system so it becomes typed, teachable, and refactor-safe

## Additional V2 Interpretation

### 1. Async resolvers should not be TanStack-only

The form runtime should support both:

- TanStack Query-based async resolvers
- direct promise-returning async resolvers

That matters because form option loading and dependency-driven async behavior often needs a lighter local path than full query wiring.

The right target is:

- TanStack-friendly
- not TanStack-exclusive

### 2. Field property ownership needs cleanup

One of the real quality issues in the legacy design is that some field contracts are too broad.

That leads to:

- properties existing on field kinds where they are meaningless
- weaker editor guidance
- more accidental misuse
- more implementation branching around irrelevant properties

V2 should make field capability boundaries much sharper and add a proper global field-property/default mechanism instead of widening every field contract.
