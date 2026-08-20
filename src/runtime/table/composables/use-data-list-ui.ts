import { createInjectionState } from '@vueuse/core'
import { computed, type ComputedRef } from 'vue'

import type { DataListControlSize, DataListDensity, DataListUiConfig } from '../types'

const densitySizes = {
  compact: 'sm',
  default: 'md',
  comfortable: 'lg',
} satisfies Record<DataListDensity, DataListControlSize>
const sizeDensities = {
  xs: 'compact',
  sm: 'compact',
  md: 'default',
  lg: 'comfortable',
  xl: 'comfortable',
} satisfies Record<DataListControlSize, DataListDensity>

const [provideDataListUiState, useInjectedDataListUiState] = createInjectionState(
  (ui: ComputedRef<DataListUiConfig>) => {
    const controlSize = computed<DataListControlSize>(
      () => ui.value.control?.size ?? densitySizes[ui.value.density ?? 'default'],
    )
    const density = computed<DataListDensity>(
      () => ui.value.density ?? sizeDensities[controlSize.value],
    )

    return { ui, density, controlSize }
  },
)

export function provideDataListUi(ui: ComputedRef<DataListUiConfig>) {
  return provideDataListUiState(ui)
}

export function useDataListUi() {
  const state = useInjectedDataListUiState()
  if (!state) throw new Error('useDataListUi must be called inside a <DataListRoot> component')
  return state
}
