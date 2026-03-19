# Query State Overview

This package gives you typed URL/query-param state.

Current main APIs:

- `useQueryState(...)`
- `useQueryStates(...)`
- `dynamicQueryState(...)`
- codecs like `stringCodec`, `numberCodec`, `createEnumCodec(...)`

## What Each One Is For

- `useQueryState(...)`
  one URL-backed value
- `useQueryStates(...)`
  a grouped set of URL-backed values
- `dynamicQueryState(...)`
  definition-driven keys where the key set is not static

## Quick Example

```ts
const layout = useQueryState({
  key: 'layout',
  codec: createEnumCodec(['grid', 'table']),
  defaultValue: 'table',
})
```

If `layout.value = 'grid'`, the URL becomes:

```txt
?layout=grid
```
