# Package Overview

Use this reference when the request is broad and you need to know which package surface solves it.

## Current Serious Consumer Surfaces

Today the main usable package surfaces are:

- table runtime
- form runtime
- query-state runtime
- shared responsive helpers
- i18n runtime

## Nuxt Module Auto-Imports

When the Nuxt module is installed, the main public functions are auto-imported.

That includes the primary entrypoints for:

- table schema and table runtime
- form schema and form runtime
- query-state
- shared responsive helpers
- i18n

The module also auto-registers the main public components:

- `DataList`
- `Form`
- `FormProvider`
- `ToolsProvider`

The configured module prefix still applies, so with the default module options
those components are available as `UiDataList`, `UiForm`, `UiFormProvider`, and `UiToolsProvider`.

## What To Import

Table usage:

```ts
import { defineTableSchema, useTable } from '#ui-tools/table'
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
} from '#ui-tools/query-state'
```

Responsive shared usage:

```ts
import { useResponsiveValue } from '#ui-tools/shared'
```

Form usage:

```ts
import { defineFormSchema, useForm } from '#ui-tools/form'
```

The same domain entrypoints are available as `nuxt-ui-tools/table`,
`nuxt-ui-tools/form`, `nuxt-ui-tools/query-state`, `nuxt-ui-tools/shared`, and
`nuxt-ui-tools/i18n` when explicit package imports are preferable.

The spreadsheet import engine remains internal and is intentionally absent from
the package export map, Nuxt auto-imports, registered components, and consumer skills.

## How To Route

Use:

- `skills/consumer/table/SKILL.md`
  for schema-driven data/table usage
- `skills/consumer/query-state/SKILL.md`
  for typed URL/query param state
- `skills/consumer/shared/SKILL.md`
  for breakpoint-aware shared runtime helpers
- `skills/consumer/form/SKILL.md`
  for schema-driven forms and provider-owned overlays
- `skills/consumer/i18n/SKILL.md`
  for locale wiring and translation-friendly text

## Which Skill To Open Next

- use `skills/consumer/table/SKILL.md` for data list/table/grid questions
- use `skills/consumer/query-state/SKILL.md` for URL/query-param state questions
- use `skills/consumer/shared/SKILL.md` for breakpoint-driven values
- use `skills/consumer/form/SKILL.md` for form runtime questions
- use `skills/consumer/i18n/SKILL.md` for locale questions
