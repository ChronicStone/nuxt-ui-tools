# Server Engine Spec

This document defines the recommended server-side contract for `@nuxt-ui-tools/table` when `source.mode === 'remote'`.

It is written so you can hand it directly to another AI agent implementing the API endpoint.

## Goal

Implement a remote table engine that accepts the same logical request as the client runtime and returns a paginated result.

The server engine must be behaviorally aligned with:

- `packages/table/src/types/source.ts`
- `packages/table/src/utils/client-query.ts`

The server is responsible for:

- applying the global search
- applying resolved filters
- applying sorting
- applying pagination
- returning `rowCount` for the filtered dataset before pagination

## Canonical Internal Types

Current runtime types:

```ts
export interface TableSourceRequestContext<
  TRow extends GenericObject = GenericObject,
  TContext extends GenericObject = GenericObject,
  TSortKey extends string = TableSortKey<TRow>,
> {
  pagination: {
    pageIndex: number
    pageSize: number
  }
  sorting: Array<{
    key: TSortKey
    dir: 'asc' | 'desc'
  }>
  filters: TableResolvedFilterGroup<TableKnownFieldPath<TRow> | string>
  search: {
    value: string
    fields: TableKnownFieldPath<TRow>[]
  }
  context: TContext
}

export interface TableSourceExecutionResult<TRow extends GenericObject = GenericObject> {
  rows: TRow[]
  rowCount: number
}
```

## JSON Wire Contract

Because the API transport is JSON, use the following JSON-safe contract on the wire.

### Request body

```ts
type TableRemoteRequest = {
  pagination: {
    pageIndex: number
    pageSize: number
  }
  sorting: Array<{
    key: string
    dir: 'asc' | 'desc'
  }>
  filters: TableRemoteFilterGroup
  search: {
    value: string
    fields: string[]
  }
  context: Record<string, unknown>
}

type TableRemoteFilterNode = TableRemoteFilterGroup | TableRemoteFilterCondition

type TableRemoteFilterGroup = {
  type: 'group'
  combinator: 'and' | 'or'
  children: TableRemoteFilterNode[]
}

type TableRemoteFilterCondition = {
  type: 'condition'
  key: string
  operator:
    | 'contains'
    | 'is'
    | 'isAnyOf'
    | 'isNot'
    | 'gt'
    | 'gte'
    | 'lt'
    | 'lte'
    | 'between'
    | 'before'
    | 'after'
  value: unknown
}
```

### Response body

```ts
type TableRemoteResponse<TRow = Record<string, unknown>> = {
  rows: TRow[]
  rowCount: number
}
```

## Semantics

### 1. Search

`search` is an object containing:

- `value`: the free-text search string
- `fields`: the explicit list of schema-configured field paths that search should target

Rules:

- if `search.value === ''`, do not restrict rows
- search is case-insensitive
- search should be applied only to the provided `search.fields`
- search should support nested dot-path access
- search should support arrays anywhere in the path
- values are matched with string inclusion semantics

Example:

- `search.value = "ada"` matches `"Ada Lovelace"`
- `search.value = "comp"` matches `["compiler", "distributed"]`

Important:

- the current client implementation checks `search.value.trim().length` only to decide whether search is empty, but otherwise uses the raw search value
- for server parity, prefer matching the current implementation exactly unless you intentionally decide to normalize further

## 2. Filters

`filters` is already a resolved filter tree.

This means:

- the UI/schema layer has already chosen operators
- static filters are already merged in
- custom filter `resolve(...)` hooks have already been applied

The server must only execute the resolved tree.

### Group behavior

- `{ type: 'group', combinator: 'and' }` means all children must match
- `{ type: 'group', combinator: 'or' }` means at least one child must match
- an empty group should evaluate to `true`

### Field access

`condition.key` is a dot path.

Examples:

- `status`
- `profile.city`
- `teams.lead.name`

Path resolution rules:

- when traversing an array, continue matching against every item in the array
- scalar operators should succeed if any resolved value matches
- missing paths evaluate as non-matching

### Operator behavior

Implement operators with the same semantics as `packages/table/src/utils/client-query.ts`.

#### `contains`

- normalize both field value and filter value to lowercase strings
- succeeds if any resolved value includes the normalized filter substring
- if filter value normalizes to `''`, return `true`

#### `is`

- strict equality for non-date values
- for dates, compare normalized timestamps
- if the field resolves to multiple values, return `true` if any value is equal

#### `isAnyOf`

- if `value` is an array, return `true` if any candidate matches `is`
- if `value` is not an array, treat it the same as `is`

#### `isNot`

- logical negation of `is`

#### `gt`, `gte`, `lt`, `lte`

- normalize both the field value and filter value to comparable values
- compare numbers numerically
- compare booleans as `true => 1`, `false => 0`
- compare date-like values as timestamps
- compare strings case-insensitively
- return `true` if any resolved field value matches

#### `between`

Expected filter shape:

```ts
{
  from?: unknown
  to?: unknown
}
```

Rules:

- inclusive bounds
- if `from` is missing, only enforce the upper bound
- if `to` is missing, only enforce the lower bound
- if `value` is not an object, return `false`
- return `true` if any resolved field value falls in range

#### `before`

- equivalent to `lt`
- intended mainly for dates

#### `after`

- equivalent to `gt`
- intended mainly for dates

### Comparable normalization

