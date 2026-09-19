import { shallowRef, computed } from 'vue'

import { isNullish } from '../../shared/utils/predicate'

type TableStartupPhase = 'booting' | 'scheduled' | 'active'

export function useTableStartup() {
  const phase = shallowRef<TableStartupPhase>('booting')
  const firstFrameId = shallowRef<number | null>(null)
  const secondFrameId = shallowRef<number | null>(null)

  const isBooting = computed(() => phase.value !== 'active')
  const isActive = computed(() => phase.value === 'active')

  function dispose() {
    if (!('window' in globalThis)) {
      return
    }

    if (!isNullish(firstFrameId.value)) {
      globalThis.window.cancelAnimationFrame(firstFrameId.value)
      firstFrameId.value = null
    }

    if (!isNullish(secondFrameId.value)) {
      globalThis.window.cancelAnimationFrame(secondFrameId.value)
      secondFrameId.value = null
    }
  }

  function start() {
    dispose()
    phase.value = 'active'
  }

  function scheduleStart() {
    if (phase.value === 'active') {
      return
    }
    if (!('window' in globalThis)) {
      start()
      return
    }

    dispose()
    phase.value = 'scheduled'
    firstFrameId.value = globalThis.window.requestAnimationFrame(() => {
      firstFrameId.value = null
      secondFrameId.value = globalThis.window.requestAnimationFrame(() => {
        secondFrameId.value = null
        start()
      })
    })
  }

  return {
    dispose,
    isActive,
    isBooting,
    phase,
    scheduleStart,
    start,
  }
}

export type UseTableStartupReturn = ReturnType<typeof useTableStartup>
