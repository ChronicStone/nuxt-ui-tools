# Spreadsheet API Proposal

This file intentionally shows concrete code first.
It is not a type-definition dump.

## Public shape

The public API should center on three things:

1. `defineSpreadsheetSchema(...)`
2. `useSpreadsheetImport(...)`
3. `SpreadsheetImportFlow`

Optional lower-level entrypoints:

- `createSpreadsheetSession(...)`
- `createSpreadsheetTemplate(...)`

Optional app-level API:

- `$spreadsheetApi.start(...)`

## Example 1: Straightforward admin import

```ts
import { defineSpreadsheetSchema, useSpreadsheetImport } from '@nuxt-ui-tools/spreadsheet'

const userImportSchema = defineSpreadsheetSchema({
  importKey: 'users.import',

  source: {
    accept: ['.csv', '.xlsx'],
    maxRecords: 5_000,
    template: {
      filename: 'users-import-template.xlsx',
    },
  },

  header: {
    strategy: 'first-row',
  },

  columns: (column) => [
    column.text('firstName', {
      label: 'First name',
      match: ['first name', 'firstname', /^first[_ ]?name$/i],
      examples: ['Ada'],
      required: true,
      parse: (cell) => cell.text.trim(),
    }),

    column.text('lastName', {
      label: 'Last name',
      match: ['last name', 'lastname', /^surname$/i],
      required: true,
      parse: (cell) => cell.text.trim(),
    }),

    column.email('email', {
      label: 'Email',
      match: ['email', 'email address', /^e-?mail$/i],
      required: true,
      parse: (cell) => cell.text.trim().toLowerCase(),
    }),

    column.enum('role', {
      label: 'Role',
      match: ['role', 'user role', /^permission/i],
      options: ['admin', 'manager', 'member'],
      required: true,
    }),
  ],

  review: {
    allowInvalidSubmit: false,
  },
})

const userImport = useSpreadsheetImport(userImportSchema, {
  onSubmit: async ({ validRows, file }) => {
    await $fetch('/api/users/import', {
      method: 'POST',
      body: { rows: validRows, filename: file.name },
    })
  },
})
```

```vue
<template>
  <SpreadsheetImportFlow :importer="userImport" />
</template>
```

Why this is the right direction:

- clear top-level sections
- concrete examples over type ceremony
- matching lives per column
- parsing lives per column
- flow config is separate from column config

## Example 2: Skip header selection and skip matching

This is critical.
If the template is controlled, we should not force manual steps.

```ts
const payoutImportSchema = defineSpreadsheetSchema({
  importKey: 'finance.payouts',

  source: {
    accept: ['.xlsx'],
    template: {
      filename: 'payout-import.xlsx',
      sheet: 'Payouts',
    },
  },

  sheet: {
    strategy: 'fixed',
    sheet: 'Payouts',
    skipIfResolved: true,
  },

  header: {
    strategy: 'fixed',
    row: 3,
    skipIfResolved: true,
  },

  matching: {
    strategy: 'template',
    skipIfResolved: true,
  },

  columns: (column) => [
    column.text('employeeId', {
      label: 'Employee ID',
      from: 'Employee ID',
      required: true,
    }),
    column.number('grossAmount', {
      label: 'Gross Amount',
      from: 'Gross Amount',
      required: true,
    }),
    column.date('payoutDate', {
      label: 'Payout Date',
      from: 'Payout Date',
      required: true,
    }),
  ],
})
```

The consumer should not have to opt out of steps by awkwardly fabricating step state.
The schema itself should be able to make those steps disappear.

## Example 3: Messy files with smarter header matching

Matching should support strings, regex, and scoring functions.

