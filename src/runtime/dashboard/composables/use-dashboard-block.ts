import { computed, onBeforeUnmount, onMounted } from 'vue'
import type { ShallowRef } from 'vue'

import { useResponsiveValue } from '../../shared/composables/use-responsive-value'
import type { DashboardBlockActivation, DashboardBlockPhase, DashboardSourceLike } from '../types'
import { observeDashboardVisibility } from '../utils/visibility'

/**
 * Non-visual block behaviour: reduces the source into one render phase, activates deferred sources
 * (on mount or when the block nears the viewport), and resolves the grid placement.
 *
 * The phase is a branch, not a mask: while a block is `idle` or `loading`, its real values are not
 * in the DOM at all, so nothing can flash through.
 */
export function useDashboardBlock(params: {
  source: () => DashboardSourceLike | undefined
  empty: () => boolean
  activation: () => DashboardBlockActivation | undefined
  size: () => string | undefined
  rows: () => string | undefined
  root: Readonly<ShallowRef<HTMLElement | null>>
}) {
  const phase = computed<DashboardBlockPhase>(() => {
    const source = params.source()
    if (!source) return 'content'
    if (source.state !== 'ready') return source.state
    return params.empty() ? 'empty' : 'content'
  })
  const refreshing = computed<boolean>(() => params.source()?.refreshing ?? false)

  const span = useResponsiveValue(() => params.size() ?? '', 'col')
  const rowSpan = useResponsiveValue(() => params.rows() ?? '', 'row')
  const style = computed(() =>
    [span.value ?? 'grid-column: 1 / -1', rowSpan.value].filter(Boolean).join('; '),
  )

  let stopObserving: (() => void) | undefined
  onMounted(() => {
    const source = params.source()
    const activation = params.activation() ?? 'visible'
    if (!source || activation === 'manual' || !waitsForActivation(source)) return
    const element = params.root.value
    if (activation === 'mount' || !element || typeof IntersectionObserver === 'undefined')
      return source.activate()
    stopObserving = observeDashboardVisibility(element, () => params.source()?.activate())
  })
  onBeforeUnmount(() => stopObserving?.())

  function retry() {
    params
      .source()
      ?.refresh()
      .catch(() => undefined)
  }

  return { phase, refreshing, retry, style }
}

/**
 * Only deferred queries wait for a block to activate them. Derived values may read one, so they are
 * activated too; other queries fetch on their own and need no observer.
 */
function waitsForActivation(source: DashboardSourceLike) {
  return !('stage' in source) || source.stage === 'deferred'
}
