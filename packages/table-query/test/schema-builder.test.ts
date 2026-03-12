import { readFileSync } from 'node:fs'

import { describe, expect, expectTypeOf, it } from 'vitest'

import { defineQueryTable } from '../src/schema'
import type {
  ExtractTableContextData,
  ExtractTablePageContextData,
} from '../src/types'

const schema = defineQueryTable({
  tableKey: 'users',
  rowKey: 'id',
  source: {
    mode: 'remote',
    query: () => ({
      queryKey: ['users'],
      queryFn: async () => ({
        rows: [
          {
            id: 1,
            name: 'Ada',
            status: 'active' as const,
          },
        ],
        rowCount: 1,
      }),
    }),
  },
  context: [
    {
      key: 'organisationId',
      query: () => ({
        queryKey: ['organisation'],
        queryFn: async () => 'org_123' as string,
      }),
    },
  ],
  pageContext: [
    {
      key: 'rowCountLabel',
      query: ({ rows, context }) => ({
        queryKey: ['summary', rows.length, context.organisationId],
        queryFn: async () => `${rows[0]!.id}-${context.organisationId}-${rows.length}`,
      }),
    },
  ],
  filters: {
    ui: (filter) => [
      filter.option('status', {
        label: 'Status',
        options: {
          query: () => ({
            queryKey: ['statuses'],
            queryFn: async () => [
              { label: 'Active', value: 'active' as string },
              { label: 'Inactive', value: 'inactive' as string },
            ],
          }),
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

describe('defineQueryTable', () => {
  it('resolves builder collections into plain schema arrays', () => {
    expect(schema.table?.columns).toHaveLength(1)
    expect(schema.filters?.ui).toHaveLength(1)
    expect(schema.source.mode).toBe('remote')
  })

  it('preserves query-option-based inference for context and pageContext', () => {
    expectTypeOf<ContextData['organisationId']>().toEqualTypeOf<string>()
    expectTypeOf<PageContextData['rowCountLabel']>().toEqualTypeOf<string>()
    expectTypeOf<NameColumnRenderParams['context']['organisationId']>().toEqualTypeOf<string>()
    expectTypeOf<NameColumnRenderParams['pageContext']['rowCountLabel']>().toEqualTypeOf<string>()
    expectTypeOf<NameColumnRenderParams['value']>().toEqualTypeOf<string>()
  })

  it('declares TanStack Query on the query package boundary', () => {
    const packageJson = JSON.parse(
      readFileSync(new URL('../package.json', import.meta.url), 'utf8'),
    ) as { peerDependencies?: Record<string, string> }

    expect(packageJson.peerDependencies?.['@tanstack/vue-query']).toBeDefined()
  })
})
