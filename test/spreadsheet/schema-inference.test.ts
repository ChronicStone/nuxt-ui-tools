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

const context = [
  {
    key: 'affiliationGroups',
    query: () =>
      ({
        queryKey: ['affiliation-groups', 'tc_123'],
        queryFn: async () => affiliationGroups,
      }) satisfies SpreadsheetQueryDefinition<readonly DemoAffiliationGroup[]>,
  },
] satisfies readonly [
  SpreadsheetContextItem<'affiliationGroups', readonly DemoAffiliationGroup[]>,
]

const schema = defineSpreadsheetSchema({
  importKey: 'assessment.results',
  context,
  file: {
    accept: ['.xlsx'],
    maxRecords: 100,
  },
  columns: {
    static: (column) => [
      column.text('testCenterId', {
        required: true,
        match: {
          headers: ['Test center ID'],
        },
      }),
      column.text('examNameRaw', {
        required: true,
        match: {
          headers: ['Exam name'],
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
        options: {
          resolve: group => group.items,
          optionLabel: item => item.name,
          optionValue: item => item.id,
        },
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

type SchemaContextData = ExtractSpreadsheetContextData<typeof schema>
type Row = ExtractSpreadsheetRow<typeof schema>

describe('defineSpreadsheetSchema inference', () => {
  it('infers context data from query definitions', () => {
    expectTypeOf<SchemaContextData['affiliationGroups'][number]['slug']>().toEqualTypeOf<string>()
  })

  it('infers nested static row fields from dot-path keys', () => {
    expectTypeOf<Row['testCenterId']>().toEqualTypeOf<string>()
    expectTypeOf<Row['examNameRaw']>().toEqualTypeOf<string>()
    expectTypeOf<Row['scores']>().toEqualTypeOf<{ general?: number } | undefined>()
  })

  it('adds reference outputs when references are provided', () => {
    expectTypeOf<Row['productId']>().toEqualTypeOf<'prod_1' | 'prod_2' | undefined>()
  })

  it('infers buildRow payloads from the schema', () => {
    expectTypeOf<Awaited<ReturnType<NonNullable<typeof schema.buildRow>>>>().toEqualTypeOf<{
      examName: string
    }>()
  })
})
