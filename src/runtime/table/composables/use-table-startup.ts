import { shallowRef, computed } from 'vue'

type TableStartupPhase = 'booting' | 'scheduled' | 'active'

export function useTableStartup() {
  const phase = shallowRef<TableStartupPhase>('booting')
  const firstFrameId = shallowRef<number | null>(null)
  const secondFrameId = shallowRef<number | null>(null)

  const isBooting = computed(() => phase.value !== 'active')
  const isActive = computed(() => phase.value === 'active')

  function dispose() {
    if (!('window' in globalThis)) return

    if (firstFrameId.value != null) {
      globalThis.window.cancelAnimationFrame(firstFrameId.value)
      firstFrameId.value = null
    }

    if (secondFrameId.value != null) {
      globalThis.window.cancelAnimationFrame(secondFrameId.value)
      secondFrameId.value = null
    }
  }

  function start() {
    dispose()
    phase.value = 'active'
  }

  function scheduleStart() {
    if (phase.value === 'active') return
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
    phase,
    isBooting,
    isActive,
    start,
    scheduleStart,
    dispose,
  }
}

export type UseTableStartupReturn = ReturnType<typeof useTableStartup>
