# Package Overview

Use this reference when the request is broad and you need to know which package surface solves it.

## Current Serious Consumer Surfaces

Today the main usable package surfaces are:

- table runtime
- query-state runtime

The `form` area exists but is not yet a mature consumer-facing surface.

## What To Import

Table usage:

```ts
import { DataList, defineTableSchema, useTable } from '#table'
```

Query-state usage:

```ts
import {
  booleanCodec,
  createArrayCodec,
  createEnumCodec,
  dateISOCodec,
  dynamicQueryState,
  numberCodec,
  stringCodec,
  useQueryState,
  useQueryStates,
} from '#query-state'
```

## How To Route

Use:

- `skills/consumer/table/SKILL.md`
  for schema-driven data/table usage
- `skills/consumer/query-state/SKILL.md`
  for typed URL/query param state

## Which Skill To Open Next

- use `skills/consumer/table/SKILL.md` for data list/table/grid questions
- use `skills/consumer/query-state/SKILL.md` for URL/query-param state questions
