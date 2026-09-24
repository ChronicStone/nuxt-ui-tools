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
import type { dashboardFilterBuilder } from '../utils/builders/dashboard-filters'
import type { DashboardCondition } from './resource'

export type DashboardFilterKind =
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
 * Option item shape. It matches Nuxt UI `USelect` / `USelectMenu` items, so filter controls can be
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
 * Where a filter keeps its value.
 *
 * - `'url'` (default): the query string, under the filter's URL key.
 * - `'memory'`: component state, gone on reload.
 * - a `Ref`: an external store, read and written both ways (e.g. a Pinia `storeToRefs` ref).
 * - a getter: an external, read-only source; writes are ignored and the filter is headless.
 *
 * A nullish external value reads as the default value.
 */
export type DashboardFilterSync<TValue> =
  | 'url'
  | 'memory'
  | Ref<TValue | null | undefined>
  | (() => TValue | null | undefined)

/** A value a filter offers as a shortcut: "Last 30 days", "English range". */
export interface DashboardFilterPreset<TValue> {
  label: LazyTextValue
  value: TValue
  icon?: string
  /** Short trailing text: a count, a range. */
  hint?: string
}

/** Presets of a filter: fixed, or read reactively (e.g. from another query's data). */
export type DashboardFilterPresets<TValue> =
  | readonly DashboardFilterPreset<TValue>[]
  | (() => readonly DashboardFilterPreset<TValue>[])

/**
 * A default value, or a getter reading it from data. A getter may return `undefined` while its data
 * loads; the filter type then keeps `undefined` (a list filter falls back to `[]`).
 */
export type DashboardFilterDefault<TValue> = TValue | (() => TValue | undefined)

/** Options shared by every `f.*` builder. `TValue` is the filter value. */
export interface DashboardFilterOptions<TDefault, TValue = unknown> {
  /**
   * Value used when the filter is unset (missing or unparsable URL key, nullish external value).
   * A non-`undefined` default narrows the filter type: `f.string()` is `string | undefined`,
   * `f.string({ defaultValue: '' })` is `string`. Values equal to the default never reach the URL.
   *
   * A getter makes the default follow data, e.g. the top three products of a loaded list: the
   * filter reads it while unset, and a value equal to it keeps following it.
   */
  defaultValue?: TDefault
  /** Where the value lives. Defaults to `'url'`. */
  sync?: DashboardFilterSync<TValue>
  /**
   * Override the URL key. Defaults to the filter key: filters with the same URL key are one
   * filter, so `year` declared by two views keeps its value when the tab changes.
   */
  urlKey?: string
  /** Remove the key from the URL when the value equals the default. Defaults to `true`. */
  omitDefault?: boolean
  /** Router history mode for writes to this filter. Filters default to `'replace'`. */
  historyMode?: HistoryMode
  /** Filter name, shown on its pill and read by assistive tech. Defaults to the filter key. */
  label?: LazyTextValue
  /** Text of an empty selection. Defaults to the localized "All". */
  placeholder?: LazyTextValue
  /**
   * State only: `UiDashboardFilters` does not render it, and `filtered` / `resetFilters()` ignore
   * it. Use it for values driven by the app (a store, a chart drill-down you render yourself).
   */
  headless?: boolean
  /**
   * Whether the filter exists right now, e.g. an account filter only an admin gets. While it is
   * `false` its control leaves every bar, its value reads as the default (queries never send it),
   * and writes are ignored.
   */
  enabled?: DashboardCondition
  /** Shortcuts the filter menu offers under its options; picking one sets the whole value. */
  presets?: DashboardFilterPresets<TValue>
}

/** Presentation of filters whose values have no label of their own (`enum`, `boolean`, `number`…). */
export interface DashboardFilterFormatOptions<TItem> {
  /** Text of one value, in the menu and on the pill. Evaluated reactively. */
  format?: (value: TItem) => string
}

