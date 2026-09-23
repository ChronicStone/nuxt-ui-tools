import type { QueryKey } from '@tanstack/vue-query'

import type { DashboardFilterControls } from './controls'
import type {
  DashboardEmptyMap,
  DashboardFilterMap,
  DashboardFilterValues,
  DashboardFiltersInput,
} from './filters'
import type { DashboardKeyError } from './schema'

/**
 * Fetch stage of a query.
 *
 * - `essential` fetches as soon as its scope is active and drives the scope `state`.
 * - `background` fetches once every essential query of the same scope has settled.
 * - `deferred` never fetches until `resource.activate()` runs (blocks call it when they mount or
 *   scroll into view).
 */
export type DashboardStage = 'essential' | 'background' | 'deferred'

/**
 * - `idle`: not requested yet (a deferred query nobody activated, an unopened view).
 * - `loading` / `ready` / `error`: the fetch lifecycle.
 * - `disabled`: an `enabled` condition does not hold (its own, or its view's). The resource never
 *   fetches and holds its `defaultValue`; blocks bound to it render nothing.
 */
export type DashboardResourceState = 'idle' | 'loading' | 'ready' | 'error' | 'disabled'

/**
 * Whether a view, query, or filter is part of the dashboard right now, read lazily and reactively:
 * what the schema function knows (the audience), another filter, data.
 */
export type DashboardCondition = () => boolean

/**
 * Contract every block binds to through `:source`. Query resources and derived resources both
 * satisfy it. Every member is a plain value read through a getter — there is no `.value`.
 */
export interface DashboardSourceLike<TData = unknown> {
  /** Stable identity, e.g. `consumption.productLines`. */
  readonly id: string
  readonly data: TData
  readonly state: DashboardResourceState
  readonly error: unknown
  /** A background refetch is running while `state` is still `'ready'`. */
  readonly refreshing: boolean
  /**
   * A request for this source is in flight, whatever its state: the first load, a refetch of shown
   * data, or a retry after an error (TanStack keeps an errored query in `error` while it refetches).
   * Blocks draw their progress bar from it. Optional so hand-written sources keep fitting; blocks
   * fall back to `refreshing`.
   */
  readonly fetching?: boolean
  /**
   * When the data was last fetched successfully (epoch milliseconds). `undefined` until the first
   * success. A derived value reports its oldest input.
   */
  readonly updatedAt: number | undefined
  /** Opts an idle `deferred` resource in. No-op for other resources. */
  activate(): void
  refresh(): Promise<void>
}

/** A declared query, as exposed on the dashboard facade. */
export interface DashboardResource<
  TData,
  TFilters extends DashboardFilterMap = DashboardEmptyMap,
  TStage extends DashboardStage = DashboardStage,
> extends DashboardSourceLike<TData> {
  readonly kind: 'query'
  readonly fetching: boolean
  readonly stage: TStage
  /** `false` while the owning view has never been opened or a `deferred` query was not activated. */
  readonly active: boolean
  /** Values of the filters declared on this query, URL-synced under the query key. */
  readonly filters: DashboardFilterValues<TFilters>
  /** Controls of the same filters: bind them to a chart's `series`, `UiDashboardFilter`, or any control. */
  readonly controls: DashboardFilterControls<TFilters>
}

/** A value declared in `derive`, exposed as a resource whose state follows the data it reads. */
export interface DashboardDerived<TData> extends DashboardSourceLike<TData> {
  readonly kind: 'derived'
  readonly fetching: boolean
}

export type DashboardSourceMap = Record<string, DashboardSourceLike>

/** Data of a source once it is `ready` (`undefined` is excluded, `null` is kept). */
export type DashboardReadyData<TSource> =
  TSource extends DashboardSourceLike<infer TData> ? Exclude<TData, undefined> : never

/** Row type of a source whose ready data is an array. */
export type DashboardSourceRow<TSource> =
  DashboardReadyData<TSource> extends readonly (infer TRow)[] ? TRow : never

/** Minimal query shape accepted from query factories (TanStack `queryOptions()` objects fit). */
export interface DashboardQueryLike {
  queryKey: QueryKey
}

