import type { QueryKey } from '@tanstack/vue-query'

import type { QueryFnDefinition } from '../types/query'
import { isFunction } from './predicate'

/** Maps an endpoint query while keeping its own key and cancellation context. */
export function mapRemoteOptionsQuery<TData, TResult>(
  definition: { queryKey: QueryKey },
  map: (result: TData) => TResult,
  suffix: readonly unknown[],
): QueryFnDefinition<TResult> {
  return {
    async queryFn(context) {
      if (!hasQueryFunction<TData>(definition)) {
        throw new Error(
          '[remote options] `load` and `resolveSelected` must return a query with a queryFn.',
        )
      }
      const result = await definition.queryFn({ ...context, queryKey: definition.queryKey })
      return map(result)
    },
    queryKey: [...definition.queryKey, ...suffix],
  }
}

function hasQueryFunction<TData>(definition: {
  queryKey: QueryKey
}): definition is QueryFnDefinition<TData> {
  return 'queryFn' in definition && isFunction(definition.queryFn)
}
