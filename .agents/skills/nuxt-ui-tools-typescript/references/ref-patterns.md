# Ref Patterns

Refs are the main exception to the repository's inference-first style.

## Hard Rule

Always write an explicit generic on `ref(...)`.

Preferred:

```ts
const open = ref<boolean>(false)
const currentRow = ref<TableRow | null>(null)
```

Avoid:

```ts
const open = ref(false)
const currentRow = ref(null)
```

## Why

This keeps the reactive state contract obvious and prevents type drift around nullable or widened values.
