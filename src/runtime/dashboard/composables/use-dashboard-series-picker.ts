import { computed } from 'vue'

import { useUiToolsLocale } from '../../i18n/use-locale'
import type { DashboardFilterControl, DashboardOptionValue, DashboardSeries } from '../types'
import { DASHBOARD_PALETTE_SIZE, resolveDashboardColor } from '../utils/charts'
import { resolveDashboardFilterSeries } from '../utils/filters'

/**
 * Series of an XY chart: the declared list, or one series per option a filter picks. With a filter,
 * the chart draws the picker (add from the options, presets) and one removable chip per series, in
 * the series' own color, in place of the legend.
 */
export function useDashboardSeriesPicker<TRow, TItem extends DashboardOptionValue>(params: {
  series: () => readonly DashboardSeries<TRow>[] | DashboardFilterControl<unknown, TItem>
  value: () => ((row: TRow, item: TItem) => number | null | undefined) | undefined
}) {
  const { t } = useUiToolsLocale()
  const picker = computed(() => {
    const declared = params.series()
    return isSeriesList(declared) ? undefined : declared
  })
  const series = computed<readonly DashboardSeries<TRow>[]>(() => {
    const declared = params.series()
    return isSeriesList(declared)
      ? declared
      : resolveDashboardFilterSeries(declared, params.value())
  })
  const chips = computed(() => {
    const filter = picker.value
    if (!filter) return []
    return filter.selected.map((option, index) => ({
      color: resolveDashboardColor(`series-${(index % DASHBOARD_PALETTE_SIZE) + 1}`, index),
      key: String(option.value),
      label: option.label,
      remove: () => filter.toggle(option.value),
      removeLabel: t('dashboard.series.remove', { label: option.label }),
    }))
  })
  return { chips, picker, series }
}

function isSeriesList<TRow, TItem extends DashboardOptionValue>(
  value: readonly DashboardSeries<TRow>[] | DashboardFilterControl<unknown, TItem>,
): value is readonly DashboardSeries<TRow>[] {
  return Array.isArray(value)
}
