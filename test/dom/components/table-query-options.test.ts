import { afterEach, describe, expect, it } from 'vitest'

import { defineTableSchema, tableSource } from '#ui-tools/table'

import { mountLoaded } from '../harness'
import type { Harness } from '../harness'

let harness: Harness | undefined
afterEach(() => harness?.unmount())

const ROWS = [
  { id: 'row-1', name: 'First' },
  { id: 'row-2', name: 'Second' },
]

function offsetPage() {
  return {
    pageInfo: {
      count: 'exact' as const,
      hasNextPage: false,
      mode: 'offset' as const,
      pageIndex: 0,
      pageSize: 25,
      rowCount: ROWS.length,
    },
    rows: ROWS,
  }
}

describe('table query options', () => {
  it('keeps page context loaded while the base data refreshes', async () => {
    let contextFetches = 0
    harness = await mountLoaded({
      queryDefaults: { refetchOnMount: 'always' },
      schema: defineTableSchema({
        pageContext: [
          {
            key: 'totals',
            query: ({ rows }) => ({
              queryFn: () => {
                contextFetches += 1
                return { count: rows.length }
              },
              queryKey: ['totals', rows.length],
            }),
          },
        ],
        rowKey: 'id',
        source: tableSource({
          mode: 'remote',
          query: () => ({ queryFn: async () => offsetPage(), queryKey: ['rows'] }),
        }),
        tableKey: 'page-context-refresh',
      }),
    })
    await harness.until(() => contextFetches > 0)
    await harness.flush()
    const fetchesBeforeRefresh = contextFetches

    await harness.internals.queryContent.refreshData()()
    await harness.flush()

    expect(contextFetches).toBe(fetchesBeforeRefresh)
    expect(harness.internals.queryContent.pageContextData.value).toStrictEqual({
      totals: { count: 2 },
    })
  })

  it('carries the source query meta onto cursor queries', async () => {
    harness = await mountLoaded({
      schema: defineTableSchema({
        pagination: { mode: 'cursor', pageSize: 25 },
        rowKey: 'id',
        source: tableSource({
          mode: 'remote',
          query: () => ({
            meta: { topic: 'rows' },
            queryFn: async () => ({
              pageInfo: {
                count: 'exact' as const,
                mode: 'cursor' as const,
                nextCursor: null,
                pageSize: 25,
                rowCount: ROWS.length,
              },
              rows: ROWS,
            }),
            queryKey: ['cursor-rows'],
          }),
        }),
        tableKey: 'cursor-meta',
      }),
    })

    const cursorQuery = harness.queryClient
      .getQueryCache()
      .getAll()
      .find((query) => JSON.stringify(query.queryKey).includes('cursor-rows'))

    expect(cursorQuery?.meta).toStrictEqual({ topic: 'rows' })
  })
})
