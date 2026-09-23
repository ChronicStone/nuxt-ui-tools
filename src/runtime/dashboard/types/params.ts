import type { QueryKey } from '@tanstack/vue-query'
import type { Ref } from 'vue'

import type { HistoryMode, QueryCodec, StaticQueryStateOptions } from '../../query-state'
import type { QueryDefinition } from '../../shared/types/query'
import type {
  RemoteOptionsPageRequest,
  RemoteOptionsPagination,
  RemoteOptionsResult,
  RemoteOptionsSearch,
} from '../../shared/types/remote-options'
import type { LazyTextValue } from '../../shared/types/utils'
import type { dashboardParamBuilder } from '../utils/builders/dashboard-params'
import type { DashboardCondition } from './resource'

export type DashboardParamKind =
  | 'string'
  | 'number'
  | 'boolean'
  | 'date'
  | 'dateRange'
  | 'enum'
  | 'options'
  | 'remote'
  | 'comparison'
  | 'custom'

/**
 * Period a dashboard compares against: the one right before the current range (`previous`), the
 * same dates a year earlier (`year`), or no comparison (`none`).
 */
export type DashboardComparison = 'previous' | 'year' | 'none'

/** Primitive value a filter can pick. */
export type DashboardOptionValue = string | number | boolean

/**
 * Option item shape. It matches Nuxt UI `USelect` / `USelectMenu` items, so filter handles can be
 * bound to those components directly.
 */
export interface DashboardOption<TValue extends DashboardOptionValue = DashboardOptionValue> {
  value: TValue
  label: string
  description?: string
  /** Short trailing text in filter menus: a count, a code. */
  hint?: string
  icon?: string
  avatar?: { src?: string; alt?: string; text?: string }
  disabled?: boolean
}

export interface DashboardDateRange {
  start: Date
  end: Date
}

/**
 * Where a param keeps its value.
 *
 * - `'url'` (default): the query string, under the param's URL key.
 * - `'memory'`: component state, gone on reload.
 * - a `Ref`: an external store, read and written both ways (e.g. a Pinia `storeToRefs` ref).
 * - a getter: an external, read-only source; writes are ignored and the param is headless.
 *
 * A nullish external value reads as the default value.
 */
export type DashboardParamSync<TValue> =
  | 'url'
  | 'memory'
  | Ref<TValue | null | undefined>
  | (() => TValue | null | undefined)

/** A value a filter offers as a shortcut: "Last 30 days", "English range". */
export interface DashboardParamPreset<TValue> {
  label: LazyTextValue
  value: TValue
  icon?: string
  /** Short trailing text: a count, a range. */
  hint?: string
}

/** Presets of a param: fixed, or read reactively (e.g. from another query's data). */
export type DashboardParamPresets<TValue> =
  | readonly DashboardParamPreset<TValue>[]
  | (() => readonly DashboardParamPreset<TValue>[])

/**
 * A default value, or a getter reading it from data. A getter may return `undefined` while its data
 * loads; the param type then keeps `undefined` (a list param falls back to `[]`).
 */
export type DashboardParamDefault<TValue> = TValue | (() => TValue | undefined)

