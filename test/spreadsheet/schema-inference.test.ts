import { describe, expectTypeOf, it } from 'vitest'

import { defineSpreadsheetSchema } from '#ui-tools/spreadsheet/schema'
import type {
  ExtractSpreadsheetContextData,
  ExtractSpreadsheetRow,
  SpreadsheetContextItem,
  SpreadsheetQueryDefinition,
} from '#ui-tools/spreadsheet/types'

interface DemoAffiliationItem {
  id: string
  name: string
}

interface DemoAffiliationGroup {
  id: string
  name: string
  slug: string
  items: readonly DemoAffiliationItem[]
}

const affiliationGroups = [
  {
    id: 'school-level',
    name: 'School level',
    slug: 'schoolLevel',
    items: [
      { id: 'primary', name: 'Primary' },
      { id: 'secondary', name: 'Secondary' },
    ],
  },
] satisfies readonly DemoAffiliationGroup[]

const contextItems = [
  {
    key: 'affiliationGroups',
    query: () =>
      ({
        queryKey: ['affiliation-groups', 'tc_123'],
        queryFn: async () => affiliationGroups,
      }) satisfies SpreadsheetQueryDefinition<readonly DemoAffiliationGroup[]>,
  },
  {
    key: 'products',
    query: () =>
      ({
        queryKey: ['products', 'tc_123'],
        queryFn: async () => [
          { id: 'prod_1', name: 'Business English 4 Skills' },
          { id: 'prod_2', name: 'Reading Placement Test' },
        ] as const,
      }) satisfies SpreadsheetQueryDefinition<
        readonly [
          { id: 'prod_1', name: 'Business English 4 Skills' },
          { id: 'prod_2', name: 'Reading Placement Test' },
        ]
      >,
  },
] satisfies readonly [
  SpreadsheetContextItem<'affiliationGroups', readonly DemoAffiliationGroup[]>,
  SpreadsheetContextItem<
    'products',
    readonly [
      { id: 'prod_1', name: 'Business English 4 Skills' },
      { id: 'prod_2', name: 'Reading Placement Test' },
    ]
  >,
]

const schema = defineSpreadsheetSchema({
  importKey: 'assessment.results',
  context: contextItems,
  file: {
    accept: ['.xlsx'],
    maxRecords: 100,
  },
  columns: {
    static: (column) => [
      column.text('testCenterId', {
        rules: v => [v.required()],
        match: {
          headers: ['Test center ID'],
        },
      }),
      column.text('examNameRaw', {
        rules: v => [v.required()],
        match: {
          headers: ['Exam name'],
        },
      }),
      column.text('tags', {
        multiple: true,
      }),
      column.number('scores.history', {
        multiple: {
          separator: ';',
        },
      }),
      column.option('productIds', {
        options: ({ context: queryContext }) =>
          queryContext.products.map(product => ({
            label: product.name,
            value: product.id,
          })),
        multiple: {
          separator: ',',
          matchBy: 'label',
        },
      }),
      column.number('scores.general'),
    ],
    dynamic: ({ dynamic }) => [
      dynamic.optionGroups({
        key: 'affiliations',
        source: affiliationGroups,
        itemKey: group => group.id,
        itemLabel: group => group.name,
        targetKey: group => group.slug,
        header: {
          strategy: 'template',
          template: ({ source }) => `${source.name}: PRÉREQUIS CECR`,
        },
        options: group => group.items.map(item => ({
          label: item.name,
          value: item.id,
        })),
        values: {
          mode: 'csv',
          separator: ',',
          resolve: 'label',
        },
        output: {
          into: 'affiliations',
        },
      }),
    ],
  },
  references: reference => [
    reference.select('productId', {
      source: 'examNameRaw',
      options: [
        { label: 'Business English 4 Skills', value: 'prod_1' },
        { label: 'Reading Placement Test', value: 'prod_2' },
      ],
    }),
  ],
  buildRow: ({ row }) => ({
    examName: row.examNameRaw,
  }),
})

