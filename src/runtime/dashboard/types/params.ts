import type { QueryKey } from '@tanstack/vue-query'

import type { HistoryMode, QueryCodec, StaticQueryStateOptions } from '../../query-state'
import type {
  RemoteOptionsPageRequest,
  RemoteOptionsPagination,
  RemoteOptionsResult,
  RemoteOptionsSearch,
} from '../../shared/types/remote-options'
import type { dashboardParamBuilder } from '../utils/builders/dashboard-params'

export type DashboardParamKind =
  | 'string'
  | 'number'
  | 'boolean'
  | 'date'
  | 'dateRange'
  | 'enum'
  | 'options'
  | 'remote'
  | 'custom'

/** Primitive value an option-backed param can hold. */
export type DashboardOptionValue = string | number

/**
 * Option item shape. It matches Nuxt UI `USelect` / `USelectMenu` items, so option handles can be
 * bound to those components directly.
 */
export interface DashboardOption<TValue extends DashboardOptionValue = DashboardOptionValue> {
  value: TValue
  label: string
  description?: string
  icon?: string
  avatar?: { src?: string; alt?: string; text?: string }
  disabled?: boolean
}

export interface DashboardDateRange {
  start: Date
  end: Date
}

/** Options shared by every `p.*` param builder. */
export interface DashboardParamOptions<TDefault> {
  /**
   * Value used when the URL key is absent or cannot be parsed.
   * A non-`undefined` default narrows the param type: `p.string()` is `string | undefined`,
   * `p.string({ defaultValue: '' })` is `string`. Values equal to the default never reach the URL.
   */
  defaultValue?: TDefault
  /** Override the URL segment. Defaults to the param name inside its scope prefix. */
  urlKey?: string
  /** Remove the key from the URL when the value equals the default. Defaults to `true`. */
  omitDefault?: boolean
  /** Router history mode for writes to this param. Params default to `'replace'`. */
  historyMode?: HistoryMode
}

/** Request received by a remote option source. */
export interface DashboardRemoteOptionsRequest {
  /** Current debounced search term. Empty when the menu lists unfiltered options. */
  search: string
  /** Requested page. */
  page: RemoteOptionsPageRequest
}

/**
 * Remote option source, following the same contract as the form engine's remote options:
 * server-side search, page or cursor pagination, and hydration of selected values that the loaded
 * pages do not contain (for example ids restored from the URL).
 */
export interface DashboardRemoteOptionsConfig {
  /** Loads one page of options for the current search term. */
  load: (
    request: DashboardRemoteOptionsRequest,
  ) => Promise<RemoteOptionsResult<DashboardOption<string>>>
  /** Resolves labels for selected values missing from the loaded pages. */
  resolveSelected?: (request: {
    values: readonly string[]
  }) => Promise<readonly DashboardOption<string>[]>
  /** Defaults to `{ type: 'page', size: 25 }`. */
  pagination?: RemoteOptionsPagination
  search?: RemoteOptionsSearch
  /** Cache identity of the option source. Defaults to a key derived from the param location. */
  queryKey?: QueryKey
}

/** Runtime view of a param definition, with its value type erased. */
export interface DashboardRuntimeParam extends DashboardParamLike {
  /** Erased codec, in the shape `useQueryStates` accepts for heterogeneous schemas. */
  readonly codec: StaticQueryStateOptions['codec']
  readonly urlKey?: string
  readonly omitDefault?: boolean
  readonly historyMode?: HistoryMode
  /** Static option items for `p.enum` and `p.options`. */
  readonly items?: readonly DashboardOption[]
  /** Remote option source for `p.remote`. */
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

export type DashboardParamMap = Record<string, DashboardParamLike>

/** Empty map used when a scope declares no params, queries, or derived values. */
export type DashboardEmptyMap = Record<never, never>

/** Writable, URL-synced values of a param map. Every property is a `v-model` target. */
export type DashboardParamValues<TParams> = {
  -readonly [K in keyof TParams]: TParams[K] extends { readonly defaultValue: infer TValue }
    ? TValue
    : never
}

/** Keys of params that carry option items (`p.enum`, `p.options`, `p.remote`). */
export type DashboardOptionParamKeys<TParams> = {
  [K in keyof TParams]: TParams[K] extends { readonly kind: 'enum' | 'options' | 'remote' }
    ? K
    : never
}[keyof TParams]

/** The `p` builder handed to every `params` callback. */
export type DashboardParamBuilder = typeof dashboardParamBuilder