/** Options shared by every `p.*` builder. `TValue` is the param value. */
export interface DashboardParamOptions<TDefault, TValue = unknown> {
  /**
   * Value used when the param is unset (missing or unparsable URL key, nullish external value).
   * A non-`undefined` default narrows the param type: `p.string()` is `string | undefined`,
   * `p.string({ defaultValue: '' })` is `string`. Values equal to the default never reach the URL.
   *
   * A getter makes the default follow data, e.g. the top three products of a loaded list: the
   * param reads it while unset, and a value equal to it keeps following it.
   */
  defaultValue?: TDefault
  /** Where the value lives. Defaults to `'url'`. */
  sync?: DashboardParamSync<TValue>
  /** Override the URL segment. Defaults to the param name inside its scope prefix. */
  urlKey?: string
  /** Remove the key from the URL when the value equals the default. Defaults to `true`. */
  omitDefault?: boolean
  /** Router history mode for writes to this param. Params default to `'replace'`. */
  historyMode?: HistoryMode
  /** Filter name, shown on its pill and read by assistive tech. Defaults to the param key. */
  label?: LazyTextValue
  /** Text of an empty selection. Defaults to the localized "All". */
  placeholder?: LazyTextValue
  /**
   * State only: `UiDashboardFilters` does not render it, and `filtered` / `resetFilters()` ignore
   * it. Use it for values driven by the app (a store, a chart drill-down you render yourself).
   */
  headless?: boolean
  /**
   * Whether the param exists for the current dashboard state, e.g. an account filter that a
   * client workspace, whose account is fixed, must not show. While it is `false` its filter leaves
   * every bar, its value reads as the default (queries never send it), and writes are ignored.
   */
  enabled?: DashboardCondition
  /** Shortcuts the filter menu offers under its options; picking one sets the whole value. */
  presets?: DashboardParamPresets<TValue>
}

/** Presentation of params whose values have no label of their own (`enum`, `boolean`, `number`…). */
export interface DashboardParamFormatOptions<TItem> {
  /** Text of one value, in the menu and on the pill. Evaluated reactively. */
  format?: (value: TItem) => string
}

/** Options of params a filter picks from a list. */
export interface DashboardParamListOptions {
  /** Menu columns: `3` lays twelve months out as a 3×4 grid. */
  columns?: number
  /**
   * Shows a search field in the menu. Remote lists always search on the server; static lists
   * filter their items locally. Defaults to `true` for remote lists, `false` otherwise.
   */
  searchable?: boolean
}

/** Options of `multiple` params. */
export interface DashboardParamMultipleOptions {
  /** Most values the filter picks; the other items disable once it is reached. */
  max?: number
}

/** Request received by a remote option source. */
export interface DashboardRemoteOptionsRequest {
  /** Current debounced search term. Empty when the menu lists unfiltered options. */
  search: string
  /** Requested page. */
  page: RemoteOptionsPageRequest
}

/**
 * What a remote source returns for one request: a query definition (the dashboard runs its
 * `queryFn`, e.g. a Tuyau / TanStack `queryOptions()` object), or a promise.
 */
export type DashboardRemoteResult<TResult> = QueryDefinition<TResult> | Promise<TResult>

/**
 * Remote option source, following the same contract as the form engine and table filters:
 * server-side search, page or cursor pagination, and hydration of selected values that the loaded
 * pages do not contain (for example ids restored from the URL). `remoteTableOptions()` builds one
 * for any endpoint that speaks the table request protocol.
 */
export interface DashboardRemoteOptionsConfig {
  /** Loads one page of options for the current search term. */
  load: (
    request: DashboardRemoteOptionsRequest,
  ) => DashboardRemoteResult<RemoteOptionsResult<DashboardOption<string>>>
  /** Resolves labels for selected values missing from the loaded pages. */
  resolveSelected?: (request: {
    values: readonly string[]
  }) => DashboardRemoteResult<readonly DashboardOption<string>[]>
  /** Defaults to `{ type: 'page', size: 25 }`. */
  pagination?: RemoteOptionsPagination
  search?: RemoteOptionsSearch
  /** Cache identity of the option source. Defaults to a key derived from the param location. */
  queryKey?: QueryKey
}

/** Option items of a param: fixed, or read reactively (e.g. from another query's data). */
export type DashboardParamItems = readonly DashboardOption[] | (() => readonly DashboardOption[])

