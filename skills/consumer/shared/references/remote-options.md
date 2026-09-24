# Reusable Remote Options

`defineRemoteOptions` creates one query-backed source for dashboard filters, table option filters,
and form fields. Use it when the same list, such as users, is picked in several places. Each picker
still accepts its existing inline remote definition.

```ts
import { defineRemoteOptions } from '#ui-tools/shared'

const users = defineRemoteOptions(
  {
    load: ({ search, page }) =>
      $api.users.list.queryOptions({
        query: { search, cursor: page.cursor, limit: page.size },
      }),
    resolveSelected: ({ values }) =>
      $api.users.byIds.queryOptions({ body: { ids: values.map(String) } }),
  },
  {
    key: 'users',
    pagination: { type: 'cursor', size: 25 },
    search: { debounce: 250 },
    mapPage: (result) => ({
      options: result.rows.map((user) => ({ value: user.id, label: user.name })),
      nextCursor: result.pageInfo.nextCursor,
    }),
    mapSelected: (result) => result.rows.map((user) => ({ value: user.id, label: user.name })),
  },
)
```

The first argument supplies endpoint queries, so `mapPage` and `mapSelected` infer their response
types. The maps convert endpoint data to `{ options, nextCursor }` for cursor pagination, or
`{ options, hasMore }` for page pagination. `resolveSelected` supplies labels for values restored
from a URL or an existing form value, even when their page has not loaded.

```ts
// Dashboard filter
owner: f.remote(users, { label: 'Owner' })

// Table option filter; facet counts remain a separate table concern
filter.option('ownerId', { source: { remote: users } })

// Form select; refreshOn and creation behavior can still vary per field
{ key: 'ownerId', type: 'select', options: { mode: 'remote', loader: users } }
```

Use a stable `key` for each option mapping. The endpoint query keys must include every request
input, including workspace or tenant scope; the package adds the loader key to keep mapped option
data apart from the endpoint's raw response. The loader exposes `queryKeyFor` from `load` and
`selectedQueryKeyFor` from `resolveSelected`, so an external workspace change reloads open pages
and a locale used only by the selected lookup refreshes restored labels. Form fields follow these
loader keys automatically; `refreshOn` remains available when a field depends on another field.
Parent-specific remote tree loading continues to use the inline form source, which receives
`parent` in its request.
