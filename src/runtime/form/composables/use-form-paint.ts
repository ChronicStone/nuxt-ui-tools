import { getCurrentScope, ref } from 'vue'

import type { FormPaintGate } from '../types'

/** Time one render may spend building live controls before the rows that follow render inert. */
const LIVE_RENDER_BUDGET_MS = 50

/**
 * Holds work that does not change what the form shows, such as field watchers, until the form has
 * painted: the form renders everything in one task and pays for that work right after its first
 * frame. Work queued once the form has painted runs at once.
 *
 * It also measures how long the render of the current frame has run, from the creation of the form
 * for its first render and from the first question for a later one, so a large render builds live
 * controls within a budget and renders the rest inert. On the server nothing is deferred or
 * measured.
 */
export function createFormPaintGate(options: { defer: boolean }): FormPaintGate {
  const painted = ref<boolean>(!options.defer)
  const tasks: (() => void)[] = []
  let started = false
  let renderStart: number | null = null
  if (options.defer) {
    openRender()
  }

  function afterPaint(task: () => void) {
    if (painted.value) {
      task()
      return
    }
    const scope = getCurrentScope()
    tasks.push(() => {
      if (!scope) {
        task()
        return
      }
      if (scope.active) {
        scope.run(task)
      }
    })
  }

  function start() {
    if (started || painted.value) {
      return
    }
    started = true
    afterNextPaint(() => {
      painted.value = true
      for (const task of tasks.splice(0)) {
        task()
      }
    })
  }

  function allowsLive() {
    if (!options.defer) {
      return true
    }
    if (renderStart === null) {
      openRender()
      return true
    }
    return performance.now() - renderStart < LIVE_RENDER_BUDGET_MS
  }

  function openRender() {
    renderStart = performance.now()
    beforeNextFrame(() => {
      renderStart = null
    })
  }

  return { afterPaint, allowsLive, painted, start }
}

/** Calls `callback` once the next frame has painted. */
function afterNextPaint(callback: () => void) {
  beforeNextFrame(() => setTimeout(callback, 0))
}

/**
 * Calls `callback` before the next frame. A hidden page paints no frame, so there it only waits for
 * the current task to end.
 */
function beforeNextFrame(callback: () => void) {
  if (typeof document === 'undefined' || document.visibilityState === 'hidden') {
    setTimeout(callback, 0)
    return
  }
  requestAnimationFrame(callback)
}
