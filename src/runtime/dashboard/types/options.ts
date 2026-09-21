import type { DashboardOption, DashboardOptionParamKeys, DashboardOptionValue } from './params'

/**
 * Props ready to spread onto a Nuxt UI `USelectMenu`:
 * `<USelectMenu v-model="dashboard.params.account" v-bind="dashboard.options.account.menu" />`.
 */
export interface DashboardOptionsMenuBindings<
  TValue extends DashboardOptionValue = DashboardOptionValue,
> {
  items: DashboardOption<TValue>[]
  valueKey: 'value'
  labelKey: 'label'
  loading?: boolean
  searchTerm?: string
  ignoreFilter?: boolean
  'onUpdate:searchTerm'?: (value: string) => void
  'onUpdate:open'?: (value: boolean) => void
}

/**
 * Option state of an option-backed param (`p.enum`, `p.options`, `p.remote`).
 *
 * Remote handles load nothing until `open` becomes `true` (or `search` is set), then page through
 * the source; selected values restored from the URL are hydrated through `resolveSelected`.
 */
export interface DashboardOptionsHandle<
  TValue extends DashboardOptionValue = DashboardOptionValue,
> {
  /** Loaded options merged with the hydrated selected options. */
  readonly items: readonly DashboardOption<TValue>[]
  /** Options matching the current param value, in value order. */
  readonly selected: readonly DashboardOption<TValue>[]
  readonly loading: boolean
  readonly loadingMore: boolean
  readonly hasMore: boolean
  readonly error: unknown
  /** Search term. Writable; remote sources debounce it before loading. */
  search: string
  /** Picker open state. Writable; opening a remote picker starts loading its first page. */
  open: boolean
  loadMore(): void
  refresh(): Promise<void>
  readonly menu: DashboardOptionsMenuBindings<TValue>
}

/** Option value type of a param: its value, or its element type for `multiple` params. */
type DashboardParamOptionValue<TParam> = TParam extends { readonly defaultValue: infer TValue }
  ? Extract<
      NonNullable<TValue> extends readonly (infer TItem)[] ? TItem : NonNullable<TValue>,
      DashboardOptionValue
    >
  : never

export type DashboardOptionsHandles<TParams> = {
  readonly [K in DashboardOptionParamKeys<TParams>]: DashboardOptionsHandle<
    DashboardParamOptionValue<TParams[K]>
  >
}
