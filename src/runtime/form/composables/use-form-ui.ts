import { createInjectionState } from '@vueuse/core'
import { computed, type ComputedRef } from 'vue'

import type { FormControlSize, FormDensity, FormUiConfig } from '../types'

const densitySizes: Record<FormDensity, FormControlSize> = {
  compact: 'sm',
  default: 'md',
  comfortable: 'lg',
}

const [provideFormUiState, useInjectedFormUiState] = createInjectionState(
  (ui: ComputedRef<FormUiConfig>) => {
    const density = computed<FormDensity>(() => ui.value.density ?? 'default')
    const controlSize = computed<FormControlSize>(
      () => ui.value.control?.size ?? densitySizes[density.value],
    )

    return { ui, density, controlSize }
  },
)

export function provideFormUi(ui: ComputedRef<FormUiConfig>) {
  return provideFormUiState(ui)
}

export function useFormUi() {
  const state = useInjectedFormUiState()
  if (!state) throw new Error('useFormUi must be called inside a <NutForm> component')
  return state
}
