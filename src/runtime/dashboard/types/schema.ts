import type { LazyTextValue, Prettify } from '../../shared/types/utils'
import type { DashboardFilterControls } from './controls'
import type {
  DashboardEmptyMap,
  DashboardFilterBuilder,
  DashboardFilterLike,
  DashboardFilterMap,
  DashboardFiltersInput,
  DashboardFilterValues,
} from './filters'
import type {
  DashboardCondition,
  DashboardDerived,
  DashboardQueryStage,
  DashboardResourceState,
  DashboardSourceLike,
  DashboardSourceMap,
} from './resource'

/** `derive` entries: each one is a function evaluated reactively into a derived resource. */
export type DashboardDeriveMap = Record<string, () => unknown>

/** Context received by a scope's `queries` builder. */
export interface DashboardQueriesContext<TFilters> {
  essential: DashboardQueryStage<'essential'>
  background: DashboardQueryStage<'background'>
  deferred: DashboardQueryStage<'deferred'>
  /** Values of the scope's filters. */
  filters: Readonly<DashboardFilterValues<TFilters>>
}

/** `data` of every source a `derive` builder can read. */
export type DashboardSourceData<TSources> = {
  readonly [K in keyof TSources]: TSources[K] extends DashboardSourceLike<infer TData>
    ? TData
    : never
}

/** Context received by a scope's `derive` builder. */
export interface DashboardDeriveContext<TFilters, TSources> {
  /**
   * Current data of every query of this scope. Reads are tracked: a derived value's `state` follows
   * the state of the queries it actually read during its last evaluation.
   */
  data: DashboardSourceData<TSources>
  filters: Readonly<DashboardFilterValues<TFilters>>
}

export type DashboardDerivedResources<TDerive> = {
  readonly [K in keyof TDerive]: TDerive[K] extends () => infer TResult
    ? DashboardDerived<TResult>
    : never
}

/** Filters, queries and derived values of one scope (the dashboard root or one view). */
export interface DashboardScopeInput<
  TFilters extends DashboardFilterMap,
  TQueries extends DashboardSourceMap,
  TDerive extends DashboardDeriveMap,
> {
  /**
   * Filters of this scope, declared inline with the `f` builder. A filter key names one state across
   * the dashboard: two views declaring `year` share its value, so it survives a tab change.
   */
  filters?: DashboardFiltersInput<TFilters>
  /** Staged queries of this scope. Declared once, when `useDashboard()` runs. */
  queries?: (context: DashboardQueriesContext<TFilters>) => TQueries
  /** Derived values computed from query data, exposed as resources with automatic state. */
  derive?: (context: DashboardDeriveContext<TFilters, TQueries>) => TDerive
}

/** Names owned by the runtime on the dashboard root and on every view handle. */
export type DashboardReservedKey =
  | 'filters'
  | 'controls'
  | 'filtered'
  | 'resetFilters'
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

/** A view (tab): its label, its own filters, queries and derived values. */
export interface DashboardView<
  TFilters extends DashboardFilterMap,
  TQueries extends DashboardSourceMap,
  TDerive extends DashboardDeriveMap,
> {
  /** Tab label. The lazy form keeps it translation-friendly. */
  readonly label?: LazyTextValue
  /** Availability of the view (see `defineDashboardView`). */
  readonly enabled?: DashboardCondition
  readonly filters?: (f: DashboardFilterBuilder) => TFilters
  readonly queries?: (context: never) => TQueries
  readonly derive?: (context: never) => TDerive
}

/** Loosest filters input, for structural constraints. */
type DashboardFiltersLike = (f: DashboardFilterBuilder) => Record<string, DashboardFilterLike>

export type DashboardViewMap = Record<
  string,
  DashboardView<DashboardFilterMap, DashboardSourceMap, DashboardDeriveMap>
>

/** Resolved dashboard schema returned by `defineDashboardSchema`. */
export interface DashboardSchema<
  TFilters extends DashboardFilterMap = DashboardEmptyMap,
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
  readonly filters?: (f: DashboardFilterBuilder) => TFilters
  readonly queries?: (context: never) => TQueries
  readonly derive?: (context: never) => TDerive
  readonly views?: TViews
  readonly defaultView?: keyof TViews & string
  readonly badges?: (context: never) => DashboardViewBadges<keyof TViews & string>
}

/** Structural constraint every schema returned by `defineDashboardSchema` satisfies. */
export interface DashboardSchemaLike {
  readonly key: string
  readonly urlPrefix?: string
  readonly autoRefresh?: number
  readonly filters?: DashboardFiltersLike
  readonly queries?: (context: never) => DashboardSourceMap
  readonly derive?: (context: never) => DashboardDeriveMap
  readonly views?: DashboardViewMap
  readonly defaultView?: string
  readonly badges?: (context: never) => DashboardViewBadges<string>
}