/** Result type of a query definition, read from its `queryFn`. */
export type DashboardQueryData<TQuery> = TQuery extends { queryFn?: infer TFn }
  ? TFn extends (...args: never[]) => infer TResult
    ? Awaited<TResult>
    : never
  : never

/** Scope handed to the configured query factory. */
export interface DashboardQueryScope<TFilters extends DashboardFilterMap, TRequired> {
  /** Values of the filters declared on this query. */
  filters: Readonly<DashboardFilterValues<TFilters>>
  /** Non-nullish value returned by `requires`. */
  required: NonNullable<TRequired>
}

export interface DashboardQueryInput<
  TQuery extends DashboardQueryLike,
  TFilters extends DashboardFilterMap,
  TRequired,
  TSelected,
> {
  /**
   * Filters of this query only, e.g. the products a chart tracks, URL-synced under
   * `<queryKey>.<filter>`. Their controls drive the block bound to the query.
   */
  filters?: DashboardFiltersInput<TFilters>
  /**
   * Gate and narrow. While it returns `null` or `undefined` the query does not fetch; once set,
   * `scope.required` is the non-nullish value. Reading another resource's `data` here expresses a
   * dependent query: the resource is `loading` while the resources it read load, and once they
   * are ready without satisfying it, `ready` with its `defaultValue` (`idle` without one).
   */
  requires?: () => TRequired
  /**
   * Whether the query exists for the current dashboard state, e.g. a section this workspace may
   * not see. While it is `false` the query never fetches, its state is `disabled` and its data its
   * `defaultValue`, and every block bound to it renders nothing (grids close the gap). To wait for
   * data instead, use `requires`.
   */
  enabled?: DashboardCondition
  /**
   * Reactive query factory returning a TanStack query definition. Several resources may share one
   * factory: they share its request and cache entry, and each `select`s its own part.
   */
  query: (scope: DashboardQueryScope<NoInfer<TFilters>, NoInfer<TRequired>>) => TQuery
  /**
   * Picks or reshapes the part of the query result this resource exposes. The cached result stays
   * whole, so resources selecting from the same query never refetch it.
   */
  select?: (data: DashboardQueryData<TQuery>) => TSelected
  /** Keep previous data while a new key loads. Defaults to `true`. */
  keepPreviousData?: boolean
  staleTime?: number
}

/**
 * One fetch stage. Declared once and instantiated for `essential`, `background` and `deferred`.
 */
export interface DashboardQueryStage<TStage extends DashboardStage> {
  /** Plain query. `data` is `T | undefined`. */
  query<TQuery extends DashboardQueryLike>(
    factory: () => TQuery,
  ): DashboardResource<DashboardQueryData<TQuery> | undefined, DashboardEmptyMap, TStage>

  /** Configured query without a default. `data` is `T | undefined` (`T`: the `select` result). */
  query<
    TQuery extends DashboardQueryLike,
    const TFilters extends DashboardFilterMap = DashboardEmptyMap,
    TRequired = undefined,
    TSelected = DashboardQueryData<TQuery>,
  >(
    input: DashboardQueryInput<TQuery, TFilters, TRequired, TSelected> & {
      defaultValue?: undefined
    },
  ): DashboardResource<NoInfer<TSelected> | undefined, TFilters, TStage>

  /**
   * Configured query with a default. `data` is always defined. The default is inferred on its own
   * (so property order inside the object does not matter) and checked against the query result (or
   * the `select` result): a mismatching default turns the resource into a `DashboardKeyError`,
   * rejected by `queries`.
   */
  query<
    TQuery extends DashboardQueryLike,
    const TFilters extends DashboardFilterMap = DashboardEmptyMap,
    TRequired = undefined,
    TSelected = DashboardQueryData<TQuery>,
    TDefault = never,
  >(
    input: DashboardQueryInput<TQuery, TFilters, TRequired, TSelected> & { defaultValue: TDefault },
  ): [TDefault] extends [NoInfer<TSelected>]
    ? DashboardResource<NoInfer<TSelected>, TFilters, TStage>
    : DashboardKeyError<'defaultValue is not assignable to the query data type.'>
}