```ts
const crmLeadImportSchema = defineSpreadsheetSchema({
  importKey: 'crm.leads',

  source: {
    accept: ['.csv', '.xlsx'],
  },

  header: {
    strategy: 'selection',
    detect: {
      candidates: 8,
      scoreRow: ({ row }) => {
        const joined = row.join(' ').toLowerCase()

        if (joined.includes('first name') || joined.includes('email')) return 100

        if (joined.includes('generated on')) return -20

        return 0
      },
      autoSelectWhenConfident: true,
    },
  },

  matching: {
    strategy: 'smart',
    autoApplyWhenConfident: true,
    threshold: 0.72,
  },

  columns: (column) => [
    column.text('firstName', {
      label: 'First name',
      required: true,
      match: [
        'first name',
        'given name',
        /^fname$/i,
        ({ header }) => (header.normalized === 'forename' ? 0.95 : null),
      ],
    }),

    column.text('company', {
      label: 'Company',
      match: ['company', 'organisation', /^business( name)?$/i],
    }),

    column.email('email', {
      label: 'Email',
      required: true,
      match: [
        'email',
        'email address',
        /^primary[_ ]?email$/i,
        ({ sampleValues }) => {
          const emailLikeCount = sampleValues.filter((value) => value.includes('@')).length
          return emailLikeCount >= 4 ? 0.9 : null
        },
      ],
    }),

    column.phone('phone', {
      label: 'Phone',
      match: ['phone', 'telephone', /^mobile$/i, /^phone(_number)?$/i],
    }),
  ],
})
```

This is much closer to the real problem than "alternate labels + distance".

## Example 4: Remote option resolution with table-style query contracts

This is where table patterns should carry over.

```ts
const productImportSchema = defineSpreadsheetSchema({
  importKey: 'catalog.products',

  context: [
    {
      key: 'organisationId',
      query: () => ({
        queryKey: ['active-organisation'],
        queryFn: async () => {
          const organisation = await $fetch('/api/organisation/active')
          return organisation.id
        },
      }),
    },
  ],

  columns: (column) => [
    column.text('sku', {
      label: 'SKU',
      required: true,
      match: ['sku', 'product code'],
    }),

    column.option('brandId', {
      label: 'Brand',
      required: true,
      match: ['brand', 'maker', 'vendor'],
      options: {
        query: ({ context, search }) => ({
          queryKey: ['brands', context.organisationId, search],
          queryFn: async () => {
            return await $fetch('/api/brands/options', {
              query: {
                organisationId: context.organisationId,
                search,
              },
            })
          },
        }),
      },
      resolve: async ({ cell, options }) => {
        const match = options.find(
          (option) => option.label.toLowerCase() === cell.text.trim().toLowerCase(),
        )

        return match
          ? { value: match.value }
          : {
              issues: [
                {
                  level: 'error',
                  code: 'brand.not_found',
                  message: `Unknown brand: ${cell.text}`,
                },
              ],
            }
      },
    }),
  ],
})
```

This is the kind of power we need for real imports.

## Example 5: Dynamic runtime columns for org-defined affiliations

This is the concrete case your old implementation handled badly.

The key requirement is not just "build columns from an array".
The real requirement is:

- columns can be resolved at runtime
- those dynamic columns still participate in matching, parsing, review, and inference
- their imported values can be reshaped into the final payload instead of leaking a flat `affiliation:foo` key surface
- the consumer should not have to hand-build repetitive regex, `map(...)`, option matching, and submit reshaping for every dynamic group