/** Runtime view of a param definition, with its value type erased. */
export interface DashboardRuntimeParam extends DashboardParamLike {
  /** Erased codec, in the shape `useQueryStates` accepts for heterogeneous schemas. */
  readonly codec: StaticQueryStateOptions['codec']
  /**
   * The current default: the declared value, or what the default getter returns now.
   * `defaultValue` holds the unset form (the static default, or `undefined` / `[]` for a getter).
   */
  readonly resolveDefault: () => unknown
  readonly sync?: DashboardParamSync<unknown>
  readonly urlKey?: string
  readonly omitDefault?: boolean
  readonly historyMode?: HistoryMode
  readonly label?: LazyTextValue
  readonly placeholder?: LazyTextValue
  readonly headless?: boolean
  readonly enabled?: DashboardCondition
  /** Text of one value. A method, so builders' typed `format` callbacks fit the erased shape. */
  format?(value: unknown): string
  readonly columns?: number
  readonly searchable?: boolean
  readonly max?: number
  /** Presets, read reactively (fixed lists are normalized to getters). */
  readonly presets?: () => readonly DashboardParamPreset<unknown>[]
  /** Option items of `p.enum`, `p.options`, `p.boolean`, `p.comparison`, read reactively. */
  readonly items?: () => readonly DashboardOption[]
  /** Remote option source of `p.remote`. */
  readonly remote?: DashboardRemoteOptionsConfig
}

/**
 * Param definition produced by the `p.*` builders. `defaultValue` carries the resolved value type:
 * it includes `undefined` only when no default was declared.
 */
export type DashboardParamDefinition<TValue> = Omit<
  DashboardRuntimeParam,
  'codec' | 'defaultValue'
> & {
  readonly codec: QueryCodec<TValue | undefined>
  readonly defaultValue: TValue
}

/** Structural constraint every param definition satisfies, whatever its value type. */
export interface DashboardParamLike {
  readonly kind: DashboardParamKind
  readonly multiple: boolean
  readonly defaultValue: unknown
}

/**
 * A param declared lazily: `defineDashboardFilter((p) => p.enum(...))`. The factory runs when
 * `useDashboard()` does, inside component setup, so it may call composables (`useNuxtApp`,
 * `useI18n`, a store).
 */
export type DashboardParamFactory<TParam extends DashboardParamLike = DashboardParamLike> = (
  p: DashboardParamBuilder,
) => TParam

/** One entry of a params map as written: a param, or a factory returning one. */
export type DashboardParamEntry = DashboardParamLike | DashboardParamFactory

/** Params of a scope, by key. */
export type DashboardParamMap = Record<string, DashboardParamLike>

/**
 * A params map as written: each entry is a param or a factory returning it. The mapped form lets
 * inline factories (`{ account: (p) => p.string() }`) get their builder typed while `TParams`
 * infers the params they return.
 */
export type DashboardParamEntries<TParams> = {
  [K in keyof TParams]: TParams[K] | ((p: DashboardParamBuilder) => TParams[K])
}

/** Param definition of a params map entry: the entry itself, or what its factory returns. */
export type DashboardParamOf<TEntry> = TEntry extends (p: never) => infer TParam ? TParam : TEntry

/** Empty map used when a scope declares no params, queries, or derived values. */
export type DashboardEmptyMap = Record<never, never>

/** Writable values of a param map. Every property is a `v-model` target. */
export type DashboardParamValues<TParams> = {
  -readonly [K in keyof TParams]: DashboardParamOf<TParams[K]> extends {
    readonly defaultValue: infer TValue
  }
    ? TValue
    : never
}

/** Context of a scope's `params` callback: the params it shares with the dashboard root. */
export interface DashboardParamsContext<TShared> {
  /** Shared params (the root's, inside a view). Read them in `format` and other lazy options. */
  params: Readonly<DashboardParamValues<TShared>>
}

/**
 * Params of a scope: a map of params and factories, or a callback receiving the `p` builder.
 *
 * @example
 * ```ts
 * params: { year: yearFilter, account: accountFilter }
 * params: (p, { params }) => ({ compare: p.boolean({ format: (on) => (on ? `${params.year - 1}` : 'None') }) })
 * ```
 */
export type DashboardParamsInput<TParams, TShared = DashboardEmptyMap> =
  | DashboardParamEntries<TParams>
  | ((
      p: DashboardParamBuilder,
      context: DashboardParamsContext<TShared>,
    ) => DashboardParamEntries<TParams>)

/** The `p` builder handed to every `params` callback and filter factory. */
export type DashboardParamBuilder = typeof dashboardParamBuilder
