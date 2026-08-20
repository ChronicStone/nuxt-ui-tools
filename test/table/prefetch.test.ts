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
      tableKey: 'users',
      rowKey: 'id',
      context: [
        {
          key: 'account',
          query: () => ({
            queryKey: ['account'],
            queryFn: async () => ({ id: 'account-1' }),
          }),
        },
      ],
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
      source: {
        mode: 'remote',
        facets: (request) => ({
          queryKey: ['user-facets', request],
          queryFn: async () => {
            facetQueryCalls++
            return { facets: [] }
          },
        }),
        query: (request) => ({
          queryKey: ['users', request],
          queryFn: async () => {
            sourceRequest = request
            return { rows: [{ id: 'user-1', name: 'Ada', status: 'active' }], rowCount: 1 }
          },
        }),
      },
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
      table: {
        defaultSorting: { key: 'name', dir: 'asc' },
        columns: (column) => [column.field('name', { label: 'Name' })],
      },
    })
    const queryClient = new QueryClient()
    const plan = prefetchTable({
      route: {
        query: {
          'p.page': '2',
          'p.size': '25',
          's.key': 'name',
          's.dir': 'desc',
          'f.search': 'ada',
          'f.ui.status': 'active',
        },
      },
      schema,
    })

    await executeQueryPrefetchPlan(plan, { queryClient })

    expect(sourceRequest?.context).toEqual({ account: { id: 'account-1' } })
    expect(sourceRequest?.pagination).toEqual({
      mode: 'offset',
      pageIndex: 2,
      pageSize: 25,
      count: 'exact',
    })
    expect(sourceRequest?.sorting).toEqual([{ key: 'name', dir: 'desc' }])
    expect(sourceRequest?.search).toEqual({ value: 'ada', fields: ['name'] })
    expect(sourceRequest?.filters).toEqual({
      type: 'group',
      combinator: 'and',
      children: [{ type: 'condition', key: 'status', operator: 'isAnyOf', value: ['active'] }],
    })
    expect(optionQueryCalls).toBe(1)
    expect(facetQueryCalls).toBe(1)
    expect(pageContextRows).toBe(1)
    expect(pageContextAccount).toEqual({ id: 'account-1' })
  })
})
