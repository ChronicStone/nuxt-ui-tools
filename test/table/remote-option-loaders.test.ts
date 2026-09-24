import { QueryClient, queryOptions } from '@tanstack/vue-query'
import type { QueryFunctionContext, QueryKey } from '@tanstack/vue-query'
import { describe, expect, expectTypeOf, it } from 'vitest'

import { defineDashboardSchema } from '#ui-tools/dashboard'
import { defineRemoteOptions } from '#ui-tools/shared'
import type { QueryFnDefinition } from '#ui-tools/shared'
import type { TableFilterRemoteOptions } from '#ui-tools/table'

const USERS = [
  { id: 'u1', name: 'Ada' },
  { id: 'u2', name: 'Grace' },
]

function run<TData>(definition: QueryFnDefinition<TData>) {
  const client = new QueryClient()
  const context: QueryFunctionContext<QueryKey, string | null> = {
    client,
    direction: 'forward',
    meta: undefined,
    pageParam: null,
    queryKey: definition.queryKey,
    signal: new AbortController().signal,
  }
  return definition.queryFn(context)
}

describe('shared remote option loaders', () => {
  it('maps a generated query to reusable pages and selected labels', async () => {
    const users = defineRemoteOptions(
      {
        load: ({ page, search }) =>
          queryOptions({
            queryFn: () => Promise.resolve({ nextCursor: null, rows: USERS }),
            queryKey: ['users', 'list', search, page.cursor, page.size],
          }),
        resolveSelected: ({ values }) =>
          queryOptions({
            queryFn: () =>
              Promise.resolve({ rows: USERS.filter((user) => values.includes(user.id)) }),
            queryKey: ['users', 'selected', values],
          }),
      },
      {
        key: 'users',
        mapPage: ({ nextCursor, rows }) => ({
          nextCursor,
          options: rows.map((user) => ({ label: user.name, value: user.id })),
        }),
        mapSelected: ({ rows }) => rows.map((user) => ({ label: user.name, value: user.id })),
        pagination: { size: 25, type: 'cursor' },
        search: { debounce: 100 },
      },
    )

    const page = users.load({ page: { cursor: null, index: 1, size: 25 }, search: 'a' })
    expect(page.queryKey).toEqual([
      'users',
      'list',
      'a',
      null,
      25,
      'remote-options',
      'users',
      'page',
    ])
    expect(
      users.queryKeyFor?.({ page: { cursor: null, index: 1, size: 25 }, search: 'a' }),
    ).toEqual(page.queryKey)
    await expect(run(page)).resolves.toEqual({
      nextCursor: null,
      options: [
        { label: 'Ada', value: 'u1' },
        { label: 'Grace', value: 'u2' },
      ],
    })
    await expect(run(users.resolveSelected({ values: ['u2'] }))).resolves.toEqual([
      { label: 'Grace', value: 'u2' },
    ])
    expect(users.pagination).toEqual({ size: 25, type: 'cursor' })
    expect(users.search).toEqual({ debounce: 100 })

    defineDashboardSchema({
      filters: (f) => ({ owner: f.remote(users, { label: 'Owner' }) }),
      key: 'users',
    })
    expectTypeOf(users).toExtend<TableFilterRemoteOptions<string>>()
  })
})
