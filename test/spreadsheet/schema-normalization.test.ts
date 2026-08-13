import { describe, expect, expectTypeOf, it } from 'vitest'

import { createSpreadsheetDynamicBuilder } from '#ui-tools/spreadsheet'
import { defineSpreadsheetSchema, normalizeSpreadsheetSchema } from '#ui-tools/spreadsheet/schema'
import type {
  ExtractSpreadsheetContextData,
  SpreadsheetColumnsDefinition,
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
] satisfies readonly [SpreadsheetContextItem<'affiliationGroups', readonly DemoAffiliationGroup[]>]

type ContextData = ExtractSpreadsheetContextData<{ context: typeof context }>

const columns = {
  static: (column) => [
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
      source: [
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
      itemKey: (group) => group.id,
      itemLabel: (group) => group.name,
      targetKey: (group) => group.slug,
      header: {
        strategy: 'template',
        template: ({ source }) => `${source.name}: PRÉREQUIS CECR`,
      },
      options: (group) =>
        group.items.map((item) => ({
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
} satisfies SpreadsheetColumnsDefinition<ContextData>

const schema = defineSpreadsheetSchema({
  importKey: 'assessment.results',
  context,
  columns,
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
            slug: 'schoolLevel',
            items: [{ id: 'primary', name: 'Primary' }],
          },
        ],
      },
      dynamic: createSpreadsheetDynamicBuilder({
        affiliationGroups: [
          {
            id: 'school-level',
            name: 'School level',
            slug: 'schoolLevel',
            items: [{ id: 'primary', name: 'Primary' }],
          },
        ],
      }),
    })

    expect(dynamicColumns).toHaveLength(1)
    expect(dynamicColumns[0]).toMatchObject({
      kind: 'option-groups',
      key: 'affiliations',
    })
  })

  it('keeps normalized schema types inferred', () => {
    expectTypeOf(normalized.columns.dynamic).toBeFunction()
    expect(normalized.context).toHaveLength(1)
    expect(normalized.references).toHaveLength(0)
    expect(normalized.buildRow).toBeUndefined()
  })
})
