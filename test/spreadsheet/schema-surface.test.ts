import { readFileSync } from 'node:fs'

import { describe, expect, expectTypeOf, it } from 'vitest'

import { defineSpreadsheetSchema } from '#ui-tools/spreadsheet/schema'
import type {
  ExtractSpreadsheetContextData,
  ExtractSpreadsheetRow,
  ExtractSpreadsheetSubmitPayload,
  SpreadsheetColumnsDefinition,
  SpreadsheetContextItem,
  SpreadsheetQueryDefinition,
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
          required: true,
          match: {
            headers: ['Exam name'],
          },
        }),
      ],
    } satisfies SpreadsheetColumnsDefinition<ContextData>

    const schema = defineSpreadsheetSchema({
      importKey: 'demo.import',
      context,
      columns,
      references: reference => [
        reference.select('productId', {
          source: 'examNameRaw',
          options: [{ label: 'Demo product', value: 'prod_1' }],
        }),
      ],
    })

    type SchemaContextData = ExtractSpreadsheetContextData<typeof schema>
    type Row = ExtractSpreadsheetRow<typeof schema>

    expectTypeOf<SchemaContextData['products'][number]['name']>().toEqualTypeOf<string>()
    expectTypeOf<Row['productId']>().toEqualTypeOf<'prod_1' | undefined>()
  })

  it('infers context-backed option columns without root-level getters', () => {
    const context = [
      {
        key: 'products',
        query: () =>
          ({
            queryKey: ['products', 'org_456'],
            queryFn: async () => [
              { id: 'prod_1', name: 'Demo product' },
              { id: 'prod_2', name: 'Advanced product' },
            ],
          }) satisfies SpreadsheetQueryDefinition<readonly { id: string; name: string }[]>,
      },
    ] satisfies readonly [
      SpreadsheetContextItem<'products', readonly { id: string; name: string }[]>,
    ]

    const schema = defineSpreadsheetSchema({
      importKey: 'demo.option-import',
      context,
      columns: {
        static: (column) => [
          column.option('productId', {
            match: {
              headers: ['Product'],
            },
            options: ({ context }) =>
              context.products.map(product => ({
                label: product.name,
                value: product.id,
              })),
          }),
          column.option('selectedProductId', {
            match: {
              headers: ['Selected product'],
            },
            options: ({ context }) =>
              context.products.map(product => ({
                label: product.name,
                value: product.id,
              })),
          }),
        ],
      },
    })

    type Row = ExtractSpreadsheetRow<typeof schema>

    expectTypeOf<Row['productId']>().toEqualTypeOf<string | undefined>()
    expectTypeOf<Row['selectedProductId']>().toEqualTypeOf<string | undefined>()
  })

  it('supports primitive option arrays without consumer-side mapping', () => {
    const schema = defineSpreadsheetSchema({
      importKey: 'demo.primitive-options',
      columns: {
        static: (column) => [
          column.option('status', {
            options: ['Draft', 'Done'],
          }),
        ],
      },
    })

    type Row = ExtractSpreadsheetRow<typeof schema>

    expectTypeOf<Row['status']>().toEqualTypeOf<'Draft' | 'Done' | undefined>()
  })

  it('infers array reference outputs from array source fields', () => {
    const schema = defineSpreadsheetSchema({
      importKey: 'demo.multi-reference',
      columns: {
        static: (column) => [
          column.text('productLabels', {
            multiple: true,
          }),
        ],
      },
      references: reference => [
        reference.select('productIds', {
          source: 'productLabels',
          options: [
            { label: 'Business English', value: 'prod_1' },
            { label: 'Reading Placement', value: 'prod_2' },
          ],
        }),
      ],
    })

    type Row = ExtractSpreadsheetRow<typeof schema>

    const sparseRow: Row = {
      productLabels: undefined,
      productIds: undefined,
    }
    const populatedRow: Row = {
      productLabels: ['Business English', 'Reading Placement'],
      productIds: ['prod_1', 'prod_2'],
    }

    void sparseRow
    void populatedRow
  })

  it('types refine relations against buildRow output', () => {
    const schema = defineSpreadsheetSchema({
      importKey: 'demo.refine-import',
      columns: {
        static: (column) => [
          column.text('examNameRaw', {
            rules: v => [v.required()],
            match: {
              headers: ['Exam name'],
            },
          }),
        ],
      },
      buildRow: ({ row }) => ({
        examName: row.examNameRaw,
      }),
    }).refine({
      relations: [
        {
          column: 'examName',
          condition: row => row.examName.length > 0,
          rules: v => [
            v.required(),
          ],
        },
      ],
    })

    type SubmitPayload = ExtractSpreadsheetSubmitPayload<typeof schema>

    expectTypeOf<SubmitPayload>().toEqualTypeOf<{ examName: string }>()
  })
})