/** Options of filters picked from a list. */
export interface DashboardFilterListOptions {
  /** Menu columns: `3` lays twelve months out as a 3×4 grid. */
  columns?: number
  /**
   * Shows a search field in the menu. Remote lists always search on the server; static lists
   * filter their items locally. Defaults to `true` for remote lists, `false` otherwise.
   */
  searchable?: boolean
}

/** Options of `multiple` filters. */
export interface DashboardFilterMultipleOptions {
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
  /** Cache identity of an inline source. Defaults to a key derived from the filter location. */
  queryKey?: QueryKey
  /** Cache identity of a reusable loader, derived from its endpoint request and current search. */
  queryKeyFor?: (request: DashboardRemoteOptionsRequest) => QueryKey
  /** Cache identity of a selected lookup, including scope absent from the page endpoint. */
  selectedQueryKeyFor?: (request: { values: readonly string[] }) => QueryKey
}

/** Option items of a filter: fixed, or read reactively (e.g. from another query's data). */
export type DashboardFilterItems = readonly DashboardOption[] | (() => readonly DashboardOption[])

/** Runtime view of a filter definition, with its value type erased. */
export interface DashboardRuntimeFilter extends DashboardFilterLike {
  /** Erased codec, in the shape `useQueryStates` accepts for heterogeneous schemas. */
  readonly codec: StaticQueryStateOptions['codec']
  /**
   * The current default: the declared value, or what the default getter returns now.
   * `defaultValue` holds the unset form (the static default, or `undefined` / `[]` for a getter).
   */
  readonly resolveDefault: () => unknown
  readonly sync?: DashboardFilterSync<unknown>
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
  readonly presets?: () => readonly DashboardFilterPreset<unknown>[]
  /** Option items of `f.enum`, `f.options`, `f.boolean`, `f.comparison`, read reactively. */
  readonly items?: () => readonly DashboardOption[]
  /** Remote option source of `f.remote`. */
  readonly remote?: DashboardRemoteOptionsConfig
  /** Points `value` at the filter's state once its dashboard runs. */
  bind(read: () => unknown): void
}

/**
 * Filter definition produced by the `f.*` builders. `defaultValue` carries the resolved value type:
 * it includes `undefined` only when no default was declared.
 */
export type DashboardFilterDefinition<TValue> = Omit<
  DashboardRuntimeFilter,
  'bind' | 'codec' | 'defaultValue' | 'value'
> & {
  readonly codec: QueryCodec<TValue | undefined>
  readonly defaultValue: TValue
  /**
   * Current value, once the dashboard runs (the default before). Read it in another filter's lazy
   * options, e.g. a `format` naming the year before the selected one:
   * `f.boolean({ format: (on) => (on ? String(year.value - 1) : 'None') })`.
   */
  readonly value: TValue
}

/** Structural constraint every filter definition satisfies, whatever its value type. */
export interface DashboardFilterLike {
  readonly kind: DashboardFilterKind
  readonly multiple: boolean
  readonly defaultValue: unknown
  readonly value: unknown
}

/** Filters of a scope, by key. */
export type DashboardFilterMap = Record<string, DashboardFilterLike>

/** Empty map used when a scope declares no filters, queries, or derived values. */
export type DashboardEmptyMap = Record<never, never>

/** Writable values of a filter map. Every property is a `v-model` target. */
export type DashboardFilterValues<TFilters> = {
  -readonly [K in keyof TFilters]: TFilters[K] extends { readonly defaultValue: infer TValue }
    ? TValue
    : never
}

/**
 * Filters of a scope, declared inline with the `f` builder.
 *
 * @example
 * ```ts
 * filters: (f) => {
 *   const year = f.enum([2025, 2026], { defaultValue: 2026, label: 'Year' })
 *   return {
 *     year,
 *     compare: f.boolean({ format: (on) => (on ? String(year.value - 1) : 'None') }),
 *   }
 * }
 * ```
 */
export type DashboardFiltersInput<TFilters> = (f: DashboardFilterBuilder) => TFilters

/** The `f` builder handed to every `filters` callback. */
export type DashboardFilterBuilder = typeof dashboardFilterBuilder
