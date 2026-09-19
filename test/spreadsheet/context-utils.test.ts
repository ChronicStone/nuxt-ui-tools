import { describe, expect, expectTypeOf, it, vi } from 'vitest'

import {
  createSpreadsheetContextData,
  createSpreadsheetContextQueries,
  createSpreadsheetContextStatus,
} from '#ui-tools/spreadsheet'
import type { SpreadsheetContextItem } from '#ui-tools/spreadsheet/types'

const contextItems = [
  {
    key: 'affiliationGroups',
    query: () => ({
      queryFn: async () => [{ id: 'group_1', name: 'School level' }],
      queryKey: ['affiliation-groups', 'tc_123'],
    }),
  },
  {
    key: 'products',
    query: () => ({
      queryFn: async () => [{ id: 'prod_1', name: 'Business English 4 Skills' }],
      queryKey: ['products', 'tc_123'],
    }),
  },
] satisfies readonly [
  SpreadsheetContextItem<'affiliationGroups', readonly { id: string; name: string }[]>,
  SpreadsheetContextItem<'products', readonly { id: string; name: string }[]>,
]

describe('spreadsheet context utils', () => {
  it('creates query definitions from context items', () => {
    const queries = createSpreadsheetContextQueries(contextItems)

    expect(queries).toHaveLength(2)
    expect(queries[0]?.queryKey).toStrictEqual(['affiliation-groups', 'tc_123'])
    expect(queries[1]?.queryKey).toStrictEqual(['products', 'tc_123'])
  })

  it('creates typed partial context data from query results', () => {
    const data = createSpreadsheetContextData(contextItems, [
      {
        data: [{ id: 'group_1', name: 'School level' }],
      },
      {
        data: [{ id: 'prod_1', name: 'Business English 4 Skills' }],
      },
    ])

    expect(data).toStrictEqual({
      affiliationGroups: [{ id: 'group_1', name: 'School level' }],
      products: [{ id: 'prod_1', name: 'Business English 4 Skills' }],
    })

    expectTypeOf(data.affiliationGroups?.[0]?.id).toEqualTypeOf<string | undefined>()
    expectTypeOf(data.products?.[0]?.name).toEqualTypeOf<string | undefined>()
  })

  it('derives aggregate query status flags', () => {
    const status = createSpreadsheetContextStatus([
      {
        isFetching: false,
        isPending: false,
        isRefetching: false,
        isSuccess: true,
      },
      {
        isFetching: true,
        isPending: false,
        isRefetching: true,
        isSuccess: true,
      },
    ])

    expect(status).toStrictEqual({
      initialized: true,
      isFetching: true,
      isPending: false,
      isReady: true,
      isRefreshing: true,
    })
  })

  it('keeps refresh functions compatible with the query result contract', async () => {
    const refetch = vi.fn(async () => ({ ok: true }))

    const results = [
      {
        data: [{ id: 'prod_1', name: 'Business English 4 Skills' }],
        key: 'products',
        refetch,
      },
    ]

    await Promise.all(results.map((result) => result.refetch()))

    expect(refetch).toHaveBeenCalledOnce()
  })
})
