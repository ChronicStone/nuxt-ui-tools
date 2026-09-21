import type { LazyTextValue, Prettify } from '../../shared/types/utils'
import type { DashboardOptionsHandles } from './options'
import type {
  DashboardEmptyMap,
  DashboardParamBuilder,
  DashboardParamMap,
  DashboardParamValues,
} from './params'
import type {
  DashboardDerived,
  DashboardQueryStage,
  DashboardResourceState,
  DashboardSourceLike,
  DashboardSourceMap,
} from './resource'

/** `derive` entries: each one is a function evaluated reactively into a derived resource. */
export type DashboardDeriveMap = Record<string, () => unknown>

/** Context received by a scope's `queries` builder. */
export interface DashboardQueriesContext<TParams> {
  essential: DashboardQueryStage<'essential'>
  background: DashboardQueryStage<'background'>
  deferred: DashboardQueryStage<'deferred'>
  /** Params visible to this scope (shared params plus the view's own params). */
  params: Readonly<DashboardParamValues<TParams>>
}

/** `data` of every source a `derive` builder can read. */
export type DashboardSourceData<TSources> = {
  readonly [K in keyof TSources]: TSources[K] extends DashboardSourceLike<infer TData>
    ? TData
    : never
}

/** Context received by a scope's `derive` builder. */
export interface DashboardDeriveContext<TParams, TSources> {
  /**
   * Current data of every query visible to this scope. Reads are tracked: a derived value's
   * `state` follows the state of the queries it actually read during its last evaluation.
   */
  data: DashboardSourceData<TSources>
  params: Readonly<DashboardParamValues<TParams>>
}

export type DashboardDerivedResources<TDerive> = {
  readonly [K in keyof TDerive]: TDerive[K] extends () => infer TResult
    ? DashboardDerived<TResult>
    : never
}

/** Params, queries and derived values of one scope (the dashboard root or one view). */
export interface DashboardScopeInput<
  TShared extends DashboardParamMap,
  TVisibleSources,
  TParams extends DashboardParamMap,
  TQueries extends DashboardSourceMap,
  TDerive extends DashboardDeriveMap,
> {
  /** Typed, URL-synced params owned by this scope. */
  params?: (p: DashboardParamBuilder) => TParams
  /** Staged queries owned by this scope. Declared once, when `useDashboard()` runs. */
  queries?: (context: DashboardQueriesContext<TShared & TParams>) => TQueries
  /** Derived values computed from query data, exposed as resources with automatic state. */
  derive?: (
    context: DashboardDeriveContext<TShared & TParams, TVisibleSources & TQueries>,
  ) => TDerive
}

/** Names owned by the runtime on the dashboard root and on every view handle. */
export type DashboardReservedKey =
  | 'params'
  | 'options'
  | 'state'
  | 'refreshing'
  | 'refresh'
  | 'updatedAt'
  | 'autoRefresh'
  | 'view'
  | 'schema'

declare const DashboardKeyErrorBrand: unique symbol

/** Unsatisfiable type. Its hover text is the error message the consumer reads. */
export interface DashboardKeyError<TMessage extends string> {
  readonly [DashboardKeyErrorBrand]: TMessage
}

type Guard<TSlot extends string, TBad, TMessage extends string> = [TBad] extends [never]
  ? unknown
  : { [K in TSlot]: DashboardKeyError<TMessage> }

/** Compile-time collision checks for one scope's queries and derived values. */
export type DashboardScopeGuard<TQueries, TDerive, TTaken = never> = Guard<
  'queries',
  Extract<keyof TQueries, DashboardReservedKey | TTaken>,
  `Query key "${Extract<keyof TQueries, DashboardReservedKey | TTaken> & string}" is reserved or already used.`
> &
  Guard<
    'derive',
    Extract<keyof TDerive, DashboardReservedKey | TTaken | keyof TQueries>,
    `Derived key "${Extract<keyof TDerive, DashboardReservedKey | TTaken | keyof TQueries> & string}" is reserved or already used.`
  >

/** A view declared through the `view(...)` builder. */
export interface DashboardView<
  TParams extends DashboardParamMap,
  TQueries extends DashboardSourceMap,
  TDerive extends DashboardDeriveMap,
> {
  /** Tab label. The lazy form keeps it translation-friendly. */
  readonly label?: LazyTextValue
  readonly params?: (p: DashboardParamBuilder) => TParams
  readonly queries?: (context: never) => TQueries
  readonly derive?: (context: never) => TDerive
}

export type DashboardViewMap = Record<
  string,
  DashboardView<DashboardParamMap, DashboardSourceMap, DashboardDeriveMap>
>

type DashboardViewResult<
  TParams extends DashboardParamMap,
  TQueries extends DashboardSourceMap,
  TDerive extends DashboardDeriveMap,
  TRootSources,
> = [Extract<keyof TQueries | keyof TDerive, DashboardReservedKey | keyof TRootSources>] extends [
  never,
]
  ? [Extract<keyof TDerive, keyof TQueries>] extends [never]
    ? DashboardView<TParams, TQueries, TDerive>
    : DashboardKeyError<`Derived key "${Extract<keyof TDerive, keyof TQueries> & string}" collides with a query of the same view.`>
  : DashboardKeyError<`View member "${Extract<keyof TQueries | keyof TDerive, DashboardReservedKey | keyof TRootSources> & string}" is reserved or collides with a root query or derived value.`>

/**
 * Declares one view. Its queries see the shared params plus its own, and its `derive` can read root
 * queries and derived values as well as its own queries.
 *
 * The result is `NoInfer`: otherwise the contextual `DashboardViewMap` would become an inference
 * candidate, and a view without queries would infer `TQueries` as the open constraint.
 */
