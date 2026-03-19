import { describe, expectTypeOf, it } from 'vitest'
import type { WritableComputedRef } from 'vue'

import { createEnumCodec, stringCodec, useQueryState, useQueryStates } from '#query-state'

function useExplicitLayoutState() {
  return useQueryState({
    key: 'l',
    codec: createEnumCodec(['grid', 'table'] as const),
    defaultValue: 'table',
    omitDefault: true,
  })
}

function useOptionalLayoutState() {
  return useQueryState({
    key: 'l',
    codec: createEnumCodec(['grid', 'table'] as const),
    defaultValue: undefined,
    omitDefault: true,
  })
}

function useCombinedQueryStates() {
  return useQueryStates({
    schema: {
      layout: {
        codec: createEnumCodec(['grid', 'table'] as const),
        defaultValue: 'table',
        omitDefault: true,
      },
      search: {
        codec: stringCodec,
        defaultValue: '',
      },
      optionalLayout: {
        codec: createEnumCodec(['grid', 'table'] as const),
        defaultValue: undefined,
        omitDefault: true,
      },
    },
  })
}

describe('query-state inference', () => {
  it('narrows useQueryState when defaultValue is explicit', () => {
    expectTypeOf<ReturnType<typeof useExplicitLayoutState>>().toEqualTypeOf<
      WritableComputedRef<'grid' | 'table'>
    >()
  })

  it('preserves undefined when defaultValue is undefined', () => {
    expectTypeOf<ReturnType<typeof useOptionalLayoutState>>().toEqualTypeOf<
      WritableComputedRef<'grid' | 'table' | undefined>
    >()
  })

  it('narrows useQueryStates entries from explicit defaults', () => {
    expectTypeOf<ReturnType<typeof useCombinedQueryStates>['value']['layout']>().toEqualTypeOf<
      'grid' | 'table'
    >()
    expectTypeOf<ReturnType<typeof useCombinedQueryStates>['value']['search']>().toEqualTypeOf<
      string
    >()
    expectTypeOf<
      ReturnType<typeof useCombinedQueryStates>['value']['optionalLayout']
    >().toEqualTypeOf<
      'grid' | 'table' | undefined
    >()
  })
})