```ts
export function assessmentImportSchema(params: {
  testCenterVtestId: string
  affiliations: Array<AffiliationGroup & { items: AffiliationGroupItem[] }>
}) {
  const { $i18n, $client } = useNuxtApp()

  const parseUTC = (value: string) => (value ? new Date(`${value} UTC`).toISOString() : null)

  return defineSpreadsheetSchema({
    importKey: 'assessment.results',

    context: [
      {
        key: 'testCenters',
        query: () => ({
          queryKey: ['test-centers'],
          queryFn: async () => {
            const testCenters = await $client.testCenter.getTestCenters.query()
            return testCenters.map((center) => center.vtestId)
          },
        }),
      },
    ],

    columns: (column, group, dynamic) => [
      group('identity', [
        column.text('testCenterId', {
          label: 'Test center ID',
          from: 'Test center ID',
          required: true,
          parse: (cell) => cell.text.trim(),
          validate: async ({ value, context, addIssue }) => {
            const allowed = params.testCenterVtestId
              ? [params.testCenterVtestId]
              : context.testCenters

            if (!allowed.includes(value))
              addIssue('error', 'test-center.invalid', 'Unknown test center ID')
          },
          examples: [params.testCenterVtestId],
        }),

        column.text('secureCode', {
          label: $i18n.t('labels.secureCode'),
          from: 'Secure code',
          required: true,
          parse: (cell) => cell.text.trim(),
          examples: ['3432J434D2'],
        }),

        column.text('examName', {
          label: $i18n.t('labels.examName'),
          from: 'Exam name',
          required: true,
          parse: (cell) => cell.text.trim(),
        }),

        column.email('email', {
          label: $i18n.t('labels.email'),
          from: 'Email',
          required: true,
          parse: (cell) => cell.text.trim().toLowerCase(),
        }),
      ]),

      group('result', [
        column.date('completionDate', {
          label: $i18n.t('labels.examDate'),
          from: 'Completed date',
          required: true,
          parse: (cell) => parseUTC(cell.text.trim()),
        }),

        column.text('duration', {
          label: $i18n.t('labels.examDuration'),
          from: 'Duration',
          required: true,
          parse: (cell) => cell.text.trim(),
          validate: ({ value, addIssue }) => {
            const isValid = /^([01]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/.test(value)
            if (!isValid)
              addIssue('error', 'duration.invalid', 'Duration must use HH:mm or HH:mm:ss')
          },
        }),

        column.enum('status', {
          label: $i18n.t('labels.status'),
          from: 'Status',
          required: true,
          options: ['Done'],
          parse: (cell) => cell.text.trim(),
        }),
      ]),

      dynamic.optionGroups('affiliations', {
        source: params.affiliations,
        itemKey: (group) => group.id,
        itemLabel: (group) => group.name,

        targetKey: (group) => `affiliations.${formatAffiliationLabel(group.name)}`,

        header: {
          strategy: 'affiliation-prerequisite',
          accents: true,
          fallback: ({ group }) => [
            `${group.name}: PREREQUIS CECR`,
            `${group.name}: PRÉREQUIS CECR`,
          ],
        },

        values: {
          mode: 'csv',
          separator: ',',
          resolve: 'label',
          normalize: ['trim', 'accent-insensitive', 'case-insensitive'],
        },

        options: (group) =>
          group.items.map((item) => ({
            label: item.name,
            value: item.id,
          })),

        presentation: {
          groupLabel: (group) => `Affiliation | ${group.name}`,
          columnLabel: (group) => group.name,
        },

        output: {
          collect: ({ group, values }) =>
            values.map((itemId) => ({
              groupId: group.id,
              itemId,
            })),
          into: 'affiliations',
        },
      }),
    ],
  })
}
```

Why this direction is better:

- one built-in dynamic builder owns the repetitive mechanics
- header resolution becomes a strategy instead of consumer-authored regex soup
- option lookup and label-to-value mapping become built-in behaviors
- final collected output is domain-shaped without custom flattening code in every schema
- the consumer still has hooks, but the common dynamic-group case stays high-level

## Example 6: Dynamic columns through a dedicated resolver

If the domain gets richer, dynamic columns should also support a dedicated resolver surface instead of forcing everything into one giant `columns` callback.

```ts
const schema = defineSpreadsheetSchema({
  importKey: 'assessment.results',

  columns: {
    static: (column) => [
      column.text('firstName', { label: 'First name', required: true }),
      column.text('lastName', { label: 'Last name', required: true }),
    ],

    dynamic: ({ dynamic, context }) => [
      dynamic.optionGroups('affiliations', {
        source: context.affiliations,
        itemKey: (group) => group.id,
        itemLabel: (group) => group.name,
        targetKey: (group) => `affiliations.${group.slug}`,
        header: {
          strategy: 'affiliation-prerequisite',
        },
        values: {
          mode: 'csv',
          resolve: 'label',
        },
        options: (group) => group.items,
        output: {
          into: 'affiliations',
          collect: ({ group, values }) =>
            values.map((itemId) => ({
              groupId: group.id,
              itemId,
            })),
        },
      }),
    ],
  },
})
```

