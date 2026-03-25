import { readFileSync } from 'node:fs'

import { describe, expect, expectTypeOf, it } from 'vitest'

import { defineSpreadsheetSchema } from '#ui-tools/spreadsheet/schema'
import type {
  ExtractSpreadsheetContextData,
  ExtractSpreadsheetRow,
  SpreadsheetColumnsDefinition,
  SpreadsheetContextItem,
  SpreadsheetQueryDefinition,
  SpreadsheetReferenceDefinition,
} from '#ui-tools/spreadsheet/types'

describe('spreadsheet package surface', () => {
  it('exports defineSpreadsheetSchema from the schema entrypoint', () => {
    expectTypeOf(defineSpreadsheetSchema).toBeFunction()
  })

  it('declares TanStack Query on the package boundary', () => {
    const packageJson = JSON.parse(
      readFileSync(new URL('../../package.json', import.meta.url), 'utf8'),
    ) as { peerDependencies?: Record<string, string> }

    expect(packageJson.peerDependencies?.['@tanstack/vue-query']).toBeDefined()
  })

  it('supports schema sections without runtime implementation', () => {
    const context = [
      {
        key: 'products',
        query: () =>
          ({
            queryKey: ['products', 'org_123'],
            queryFn: async () => [{ id: 'prod_1', name: 'Demo product' }],
          }) satisfies SpreadsheetQueryDefinition<readonly { id: string; name: string }[]>,
      },
    ] satisfies readonly SpreadsheetContextItem<string, unknown>[]

    type ContextData = ExtractSpreadsheetContextData<{
      context: typeof context
    }>

    const columns = {
      static: (column) => [
        column.text('examNameRaw', {
          required: true as const,
        }),
      ],
    } satisfies SpreadsheetColumnsDefinition<ContextData>

    type BaseRow = ExtractSpreadsheetRow<{
      columns: typeof columns
    }>

    const references = [
      {
        key: 'product',
        sourceField: 'examNameRaw',
        target: {
          options: [{ id: 'prod_1', name: 'Demo product' }],
          optionValue: (option) => option.id,
          optionLabel: (option) => option.name,
        },
        output: {
          field: 'productId',
        },
      },
    ] satisfies readonly SpreadsheetReferenceDefinition<
      ContextData,
      BaseRow,
      'productId',
      string,
      { id: string; name: string }
    >[]

    const schema = defineSpreadsheetSchema({
      importKey: 'demo.import',
      context,
      columns,
      references,
    })

    type SchemaContextData = ExtractSpreadsheetContextData<typeof schema>
    type Row = ExtractSpreadsheetRow<typeof schema>

    expectTypeOf<SchemaContextData['products'][number]['name']>().toEqualTypeOf<string>()
    expectTypeOf<Row['productId']>().toEqualTypeOf<string | undefined>()
  })
})
