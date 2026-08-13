import { createInjectionState } from '@vueuse/core'
import { computed, type ComputedRef } from 'vue'

import type { DataListControlSize, DataListDensity, DataListUiConfig } from '../types'

const densitySizes: Record<DataListDensity, DataListControlSize> = {
  compact: 'sm',
  default: 'md',
  comfortable: 'lg',
}

const [provideDataListUiState, useInjectedDataListUiState] = createInjectionState(
  (ui: ComputedRef<DataListUiConfig>) => {
    const density = computed<DataListDensity>(() => ui.value.density ?? 'default')
    const controlSize = computed<DataListControlSize>(
      () => ui.value.control?.size ?? densitySizes[density.value],
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
