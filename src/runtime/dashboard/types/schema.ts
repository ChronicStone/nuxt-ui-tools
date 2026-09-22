import type { LazyTextValue, Prettify } from '../../shared/types/utils'
import type { DashboardFilterHandles } from './filters'
import type {
  DashboardEmptyMap,
  DashboardParamBuilder,
  DashboardParamEntries,
  DashboardParamEntry,
  DashboardParamMap,
  DashboardParamsInput,
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
  /**
   * Params owned by this scope: a map of params and filter factories (`{ year: yearFilter }`), or
   * a callback receiving the `p` builder and the shared params.
   */
  params?: DashboardParamsInput<TParams, TShared>
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
  | 'filters'
  | 'filtered'
  | 'resetFilters'
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

/**
 * A view: its tab label, its own params, queries and derived values, and (for views declared with
 * `defineDashboardView`) the root params it reads.
 */
export interface DashboardView<
  TParams extends DashboardParamMap,
  TQueries extends DashboardSourceMap,
  TDerive extends DashboardDeriveMap,
  TShared extends DashboardParamMap = DashboardEmptyMap,
> {
  /** Tab label. The lazy form keeps it translation-friendly. */
  readonly label?: LazyTextValue
  /** Root params the view reads, checked against the schema's root params. */
  readonly shared?: DashboardParamEntries<TShared>
  readonly params?: DashboardStoredParams<TParams>
  readonly queries?: (context: never) => TQueries
  readonly derive?: (context: never) => TDerive
}

/** A params input as stored on a declared schema or view. */
type DashboardStoredParams<TParams> =
  | DashboardParamEntries<TParams>
  | ((p: DashboardParamBuilder, context: never) => DashboardParamEntries<TParams>)

/** Loosest params input, for structural constraints. */
type DashboardParamsLike =
  | Record<string, DashboardParamEntry>
  | ((p: DashboardParamBuilder, context: never) => Record<string, DashboardParamEntry>)

export type DashboardViewMap = Record<
  string,
  DashboardView<DashboardParamMap, DashboardSourceMap, DashboardDeriveMap, DashboardParamMap>
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
 * Declares one view inline. Its queries see the shared params plus its own, and its `derive` can
 * read root queries and derived values as well as its own queries.
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

/** Views of a schema: the `view(...)` builder callback, or a map of `defineDashboardView` views. */
export type DashboardViewsInput<TViews, TBuilder> = TViews | ((view: TBuilder) => TViews)

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
  readonly params?: DashboardStoredParams<TParams>
  readonly queries?: (context: never) => TQueries
  readonly derive?: (context: never) => TDerive
  readonly views?: DashboardViewsInput<TViews, never>
  readonly defaultView?: keyof TViews & string
}

/** Structural constraint every schema returned by `defineDashboardSchema` satisfies. */
export interface DashboardSchemaLike {
  readonly key: string
  readonly urlPrefix?: string
  readonly autoRefresh?: number
  readonly params?: DashboardParamsLike
  readonly queries?: (context: never) => DashboardSourceMap
  readonly derive?: (context: never) => DashboardDeriveMap
  readonly views?: DashboardViewsInput<DashboardViewMap, never>
  readonly defaultView?: string
}

/** Structural constraint every view (`defineDashboardView` or the `view(...)` builder) satisfies. */
export interface DashboardViewLike {
  readonly label?: LazyTextValue
  readonly shared?: Record<string, DashboardParamEntry>
  readonly params?: DashboardParamsLike
  readonly queries?: (context: never) => DashboardSourceMap
  readonly derive?: (context: never) => DashboardDeriveMap
}

// ---------------------------------------------------------------------------
// Inferred facade
// ---------------------------------------------------------------------------

/** Output of a builder property: what its callback returns, or the value itself. */
type ResolveBuilderOutput<TInput, TConstraint, TFallback> = [TInput] extends [never]
  ? TFallback
  : TInput extends (...args: never) => infer TOutput
    ? TOutput extends TConstraint
      ? TOutput
      : TFallback
    : TInput extends TConstraint
      ? TInput
      : TFallback

type InferParams<T> = T extends { params?: infer TInput }
  ? ResolveBuilderOutput<
      Exclude<TInput, undefined>,
      Record<string, DashboardParamEntry>,
      DashboardEmptyMap
    >
  : DashboardEmptyMap
type InferShared<T> = T extends { shared?: infer TShared }
  ? [Exclude<TShared, undefined>] extends [never]
    ? DashboardEmptyMap
    : Exclude<TShared, undefined> extends Record<string, DashboardParamEntry>
      ? Exclude<TShared, undefined>
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
type InferViews<T> = T extends { views?: infer TInput }
  ? ResolveBuilderOutput<Exclude<TInput, undefined>, DashboardViewMap, DashboardEmptyMap>
  : DashboardEmptyMap

/** Runtime members shared by the dashboard root and every view handle. */
export interface DashboardScopeMembers<TParams> {
  /** Params of this scope (a view also sees the root params). Writable, `v-model`-ready. */
  readonly params: DashboardParamValues<TParams>
  /**
   * Filter handles of the same params: value, label, display text, option list, and the
   * `toggle` / `reset` actions. Bind them to `UiDashboardFilter` or any control.
   */
  readonly filters: DashboardFilterHandles<TParams>
  /** @deprecated Use `filters`. */
  readonly options: DashboardFilterHandles<TParams>
  /**
   * A filter on screen differs from its default: the root and the current view for the dashboard,
   * the root and the view for a view handle. Headless params are ignored.
   */
  readonly filtered: boolean
  /** Restores the default of every filter `filtered` considers. */
  resetFilters(): void
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

/**
 * Handle of one view: its queries and derived values, and its params and filters merged with the
 * shared ones (`consumption.params.year`).
 */
export type DashboardViewHandle<
  TView,
  TKey extends string,
  TShared = InferShared<TView>,
> = Prettify<
  InferQueries<TView> &
    DashboardDerivedResources<InferDerive<TView>> &
    DashboardScopeMembers<TShared & InferParams<TView>> & { readonly view: DashboardViewMeta<TKey> }
>

type DashboardViewHandles<TViews, TShared> = {
  readonly [K in keyof TViews]: DashboardViewHandle<TViews[K], K & string, TShared>
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
    DashboardViewHandles<InferViews<TSchema>, InferParams<TSchema>> &
    DashboardScopeMembers<InferParams<TSchema>> &
    DashboardRootMembers &
    DashboardRootViewMembers<InferViews<TSchema>> & { readonly schema: TSchema }
>

/**
 * Type of the dashboard `useDashboard(schema)` returns, for props and helpers:
 * `InferDashboard<typeof salesDashboard>`.
 */
export type InferDashboard<TSchema> = DashboardApi<TSchema>

/**
 * Type of the handle `useDashboardView(view)` returns for a view declared with
 * `defineDashboardView`: `InferDashboardView<typeof consumptionView>`.
 */
export type InferDashboardView<TView> = DashboardViewHandle<TView, string>
