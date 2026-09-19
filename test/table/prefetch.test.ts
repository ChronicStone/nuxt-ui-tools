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
            queryFn: () => ({ id: 'account-1' }),
            queryKey: ['account'],
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
                queryFn: () => {
                  optionQueryCalls += 1
                  return [{ label: 'Active', value: 'active' }]
                },
                queryKey: ['status-options'],
              }),
            },
          }),
        ],
      },
      pageContext: [
        {
          key: 'summary',
          query: ({ rows, context }) => ({
            queryFn: () => {
              pageContextRows = rows.length
              pageContextAccount = context.account
              return { visible: rows.length }
            },
            queryKey: ['summary', rows.length, context.account],
          }),
        },
      ],
      pagination: { defaultSize: 10 },
      rowKey: 'id',
      source: {
        facets: (request) => ({
          queryFn: () => {
            facetQueryCalls += 1
            return { facets: [] }
          },
          queryKey: ['user-facets', request],
        }),
        mode: 'remote',
        query: (request) => ({
          queryFn: () => {
            sourceRequest = request
            return { rowCount: 1, rows: [{ id: 'user-1', name: 'Ada', status: 'active' }] }
          },
          queryKey: ['users', request],
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

    expect([
      sourceRequest?.context,
      sourceRequest?.pagination,
      sourceRequest?.sorting,
      sourceRequest?.search,
      sourceRequest?.filters,
      optionQueryCalls,
      facetQueryCalls,
      pageContextRows,
      pageContextAccount,
    ]).toEqual([
      { account: { id: 'account-1' } },
      {
        count: 'exact',
        mode: 'offset',
        pageIndex: 2,
        pageSize: 25,
      },
      [{ dir: 'desc', key: 'name' }],
      { fields: ['name'], value: 'ada' },
      {
        children: [{ key: 'status', operator: 'isAnyOf', type: 'condition', value: ['active'] }],
        combinator: 'and',
        type: 'group',
      },
      1,
      1,
      1,
      { id: 'account-1' },
    ])
  })
})
