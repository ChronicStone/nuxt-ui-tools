# Query State Integration

You can use query-state directly for app-level URL state.

```ts
const filters = useQueryStates({
  prefix: 'filters',
  schema: {
    search: { codec: stringCodec, defaultValue: '' },
    page: { codec: numberCodec, defaultValue: 1 },
  },
})
```

Resulting URL:

```txt
?filters.search=emma&filters.page=2
```

Use query-state directly when URL state itself is the feature.

This is a good fit for:

- search and pagination state on app pages
- shareable list views
- filters outside the table surface
- feature toggles encoded in the URL
