import { createInjectionState } from '@vueuse/core'
import { ref } from 'vue'

const [provideDataListOverlayInsetState, useInjectedDataListOverlayInset] = createInjectionState(
  () => ({ bottom: ref<number>(0) }),
)

/**
 * Shares the height a floating part, such as the mobile selection bar, covers at the bottom of the
 * list, so the scroll areas can end with as much room and their last row scrolls above it.
 */
export function provideDataListOverlayInset() {
  return provideDataListOverlayInsetState()
}

export function useDataListOverlayInset() {
  return useInjectedDataListOverlayInset()
}
