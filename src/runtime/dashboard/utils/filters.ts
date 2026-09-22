import { isRef } from 'vue'

import { isBoolean, isDate, isNumber, isObject, isString } from '../../shared/utils/predicate'
import type {
  DashboardFilterHandle,
  DashboardFilterUi,
  DashboardOptionValue,
  DashboardParamKind,
  DashboardRuntimeParam,
} from '../types'

/** Params whose filter picks from a list, in a menu. The others show their value only. */
const DASHBOARD_LISTED_KINDS: ReadonlySet<DashboardParamKind> = new Set([
  'boolean',
  'comparison',
  'enum',
  'options',
  'remote',
])

/** The filter has a menu: options to pick from, or presets. */
export function hasDashboardFilterMenu(filter: Pick<DashboardFilterHandle, 'kind' | 'presets'>) {
  return DASHBOARD_LISTED_KINDS.has(filter.kind) || filter.presets.length > 0
}

/**
 * Default classes of `UiDashboardFilter`. Pills are 32px high, menus dense (28px rows, 13px text;
 * taller rows on touch screens only). An active pill takes the `--nut-dash-filter-*` tokens.
 */
export const DASHBOARD_FILTER_CLASSES = {
  avatar:
    'inline-grid size-[18px] flex-none place-items-center rounded-[4px] bg-muted text-[8.5px] font-semibold text-muted',
  button:
    'inline-flex h-7 flex-none items-center justify-center gap-1.5 rounded-[7px] border border-default bg-default px-2.5 text-[12.5px] font-medium whitespace-nowrap text-default transition-colors outline-none hover:bg-elevated/60 focus-visible:ring-2 focus-visible:ring-primary',
  check:
    'inline-grid size-3.5 flex-none place-items-center rounded-[4px] border border-accented bg-default text-transparent transition-colors data-[checked]:border-primary data-[checked]:bg-primary data-[checked]:text-inverted',
  chevron: 'size-3.5 flex-none text-dimmed',
  clear:
    'ms-px me-[5px] inline-grid size-5 flex-none place-items-center rounded-full text-[var(--nut-dash-filter-ink)] outline-none hover:bg-[var(--nut-dash-filter-active-line)] focus-visible:ring-2 focus-visible:ring-primary',
  content:
    'min-w-[max(160px,var(--reka-popover-trigger-width,0px))] max-w-[min(320px,calc(100vw-24px))] p-1 text-[13px]',
  hint: 'ms-auto shrink-0 ps-2 text-[11px] text-dimmed tabular-nums',
  item: 'flex h-7 w-full min-w-0 items-center gap-2 rounded-[4px] px-2 text-start text-[13px] text-default outline-none hover:bg-[var(--nut-dash-row-hover)] focus-visible:bg-[var(--nut-dash-row-hover)] disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:bg-transparent data-[selected]:font-medium pointer-coarse:h-9',
  label: 'text-muted',
  list: 'max-h-[300px] overflow-y-auto overscroll-contain',
  note: 'flex items-center justify-center px-2 py-1.5 text-xs text-dimmed',
  // The trigger's keyboard focus rings the whole pill, clear button included.
  root: 'group/filter inline-flex h-8 max-w-full flex-none items-center rounded-[7px] border border-default bg-default text-[13px] whitespace-nowrap transition-[background-color,border-color] duration-150 hover:bg-elevated/60 has-[[data-dashboard-filter-trigger]:focus-visible]:ring-2 has-[[data-dashboard-filter-trigger]:focus-visible]:ring-primary data-[active]:border-[var(--nut-dash-filter-active-line)] data-[active]:bg-[var(--nut-dash-filter-active)] data-[active]:hover:bg-[var(--nut-dash-filter-active)]',
  search:
    'mb-1 flex h-7 items-center gap-1.5 rounded-md border border-default px-2 focus-within:border-primary',
  separator: 'my-1 h-px bg-[var(--ui-border-muted)]',
  tick: 'ms-auto size-3.5 flex-none text-[var(--nut-dash-filter-ink)]',
  title: 'px-2 pt-1 pb-1 text-[11.5px] font-medium text-muted',
  trigger:
    'inline-flex h-full min-w-0 items-center gap-1.5 rounded-[6px] ps-[11px] pe-[9px] outline-none group-data-[active]/filter:pe-1',
  value:
    'max-w-[200px] min-w-0 truncate font-medium text-default group-data-[active]/filter:text-[var(--nut-dash-filter-ink)]',
} satisfies Required<DashboardFilterUi>

/**
 * The param is state only: declared `headless`, or read from a getter (a read-only source no filter
 * can drive).
 */
export function isDashboardParamHeadless(definition: DashboardRuntimeParam) {
  const { sync } = definition
  if (definition.headless === true) return true
  return sync !== undefined && sync !== 'url' && sync !== 'memory' && !isRef(sync)
}

/** A value a filter can pick from a list: a string, a number, or a boolean. */
export function isDashboardOptionValue(value: unknown): value is DashboardOptionValue {
  return isString(value) || isNumber(value) || isBoolean(value)
}

/**
 * Default text of a param value without an option label: dates and ranges in the locale's medium
 * style, numbers with its grouping, lists joined.
 */
export function formatDashboardParamValue(value: unknown, locale: string): string {
  if (Array.isArray(value))
    return value.map((entry) => formatDashboardParamValue(entry, locale)).join(', ')
  if (isDate(value)) return new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(value)
  if (isNumber(value)) return new Intl.NumberFormat(locale).format(value)
  if (isObject(value) && isDate(value.start) && isDate(value.end))
    return new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).formatRange(
      value.start,
      value.end,
    )
  return String(value ?? '')
}
