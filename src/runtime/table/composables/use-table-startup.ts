import { shallowRef, computed } from 'vue'

type TableStartupPhase = 'booting' | 'scheduled' | 'active'

export function useTableStartup() {
  const phase = shallowRef<TableStartupPhase>('booting')
  const firstFrameId = shallowRef<number | null>(null)
  const secondFrameId = shallowRef<number | null>(null)

  const isBooting = computed(() => phase.value !== 'active')
  const isActive = computed(() => phase.value === 'active')

  function dispose() {
    if (typeof window === 'undefined') return

    if (firstFrameId.value != null) {
      window.cancelAnimationFrame(firstFrameId.value)
      firstFrameId.value = null
    }

    if (secondFrameId.value != null) {
      window.cancelAnimationFrame(secondFrameId.value)
      secondFrameId.value = null
    }
  }

  function start() {
    dispose()
    phase.value = 'active'
  }

  function scheduleStart() {
    if (phase.value === 'active') return
    if (typeof window === 'undefined') {
      start()
      return
    }

    dispose()
    phase.value = 'scheduled'
    firstFrameId.value = window.requestAnimationFrame(() => {
      firstFrameId.value = null
      secondFrameId.value = window.requestAnimationFrame(() => {
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
