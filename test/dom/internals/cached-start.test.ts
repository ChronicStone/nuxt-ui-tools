import { QueryClient } from '@tanstack/vue-query'
import { afterEach, describe, expect, it } from 'vitest'

import { defineTableSchema, tableSource } from '#ui-tools/table'

import { mountDataList, mountLoaded, rows } from '../harness'
import type { Harness } from '../harness'

let harness: Harness | undefined
afterEach(() => harness?.unmount())

const ROWS = [
  { id: 'row-1', name: 'First' },
  { id: 'row-2', name: 'Second' },
]

function rowsSchema(input: { fetches: { count: number }; cursor?: boolean }) {
  return defineTableSchema({
    ...(input.cursor ? { pagination: { mode: 'cursor' as const, pageSize: 25 } } : {}),
    rowKey: 'id',
    source: tableSource({
      mode: 'remote',
      query: () => ({
        queryFn: async () => {
          input.fetches.count += 1
          return {
            pageInfo: input.cursor
              ? {
                  count: 'exact' as const,
                  mode: 'cursor' as const,
                  nextCursor: null,
                  pageSize: 25,
                  rowCount: ROWS.length,
                }
              : {
                  count: 'exact' as const,
                  hasNextPage: false,
                  mode: 'offset' as const,
                  pageIndex: 0,
                  pageSize: 25,
                  rowCount: ROWS.length,
                },
            rows: ROWS,
          }
        },
        queryKey: ['cached-rows', input.cursor ? 'cursor' : 'offset'],
      }),
    }),
    tableKey: 'cached-rows',
  })
}

function sharedClient(refetchOnMount: boolean | 'always') {
  return new QueryClient({
    defaultOptions: { queries: { gcTime: 60_000, refetchOnMount, retry: false } },
  })
}

async function reopen(input: { queryClient: QueryClient; cursor?: boolean }) {
  const fetches = { count: 0 }
  const first = await mountLoaded({
    queryClient: input.queryClient,
    schema: rowsSchema({ cursor: input.cursor, fetches }),
  })
  first.unmount()

  harness = await mountDataList({
    queryClient: input.queryClient,
    schema: rowsSchema({ cursor: input.cursor, fetches }),
    settle: false,
    start: false,
  })

  return { fetches, harness }
}

describe('a table whose data is already cached', () => {
  it('shows the cached rows on its first render instead of waiting for the startup frames', async () => {
    const { harness: reopened } = await reopen({ queryClient: sharedClient(true) })

    expect(reopened.internals.queryContent.status.value.isBooting).toBeFalsy()
    expect(reopened.internals.queryContent.status.value.isPending).toBeFalsy()
    expect(rows(reopened)).toStrictEqual(ROWS)
  })

  it('revalidates the cached rows behind them when the client refetches on every mount', async () => {
    const { fetches, harness: reopened } = await reopen({ queryClient: sharedClient('always') })

    expect(rows(reopened)).toStrictEqual(ROWS)
    await reopened.until(() => fetches.count === 2)
    expect(rows(reopened)).toStrictEqual(ROWS)
  })

  it('revalidates cached cursor pages the same way', async () => {
    const { fetches, harness: reopened } = await reopen({
      cursor: true,
      queryClient: sharedClient('always'),
    })

    expect(rows(reopened)).toStrictEqual(ROWS)
    await reopened.until(() => fetches.count === 2)
  })

  it('keeps fresh cached rows without a request when the client refetches only stale data', async () => {
    const { fetches, harness: reopened } = await reopen({ queryClient: sharedClient(true) })

    await reopened.flush()

    expect(fetches.count).toBe(1)
    expect(rows(reopened)).toStrictEqual(ROWS)
  })
})
