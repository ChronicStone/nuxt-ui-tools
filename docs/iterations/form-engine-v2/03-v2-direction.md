# V2 Direction

## Goal

Build a new `src/runtime/form` engine that preserves the legacy system's core strengths while fixing its main abstraction leaks.

Most important preservation targets:

- schema-first authoring
- strong inferred output types
- nested object and array editing
- stepped forms
- dynamic options
- field-level actions
- preformat/input/output transform pipeline
- field registry/config-driven architecture

Most important redesign target:

- typed dependencies and typed scoped state access
- cleaner field capability and property ownership
- a first-class global field-property/default layer
- async resolver support for both TanStack Query and plain promises

## Core V2 Principles

### 1. Keep the product model, not the legacy strings

We should preserve the domain capabilities, but not necessarily the raw API surface.

Preserve:

- nested scopes
- ancestor-aware dependencies
- aliasing
- dynamic options
- form API actions

Do not preserve by default:

- raw `string | [string, string]` dependency declarations
- `Record<string, any>` dependency payloads
- overloaded path grammar everywhere

### 2. Use the same runtime shape as stronger repo domains

Target internal shape:

- `types/`
- `schema/`
- `composables/`
- `utils/`
- `utils/builders/` when builder helpers become real
- `components/`

Likely early sub-areas:

- `types/field/*`
- `types/dependencies.ts`
- `schema/define-form-schema.ts`
- `utils/path/*`
- `utils/dependencies/*`
- `utils/state/*`
- `utils/validation/*`
- `utils/field-config/*`

### 3. Keep registry-driven field architecture

The legacy `FieldConfigMap` direction is right.
V2 should keep a central normalized runtime field registry.

The registry should own:

- field behavior kind
- renderless/stateless/passthrough classification
- default value strategy
- option runtime behavior if relevant
- component resolver
- layout metadata

It should also become the main place that defines field capability boundaries:

- which common properties a field kind supports
- which field-specific props are legal
- which async capabilities the field kind participates in
- which global field defaults can merge into that field kind

### 4. Make scope explicit

The dependency and state APIs should be built around an explicit scope model:

- root form data
- current scope
- ancestor scopes
- previously declared local fields

That model should drive:

- dependency declarations
- `deps` typing
- `api.getValue`
- `api.setValue`
- option invalidation references

### 5. Prefer one coherent context model

Do not build separate mental models for:

- dependency reads
- field-local state reads
- option-related reads

They can use different helpers, but they should all be built from the same underlying scoped-path model.

### 6. Separate async contract from async integration

The public async contract should be simple and flexible.
It should allow either:

- a direct promise-returning resolver
- a TanStack Query-backed resolver path

TanStack support should feel first-class, but the core form runtime should not require TanStack for every async option source or dependency-driven resolver.

### 7. Add a real global field property layer

V2 should have a proper way to define global field properties without blurring per-field ownership.

That likely means a dedicated layer for:

- shared field defaults
- per-field-kind default props
- cross-cutting UI or behavior policies
- consumer overrides

## Proposed V2 Architecture

## Public surface

Keep a small public surface, but make the concepts stronger:

- `defineFormSchema(...)`
- `defineFormField(...)`
- `defineFormFields(...)`
- `useFormController(...)`
- `useFormSubmit(...)`
- `FormRenderer`

Potential additions:

- dependency helper builders
- typed path helper exports if they help power-users

## Schema layer

Own:

- author-facing form schema
- field schema contracts
- dependency declaration DSL
- async resolver declaration contracts
- global field-property/default contracts
- schema normalization entrypoints

Important:

- schema should describe what users write
- schema normalization should absorb complexity

## Types layer

Own:

- output inference
- field output contracts
- dependency declaration types
- scoped path types
- form API contracts
- async resolver contracts
- field capability typing
- global field-property typing

Important:

- root data inference and dependency typing should be derived from schema values
- avoid parallel type systems that re-declare the same structure twice

## Utils layer

Own:

- scoped path resolution
- dependency normalization
- value hydration and serialization
- validation rule building
- field registry helpers
- option resolution helpers
- async resolver normalization
- global field-property merging

Important:

- pure logic belongs here
- string parsing should be replaced by typed helper normalization as much as possible

## Composables layer

Own:

- form state
- form controls
- step orchestration
- field runtime context
- validation orchestration
- option orchestration

Important:

- composables should consume normalized utils/types
- they should not be responsible for inventing path semantics ad hoc

## Components layer

Own:

- renderer shells
- field renderer
- layouts
- field components

Important:

- rendering should consume prepared field/runtime context
- heavy dependency or path logic should not live here

## Recommended V2 Dependency Model

The dependency system should probably be redesigned around these concepts:

### 1. typed references

Represent dependency sources as structured typed references, not raw strings.

### 2. alias map output

Consumers should still receive a convenient `deps` object:

- short names
- inferred value types

### 3. directional scope rule

A field may reference:

- ancestors
- previously defined siblings in the same scope

It may not reference:

- future siblings
- arbitrary unrelated descendants

### 4. explicit escape hatch

Keep one intentionally looser path or callback escape hatch for exceptional cases.
Do not make the whole API loose just because some cases are hard.

## Recommended V2 Async Model

The form runtime should normalize async work behind one internal contract while allowing multiple authoring styles.

Directionally:

- plain promise resolvers should be valid everywhere async behavior is relevant
- TanStack Query should be supported as a first-class integration path for:
  - option loading
  - remote dependency-driven lookups
  - async field hydration helpers

Internally, V2 can normalize both into one resolver model.
Publicly, it should not force TanStack everywhere.

## Recommended V2 Field Property Model

V2 should split field properties into layers:

### 1. core shared field properties

Examples:

- `key`
- `label`
- `description`
- `condition`
- `required`

### 2. capability-specific shared properties

Examples:

- option-related properties only for option-capable fields
- action-related properties only for action-capable fields
- child-field properties only for structural fields

### 3. field-kind specific props

Examples:

- select props
- date props
- phone props

### 4. global field defaults

Examples:

- shared label behavior
- shared size defaults
- consistent disabled/loading styling hooks
- per-field-kind global props

This should be explicit and typed.
The goal is to improve both DX and implementation cleanliness.

## Recommended V2 Milestones

### Milestone 1: schema and typing foundation

- canonical field contracts
- output inference
- scoped path types
- dependency declaration prototype

### Milestone 2: headless state engine

- input hydration
- internal state
- output serialization
- typed `api.getValue` and `api.setValue`

### Milestone 3: field registry and basic renderer

- core field kinds
- field config map
- form renderer
- field renderer

### Milestone 4: validation and options

- validation pipeline
- async options
- create-option flow
- options invalidation story

### Milestone 5: stepped forms and advanced nesting

- step orchestration
- nested groups/objects
- arrays
- parent/ancestor dependency helpers

## Direction Summary

V2 should be:

- a real runtime domain, not a thin wrapper
- schema-first and inference-first
- registry-driven for field variants
- explicit about scope
- strongly typed around dependencies
- flexible about async resolver integration
- stricter about field property ownership
- simpler to teach than the legacy string grammar
