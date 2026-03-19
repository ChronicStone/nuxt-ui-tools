# Query State Patterns

## Good: One Value

```ts
const locale = useQueryState({
  key: 'locale',
  codec: stringCodec,
  defaultValue: 'en',
})
```

## Good: Grouped Values

```ts
const pagination = useQueryStates({
  prefix: 'p',
  schema: {
    pageIndex: { urlKey: 'page', codec: numberCodec, defaultValue: 1 },
    pageSize: { urlKey: 'size', codec: numberCodec, defaultValue: 20 },
  },
})
```

## Good: Dynamic Values

Use `dynamicQueryState(...)` when the URL keys come from runtime definitions, such as user-configured filter definitions.

## Good: Keep Related Keys Grouped

```ts
const sorting = useQueryStates({
  prefix: 's',
  schema: {
    key: { codec: stringCodec, defaultValue: '' },
    dir: { codec: createEnumCodec(['asc', 'desc']), defaultValue: 'asc' },
  },
})
```

This yields a URL shape like:

```txt
?s.key=hiredAt&s.dir=desc
```

Grouping related keys keeps the API easier to read and keeps URL ownership obvious.
