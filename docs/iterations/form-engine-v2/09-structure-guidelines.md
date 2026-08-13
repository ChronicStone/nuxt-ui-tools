# Form Engine Structure Guidelines

This file is a hard implementation guideline for the form engine port.

The goal is not to make a smaller form engine than `shared-ui`.
The goal is to keep the same architectural quality while adapting the API, UI library, and rough edges.

`shared-ui` is the architectural baseline, not a frozen blueprint.
For existing form-engine capabilities, always inspect the `shared-ui` implementation first and
preserve its responsibility split unless there is a concrete reason to diverge.

New concepts are allowed and some existing concepts should change, but only for a clear reason.

## Porting Standard

Do not half-port important architecture.

The baseline source is:

```txt
/Users/cyprienthao/Documents/DEV/ORGANISATIONS/AGORASTORE/NEW_STACK/tars-shared-ui/src/runtime/lib/form
```

Before touching an existing feature area, inspect the matching files there. This is mandatory for:

- form provider and global form API
- inline/modal/drawer/fullscreen layouts
- layout cleanup and transition lifecycle
- stepper and actions
- state/output type engine
- field config and field-owned value/output types
- context/dependency/query orchestration
- validation/i18n behavior
- field runtime APIs

Before simplifying a `shared-ui` concept, answer:

- what problem did the original structure solve?
- is that problem still real in the Nuxt UI version?
- is the replacement equally flexible and type-safe?
- does the replacement keep concerns separated?
- can the result be extended without rewriting the layer again?

If the answer is unclear, preserve the `shared-ui` architecture first and simplify only after the new engine proves it no longer needs the old structure.

Valid reasons to diverge from `shared-ui` include:

- Nuxt UI has different primitives or a better native composition point
- the old concept was compensating for Naive UI-specific behavior
- the old feature accreted rough edges that can be replaced by a cleaner contract
- type inference can be made stronger without increasing consumer burden
- a config/registry boundary becomes clearer
- runtime ownership becomes simpler without losing capability
- a public API becomes easier to explain while preserving flexibility

Invalid reasons to diverge:

- fewer files for convenience
- shorter code at the cost of mixed concerns
- "the current V2 slice is small"
- "we can wire it in the renderer for now"
- "Nuxt UI makes it possible to do inline"
- inline conditional type logic that hides field ownership
- dropping a feature because it is temporarily inconvenient
- moving logic into a broad helper instead of the owning field/config layer
- replacing a deliberate abstraction with a one-off branch

Working behavior is not enough. The implementation must also preserve:

- maintainability
- type ownership
- file ownership
- long-term field extensibility
- clear runtime layering
- clear public/internal boundaries

## Component Structure

Do not flatten components into one broad directory.
Do not let a component own multiple form-engine layers.

Use concern-based folders:

```txt
src/runtime/form/components/
  root/
    Form.vue
  renderer/
    FormFieldRenderer.vue
    FormFieldShell.vue
  layout/
  actions/
  provider/
  utils/
```

Field-specific components stay with their field kind:

```txt
src/runtime/form/fields/select/
  component.vue
  config.ts
  types.ts
  index.ts
```

Renderer components should orchestrate rendering.
Field components should own the UI for one field kind.
Layout/action/provider components should not be mixed into renderer or field folders.

The shared-ui layout architecture is the baseline:

- a renderer/host chooses the layout
- each layout type is a separate component
- layouts own shell markup and transition/close events
- form/runtime controllers own submit, cancel, and output resolution
- cleanup is a first-class lifecycle boundary, not an incidental timeout in a broad renderer

In Nuxt UI, the primitive events may differ from Naive UI, but the responsibility split should stay.

## Shared Utilities

Generic utilities do not belong to `form`.

Move reusable pieces to `src/runtime/shared` when they are not form-specific:

- generic object types
- maybe-promise helpers
- path object helpers
- primitive type helpers
- generic lazy text/renderable types
- generic predicates

Form files may expose form-named aliases when those aliases clarify the public form API, but their implementation should come from shared primitives.

Do not create inline local aliases like:

```ts
type RuntimeContext = FormContextData<object>
```

Prefer exported canonical types with defaults:

```ts
export type FormContextData<TContext extends GenericObject = GenericObject> = ...
```

Use `GenericObject`, not bare `object`, for generic object contracts.

## Type Engine Structure

The state/output type engine must follow the `shared-ui` pattern.

`types/output.ts` owns engine composition only:

- field collection to object output
- step collection to object output
- passthrough field merging
- root mapping
- dotted path expansion
- omit/submit-mode handling
- internal/output mode selection

`types/output.ts` must not contain field-specific value logic such as:

- text is `string`
- number is `number`
- select reads option values
- upload resolves URL/object output

Each field kind declares its own value resolution as part of field setup/config.

Use named field output generics like `SelectFieldOutput<TField>` and `ObjectFieldOutput<TChildren>`.
Do not inline those rules into the engine.

Do not pass internal/output mode into field-owned output types.
Fields describe the raw value shape they own.
The graph engine applies mode-specific behavior above the field layer.

Long conditional type dispatch should follow the readable `shared-ui` style:

```ts
export type ResolveFieldOutput<TField extends FormField> = TField extends TextField
  ? TextFieldOutput
  : TField extends SelectField
    ? SelectFieldOutput<TField>
    : TField extends ObjectField
      ? ObjectFieldOutput<unknown>
      : unknown
```

Do not let formatters turn this into a deeply indented unreadable block.

## Internal And Output State

Internal state and submitted output should use the same root inference engine with a mode argument.

The mode belongs to the graph engine, not the field output definitions.
It controls behavior such as:

- whether output transforms apply
- whether submit omissions apply
- whether conditional fields become optional
- whether state-only fields remain present

Keep `NullableValue`.

Nullability is an engine policy that must remain easy to swap between `null` and `undefined`.
Do not hard-code nullability into many field-specific branches.

## Runtime Types

Do not define reusable structural contracts inside composables.

Composable files may define local parameter types only when they are truly local.
Reusable runtime contracts belong in `types/`.

Examples:

- form context data type: `types/context.ts`
- form runtime public contracts: `types/runtime.ts` or a dedicated public type file
- field instance contracts: field instance type file, not inline in a component

## Refactor Order

Refactor in this order:

1. write or update the structural guideline
2. move generic shared utilities out of `form`
3. restore field-owned value/output type declarations
4. reduce `output.ts` to engine logic only
5. align runtime files with exported canonical types
6. reorganize component folders by concern
7. validate type inference and playground behavior

Do not add new feature surface while this structure is being corrected unless it directly supports the refactor.