/** Structural constraint every view returned by `defineDashboardView` satisfies. */
export interface DashboardViewLike {
  readonly label?: LazyTextValue
  readonly enabled?: DashboardCondition
  readonly filters?: DashboardFiltersLike
  readonly queries?: (context: never) => DashboardSourceMap
  readonly derive?: (context: never) => DashboardDeriveMap
}

/**
 * A schema, or a function returning one: `salesSchema`, `accountSchema` (which takes the account),
 * `() => accountSchema({ accountId })`.
 */
export type DashboardSchemaInput = DashboardSchemaLike | ((...args: never[]) => DashboardSchemaLike)

/** The schema a `DashboardSchemaInput` describes: the object, or what the function returns. */
export type DashboardSchemaOf<TInput> = TInput extends (...args: never[]) => infer TSchema
  ? TSchema
  : TInput

/** A view, or a function returning one: `consumptionView` (which takes the workspace). */
export type DashboardViewInput = DashboardViewLike | ((...args: never[]) => DashboardViewLike)

/** The view a `DashboardViewInput` describes: the object, or what the function returns. */
export type DashboardViewOf<TInput> = TInput extends (...args: never[]) => infer TView
  ? TView
  : TInput

// ---------------------------------------------------------------------------
// Inferred facade
// ---------------------------------------------------------------------------

type InferFilters<T> = T extends { filters?: (f: never) => infer TFilters }
  ? TFilters extends DashboardFilterMap
    ? TFilters
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
type InferViews<T> = T extends { views?: infer TViews }
  ? Exclude<TViews, undefined> extends DashboardViewMap
    ? Exclude<TViews, undefined>
    : DashboardEmptyMap
  : DashboardEmptyMap

/** Runtime members shared by the dashboard root and every view handle. */
export interface DashboardScopeMembers<TFilters> {
  /** Values of the scope's filters. Writable, `v-model`-ready: `consumption.filters.year`. */
  readonly filters: DashboardFilterValues<TFilters>
  /**
   * Controls of the same filters: label, display text, option list, and the `toggle` / `reset`
   * actions. Bind them to `UiDashboardFilter`, a chart's `series`, or any control.
   */
  readonly controls: DashboardFilterControls<TFilters>
  /**
   * A filter on screen differs from its default: the root's and the current view's for the
   * dashboard, the view's own for a view handle. Headless filters are ignored.
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

/** What a view's `badge` returns: a count or a short text; empty values show nothing. */
export type DashboardViewBadge = number | string | null | undefined

/** Badges of a dashboard's views, by view key; a view left out shows none. */
export type DashboardViewBadges<TKey extends string> = { readonly [K in TKey]?: DashboardViewBadge }

/** Context received by a schema's `badges`: the data of its root queries and derived values. */
export interface DashboardBadgesContext<TFilters, TSources> {
  data: DashboardSourceData<TSources>
  filters: Readonly<DashboardFilterValues<TFilters>>
}

/** One tab of a dashboard's views. */
export interface DashboardViewItem<TKey extends string> {
  value: TKey
  label: string
  /** The view's badge (see the schema's `badges`), when it shows something. */
  badge?: number | string
}

export interface DashboardViewMeta<TKey extends string> {
  readonly key: TKey
  readonly label: string
  /** The view's badge (see the schema's `badges`), when it shows something. */
  readonly badge: number | string | undefined
  /** The view is the current one. */
  readonly active: boolean
  /** The view's `enabled` condition holds. A disabled view has no tab and cannot be current. */
  readonly enabled: boolean
  /** The view has been opened at least once; its queries stay warm afterwards. */
  readonly opened: boolean
}

export interface DashboardViewController<TKey extends string> {
  /**
   * Current view. Writable and URL-synced under `view`. Always an enabled view: a URL naming a
   * disabled one reads as the default view (or the first enabled), and writing a disabled view is
   * ignored.
   */
  current: TKey
  /** Enabled views in declaration order, ready for `UTabs` items. */
  readonly items: readonly DashboardViewItem<TKey>[]
}

/** Handle of one view: its queries, derived values and filters (`consumption.filters.year`). */
export type DashboardViewHandle<TView, TKey extends string> = Prettify<
  InferQueries<TView> &
    DashboardDerivedResources<InferDerive<TView>> &
    DashboardScopeMembers<InferFilters<TView>> & { readonly view: DashboardViewMeta<TKey> }
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
    DashboardScopeMembers<InferFilters<TSchema>> &
    DashboardRootMembers &
    DashboardRootViewMembers<InferViews<TSchema>> & { readonly schema: TSchema }
>

/**
 * Type of the dashboard `useDashboard` returns, for props and helpers:
 * `InferDashboard<typeof accountSchema>` (a schema function) or `InferDashboard<typeof salesSchema>`.
 */
export type InferDashboard<TInput> = DashboardApi<DashboardSchemaOf<TInput>>

/**
 * Type of the handle `useDashboardView` returns: `InferDashboardView<typeof consumptionView>` (a
 * view function) or the type of a view object.
 */
export type InferDashboardView<TInput> = DashboardViewHandle<DashboardViewOf<TInput>, string>