This is much closer to the API direction I think we actually want:

- static columns and dynamic columns are clearly separated
- dynamic columns use a dedicated builder, not hand-built loops
- matching and value resolution use built-in strategies first
- consumers only drop to custom hooks when the built-in strategy is not enough

## Example 7: Cross-row validation and enrichment

```ts
const inventoryImportSchema = defineSpreadsheetSchema({
  importKey: 'inventory.adjustments',

  columns: (column) => [
    column.text('sku', {
      label: 'SKU',
      required: true,
      match: ['sku', 'product code'],
    }),
    column.number('quantity', {
      label: 'Quantity',
      required: true,
      match: ['quantity', 'qty'],
    }),
    column.enum('direction', {
      label: 'Direction',
      options: ['in', 'out'],
      required: true,
      match: ['direction', 'movement'],
    }),
  ],

  pipeline: {
    row: async ({ row, addIssue }) => {
      if (row.quantity === 0) addIssue('quantity', 'warning', 'quantity.zero', 'Quantity is zero')

      return {
        ...row,
        quantityDelta: row.direction === 'out' ? -row.quantity : row.quantity,
      }
    },

    table: async ({ rows, addIssue }) => {
      const seen = new Set<string>()

      rows.forEach((row, index) => {
        const duplicateKey = `${row.sku}:${row.direction}:${row.quantity}`
        if (seen.has(duplicateKey))
          addIssue(index, 'sku', 'warning', 'row.duplicate', 'Possible duplicate adjustment')

        seen.add(duplicateKey)
      })

      return rows
    },
  },
})
```

The important part is not the exact callback names.
The important part is clear ownership:

- column parse/resolve handles cell-local logic
- `pipeline.row` handles row-local logic
- `pipeline.table` handles cross-row logic

## Example 8: Headless session with custom UI

```ts
const session = useSpreadsheetImport(userImportSchema, {
  initialState: {
    step: 'review',
    file,
    workbook,
    sheet: 'Users',
    headerRow: 2,
    matches: {
      'First Name': 'firstName',
      'Last Name': 'lastName',
      Email: 'email',
      Role: 'role',
    },
  },
})

await session.load()

const invalidRows = session.rows.value.filter((row) => row.status === 'invalid')
```

This matters because the runtime should not be locked to one modal implementation.

## Example 9: Imperative app API

The inline renderer is the first target.
But the imperative path should be in scope from the start so the architecture does not paint us into a corner.

```ts
const { $spreadsheetApi } = useNuxtApp()

const result = await $spreadsheetApi.start(
  assessmentImportSchema({
    testCenterVtestId,
    affiliations,
  }),
  {
    mode: 'inline',
    title: 'Import assessment results',
    onSubmit: async ({ validRows }) => {
      await $client.assessment.import.mutate({ rows: validRows })
    },
  },
)

if (result.isCompleted) {
  console.log(result.data.validRows)
}
```

Desired behavior:

- `start(...)` creates a real session/runtime instance
- it can be rendered inline now
- later it can also target drawer/modal/fullscreen if needed
- the promise resolves with typed completion data

Possible resolved shape:

```ts
const result = await $spreadsheetApi.start(schema, options)

if (result.isCompleted) {
  result.data.validRows
  result.data.invalidRows
  result.data.allRows
  result.data.submitPayload
}
```

This is much closer to the old `useFormApi().createForm(...)` direction than a simple component callback.

## Example 10: Generate a reference template

```ts
const template = createSpreadsheetTemplate(userImportSchema, {
  includeExamples: true,
  includeDescriptions: true,
  includeRequiredMarkers: true,
})

await template.download()
```

This is a real workflow benefit from the old implementation and should remain first-class.

## Proposed top-level schema sections

These sections feel right at the public surface:

```ts
defineSpreadsheetSchema({
  importKey: '...',
  source: { ... },
  sheet: { ... },
  header: { ... },
  matching: { ... },
  context: [ ... ],
  columns: (column) => [ ... ],
  pipeline: { ... },
  review: { ... },
  submission: { ... },
})
```

