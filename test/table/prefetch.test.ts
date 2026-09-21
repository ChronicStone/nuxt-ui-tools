import { QueryClient } from '@tanstack/vue-query'
import { describe, expect, it } from 'vitest'

import { executeQueryPrefetchPlan } from '#ui-tools/query-prefetch/utils/plan'
import { defineTableSchema, tableSource } from '#ui-tools/table'
import type { TableRemoteSourceRequest } from '#ui-tools/table/types'
import { createTableCursorQueryKey, prefetchTable } from '#ui-tools/table/utils'

describe('table query prefetch', () => {
  it('prefetches context, route-derived source state, facets, options, and page context in order', async () => {
    let sourceRequest: TableRemoteSourceRequest | undefined
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
      source: tableSource({
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
      }),
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
      sourceRequest?.pagination,
      sourceRequest?.sorting,
      sourceRequest?.search,
      sourceRequest?.filters,
      optionQueryCalls,
      facetQueryCalls,
      pageContextRows,
      pageContextAccount,
    ]).toStrictEqual([
      {
        count: 'exact',
        mode: 'offset',
        pageIndex: 2,
        pageSize: 25,
      },
      [{ dir: 'desc', key: 'name' }],
      { fields: ['name'], value: 'ada' },
      [
        {
          children: [{ key: 'status', operator: 'isAnyOf', type: 'condition', value: ['active'] }],
          combinator: 'and',
          type: 'group',
        },
      ],
      1,
      1,
      1,
      { id: 'account-1' },
    ])
  })

  it('prefetches the options of URL-restored remote filter values, never their pages', async () => {
    let pageCalls = 0
    const resolved: (readonly (string | number | boolean)[])[] = []
    const tasks: { id: string; ownerId: string }[] = []
    const schema = defineTableSchema({
      filters: {
        ui: (filter) => [
          filter.option('ownerId', {
            label: 'Owner',
            source: {
              remote: {
                load: ({ page, search }) => ({
                  queryFn: () => {
                    pageCalls += 1
                    return { hasMore: false, options: [] }
                  },
                  queryKey: ['owners', search, page.index],
                }),
                resolveSelected: ({ values }) => ({
                  queryFn: () => {
                    resolved.push(values)
                    return values.map((value) => ({ label: `Owner ${value}`, value }))
                  },
                  queryKey: ['owners', 'selected', values],
                }),
              },
            },
          }),
        ],
      },
      rowKey: 'id',
      source: tableSource({
        mode: 'remote',
        query: (request) => ({
          queryFn: () => ({ rowCount: 0, rows: tasks }),
          queryKey: ['tasks', request],
        }),
      }),
      table: { columns: (column) => [column.field('ownerId', { label: 'Owner' })] },
      tableKey: 'tasks',
    })
    const queryClient = new QueryClient()

    await executeQueryPrefetchPlan(
      prefetchTable({ route: { query: { 'f.ui.ownerId': 'u2,u5' } }, schema }),
      { queryClient },
    )

    // The runtime resolves the same values under the same key, so its first render reuses this.
    expect([resolved, pageCalls]).toStrictEqual([[['u2', 'u5']], 0])
    expect(queryClient.getQueryData(['owners', 'selected', ['u2', 'u5']])).toStrictEqual([
      { label: 'Owner u2', value: 'u2' },
      { label: 'Owner u5', value: 'u5' },
    ])
  })

  it('prefetches cursor sources into the runtime infinite-query cache shape', async () => {
    let pageContextRows = 0
    const schema = defineTableSchema({
      pageContext: [
        {
          key: 'summary',
          query: ({ rows }) => ({
            queryFn: () => {
              pageContextRows = rows.length
              return rows.length
            },
            queryKey: ['cursor-summary', rows.length],
          }),
        },
      ],
      pagination: { count: 'exact', mode: 'cursor', pageSize: 20 },
      rowKey: 'id',
      source: tableSource({
        mode: 'remote',
        query: (request) => ({
          queryFn: () => ({
            pageInfo: {
              count: 'exact',
              mode: 'cursor',
              nextCursor: 'page-2',
              pageSize: 20,
              rowCount: 2,
            },
            rows: [
              { id: 'audit-1', request },
              { id: 'audit-2', request },
            ],
          }),
          queryKey: ['audit', request],
        }),
      }),
      table: { columns: (column) => [column.field('id')] },
      tableKey: 'audit',
    })
    const queryClient = new QueryClient()
    const plan = prefetchTable({ route: { query: {} }, schema })

    await executeQueryPrefetchPlan(plan, { queryClient })

    const request = {
      facets: undefined,
      filters: [],
      pagination: { count: 'exact', cursor: null, mode: 'cursor', pageSize: 20 },
      search: { fields: [], value: '' },
      sorting: [],
    }
    expect(
      queryClient.getQueryData(createTableCursorQueryKey(['audit', request], 0)),
    ).toMatchObject({
      pageParams: [null],
      pages: [{ rows: [{ id: 'audit-1' }, { id: 'audit-2' }] }],
    })
    expect(pageContextRows).toBe(2)
  })
})
