# Dependency System Analysis

## Why This Matters

The legacy form engine already relies heavily on dependencies.

Observed usage in `tars-profile-frontend`:

- 59 dependency declarations
- 40 `$parent` references
- 6 `onDependencyChange` hooks
- 5 `createOption` flows

So this is not an advanced edge feature.
It is part of the normal form-authoring model.

## Current Legacy Model

### Shape

Each field can declare:

```ts
dependencies?: Array<string | [string, string]>
```

Resolution rules:

- `"country"` means source `country`, target alias `country`
- `["meta.country", "country"]` means read `meta.country`, expose as `deps.country`
- relative paths are allowed through `$parent`
- ancestor climbing is allowed through `$parent:n`
- `$root` is supported by the property helpers for full-object access

The runtime result is:

```ts
type Dependencies = Record<string, any>
```

So all semantics are runtime-only.

### Implementation

The core implementation path is:

- `getFieldDependencies(...)` in `utils/field.ts`
- `getScopedProperty(...)` / `setScopedProperty(...)` in `utils/property.ts`
- `mapRelativeKeyPath(...)` for `$parent:n` normalization

The relative grammar is implemented by parsing strings like:

- `$parent.value`
- `$parent:1.hasImmatriculation`

The `:n` suffix is interpreted as an ancestor offset.

## What The Current Model Does Well

### 1. It matches real nested-form authoring needs

The current model allows a field to talk about:

- root fields
- sibling fields
- parent object fields
- ancestor object fields
- array item sibling values

That maps well to real-world nested forms.

### 2. It keeps field callbacks local

A field can usually declare the references it needs near the field itself.
That makes authoring ergonomic.

### 3. It supports aliasing

`[source, target]` is useful because:

- long source path stays local to dependency setup
- field callbacks can use short names
- multiple sources can be normalized into one callback shape

This is worth preserving in some form.

## DX Problems In The Current Model

### 1. `deps` is untyped

Today, all of these are manual and fragile:

- `deps.country`
- `deps.authorizationLabels`
- `deps.hasImmatriculation`
- `deps.value`

There is no compile-time guarantee that:

- the dependency exists
- the alias name is correct
- the resolved value type matches the actual field output type

### 2. path strings are refactor-hostile

Today a rename can silently break:

- field keys
- dotted child paths
- relative parent references
- hidden transport keys
- `api.setValue(...)` writes

### 3. ancestor depth is powerful but opaque

`$parent:1` and similar syntax solves real problems.
But it is difficult to understand from the callsite:

- what is the current scope?
- which object does `$parent` refer to here?
- does `:1` mean one parent or two total levels?
- what happens after schema restructuring?

### 4. read paths and write paths use different mental models

Consumers must currently juggle:

- field key paths
- relative dependency paths
- full absolute `api.setValue(...)` paths
- local `api.setValue('$parent.value', ...)` writes

The model is flexible, but mentally expensive.

## Typed-XLSX Lessons That Transfer Well

Relevant source:

- `typed-xlsx/packages/core/src/core/path.ts`
- `typed-xlsx/packages/core/src/core/accessor.ts`

Important transferable ideas:

### 1. Typed path strings are realistic

`typed-xlsx` proves that dot-path string unions are practical for a public API when:

- the root object type is known
- array traversal rules are constrained
- depth is bounded

That gives a useful baseline for top-level and object-path dependency typing.

### 2. Callback accessors and path accessors can coexist

`Accessor<T>` in `typed-xlsx` allows:

- typed path strings
- typed callback accessors

That is interesting for forms because dependencies likely need both:

- a typed path reference form
- an escape hatch callback form for the hardest cases

### 3. One explicit context model is easier to teach

The typed-xlsx refactor notes argue for a single coherent context model instead of multiple selective inference tricks.
That lesson transfers strongly here.

For forms, that likely means:

- one typed root form value model
- one typed current-scope model
- one explicit relative-reference helper vocabulary

not a pile of unrelated path conventions.

