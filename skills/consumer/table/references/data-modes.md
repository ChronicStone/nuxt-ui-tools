# Table Data Modes

Current source modes:

- `client`
- `remote`

## Client Mode

Use client mode when the dataset can be loaded locally and queried in-memory.

Example:

```ts
source: {
  mode: 'client',
  query: () => ({
    queryKey: ['employees'],
    queryFn: async () => [
      { id: '1', fullName: 'Emma Martin', email: 'emma@example.com' },
      { id: '2', fullName: 'Luca Sato', email: 'luca@example.com' },
    ],
  }),
}
```

What you return:

- an array of rows
- or an object with `rows` and `rowCount`

## Remote Mode

Use remote mode when filtering, sorting, pagination, or option counts should be server-backed.

Example:

```ts
source: {
  mode: 'remote',
  query: (request) => ({
    queryKey: ['employees', request],
    queryFn: async () => api.queryTable({ request }),
  }),
}
```

What your `request` contains:

- pagination
- sorting
- resolved filters
- search
- context

What your API should return:

```ts
{
  rows: EmployeeRow[],
  rowCount: number
}
```

Remote mode can also provide:

- remote facets
- remote filter-option queries

## Choosing Between Them

Use client mode for:

- local datasets
- simpler setups
- built-in client-side query behavior

Use remote mode for:

- large datasets
- server-backed filtering/sorting/pagination
- dynamic facet and option loading