const resolveSchema = defineSpreadsheetSchema({
  importKey: 'assessment.resolve',
  columns: {
    static: (column) => [
      column.text('productId', {
        match: {
          headers: ['Product'],
        },
        resolve: {
          options: [
            { label: 'Business English 4 Skills', value: 'prod_1' },
            { label: 'Reading Placement Test', value: 'prod_2' },
          ],
        },
        rules: v => [
          v.required(),
          v.validate({
            name: 'allowedProduct',
            validator: value => value !== 'prod_2',
            message: 'Product is not allowed',
          }),
        ],
      }),
      column.number('centerId', {
        match: {
          headers: ['Center code'],
        },
        resolve: {
          options: [
            { label: '1201', value: 1201 },
            { label: '1202', value: 1202 },
          ],
        },
      }),
      column.text('productIds', {
        match: {
          headers: ['Products'],
        },
        multiple: {
          separator: ',',
        },
        resolve: {
          options: [
            { label: 'Business English 4 Skills', value: 'prod_1' },
            { label: 'Reading Placement Test', value: 'prod_2' },
          ],
        },
      }),
      column.text('status', {
        match: {
          headers: ['Status'],
        },
      }),
    ],
  },
  buildRow: ({ row }) => ({
    resolvedProductId: row.productId,
    reviewStatus: row.status,
  }),
}).refine({
  relations: [
    {
      column: 'resolvedProductId',
      condition: row => row.reviewStatus === 'Done',
      rules: v => [
        v.required({
          message: 'Resolved product is required when reviewStatus is Done',
        }),
      ],
    },
  ],
})

type SchemaContextData = ExtractSpreadsheetContextData<typeof schema>
type Row = ExtractSpreadsheetRow<typeof schema>
type ResolveRow = ExtractSpreadsheetRow<typeof resolveSchema>

describe('defineSpreadsheetSchema inference', () => {
  it('infers context data from query definitions', () => {
    expectTypeOf<SchemaContextData['affiliationGroups'][number]['slug']>().toEqualTypeOf<string>()
  })

  it('infers nested static row fields from dot-path keys', () => {
    expectTypeOf<Row['testCenterId']>().toEqualTypeOf<string>()
    expectTypeOf<Row['examNameRaw']>().toEqualTypeOf<string>()

    const multiValueFields: Pick<Row, 'tags' | 'productIds' | 'scores'> = {
      tags: ['tag'],
      productIds: ['prod_1'],
      scores: {
        general: 82,
        history: [73, 91],
      },
    }
    const sparseMultiValueFields: Pick<Row, 'tags' | 'productIds' | 'scores'> = {
      tags: undefined,
      productIds: undefined,
      scores: undefined,
    }

    void multiValueFields
    void sparseMultiValueFields
  })

  it('adds reference outputs when references are provided', () => {
    expectTypeOf<Row['productId']>().toEqualTypeOf<'prod_1' | 'prod_2' | undefined>()
  })

  it('infers in-place resolve outputs from text and number options', () => {
    expectTypeOf<ResolveRow['productId']>().toEqualTypeOf<'prod_1' | 'prod_2' | undefined>()
    expectTypeOf<ResolveRow['centerId']>().toEqualTypeOf<1201 | 1202 | undefined>()
    expectTypeOf<ResolveRow['productIds']>().toMatchTypeOf<readonly unknown[] | undefined>()
  })

  it('infers buildRow payloads from the schema', () => {
    expectTypeOf<Awaited<ReturnType<NonNullable<typeof schema.buildRow>>>>().toEqualTypeOf<{
      examName: string
    }>()
  })

  it('keeps buildRow and refine working after introducing column resolve', () => {
    expectTypeOf<Awaited<ReturnType<NonNullable<typeof resolveSchema.buildRow>>>>().toEqualTypeOf<{
      resolvedProductId: 'prod_1' | 'prod_2' | undefined
      reviewStatus: string | undefined
    }>()
  })
})
