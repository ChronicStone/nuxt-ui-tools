import { queryOptions } from '@tanstack/vue-query'
import type { DataTag, QueryKey, UseQueryOptions } from '@tanstack/vue-query'
import { describe, expectTypeOf, it } from 'vitest'
import type { Ref } from 'vue'

import { defineRemoteOptions } from '#ui-tools/shared'
import type { QueryFnDefinition, QueryFunctionResult } from '#ui-tools/shared'

type Page = { rows: { id: string; name: string }[] }

/** The shape generated clients such as Tuyau return: ref-wrapped options with a tagged key. */
type GeneratedQuery<TData> = UseQueryOptions<TData, Error, TData, TData, QueryKey> & {
  queryKey: DataTag<QueryKey, TData, Error>
}

declare function generatedQuery(search: string): GeneratedQuery<Page>
declare const page: Page

describe('query function result', () => {
  it('reads the data of generated, TanStack, ref and minimal query definitions', () => {
    expectTypeOf<QueryFunctionResult<GeneratedQuery<Page>>>().toEqualTypeOf<Page>()
    const tanstack = queryOptions({ queryFn: () => Promise.resolve(page), queryKey: ['page'] })
    expectTypeOf<QueryFunctionResult<typeof tanstack>>().toEqualTypeOf<Page>()
    expectTypeOf<QueryFunctionResult<QueryFnDefinition<Page>>>().toEqualTypeOf<Page>()
    expectTypeOf<
      QueryFunctionResult<{ queryKey: QueryKey; queryFn: Ref<() => Promise<Page>> }>
    >().toEqualTypeOf<Page>()
  })

  it('types remote option mappers over generated queries', () => {
    const options = defineRemoteOptions(
      {
        load: ({ search }) => generatedQuery(search),
        resolveSelected: ({ values }) => generatedQuery(values.join(',')),
      },
      {
        key: 'generated',
        mapPage: ({ rows }) => ({
          hasMore: false,
          options: rows.map((row) => ({ label: row.name, value: row.id })),
        }),
        mapSelected: ({ rows }) => rows.map((row) => ({ label: row.name, value: row.id })),
        pagination: { size: 25, type: 'page' },
      },
    )

    expectTypeOf(options.load).returns.toHaveProperty('queryKey')
  })
})
