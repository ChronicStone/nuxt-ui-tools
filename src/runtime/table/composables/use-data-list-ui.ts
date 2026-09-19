import { createInjectionState } from '@vueuse/core'
import { computed } from 'vue'
import type { ComputedRef } from 'vue'

import type { DataListControlSize, DataListDensity, DataListUiConfig } from '../types'

const densitySizes = {
  comfortable: 'lg',
  compact: 'sm',
  default: 'md',
} satisfies Record<DataListDensity, DataListControlSize>
const sizeDensities = {
  lg: 'comfortable',
  md: 'default',
  sm: 'compact',
  xl: 'comfortable',
  xs: 'compact',
} satisfies Record<DataListControlSize, DataListDensity>

const [provideDataListUiState, useInjectedDataListUiState] = createInjectionState(
  (ui: ComputedRef<DataListUiConfig>) => {
    const controlSize = computed<DataListControlSize>(
      () => ui.value.control?.size ?? densitySizes[ui.value.density ?? 'default'],
    )
    const density = computed<DataListDensity>(
      () => ui.value.density ?? sizeDensities[controlSize.value],
    )

    return { controlSize, density, ui }
  },
)

export function provideDataListUi(ui: ComputedRef<DataListUiConfig>) {
  return provideDataListUiState(ui)
}

export function useDataListUi() {
  const state = useInjectedDataListUiState()
  if (!state) {
    throw new Error('useDataListUi must be called inside a <DataListRoot> component')
  }
  return state
}
