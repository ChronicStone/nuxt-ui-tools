import { computed, onBeforeUnmount, watch } from 'vue'
import type { ShallowRef } from 'vue'

import { useResponsiveValue } from '../../shared/composables/use-responsive-value'
import type { DashboardBlockActivation, DashboardBlockPhase, DashboardSourceLike } from '../types'
import { parseDashboardSpan, resolveDashboardCellStyle } from '../utils/grid'
import { observeDashboardVisibility } from '../utils/visibility'
import { useDashboardGridContext } from './use-dashboard-ui'

/**
 * Non-visual block behaviour: reduces the source into one render phase, hides the block while its
 * source is `disabled`, activates deferred sources (on mount or when the block nears the viewport),
 * and resolves the grid cell.
 *
 * The phase is a branch, not a mask: while a block is `idle` or `loading`, its real values are not
 * in the DOM at all, so nothing can flash through.
 */
export function useDashboardBlock(params: {
  source: () => DashboardSourceLike | undefined
  empty: () => boolean
  activation: () => DashboardBlockActivation | undefined
  size: () => string | undefined
  root: Readonly<ShallowRef<HTMLElement | null>>
}) {
  /** The source is not part of the dashboard: the block renders nothing and its row closes up. */
  const hidden = computed<boolean>(() => params.source()?.state === 'disabled')
  const phase = computed<DashboardBlockPhase>(() => {
    const source = params.source()
    if (!source) return 'content'
    if (source.state === 'disabled') return 'idle'
    if (source.state !== 'ready') return source.state
    return params.empty() ? 'empty' : 'content'
  })
  /** A request for the source is in flight, in any phase: the card draws its progress bar. */
  const fetching = computed<boolean>(() => {
    const source = params.source()
    return source ? (source.fetching ?? source.refreshing) : false
  })

  const grid = useDashboardGridContext()
  const span = useResponsiveValue(() => params.size() ?? '', 'integer')
  const style = computed(() =>
    grid
      ? resolveDashboardCellStyle({
          columns: grid.columns.value,
          fill: grid.fill.value,
          gap: grid.gap.value,
          span: parseDashboardSpan(span.value),
        })
      : '',
  )

  // Deferred sources start once the rendered block mounts or nears the viewport. A hidden block
  // has no element, so a source disabled at mount waits until it is enabled and shows.
  let stopObserving: (() => void) | undefined
  watch(
    () => params.root.value,
    (element) => {
      stopObserving?.()
      stopObserving = undefined
      const source = params.source()
      const activation = params.activation() ?? 'visible'
      if (!element || !source || activation === 'manual' || !waitsForActivation(source)) return
      if (activation === 'mount' || typeof IntersectionObserver === 'undefined')
        return source.activate()
      stopObserving = observeDashboardVisibility(element, () => params.source()?.activate())
    },
    { flush: 'post', immediate: true },
  )
  onBeforeUnmount(() => stopObserving?.())

  function retry() {
    params
      .source()
      ?.refresh()
      .catch(() => undefined)
  }

  return { fetching, hidden, phase, retry, style }
}

/**
 * Only deferred queries wait for a block to activate them. Derived values may read one, so they are
 * activated too; other queries fetch on their own and need no observer.
 */
function waitsForActivation(source: DashboardSourceLike) {
  return !('stage' in source) || source.stage === 'deferred'
}