Why this shape works:

- `source` owns file-level concerns
- `sheet` owns workbook sheet resolution
- `header` owns header detection / selection
- `matching` owns mapping behavior
- `columns` owns target row contract
- `pipeline` owns transforms and validation
- `review` owns review-step behavior
- `submission` owns submit/output policy

That is much cleaner than stuffing everything into one field definition or one component prop bag.

## Proposed column surface

The column API should be concrete builders, not one mega object kind switch.

Good direction:

```ts
columns: (column) => [
  column.text('name', { ... }),
  column.email('email', { ... }),
  column.number('amount', { ... }),
  column.date('birthdate', { ... }),
  column.boolean('isActive', { ... }),
  column.option('status', { ... }),
  column.array('tags', { ... }),
  column.custom('metadata', { ... }),
]
```

Why:

- easier to scan
- easier to document
- clearer defaults per kind
- better long-term config-driven internals

## Proposed matching surface

The matching system should allow:

```ts
match: [
  'email',
  'email address',
  /^e-?mail$/i,
  ({ header, column }) => (header.normalized === column.key ? 1 : null),
  ({ sampleValues }) => (sampleValues.some((value) => value.includes('@')) ? 0.85 : null),
]
```

And at the global level:

```ts
matching: {
  strategy: 'smart',
  threshold: 0.72,
  autoApplyWhenConfident: true,
  allowDuplicateMatches: false,
  unresolved: 'review',
}
```

This gives us room for a registry-driven matcher engine internally.

## Proposed step control surface

This is important because "optional step" should be native, not hacked in.

```ts
sheet: {
  strategy: 'selection',
  skipIfSingle: true,
}

header: {
  strategy: 'selection',
  skipIfResolved: true,
}

matching: {
  strategy: 'smart',
  skipIfResolved: true,
}

review: {
  enabled: ({ summary }) => summary.invalidRows > 0,
}
```

This is much better than asking the user to manually construct hidden wizard state.

## Proposed runtime surface

The runtime should expose enough to support both stock UI and custom UI:

```ts
const importer = useSpreadsheetImport(schema, {
  onSubmit: async ({ validRows }) => {
    await save(validRows)
  },
})

await importer.open()
await importer.selectFile(file)
await importer.goToNextStep()

importer.step.value
importer.rows.value
importer.summary.value
importer.matches.value
importer.actions.downloadInvalidRows()
importer.actions.downloadTemplate()
importer.actions.submit()
```

This should feel like a real domain runtime, not an opaque component.

## Proposed imperative API shape

There should also be a global/session API for app-driven usage:

```ts
type SpreadsheetApi = {
  start: <TSchema>(
    schema: TSchema,
    options?: {
      mode?: 'inline' | 'modal' | 'drawer' | 'fullscreen'
      onSubmit?: (payload: {
        validRows: InferSpreadsheetValidRows<TSchema>
        invalidRows: InferSpreadsheetInvalidRows<TSchema>
        allRows: InferSpreadsheetAllRows<TSchema>
        submitPayload: InferSpreadsheetSubmitPayload<TSchema>
      }) => Promise<void> | void
    },
  ) => Promise<{
    isCompleted: boolean
    data: {
      validRows: InferSpreadsheetValidRows<TSchema>
      invalidRows: InferSpreadsheetInvalidRows<TSchema>
      allRows: InferSpreadsheetAllRows<TSchema>
      submitPayload: InferSpreadsheetSubmitPayload<TSchema>
    }
  }>
}
```

The docs should keep showing concrete examples first.
But the architecture needs to preserve this shape from the beginning.

## API decisions this proposal is making

1. Use one schema builder, not many disconnected config entrypoints.
2. Use concrete builder helpers for columns.
3. Separate flow config from column config.
4. Make steps skippable by schema policy.
5. Make matching strategy-based and extensible.
6. Use query-definition contracts for async/context-aware behavior.
7. Support headless runtime and stock UI equally.
