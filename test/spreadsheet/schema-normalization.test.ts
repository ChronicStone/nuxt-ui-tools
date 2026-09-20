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
        queryFn: () =>
          [
            {
              id: 'school-level',
              items: [
                { id: 'primary', name: 'Primary' },
                { id: 'secondary', name: 'Secondary' },
              ],
              name: 'School level',
              slug: 'schoolLevel',
            },
          ] satisfies readonly DemoAffiliationGroup[],
        queryKey: ['affiliation-groups', 'tc_123'],
      }) satisfies SpreadsheetQueryDefinition<readonly DemoAffiliationGroup[]>,
  },
] satisfies readonly [SpreadsheetContextItem<'affiliationGroups', readonly DemoAffiliationGroup[]>]

type ContextData = ExtractSpreadsheetContextData<{ context: typeof context }>

const columns = {
  dynamic: ({ dynamic }) => [
    dynamic.optionGroups({
      header: {
        strategy: 'template',
        template: ({ source }) => `${source.name}: PRÉREQUIS CECR`,
      },
      itemKey: (group) => group.id,
      itemLabel: (group) => group.name,
      key: 'affiliations',
      options: (group) =>
        group.items.map((item) => ({
          label: item.name,
          value: item.id,
        })),
      output: {
        into: 'affiliations',
      },
      source: [
        {
          id: 'school-level',
          items: [
            { id: 'primary', name: 'Primary' },
            { id: 'secondary', name: 'Secondary' },
          ],
          name: 'School level',
          slug: 'schoolLevel',
        },
      ] satisfies readonly DemoAffiliationGroup[],
      targetKey: (group) => group.slug,
      values: {
        mode: 'csv',
        resolve: 'label',
        separator: ',',
      },
    }),
  ],
  static: (column) => [
    column.text('examNameRaw', {
      match: {
        headers: ['Exam name'],
      },
      required: true,
    }),
    column.number('scores.general'),
  ],
} satisfies SpreadsheetColumnsDefinition<ContextData>

const schema = defineSpreadsheetSchema({
  columns,
  context,
  importKey: 'assessment.results',
})

const normalized = normalizeSpreadsheetSchema(schema)

describe(normalizeSpreadsheetSchema, () => {
  it('resolves static columns into a runtime-ready array', () => {
    expect(normalized.columns.static).toHaveLength(2)
    expect(normalized.columns.static[0]).toMatchObject({
      key: 'examNameRaw',
      kind: 'text',
      required: true,
    })
    expect(normalized.columns.static[1]).toMatchObject({
      key: 'scores.general',
      kind: 'number',
    })
  })

  it('exposes a typed dynamic resolver', () => {
    const dynamicColumns = normalized.columns.dynamic({
      context: {
        affiliationGroups: [
          {
            id: 'school-level',
            items: [{ id: 'primary', name: 'Primary' }],
            name: 'School level',
            slug: 'schoolLevel',
          },
        ],
      },
      dynamic: createSpreadsheetDynamicBuilder({
        affiliationGroups: [
          {
            id: 'school-level',
            items: [{ id: 'primary', name: 'Primary' }],
            name: 'School level',
            slug: 'schoolLevel',
          },
        ],
      }),
    })

    expect(dynamicColumns).toHaveLength(1)
    expect(dynamicColumns[0]).toMatchObject({
      key: 'affiliations',
      kind: 'option-groups',
    })
  })

  it('keeps normalized schema types inferred', () => {
    expectTypeOf(normalized.columns.dynamic).toBeFunction()
    expect(normalized.context).toHaveLength(1)
    expect(normalized.references).toHaveLength(0)
    expect(normalized.buildRow).toBeUndefined()
  })
})
