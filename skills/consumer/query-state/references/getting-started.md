# Query State Getting Started

## Single Value

```ts
const layout = useQueryState({
  key: 'layout',
  codec: createEnumCodec(['grid', 'table']),
  defaultValue: 'table',
})
```

Result:

- `layout.value` is a writable typed ref-like value
- the URL uses the `layout` key

Example:

```txt
?layout=grid
```

## Grouped Values

```ts
const pagination = useQueryStates({
  prefix: 'p',
  schema: {
    pageIndex: { urlKey: 'page', codec: numberCodec, defaultValue: 1 },
    pageSize: { urlKey: 'size', codec: numberCodec, defaultValue: 20 },
  },
  historyMode: 'push',
})
```

Resulting URL shape:

```txt
?p.page=2&p.size=50
```

Access pattern:

```ts
pagination.value.pageIndex
pagination.value.pageSize
pagination.value = {
  pageIndex: 3,
  pageSize: 100,
}
```

## Dynamic Values

Use `dynamicQueryState(...)` when the key set depends on runtime definitions instead of a fixed static shape.

A real package example is table UI filters, which use dynamic keys such as:

```txt
?f.ui.department=Engineering
?f.ui.salary~gte=100000
```

Use this when the keys are discovered from runtime definitions rather than hardcoded in the component.