To match the current client implementation, normalize as follows:

- `Date` -> `date.getTime()`
- number -> the number itself, except `NaN` becomes `null`
- string:
  - if it parses as a date and matches a `YYYY-MM-DD`-like pattern, treat it as a timestamp
  - otherwise lowercase it
- boolean -> `1` or `0`
- anything else -> `null`

### Array flattening

When the resolved field value is nested arrays, flatten them before operator evaluation.

Example:

```ts
[['compiler'], ['distributed', 'systems']]
```

should be treated as:

```ts
['compiler', 'distributed', 'systems']
```

## 3. Sorting

`sorting` is an ordered list of sort rules.

Rules:

- apply rules in array order
- compare each rule until one produces a non-zero result
- if no rule differs, rows are equivalent for sorting

Value normalization for sorting:

- array -> use the first item
- `Date` -> timestamp
- number -> number, except `NaN` becomes `null`
- boolean -> `true => 1`, `false => 0`
- string -> lowercase string
- `null` / `undefined` -> `null`
- other values -> `String(value).toLowerCase()`

Null ordering:

- `null` / `undefined` sort last

Direction:

- `asc` = natural order
- `desc` = reverse natural order

## 4. Pagination

Pagination applies after search, filters, and sorting.

Rules:

- `rowCount` is the total number of rows after search + filters, before pagination
- `rows` contains only the requested page slice
- `pageIndex` is 1-based
- if `pageIndex <= 0`, normalize to `1`
- if `pageSize <= 0`, normalize to the full filtered row count, or `1` if there are no rows

Slice formula:

```ts
const start = (pageIndex - 1) * pageSize
const end = start + pageSize
rows = filteredRows.slice(start, end)
```

## Transport Recommendations

### HTTP method

Use `POST`.

Reason:

- filters are tree-shaped JSON
- request payload can become large
- `context` may be structured

Recommended endpoint:

```txt
POST /api/table/<resource>/query
```

## Example Request

```json
{
  "pagination": {
    "pageIndex": 2,
    "pageSize": 20
  },
  "sorting": [
    {
      "key": "createdAt",
      "dir": "desc"
    },
    {
      "key": "name",
      "dir": "asc"
    }
  ],
  "search": "compiler",
  "context": {
    "organizationId": "org_123"
  },
  "filters": {
    "type": "group",
    "combinator": "and",
    "children": [
      {
        "type": "condition",
        "key": "status",
        "operator": "isAnyOf",
        "value": ["active", "inactive"]
      },
      {
        "type": "group",
        "combinator": "or",
        "children": [
          {
            "type": "condition",
            "key": "verified",
            "operator": "is",
            "value": true
          },
          {
            "type": "condition",
            "key": "score",
            "operator": "gte",
            "value": 20
          }
        ]
      }
    ]
  }
}
```

## Example Response

```json
{
  "rows": [
    {
      "id": "usr_4",
      "name": "Barbara Liskov",
      "status": "active",
      "verified": true,
      "score": 42,
      "createdAt": "2026-03-04T08:00:00.000Z"
    },
    {
      "id": "usr_2",
      "name": "Grace Hopper",
      "status": "inactive",
      "verified": false,
      "score": 21,
      "createdAt": "2026-03-08T08:00:00.000Z"
    }
  ],
  "rowCount": 7
}
```

## Client Integration Contract

A remote table source should build a query definition that posts the request context to the API and returns `TableRemoteResponse`.

Example:

```ts
source: {
  mode: 'remote',
  query: (ctx) => ({
    queryKey: ['users-table', ctx],
    queryFn: () =>
      $fetch('/api/table/users/query', {
        method: 'POST',
        body: ctx,
      }),
  }),
}
```

## Constraints For The API Agent

The agent implementing the API should follow these rules:

- do not re-interpret UI filter definitions; execute only the resolved filter tree from the request
- do not paginate before filtering and sorting
- always return both `rows` and `rowCount`
- preserve stable JSON output
- accept nested filter groups recursively
- support dot-path access in both filters and search
- support arrays encountered anywhere in a path
- keep behavior aligned with `executeClientQuery` unless the package contract is intentionally revised

## Suggested Acceptance Tests

The API implementation should be tested against these cases:

- empty search + empty filters returns the full dataset
- nested `and/or` group combinations
- each operator: `contains`, `is`, `isAnyOf`, `isNot`, `gt`, `gte`, `lt`, `lte`, `between`, `before`, `after`
- date comparisons with ISO strings
- nested path filtering
- array-backed field filtering
- multi-column sorting
- null values sorted last
- `rowCount` reflects filtered count, not page size
- page index beyond available rows returns `rows: []`

## Prompt-Ready Summary

If you want a short version to hand to another agent, use this:

> Implement a `POST /api/table/<resource>/query` endpoint. Accept JSON with `pagination`, `sorting`, `filters`, `search`, and `context`. `filters` is a recursive resolved filter tree with `group` nodes (`and`/`or`) and `condition` nodes using operators `contains`, `is`, `isAnyOf`, `isNot`, `gt`, `gte`, `lt`, `lte`, `between`, `before`, `after`. Apply search, then filters, then sorting, then pagination. Support dot-path access and arrays anywhere in the path. Return `{ rows, rowCount }`, where `rowCount` is the filtered total before pagination. Keep behavior aligned with `packages/table/src/utils/client-query.ts`.
