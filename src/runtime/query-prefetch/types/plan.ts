import type { InferDataFromTag, QueryKey, UseQueryOptions } from '@tanstack/vue-query'

import type { GenericObject, MaybePromise } from '#ui-tools/shared/types/utils'

/**
 * Minimal query shape accepted by the prefetch executor.
 *
 * Deliberately duck-typed so any `queryOptions(...)` output or hand-written
 * definition works without forcing TanStack generics on consumers. Entries with
 * `enabled: false` are skipped, and a `select` transform is applied to the
 * fetched data before it is exposed to later stages.
 */
export type QueryPrefetchOption = {
  queryKey: QueryKey
}

export type QueryPrefetchEntry = QueryPrefetchOption | QueryPrefetchPlan

export type QueryPrefetchQueries = Readonly<Record<string, QueryPrefetchOption>>

/** Values accumulated by staged prefetch resolvers after query data is decoded. */
export type QueryPrefetchContext = GenericObject

type QueryPrefetchFunctionResult<Value> = Value extends (...args: never[]) => infer Result
  ? Result
  : Value extends { value: infer Inner }
    ? QueryPrefetchFunctionResult<Inner>
    : never

type QueryPrefetchResult<Option> = Option extends { value: infer Inner }
  ? QueryPrefetchResult<Inner>
  : Option extends { select?: infer Select }
    ? [QueryPrefetchFunctionResult<NonNullable<Select>>] extends [never]
      ? QueryPrefetchDataResult<Option>
      : QueryPrefetchFunctionResult<NonNullable<Select>>
    : QueryPrefetchDataResult<Option>

type QueryPrefetchDataResult<Option> = Option extends { queryKey: infer Key }
  ? Key extends QueryKey
    ? unknown extends InferDataFromTag<unknown, Key>
      ? Option extends { queryFn?: infer QueryFn }
        ? Awaited<QueryPrefetchFunctionResult<NonNullable<QueryFn>>>
        : unknown
      : InferDataFromTag<unknown, Key>
    : unknown
  : Option extends UseQueryOptions<
        infer _QueryFnData,
        infer _Error,
        infer Data,
        infer _QD,
        infer _QK
      >
    ? Data
    : unknown

type QueryPrefetchStageResults<Queries extends QueryPrefetchQueries> = {
  [Key in keyof Queries]: QueryPrefetchResult<Queries[Key]>
}

export type QueryPrefetchStage = {
  resolve(context: Readonly<QueryPrefetchContext>): MaybePromise<QueryPrefetchQueries>
}

/**
 * An immutable, chainable staged prefetch plan.
 *
 * Each `.stage(...)` accepts either a static map of query options or a function
 * receiving the accumulated context of all previous stages. The context type
 * accumulates the `select`-ed data types of every stage, so dependent stages
 * stay fully typed:
 *
 * ```ts
 * defineQueryPrefetchPlan()
 *   .stage({ item: itemQuery })
 *   .stage(({ item }) => ({ details: detailsQuery(item.id) }))
 * ```
 */
export type QueryPrefetchPlan<Context extends object = object> = {
  kind: 'query-prefetch-plan'
  stage: <const Queries extends QueryPrefetchQueries>(
    queries: Queries | ((context: Readonly<Context>) => MaybePromise<Queries>),
  ) => QueryPrefetchPlan<Context & QueryPrefetchStageResults<Queries>>
}
