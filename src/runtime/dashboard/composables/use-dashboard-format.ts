import { computed } from 'vue'

import { useUiToolsLocale } from '../../i18n/use-locale'
import { resolveDashboardFormats } from '../utils/charts'

/** Locale-aware default formatters used when a block receives no explicit `format`. */
export function useDashboardFormat() {
  const { code } = useUiToolsLocale()
  const formats = computed(() => resolveDashboardFormats(code.value))
  return {
    delta: computed(() => formats.value.delta),
    number: computed(() => formats.value.number),
    percent: computed(() => formats.value.percent),
  }
}
