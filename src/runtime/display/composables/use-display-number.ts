import { computed } from 'vue'

import { useDisplayLocale } from './use-display-locale'

/** Formats numbers with the locale's grouping and decimals. */
export function useDisplayNumber() {
  const { code } = useDisplayLocale()
  const formatter = computed(() => new Intl.NumberFormat(code.value, { maximumFractionDigits: 2 }))
  return (value: number) => formatter.value.format(value)
}
