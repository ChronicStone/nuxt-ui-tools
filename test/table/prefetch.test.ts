import { QueryClient } from '@tanstack/vue-query'
import { describe, expect, it } from 'vitest'

import { executeQueryPrefetchPlan } from '#ui-tools/query-prefetch/utils/plan'
import { defineTableSchema } from '#ui-tools/table/schema'
import type { TableSourceRequestContext } from '#ui-tools/table/types'
import { prefetchTable } from '#ui-tools/table/utils/prefetch'

describe('table query prefetch', () => {
  it('prefetches context, route-derived source state, facets, options, and page context in order', async () => {
    let sourceRequest: TableSourceRequestContext | undefined
    let pageContextRows = 0
    let pageContextAccount: unknown
    let optionQueryCalls = 0
    let facetQueryCalls = 0

    const schema = defineTableSchema({
      context: [
        {
          key: 'account',
          query: () => ({
            queryKey: ['account'],
            queryFn: async () => ({ id: 'account-1' }),
          }),
        },
      ],
      filters: {
        search: { fields: ['name'] },
        ui: (filter) => [
          filter.option('status', {
            label: 'Status',
            source: {
              facet: true,
              query: () => ({
                queryKey: ['status-options'],
                queryFn: async () => {
                  optionQueryCalls++
                  return [{ label: 'Active', value: 'active' }]
                },
              }),
            },
          }),
        ],
      },
      pageContext: [
        {
          key: 'summary',
          query: ({ rows, context }) => ({
            queryKey: ['summary', rows.length, context.account],
            queryFn: async () => {
              pageContextRows = rows.length
              pageContextAccount = context.account
              return { visible: rows.length }
            },
          }),
        },
      ],
      pagination: { defaultSize: 10 },
      rowKey: 'id',
      source: {
        facets: (request) => ({
          queryKey: ['user-facets', request],
          queryFn: async () => {
            facetQueryCalls++
            return { facets: [] }
          },
        }),
        mode: 'remote',
        query: (request) => ({
          queryKey: ['users', request],
          queryFn: async () => {
            sourceRequest = request
            return { rows: [{ id: 'user-1', name: 'Ada', status: 'active' }], rowCount: 1 }
          },
        }),
      },
      table: {
        columns: (column) => [column.field('name', { label: 'Name' })],
        defaultSorting: { dir: 'asc', key: 'name' },
      },
      tableKey: 'users',
    })
    const queryClient = new QueryClient()
    const plan = prefetchTable({
      route: {
        query: {
          'f.search': 'ada',
          'f.ui.status': 'active',
          'p.page': '2',
          'p.size': '25',
          's.dir': 'desc',
          's.key': 'name',
        },
      },
      schema,
    })

    await executeQueryPrefetchPlan(plan, { queryClient })

    expect(sourceRequest?.context).toStrictEqual({ account: { id: 'account-1' } })
    expect(sourceRequest?.pagination).toStrictEqual({
      count: 'exact',
      mode: 'offset',
      pageIndex: 2,
      pageSize: 25,
    })
    expect(sourceRequest?.sorting).toStrictEqual([{ dir: 'desc', key: 'name' }])
    expect(sourceRequest?.search).toStrictEqual({ fields: ['name'], value: 'ada' })
    expect(sourceRequest?.filters).toStrictEqual({
      children: [{ type: 'condition', key: 'status', operator: 'isAnyOf', value: ['active'] }],
      combinator: 'and',
      type: 'group',
    })
    expect(optionQueryCalls).toBe(1)
    expect(facetQueryCalls).toBe(1)
    expect(pageContextRows).toBe(1)
    expect(pageContextAccount).toStrictEqual({ id: 'account-1' })
  })
})
