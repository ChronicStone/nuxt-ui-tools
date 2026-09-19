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

import { isObject } from '../../src/runtime/shared/utils/predicate'

describe('table package surface', () => {
  it('exports defineTableSchema from the package root', () => {
    expectTypeOf(defineTableSchema).toBeFunction()
  })

  it('declares TanStack Query on the package boundary', () => {
    interface PackageMetadata {
      peerDependencies?: Record<string, string>
    }
    const packageJson: PackageMetadata = JSON.parse(
      readFileSync(new URL('../../package.json', import.meta.url), 'utf-8'),
    )

    expect(packageJson.peerDependencies?.['@tanstack/vue-query']).toBeDefined()
  })

  it('accepts root-level pagination config on the schema', () => {
    const schema = defineTableSchema({
      pagination: {
        defaultSize: {
          grid: 20,
          table: 50,
        },
        showPageSizePicker: true,
        sizeOptions: {
          grid: [10, 20],
          table: [10, 20, 50],
        },
      },
      rowKey: 'id',
      source: {
        query: () => ({
          queryFn: async () => [{ id: 1 }],
          queryKey: ['users'],
        }),
      },
      tableKey: 'users',
    })

    expectTypeOf(
      schema.pagination && isObject(schema.pagination)
        ? schema.pagination.mode === 'cursor'
          ? undefined
          : schema.pagination.showPageSizePicker
        : undefined,
    ).toMatchTypeOf<boolean | undefined>()
  })

  it('keeps the public table api generic compatible with inferred schemas', () => {
    const schema = defineTableSchema({
      grid: {
        renderItem: ({ row }) => row.email,
      },
      rowKey: 'id',
      source: {
        query: () => ({
          queryFn: async () => [{ email: 'ada@example.com', id: 'user_1' }],
          queryKey: ['users'],
        }),
      },
      tableKey: 'users',
    })

    type PublicTable = TableApi<typeof schema> & {
      schema: ComputedRef<typeof schema>
    }

    expectTypeOf<PublicTable['schema']['value']['grid']>().toEqualTypeOf<typeof schema.grid>()
  })

  it('narrows the public pagination API from the schema strategy', () => {
    const cursorSchema = defineTableSchema({
      pagination: { mode: 'cursor', pageSize: 20 },
      rowKey: 'id',
      source: {
        mode: 'remote',
        query: () => ({
          queryFn: async () => ({
            pageInfo: {
              count: 'none' as const,
              mode: 'cursor' as const,
              nextCursor: null,
              pageSize: 20,
              rowCount: null,
            },
            rows: [{ id: 1 }],
          }),
          queryKey: ['cursor-users'],
        }),
      },
      tableKey: 'cursor-users',
    })
    const unpaginatedSchema = defineTableSchema({
      pagination: false,
      rowKey: 'id',
      source: {
        query: () => ({ queryFn: async () => [{ id: 1 }], queryKey: ['all-users'] }),
      },
      tableKey: 'all-users',
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
      facets: true,
      mode: 'remote',
      query: (ctx) => ({
        queryFn: async () => ({
          facets: [],
          rowCount: 1,
          rows: [{ id: 1 }],
        }),
        queryKey: ['remote-users', ctx.facets],
      }),
    }

    expectTypeOf(remoteSource).toEqualTypeOf<TableRemoteSource<{ id: number }>>()
  })
})
