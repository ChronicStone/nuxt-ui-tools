# Query State Codecs

Current built-in codecs:

- `stringCodec`
- `numberCodec`
- `booleanCodec`
- `dateISOCodec`
- `createEnumCodec(...)`
- `createArrayCodec(...)`

## String

```ts
const name = useQueryState({
  key: 'name',
  codec: stringCodec,
  defaultValue: '',
})
```

URL:

```txt
?name=emma
```

## Number

```ts
const page = useQueryState({
  key: 'page',
  codec: numberCodec,
  defaultValue: 1,
})
```

URL:

```txt
?page=3
```

## Enum

```ts
const layout = useQueryState({
  key: 'layout',
  codec: createEnumCodec(['grid', 'table']),
  defaultValue: 'table',
})
```

URL:

```txt
?layout=grid
```

## Array

```ts
const skills = useQueryState({
  key: 'skills',
  codec: createArrayCodec(stringCodec),
  defaultValue: [],
})
```

URL:

```txt
?skills=TypeScript,Go
```
