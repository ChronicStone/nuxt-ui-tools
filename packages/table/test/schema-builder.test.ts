import { readFileSync } from 'node:fs'

import { describe, expect, expectTypeOf, it } from 'vitest'

import { defineTable } from '../src/schema'
import type {
  ExtractTableContextData,
  ExtractTablePageContextData,
} from '../src/types'

const schema = defineTable({
  tableKey: 'users',
  rowKey: 'id',
  source: {
    mode: 'remote',
    loader: async () => ({
      rows: [
        {
          id: 1,
          name: 'Ada',
          status: 'active' as const,
          createdAt: new Date().toISOString(),
          archived: false,
        },
      ],
      rowCount: 1,
    }),
  },
  context: [
    {
      key: 'organisationId',
      loader: async () => 'org_123' as string,
    },
  ],
  pageContext: [
    {
      key: 'rowCountLabel',
      loader: async ({ rows, context }) => `${rows[0]!.id}-${context.organisationId}-${rows.length}`,
    },
  ],
  filters: {
    ui: (filter) => [
      filter.option('status', {
        label: 'Status',
        options: {
          loader: async () => [
            { label: 'Active', value: 'active' as const },
            { label: 'Inactive', value: 'inactive' as const },
          ],
        },
      }),
    ],
  },
  table: {
    columns: (column) => [
      column.field('name', {
        label: 'Name',
        render: ({ value, context, pageContext }) =>
          `${value}-${context.organisationId}-${pageContext.rowCountLabel}`,
      }),
    ],
  },
})

type ContextData = ExtractTableContextData<typeof schema>
type PageContextData = ExtractTablePageContextData<typeof schema>
type NameColumn = Extract<
  NonNullable<NonNullable<typeof schema.table>['columns']>[number],
  { key: 'name' }
>
type NameColumnRenderParams = Parameters<NonNullable<NameColumn['render']>>[0]

describe('defineTable', () => {
  it('resolves builder collections into plain schema arrays', () => {
    expect(schema.table?.columns).toHaveLength(1)
    expect(schema.filters?.ui).toHaveLength(1)
    expect(schema.source.mode).toBe('remote')
  })

  it('preserves promise-based inference for context and pageContext', () => {
    expectTypeOf<ContextData>().toEqualTypeOf<{ organisationId: string }>()
    expectTypeOf<PageContextData>().toEqualTypeOf<{ rowCountLabel: string }>()
    expectTypeOf<NameColumnRenderParams['context']>().toEqualTypeOf<{ organisationId: string }>()
    expectTypeOf<NameColumnRenderParams['pageContext']>().toEqualTypeOf<{ rowCountLabel: string }>()
    expectTypeOf<NameColumnRenderParams['value']>().toEqualTypeOf<string>()
  })

  it('keeps TanStack Query out of the base package manifest', () => {
    const packageJson = JSON.parse(
      readFileSync(new URL('../package.json', import.meta.url), 'utf8'),
    ) as { dependencies?: Record<string, string>, peerDependencies?: Record<string, string> }

    expect(packageJson.dependencies?.['@tanstack/vue-query']).toBeUndefined()
    expect(packageJson.peerDependencies?.['@tanstack/vue-query']).toBeUndefined()
  })
})
