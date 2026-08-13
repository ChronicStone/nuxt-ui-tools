import { readFileSync } from 'node:fs'

import { describe, expect, expectTypeOf, it } from 'vitest'
import type { ComputedRef } from 'vue'

import { defineTableSchema } from '#ui-tools/table/schema'
import type {
  TableApi,
  TableCursorPaginationApi,
  TableNoPaginationApi,
  TableRemoteSource,
} from '#ui-tools/table/types'

describe('table package surface', () => {
  it('exports defineTableSchema from the package root', () => {
    expectTypeOf(defineTableSchema).toBeFunction()
  })

  it('declares TanStack Query on the package boundary', () => {
    const packageJson = JSON.parse(
      readFileSync(new URL('../../package.json', import.meta.url), 'utf8'),
    ) as { peerDependencies?: Record<string, string> }

    expect(packageJson.peerDependencies?.['@tanstack/vue-query']).toBeDefined()
  })

  it('accepts root-level pagination config on the schema', () => {
    const schema = defineTableSchema({
      tableKey: 'users',
      rowKey: 'id',
      source: {
        query: () => ({
          queryKey: ['users'],
          queryFn: async () => [{ id: 1 }],
        }),
      },
      pagination: {
        defaultSize: {
          table: 50,
          grid: 20,
        },
        sizeOptions: {
          table: [10, 20, 50],
          grid: [10, 20],
        },
        showPageSizePicker: true,
      },
    })

    expectTypeOf(
      schema.pagination && typeof schema.pagination === 'object'
        ? schema.pagination.mode === 'cursor'
          ? undefined
          : schema.pagination.showPageSizePicker
        : undefined,
    ).toMatchTypeOf<boolean | undefined>()
  })

  it('keeps the public table api generic compatible with inferred schemas', () => {
    const schema = defineTableSchema({
      tableKey: 'users',
      rowKey: 'id',
      source: {
        query: () => ({
          queryKey: ['users'],
          queryFn: async () => [{ id: 'user_1', email: 'ada@example.com' }],
        }),
      },
      grid: {
        renderItem: ({ row }) => row.email,
      },
    })

    type PublicTable = TableApi<typeof schema> & {
      schema: ComputedRef<typeof schema>
    }

    expectTypeOf<PublicTable['schema']['value']['grid']>().toEqualTypeOf<typeof schema.grid>()
  })

  it('narrows the public pagination API from the schema strategy', () => {
    const cursorSchema = defineTableSchema({
      tableKey: 'cursor-users',
      rowKey: 'id',
      pagination: { mode: 'cursor', pageSize: 20 },
      source: {
        mode: 'remote',
        query: () => ({
          queryKey: ['cursor-users'],
          queryFn: async () => ({
            rows: [{ id: 1 }],
            pageInfo: {
              mode: 'cursor' as const,
              pageSize: 20,
              nextCursor: null,
              count: 'none' as const,
              rowCount: null,
            },
          }),
        }),
      },
    })
    const unpaginatedSchema = defineTableSchema({
      tableKey: 'all-users',
      rowKey: 'id',
      pagination: false,
      source: {
        query: () => ({ queryKey: ['all-users'], queryFn: async () => [{ id: 1 }] }),
      },
    })

    expectTypeOf<
      TableApi<typeof cursorSchema>['pagination']
    >().toEqualTypeOf<TableCursorPaginationApi>()
    expectTypeOf<
      TableApi<typeof unpaginatedSchema>['pagination']
    >().toEqualTypeOf<TableNoPaginationApi>()
  })

  it('requires remote sources to return rows with rowCount metadata', () => {
    const remoteSource: TableRemoteSource<{ id: number }> = {
      mode: 'remote',
      query: () => ({
        queryKey: ['remote-users'],
        // @ts-expect-error remote queries must resolve { rows, rowCount }
        queryFn: async () => [{ id: 1 }],
      }),
    }

    expectTypeOf(remoteSource).toEqualTypeOf<TableRemoteSource<{ id: number }>>()
  })

  it('accepts source-level embedded facets enablement for remote sources', () => {
    const remoteSource: TableRemoteSource<{ id: number }> = {
      mode: 'remote',
      facets: true,
      query: (ctx) => ({
        queryKey: ['remote-users', ctx.facets],
        queryFn: async () => ({
          rows: [{ id: 1 }],
          rowCount: 1,
          facets: [],
        }),
      }),
    }

    expectTypeOf(remoteSource).toEqualTypeOf<TableRemoteSource<{ id: number }>>()
  })
})