## How Far Can Type-Safety Go?

## High confidence

These should be strongly typeable:

- top-level sibling dependencies declared after the source field
- nested object sibling dependencies declared after the source field
- absolute root path references
- alias payload typing for `deps`
- `api.getValue(path)` and `api.setValue(path, value)` for absolute typed paths
- typed option reads for known fields with option-capable field kinds

## Medium confidence

These are likely typeable with a deliberate scope model:

- `$parent.foo` for current object/array-item parent
- `$parent:1.foo` for explicit ancestor stack lookup
- references to previous siblings only
- references constrained by field ordering
- nested group/object scopes

This will probably require type machinery that tracks:

- root data shape
- current scope path
- ancestor scope stack
- fields declared so far in the current scope

## Lower confidence / needs design limits

These are where complexity can explode:

- arbitrary string aliases with no helper wrapper
- references that depend on variant-specific runtime branching
- deeply polymorphic array-variant item shapes
- path typing that tries to understand every possible `preformat` intermediate state
- selective dependency typing based on runtime conditions

The important V2 choice is whether to support these with:

- a typed escape hatch
- or stricter design limits

instead of trying to make the whole system infinitely clever.

## Recommended Constraint Direction

The user direction already points to the right constraint:

- a field may depend only on parent scopes
- and on fields declared previously in the same scope

This is excellent for type-safety.

Why:

- no forward references
- local scope is closed over time
- parent scopes are stable
- dependency resolution becomes structurally directional

This is much easier to type than "any field can depend on any path anywhere".

## Proposed Mental Model For V2

Instead of generic string arrays, V2 should likely move to something like:

1. explicit dependency declaration helpers
2. typed alias map
3. explicit scope model

For example, directionally:

```ts
dependsOn({
  country: root('meta.country'),
  hasImmatriculation: parent(1, 'hasImmatriculation'),
  value: parent('value'),
})
```

or:

```ts
dependencies: (deps) => ({
  country: deps.root('meta.country'),
  hasImmatriculation: deps.parent(1, 'hasImmatriculation'),
  value: deps.parent('value'),
})
```

The exact syntax is still open.
The important part is:

- source references are structured
- alias names are explicit
- resulting `deps` object is inferred

## Important Design Split: read references vs write references

V2 should probably stop treating all path usage as one identical thing.

There are at least three different surfaces:

1. dependency reads
2. state reads/writes from API
3. option invalidation / cross-field control references

Recommendation:

- give each one its own typed helper vocabulary
- do not force one overloaded string grammar to carry everything

## Recommended V2 Rules

### 1. previous-only sibling references

Within a given scope, a field may only depend on fields defined earlier in that same scope.

This gives:

- predictable authoring
- easier incremental inference
- fewer circular behaviors

### 2. explicit ancestor traversal

Ancestor traversal should stay possible, but the syntax should become explicit and typed.

Good direction:

- `parent("value")`
- `parent(1, "hasImmatriculation")`

Less ideal:

- keep opaque `$parent:1.value` strings forever

### 3. absolute root references should be first-class

A top-level root path helper should exist for cases that truly need absolute lookup.

### 4. typed escape hatch should exist

There will still be cases where path typing is too restrictive.
That should be solved by a clearly marked escape hatch, not by making the whole normal API untyped.

## Feasibility Summary

### We can go far

Strong type-safety is realistic for:

- most normal sibling dependencies
- most parent/ancestor dependencies
- alias inference
- path-safe state API

### We should not try to make everything magical

The danger is repeating the cleverness trap:

- extremely precise but hard-to-teach inference
- multiple hidden context rules
- public API that feels smart but brittle

The typed-xlsx lesson is to prefer one coherent model over selective cleverness.

### Best V2 direction

The best likely direction is:

- typed absolute path helpers
- typed parent-scope helpers
- previous-field-only dependency visibility
- explicit alias mapping
- small escape hatch for exceptional cases

That keeps most of the power while making the mental model much cleaner.
