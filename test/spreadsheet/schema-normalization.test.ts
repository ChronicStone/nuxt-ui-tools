import { describe, expect, expectTypeOf, it } from 'vitest'

import { createSpreadsheetDynamicBuilder } from '#ui-tools/spreadsheet'
import { defineSpreadsheetSchema, normalizeSpreadsheetSchema } from '#ui-tools/spreadsheet/schema'
import type {
  ExtractSpreadsheetContextData,
  SpreadsheetColumnsDefinition,
  SpreadsheetContextItem,
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
  static: (column) => [
    column.text('examNameRaw', {
      required: true as const,
    }),
    column.number('scores.general'),
  ],
  dynamic: ({ dynamic, context }) => [
    dynamic.optionGroups({
      key: 'affiliations',
      source: context.affiliationGroups,
      itemKey: (group) => group.id,
      itemLabel: (group) => group.name,
      header: {
        strategy: 'template',
        template: ({ source }) => `${source.name}: PRÉREQUIS CECR`,
      },
      options: {
        resolve: (group) => group.items,
        optionValue: (item) => item.id,
        optionLabel: (item) => item.name,
      },
      values: {
        mode: 'csv',
        resolve: 'label',
      },
      output: {
        into: 'affiliations',
      },
    }),
  ],
} satisfies SpreadsheetColumnsDefinition<ContextData>

const references = [
  {
    key: 'product',
    sourceField: 'examNameRaw',
    target: {
      options: [{ id: 'prod_1', name: 'Business English 4 Skills' }],
      optionValue: (product) => product.id,
      optionLabel: (product) => product.name,
    },
    output: {
      field: 'productId',
    },
  },
] satisfies readonly SpreadsheetReferenceDefinition<
  ContextData,
  {
    examNameRaw: string
    scores?: {
      general?: number
    }
    affiliations?: Record<string, string[]>
  },
  'productId',
  string,
  DemoProduct
>[]

const pipeline = {
  submit: ({ row }) => ({
    examNameRaw: row.examNameRaw,
    productId: row.productId ?? null,
  }),
} satisfies SpreadsheetPipelineDefinition<
  ContextData,
  {
    examNameRaw: string
    productId?: string
    scores?: {
      general?: number
    }
    affiliations?: Record<string, string[]>
  }
>

const schema = defineSpreadsheetSchema({
  importKey: 'assessment.results',
  context,
  columns,
  references,
  pipeline,
})

const normalized = normalizeSpreadsheetSchema(schema)

describe('normalizeSpreadsheetSchema', () => {
  it('resolves static columns into a runtime-ready array', () => {
    expect(normalized.columns.static).toHaveLength(2)
    expect(normalized.columns.static[0]).toMatchObject({
      kind: 'text',
      key: 'examNameRaw',
      required: true,
    })
    expect(normalized.columns.static[1]).toMatchObject({
      kind: 'number',
      key: 'scores.general',
    })
  })

  it('exposes a typed dynamic resolver', () => {
    const dynamicColumns = normalized.columns.dynamic({
      context: {
        affiliationGroups: [
          {
            id: 'school-level',
            name: 'School level',
            items: [
              { id: 'primary', name: 'Primary' },
            ],
          },
        ],
        products: [{ id: 'prod_1', name: 'Business English 4 Skills' }],
      },
      dynamic: createSpreadsheetDynamicBuilder(),
    })

    expect(dynamicColumns).toHaveLength(1)
    expect(dynamicColumns[0]).toMatchObject({
      kind: 'option-groups',
      key: 'affiliations',
      output: {
        into: 'affiliations',
      },
    })
  })

  it('preserves references and pipeline while normalizing top-level collections', () => {
    expect(normalized.context).toHaveLength(2)
    expect(normalized.references).toHaveLength(1)
    expect(typeof normalized.pipeline?.submit).toBe('function')
  })

  it('keeps normalized schema types inferred', () => {
    expectTypeOf(normalized.columns.dynamic).toBeFunction()
    expectTypeOf(normalized.references[0]).toMatchTypeOf<{
      output: {
        field: 'productId'
      }
    }>()
  })
})
