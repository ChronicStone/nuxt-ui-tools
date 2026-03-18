import { readFileSync } from 'node:fs'

import { describe, expect, expectTypeOf, it } from 'vitest'

import { defineTableSchema } from '#table/schema'
import type { TableRemoteSource } from '#table/types'

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

    expectTypeOf(schema.pagination?.showPageSizePicker).toEqualTypeOf<boolean | undefined>()
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
})
