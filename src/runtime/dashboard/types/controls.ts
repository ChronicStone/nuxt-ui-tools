import type { DashboardFilterKind, DashboardOption, DashboardOptionValue } from './filters'

/**
 * Props ready to spread onto a Nuxt UI `USelectMenu`:
 * `<USelectMenu v-model="dashboard.filters.account" v-bind="dashboard.controls.account.menu" />`.
 */
export interface DashboardOptionsMenuBindings<
  TValue extends DashboardOptionValue = DashboardOptionValue,
> {
  items: DashboardOption<TValue>[]
  valueKey: 'value'
  labelKey: 'label'
  multiple: boolean
  loading?: boolean
  searchTerm?: string
  ignoreFilter?: boolean
  'onUpdate:searchTerm'?: (value: string) => void
  'onUpdate:open'?: (value: boolean) => void
}

/** A preset as the control exposes it: resolved text, and whether the value matches it. */
export interface DashboardControlPreset<TValue = unknown> {
  label: string
  value: TValue
  icon?: string
  hint?: string
  /** The filter's value is this preset's. */
  active: boolean
  /** Sets the filter's value to this preset's. */
  apply: () => void
}

/**
 * Everything a control needs to drive one filter: its value, how to present it, its option list,
 * and the actions a picker performs. `UiDashboardFilter` renders one; any other component can bind
 * to it directly.
 *
 * Remote lists load nothing until `open` becomes `true` (or `search` is set), then page through the
 * source; selected values restored from the URL are hydrated through `resolveSelected`.
 */
export interface DashboardFilterControl<
  TValue = unknown,
  TItem extends DashboardOptionValue = DashboardOptionValue,
> {
  readonly key: string
  readonly kind: DashboardFilterKind
  readonly multiple: boolean
  /** Not rendered by `UiDashboardFilters`; ignored by `filtered` and `resetFilters()`. */
  readonly headless: boolean
  /**
   * The filter's `enabled` condition holds. A disabled filter is out of every bar, reads its
   * default, and ignores writes.
   */
  readonly enabled: boolean
  /** Filter name. */
  readonly label: string
  /** Text of an empty selection ("All"). */
  readonly placeholder: string
  /** Current value. Writable; `null` / `undefined` restore the default. */
  value: TValue
  readonly defaultValue: TValue
  /** The value differs from the default. */
  readonly changed: boolean
  /** Text of the current value: selected labels, or the placeholder. */
  readonly display: string
  /** Options matching the current search: loaded pages and hydrated selected options for remote lists. */
  readonly items: readonly DashboardOption<TItem>[]
  /** Options of the current value, in value order. */
  readonly selected: readonly DashboardOption<TItem>[]
  /** Menu columns declared on the filter. */
  readonly columns: number | undefined
  readonly searchable: boolean
  /** Most values a `multiple` filter picks. */
  readonly max: number | undefined
  /** `value` is, or contains, this option value. */
  isSelected(value: TItem): boolean
  /**
   * Picks an option. Multiple filters add or remove it (in item order, up to `max`); single filters
   * take it as their value.
   */
  toggle(value: TItem): void
  /** Restores the default value. */
  reset(): void
  /** Shortcut values declared with `presets`. */
  readonly presets: readonly DashboardControlPreset<TValue>[]
  readonly loading: boolean
  readonly loadingMore: boolean
  readonly hasMore: boolean
  readonly error: unknown
  /** Search term. Writable; remote sources debounce it before loading. */
  search: string
  /**
   * A picker shows the list. Writable; setting it starts loading a remote list's first page.
   * `UiDashboardFilter` sets it while its menu is open.
   */
  open: boolean
  loadMore(): void
  refresh(): Promise<void>
  readonly menu: DashboardOptionsMenuBindings<TItem>
}

/** Value a filter picks from its list: its value, or its element type for `multiple` filters. */
type DashboardControlItem<TFilter> = TFilter extends { readonly defaultValue: infer TValue }
  ? Extract<
      NonNullable<TValue> extends readonly (infer TItem)[] ? TItem : NonNullable<TValue>,
      DashboardOptionValue
    >
  : never

type DashboardControlValue<TFilter> = TFilter extends { readonly defaultValue: infer TValue }
  ? TValue
  : never

/** Controls of a filter map, by filter key. */
export type DashboardFilterControls<TFilters> = {
  readonly [K in keyof TFilters]: DashboardFilterControl<
    DashboardControlValue<TFilters[K]>,
    DashboardControlItem<TFilters[K]>
  >
}

/** What a filter bar drives: a dashboard (its root and current view) or one view handle. */
export interface DashboardFiltersTarget {
  readonly controls: Readonly<Record<string, DashboardFilterControl>>
  readonly filtered: boolean
  resetFilters(): void
  /** The dashboard's view controller; view handles carry their own meta, without `current`. */
  readonly view?: { readonly current?: string }
}

type DashboardControlsOf<TTarget> = TTarget extends { readonly controls: infer TControls }
  ? TControls
  : never

/** Keys of every filter a bar may show: the root's, and those of each view. */
export type DashboardFilterKeysOf<TTarget> =
  | keyof DashboardControlsOf<TTarget>
  | (TTarget extends { readonly view: { readonly current: infer TKey } }
      ? TKey extends keyof TTarget
        ? keyof DashboardControlsOf<TTarget[TKey]>
        : never
      : never)
