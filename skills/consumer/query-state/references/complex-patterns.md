# Complex Query State Patterns

## Grouped Pagination

```ts
const pagination = useQueryStates({
  prefix: 'p',
  schema: {
    pageIndex: { urlKey: 'page', codec: numberCodec, defaultValue: 1 },
    pageSize: { urlKey: 'size', codec: numberCodec, defaultValue: 20 },
  },
})
```

URL:

```txt
?p.page=2&p.size=50
```

## Grouped Sorting

```ts
const sorting = useQueryStates({
  prefix: 's',
  schema: {
    key: { codec: stringCodec, defaultValue: '' },
    dir: { codec: createEnumCodec(['asc', 'desc']), defaultValue: 'asc' },
  },
})
```

URL:

```txt
?s.key=hiredAt&s.dir=desc
```

## Mixed Static + Dynamic Groups

You can combine fixed grouped keys with a dynamic state entry inside the same grouped abstraction.

```ts
const filters = useQueryStates({
  prefix: 'f',
  schema: {
    search: { codec: stringCodec, defaultValue: '' },
    ui: dynamicQueryState({
      urlPrefix: 'ui',
      definitions: () => filterDefinitions.value,
      defaultValue: [],
      resolve(definition) {
        return definition.operators.map((operator) => ({
          urlKey:
            operator === definition.defaultOperator
              ? definition.key
              : `${definition.key}~${operator}`,
          codec: definition.codec,
        }))
      },
      parse(entries, definitions) {
        return definitions.flatMap((definition) =>
          definition.operators.flatMap((operator) => {
            const urlKey =
              operator === definition.defaultOperator
                ? definition.key
                : `${definition.key}~${operator}`
            const value = entries.get(urlKey)
            return value == null ? [] : [{ key: definition.key, operator, value }]
          }),
        )
      },
      serialize(rules, definitions) {
        return new Map(
          rules.flatMap((rule) => {
            const definition = definitions.find((item) => item.key === rule.key)
            if (!definition) return []

            const urlKey =
              rule.operator === definition.defaultOperator
                ? rule.key
                : `${rule.key}~${rule.operator}`

            return [[urlKey, rule.value]]
          }),
        )
      },
    }),
  },
})
```

This yields a URL shape like:

```txt
?f.search=emma&f.ui.department=Engineering&f.ui.salary~gte=100000
```
