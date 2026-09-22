import { QueryClient } from '@tanstack/vue-query'
import type { QueryFunctionContext, QueryKey } from '@tanstack/vue-query'
import { describe, expect, expectTypeOf, it } from 'vitest'

import { defineDashboardFilter } from '#ui-tools/dashboard'
import type { FormRemoteOptionConfig } from '#ui-tools/form'
import type { QueryFnDefinition } from '#ui-tools/shared/types/query'
import { remoteTableOptions } from '#ui-tools/table'
import type {
  TableCursorPageResult,
  TableFilterRemoteOptions,
  TableRemoteSourceRequest,
} from '#ui-tools/table'

interface Account {
  id: string
  name: string
  active: boolean
}

const ACCOUNTS: Account[] = [
  { active: true, id: 'a1', name: 'Acme' },
  { active: true, id: 'a2', name: 'Globex' },
  { active: false, id: 'a3', name: 'Initech' },
]

function createEndpoint() {
  const requests: TableRemoteSourceRequest<Account>[] = []
  const query = (request: TableRemoteSourceRequest<Account>) => ({
    queryFn: (): Promise<TableCursorPageResult<Account>> => {
      requests.push(request)
      const ids = request.filters.flatMap((group) =>
        group.children.flatMap((node) =>
          node.type === 'condition' && Array.isArray(node.value) ? node.value : [],
        ),
      )
      const rows = ids.length
        ? ACCOUNTS.filter((row) => ids.includes(row.id))
        : ACCOUNTS.slice(0, 2)
      return Promise.resolve({
        pageInfo: {
          count: 'none',
          mode: 'cursor',
          nextCursor: 'next',
          pageSize: 2,
          rowCount: null,
        },
        rows,
      })
    },
    queryKey: ['accounts', request] as const,
  })
  return { query, requests }
}

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

describe('remoteTableOptions', () => {
  it('builds table requests and maps rows to option pages', async () => {
    const endpoint = createEndpoint()
    const accounts = remoteTableOptions({
      option: (account) => ({ label: account.name, value: account.id }),
      query: endpoint.query,
      search: { debounce: 100, fields: ['name'] },
      sort: 'name',
    })

    expect(accounts.pagination).toEqual({ size: 25, type: 'cursor' })
    expect(accounts.search).toEqual({ debounce: 100 })

    const page = accounts.load({ page: { cursor: 'c1', index: 2, size: 2 }, search: 'ac' })
    expect(page.queryKey.at(-1)).toBe('remote-options')
    await expect(run(page)).resolves.toEqual({
      nextCursor: 'next',
      options: [
        { label: 'Acme', value: 'a1' },
        { label: 'Globex', value: 'a2' },
      ],
    })
    expect(endpoint.requests[0]).toEqual({
      filters: [],
      pagination: { count: 'none', cursor: 'c1', mode: 'cursor', pageSize: 2 },
      search: { fields: ['name'], value: 'ac' },
      sorting: [{ dir: 'asc', key: 'name' }],
    })

    await expect(run(accounts.resolveSelected({ values: ['a3'] }))).resolves.toEqual([
      { label: 'Initech', value: 'a3' },
    ])
    expect(endpoint.requests[1]).toEqual({
      filters: [
        {
          children: [{ key: 'id', operator: 'isAnyOf', type: 'condition', value: ['a3'] }],
          combinator: 'and',
          type: 'group',
        },
      ],
      pagination: { count: 'none', cursor: null, mode: 'cursor', pageSize: 1 },
      search: { fields: ['name'], value: '' },
      sorting: [],
    })
  })

  it('pages by offset when asked to', () => {
    const endpoint = createEndpoint()
    const accounts = remoteTableOptions({
      option: (account) => ({ label: account.name, value: account.id }),
      pagination: { size: 10, type: 'page' },
      query: endpoint.query,
    })
    void run(accounts.load({ page: { cursor: null, index: 3, size: 10 }, search: '' }))
    expect(endpoint.requests[0]?.pagination).toEqual({
      count: 'exact',
      mode: 'offset',
      pageIndex: 2,
      pageSize: 10,
    })
  })

  it('fits dashboard filters, table option filters, and form remote options', () => {
    const endpoint = createEndpoint()
    const accounts = remoteTableOptions({
      option: (account) => ({ label: account.name, value: account.id }),
      query: endpoint.query,
      search: ['name'],
    })
    defineDashboardFilter((p) => p.remote(accounts, { multiple: true }))
    expectTypeOf(accounts).toExtend<TableFilterRemoteOptions<string>>()
    expectTypeOf({
      mode: 'remote' as const,
      pagination: accounts.pagination,
      resolveSelected: accounts.resolveSelected,
      source: accounts.load,
    }).toExtend<FormRemoteOptionConfig<{ label: string; value: string }>>()
    remoteTableOptions({
      option: (account) => ({ label: account.name, value: account.id }),
      query: endpoint.query,
      // @ts-expect-error `email` is not a field of the rows
      search: ['email'],
    })
  })
})
