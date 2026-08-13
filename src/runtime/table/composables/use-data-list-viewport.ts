import { createInjectionState } from '@vueuse/core'
import type { Ref } from 'vue'

const [provideDataListViewportState, useInjectedDataListViewportState] = createInjectionState(
  (element: Ref<HTMLElement | null>) => ({ element }),
)

export function provideDataListViewport(element: Ref<HTMLElement | null>) {
  return provideDataListViewportState(element)
}

export function useDataListViewport() {
  const state = useInjectedDataListViewportState()
  if (!state) throw new Error('useDataListViewport must be called inside <DataListContent>')
  return state
}
