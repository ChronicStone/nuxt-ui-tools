import type { QueryClient } from '@tanstack/vue-query'

import type { MaybePromise } from '#ui-tools/shared/types/utils'
import { hasProperty, isFunction } from '#ui-tools/shared/utils/predicate'

import type {
  QueryPrefetchContext,
  QueryPrefetchEntry,
  QueryPrefetchOption,
  QueryPrefetchQueries,
  QueryPrefetchPlan,
  QueryPrefetchStage,
} from '../types/plan'

type QueryPrefetchCandidate = QueryPrefetchEntry | readonly QueryPrefetchEntry[]
type QueryPrefetchResolver<Context, Queries> = (context: Readonly<Context>) => MaybePromise<Queries>

const queryPrefetchStages = new WeakMap<QueryPrefetchPlan, readonly QueryPrefetchStage[]>()

function createQueryPrefetchPlan<Context extends object>(
  stages: readonly QueryPrefetchStage[],
): QueryPrefetchPlan<Context> {
  const plan: QueryPrefetchPlan<Context> = {
    kind: 'query-prefetch-plan',
    stage<const Queries extends QueryPrefetchQueries>(
      queries: Queries | QueryPrefetchResolver<Context, Queries>,
    ) {
      const stage: QueryPrefetchStage = {
        resolve(context: Readonly<Context>) {
          return isQueryPrefetchResolver<Context, Queries>(queries) ? queries(context) : queries
        },
      }
      return createQueryPrefetchPlan([...stages, stage])
    },
  }
  queryPrefetchStages.set(plan, stages)
  return plan
}

/**
 * Starts a staged query prefetch plan.
 *
 * Stages run sequentially and queries within a stage run in parallel. Each
 * stage callback receives the accumulated (selected) results of all previous
 * stages, keyed by the record keys used when declaring them.
 *
 * Execute a plan with `executeQueryPrefetchPlan(...)`, return it from a
 * `defineQueryPrefetch(...)` resolver, or build one from a table schema with
 * `prefetchTable(...)`.
 */
export function defineQueryPrefetchPlan() {
  return createQueryPrefetchPlan<{}>([])
}

/**
 * Executes a staged prefetch plan against a TanStack query client.
 *
 * Uses `ensureQueryData({ revalidateIfStale: true })` so warm, fresh cache
 * entries are reused as-is. Errors are swallowed and the partially accumulated
 * context is returned: prefetch is opportunistic and must never break
 * navigation — the destination page's own queries remain the correctness path.
 */
export async function executeQueryPrefetchPlan(
  plan: QueryPrefetchPlan,
  { queryClient }: { queryClient: QueryClient },
) {
  const context: QueryPrefetchContext = {}

  try {
    for (const stage of queryPrefetchStages.get(plan) ?? []) {
      const queries = await stage.resolve(context)
      const entries = Object.entries(queries)
      const results = await Promise.all(
        entries.map(([, query]) => executeQuery(query, queryClient)),
      )

      Object.assign(
        context,
        Object.fromEntries(entries.map(([key], index) => [key, results[index]])),
      )
    }
  } catch {
    return context
  }

  return context
}

export function isQueryPrefetchPlan(value: QueryPrefetchCandidate): value is QueryPrefetchPlan {
  if (Array.isArray(value)) return false
  return hasProperty(value, 'kind') && value.kind === 'query-prefetch-plan'
}

export function isQueryPrefetchOption(value: QueryPrefetchCandidate): value is QueryPrefetchOption {
  if (Array.isArray(value)) return false
  return hasProperty(value, 'queryKey') && Array.isArray(value.queryKey)
}

function executeQuery(query: QueryPrefetchOption, queryClient: QueryClient) {
  if (hasProperty(query, 'enabled') && query.enabled === false) return Promise.resolve(undefined)

  return queryClient
    .ensureQueryData({ ...query, revalidateIfStale: true })
    .then((data) => {
      const select = hasProperty(query, 'select') ? query.select : undefined
      return isQueryPrefetchSelector(select) ? select(data) : data
    })
    .catch(() => undefined)
}

type QueryPrefetchSelector = (data: QueryPrefetchContext[string]) => QueryPrefetchContext[string]

function isQueryPrefetchSelector(
  value: QueryPrefetchContext[string],
): value is QueryPrefetchSelector {
  return isFunction(value)
}

function isQueryPrefetchResolver<Context, Queries>(
  value: Queries | QueryPrefetchResolver<Context, Queries>,
): value is QueryPrefetchResolver<Context, Queries> {
  return isFunction(value)
}
