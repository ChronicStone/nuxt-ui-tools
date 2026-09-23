import type { QueryFunctionContext, QueryKey } from '@tanstack/vue-query'

import type { DashboardRemoteResult } from '../types'

/**
 * Settles what a remote option source returned: awaits a promise, or runs a query definition's
 * `queryFn` under the definition's own key (the page is already cached by the caller's query).
 */
export async function runDashboardRemoteResult<TResult>(
  result: DashboardRemoteResult<TResult>,
  context: QueryFunctionContext<QueryKey, never>,
): Promise<TResult> {
  if (!('queryKey' in result)) return result
  if (!result.queryFn) {
    throw new Error(
      '[dashboard] Remote option sources returning a query definition need a queryFn.',
    )
  }
  return result.queryFn({
    ...context,
    direction: 'forward',
    pageParam: null,
    queryKey: result.queryKey,
  })
}
