import { computed } from 'vue'

import { useResponsiveValue } from '../../shared/composables/use-responsive-value'
import type { FormApiDisplayMode, FormApiRuntimeInstance } from '../types'
import { normalizeFormOverlayMode } from '../utils/overlay'

export function useFormOverlayLayout(instance: FormApiRuntimeInstance) {
  const responsiveMode = useResponsiveValue(() => instance.mode)
  const displayMode = computed<FormApiDisplayMode>(() =>
    normalizeFormOverlayMode(responsiveMode.value),
  )
  const isDrawer = computed(() => displayMode.value === 'drawer')
  const isFullscreen = computed(() => displayMode.value === 'fullscreen')
  const isModal = computed(() => displayMode.value === 'modal')

  return {
    displayMode,
    isDrawer,
    isFullscreen,
    isModal,
  }
}
