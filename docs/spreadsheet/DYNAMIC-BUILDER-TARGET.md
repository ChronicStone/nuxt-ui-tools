# Dynamic Builder Target

This file documents the intended next iteration of the spreadsheet dynamic column API.

It is a target, not the current stable public contract.

## Current Stable Direction

The spreadsheet schema has been narrowed back to a smaller, stable surface:

- `file` instead of `source`
- root `match` objects for static column header matching
- a light `references` builder
- top-level `buildRow`

Dynamic column runtime behavior remains supported through the current `dynamic.optionGroups(...)` system.

## Why This Was Deferred

The attempted redesign of dynamic builders introduced too much simultaneous change:

- a new authoring API
- new inference rules
- new output-shaping semantics
- new playground usage
- new tests

That made the schema surface unstable and made type inference regress in unrelated parts of the spreadsheet API.

The dynamic builder redesign should come back only as a focused dedicated pass.

## Target Mental Model

The target API should read naturally as:

1. build dynamic columns from a runtime collection
2. define what one generated item means
3. define how that item matches a spreadsheet header
4. define how its cell value is computed
5. define how generated values are aggregated in output

## Target Shape

```ts
columns: {
  dynamic: ({ dynamic }) => [
    dynamic.arrayFromCollection('affiliations', {
      from: ({ context }) => context.affiliationGroups,
      each: group => ({
        id: group.slug,
        match: {
          headers: [`${group.name}: PRÉREQUIS CECR`],
          normalize: ['trim', 'case-insensitive', 'accent-insensitive'],
        },
        value: value =>
          value.options({
            from: group.items,
            optionLabel: item => item.name,
            optionValue: item => item.id,
            mode: 'multiple',
            separator: ',',
            matchBy: 'label',
            normalize: ['trim', 'case-insensitive', 'accent-insensitive'],
          }),
      }),
    }),
  ],
}
```

## Output Targets

### Array Output

```ts
dynamic.arrayFromCollection('affiliations', { ... })
```

Default output:

```ts
{
  affiliations: [
    { id: 'schoolLevel', values: ['higher-education'] },
    { id: 'programme', values: ['business-english'] },
  ],
}
```

For single-value mode:

```ts
{
  affiliations: [
    { id: 'schoolLevel', value: 'higher-education' },
  ],
}
```

### Record Output

```ts
dynamic.recordFromCollection('affiliations', { ... })
```

Default output:

```ts
{
  affiliations: {
    schoolLevel: ['higher-education'],
    programme: ['business-english'],
  },
}
```

For single-value mode:

```ts
{
  affiliations: {
    schoolLevel: 'higher-education',
  },
}
```

## Locked Design Decisions For Later

These decisions were agreed and should be treated as the next target:

- keep `dynamic` as the namespace
- split builders by output shape:
  - `dynamic.arrayFromCollection(...)`
  - `dynamic.recordFromCollection(...)`
- `from` should read from runtime context
- `each(...)` is the right framing for one generated item
- use `id`, not `key`
- use root `match`
- use `value: value => ...` for computed value configuration
- default output should be smart:
  - array + single -> `{ id, value }`
  - array + multiple -> `{ id, values }`
  - record + single -> `record[id] = value`
  - record + multiple -> `record[id] = values`
- `build` should remain optional for custom output shaping

## Not Yet Locked

These parts still need a dedicated design pass before implementation:

- whether `value: value => ...` is the final best naming
- exact builder names inside that `value` callback
- stronger inference for dynamic output in plain inline schema authoring
- how much custom output shaping should be allowed inside `build`

## Rule For The Next Pass

Do not mix this redesign with unrelated spreadsheet refactors again.

When this comes back, it should be handled as:

1. API design pass
2. schema typing pass
3. runtime implementation pass
4. playground migration
5. focused inference/runtime tests
