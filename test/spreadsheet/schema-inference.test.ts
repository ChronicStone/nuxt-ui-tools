import { describe, expectTypeOf, it } from 'vitest'

import { defineSpreadsheetSchema } from '#ui-tools/spreadsheet/schema'
import type {
  ExtractSpreadsheetContextData,
  ExtractSpreadsheetRow,
  ExtractSpreadsheetSubmitPayload,
  SpreadsheetData,
  SpreadsheetColumnDefinition,
  SpreadsheetColumnsDefinition,
  SpreadsheetContextItem,
  SpreadsheetDynamicOptionGroupsDefinition,
  SpreadsheetPipelineDefinition,
  SpreadsheetQueryDefinition,
  SpreadsheetReferenceDefinition,
} from '#ui-tools/spreadsheet/types'

interface DemoAffiliationItem {
  id: string
  name: string
}

interface DemoAffiliationGroup {
  id: string
  name: string
  slug: string
  items: DemoAffiliationItem[]
}

interface DemoProduct {
  id: string
  name: string
}

const context = [
  {
    key: 'affiliationGroups',
    query: () =>
      ({
        queryKey: ['affiliation-groups', 'tc_123'],
        queryFn: async () =>
          [
            {
              id: 'school-level',
              name: 'School level',
              slug: 'schoolLevel',
              items: [
                { id: 'primary', name: 'Primary' },
                { id: 'secondary', name: 'Secondary' },
              ],
            },
          ] satisfies readonly DemoAffiliationGroup[],
      }) satisfies SpreadsheetQueryDefinition<readonly DemoAffiliationGroup[]>,
  },
  {
    key: 'products',
    query: () =>
      ({
        queryKey: ['products', 'tc_123'],
        queryFn: async () =>
          [
            { id: 'prod_1', name: 'Business English 4 Skills' },
          ] satisfies readonly DemoProduct[],
      }) satisfies SpreadsheetQueryDefinition<readonly DemoProduct[]>,
  },
] satisfies readonly [
  SpreadsheetContextItem<'affiliationGroups', readonly DemoAffiliationGroup[]>,
  SpreadsheetContextItem<'products', readonly DemoProduct[]>,
]

type ContextData = ExtractSpreadsheetContextData<{
  context: typeof context
}>

const columns = {
  static: [
    createColumn<'testCenterId', string, true>({
      kind: 'text',
      key: 'testCenterId',
      required: true as const,
    }),
    createColumn<'examNameRaw', string, true>({
      kind: 'text',
      key: 'examNameRaw',
      required: true as const,
    }),
    createColumn<'scores.general', number>({
      kind: 'number',
      key: 'scores.general',
    }),
  ],
  dynamic: () => [
    createDynamic<'affiliations', 'affiliations', string>({
      kind: 'option-groups',
      key: 'affiliations',
      output: {
        into: 'affiliations',
      },
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
      query: ({ context, row, search }) => {
        expectTypeOf(context.products).toMatchTypeOf<readonly DemoProduct[]>()
        expectTypeOf(row.testCenterId).toEqualTypeOf<string>()
        expectTypeOf(row.affiliations).toEqualTypeOf<Record<string, string[]> | undefined>()
        expectTypeOf(search).toEqualTypeOf<string>()

        return {
          queryKey: ['products-search', search],
          queryFn: async () => context.products,
        }
      },
      optionValue: (product) => product.id,
      optionLabel: (product) => product.name,
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
  DemoProduct
>[]

type Row = ExtractSpreadsheetRow<{
  columns: typeof columns
  references: typeof references
}>

const pipeline = {
  submit: ({ row, context }) => {
    expectTypeOf(row.testCenterId).toEqualTypeOf<string>()
    expectTypeOf(row.examNameRaw).toEqualTypeOf<string>()
    expectTypeOf(row.productId).toEqualTypeOf<string | undefined>()
    expectTypeOf(row.affiliations).toEqualTypeOf<Record<string, string[]> | undefined>()
    expectTypeOf(row.scores).toEqualTypeOf<{ general?: number } | undefined>()
    expectTypeOf(context.affiliationGroups).toMatchTypeOf<readonly DemoAffiliationGroup[]>()

    return {
      testCenterId: row.testCenterId,
      productId: row.productId ?? null,
      affiliations: row.affiliations ?? {},
    }
  },
} satisfies SpreadsheetPipelineDefinition<ContextData, Row>

const schema = defineSpreadsheetSchema({
  importKey: 'assessment.results',
  context,
  columns,
  references,
  pipeline,
})

type SchemaContextData = ExtractSpreadsheetContextData<typeof schema>
type Output = SpreadsheetData<typeof schema>
type SubmitPayload = ExtractSpreadsheetSubmitPayload<typeof schema>

describe('defineSpreadsheetSchema inference', () => {
  it('infers context data from query definitions', () => {
    expectTypeOf<SchemaContextData['affiliationGroups'][number]['slug']>().toEqualTypeOf<string>()
    expectTypeOf<SchemaContextData['products'][number]['id']>().toEqualTypeOf<string>()
  })

  it('infers nested static row fields from dot-path keys', () => {
    expectTypeOf<Row['testCenterId']>().toEqualTypeOf<string>()
    expectTypeOf<Row['examNameRaw']>().toEqualTypeOf<string>()
    expectTypeOf<Row['scores']>().toEqualTypeOf<{ general?: number } | undefined>()
    expectTypeOf<Output['scores']>().toEqualTypeOf<{ general?: number } | undefined>()
  })

  it('adds dynamic option-group output to the normalized row shape', () => {
    expectTypeOf<Row['affiliations']>().toEqualTypeOf<Record<string, string[]> | undefined>()
  })

  it('adds reference outputs to the normalized row shape', () => {
    expectTypeOf<Row['productId']>().toEqualTypeOf<string | undefined>()
  })

  it('uses pipeline.submit as the submit payload type', () => {
    expectTypeOf<SubmitPayload['testCenterId']>().toEqualTypeOf<string>()
    expectTypeOf<SubmitPayload['productId']>().toEqualTypeOf<string | null>()
    expectTypeOf<SubmitPayload['affiliations']>().toEqualTypeOf<Record<string, string[]>>()
  })
})

function createColumn<TKey extends string, TValue, TRequired extends boolean = false>(
  definition: SpreadsheetColumnDefinition<TKey, TValue, TRequired>,
) {
  return definition
}

function createDynamic<TKey extends string, TInto extends string, TValue>(
  definition: SpreadsheetDynamicOptionGroupsDefinition<TKey, TInto, TValue>,
) {
  return definition
}