export type DashboardViewBuilder<TShared extends DashboardParamMap, TRootSources> = <
  const TParams extends DashboardParamMap = DashboardEmptyMap,
  const TQueries extends DashboardSourceMap = DashboardEmptyMap,
  const TDerive extends DashboardDeriveMap = DashboardEmptyMap,
>(
  view: { label?: LazyTextValue } & DashboardScopeInput<
    TShared,
    TRootSources,
    TParams,
    TQueries,
    TDerive
  >,
) => DashboardViewResult<NoInfer<TParams>, NoInfer<TQueries>, NoInfer<TDerive>, TRootSources>

/** Resolved dashboard schema returned by `defineDashboardSchema`. */
export interface DashboardSchema<
  TParams extends DashboardParamMap = DashboardEmptyMap,
  TQueries extends DashboardSourceMap = DashboardEmptyMap,
  TDerive extends DashboardDeriveMap = DashboardEmptyMap,
  TViews extends DashboardViewMap = DashboardEmptyMap,
> {
  /** Stable identity, used in default query keys and devtools labels. */
  readonly key: string
  /** Prefix prepended to every URL key this dashboard owns. Use it when two dashboards share a page. */
  readonly urlPrefix?: string
  /** Default auto-refresh interval in seconds (`0`: off). */
  readonly autoRefresh?: number
  readonly params?: (p: DashboardParamBuilder) => TParams
  readonly queries?: (context: never) => TQueries
  readonly derive?: (context: never) => TDerive
  readonly views?: (view: never) => TViews
  readonly defaultView?: keyof TViews & string
}

/** Structural constraint every schema returned by `defineDashboardSchema` satisfies. */
export interface DashboardSchemaLike {
  readonly key: string
  readonly urlPrefix?: string
  readonly autoRefresh?: number
  readonly params?: (p: DashboardParamBuilder) => DashboardParamMap
  readonly queries?: (context: never) => DashboardSourceMap
  readonly derive?: (context: never) => DashboardDeriveMap
  readonly views?: (view: never) => DashboardViewMap
  readonly defaultView?: string
}

// ---------------------------------------------------------------------------
// Inferred facade
// ---------------------------------------------------------------------------

type InferParams<T> = T extends { params?: (p: never) => infer TParams }
  ? TParams extends DashboardParamMap
    ? TParams
    : DashboardEmptyMap
  : DashboardEmptyMap
type InferQueries<T> = T extends { queries?: (context: never) => infer TQueries }
  ? TQueries extends DashboardSourceMap
    ? TQueries
    : DashboardEmptyMap
  : DashboardEmptyMap
type InferDerive<T> = T extends { derive?: (context: never) => infer TDerive }
  ? TDerive extends DashboardDeriveMap
    ? TDerive
    : DashboardEmptyMap
  : DashboardEmptyMap
type InferViews<T> = T extends { views?: (view: never) => infer TViews }
  ? TViews extends DashboardViewMap
    ? TViews
    : DashboardEmptyMap
  : DashboardEmptyMap

/** Runtime members shared by the dashboard root and every view handle. */
export interface DashboardScopeMembers<TParams> {
  /** Params owned by this scope. Writable, URL-synced, `v-model`-ready. */
  readonly params: DashboardParamValues<TParams>
  /** Option handles of this scope's option-backed params. */
  readonly options: DashboardOptionsHandles<TParams>
  /**
   * `idle` while the scope has never been active, `error` if an active essential query failed,
   * `loading` while essentials load, `ready` once they all succeeded.
   */
  readonly state: DashboardResourceState
  /** A refresh started by `refresh()` is in flight. */
  readonly refreshing: boolean
  /**
   * Oldest `updatedAt` among the active queries (the dashboard root also counts the current
   * view): everything on screen is at least this fresh. `undefined` until one has loaded.
   */
  readonly updatedAt: number | undefined
  /** Refetches every active query of this scope. */
  refresh(): Promise<void>
}

export interface DashboardViewMeta<TKey extends string> {
  readonly key: TKey
  readonly label: string
  /** The view is the current one. */
  readonly active: boolean
  /** The view has been opened at least once; its queries stay warm afterwards. */
  readonly opened: boolean
}

export interface DashboardViewController<TKey extends string> {
  /** Current view. Writable and URL-synced under `view`. */
  current: TKey
  /** Ordered view descriptors, ready for `UTabs` items. */
  readonly items: readonly { value: TKey; label: string }[]
}

export type DashboardViewHandle<TView, TKey extends string> = Prettify<
  InferQueries<TView> &
    DashboardDerivedResources<InferDerive<TView>> &
    DashboardScopeMembers<InferParams<TView>> & { readonly view: DashboardViewMeta<TKey> }
>

type DashboardViewHandles<TViews> = {
  readonly [K in keyof TViews]: DashboardViewHandle<TViews[K], K & string>
}

/** Runtime members of the dashboard root only. */
export interface DashboardRootMembers {
  /**
   * Auto-refresh interval in seconds, `0` when off. Writable and URL-synced under `refresh`. Every
   * active query refetches on that interval while the page is visible (polling pauses in a
   * background tab); a query's own `refetchInterval` wins.
   */
  autoRefresh: number
}

type DashboardRootViewMembers<TViews> = [keyof TViews] extends [never]
  ? unknown
  : { readonly view: DashboardViewController<keyof TViews & string> }

/** Facade returned by `useDashboard(schema)`. */
export type DashboardApi<TSchema> = Prettify<
  InferQueries<TSchema> &
    DashboardDerivedResources<InferDerive<TSchema>> &
    DashboardViewHandles<InferViews<TSchema>> &
    DashboardScopeMembers<InferParams<TSchema>> &
    DashboardRootMembers &
    DashboardRootViewMembers<InferViews<TSchema>> & { readonly schema: TSchema }
>
