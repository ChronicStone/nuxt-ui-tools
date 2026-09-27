import { getCurrentScope, nextTick, onScopeDispose, ref } from 'vue'
import type { Ref } from 'vue'

import type { FormRenderScheduler } from '../types'

/**
 * Weight rendered at once in a frame: before the first paint, enough for what a screen shows;
 * after it, what a change such as an added row needs, while a large reveal renders in batches.
 */
const FRAME_WEIGHT = 48
/** Main-thread time a deferred batch aims for while the user interacts, so scrolling stays smooth. */
const FRAME_BUDGET_MS = 14
/** Main-thread time a deferred batch aims for while the user does not interact, to finish sooner. */
const IDLE_FRAME_BUDGET_MS = 40
/** Time after the last scroll, key, or pointer input during which the user counts as interacting. */
const INTERACTION_MS = 300
const MIN_BATCH = 1
/** A batch at most doubles from one frame to the next, so a cheap batch does not lead to a long one. */
const MAX_BATCH = 400

interface PendingSlot {
  ready: Ref<boolean>
  weight: number
  top?: () => number | undefined
}

/** Passes that fill the screen before the first paint, each after the previous one rendered. */
const FILL_ROUNDS = 8
/** Most weight the screen fill renders, in case placeholders are far smaller than what replaces them. */
const FILL_WEIGHT = 600

/** Longest wait for a frame: hidden tabs pause animation frames, and the form must still finish. */
const FRAME_FALLBACK_MS = 50

function nextFrame(callback: () => void) {
  let done = false
  function run() {
    if (!done) {
      done = true
      callback()
    }
  }
  if (import.meta.client) {
    requestAnimationFrame(run)
  }
  setTimeout(run, FRAME_FALLBACK_MS)
}

/**
 * Spreads the render of a large form over several frames. Fields and array rows claim a render
 * slot: slots within the frame weight render at once, and before the first paint the scheduler
 * keeps rendering the slots whose placeholder is on screen, so the first frame shows the screen
 * complete rather than filling in; the slots below it render in batches sized from the time the
 * previous batch took, measured once its frame has laid out and painted, since layout grows with
 * the page. Batches take a larger share of each frame while the user does not interact, and a
 * small one as soon as they scroll, type, or point.
 * Once the form has painted, an idle scheduler grants a frame weight at once again, so a small
 * change appears immediately; slots claimed while a batch renders, or beyond that weight, wait for
 * the next batch. Work queued before the first paint, such as field watchers, runs after it.
 * Anything needed earlier (a focus request) flushes the queue, and what the flushed slots render
 * in that frame renders at once too, so a nested target is there when the flush resolves.
 */
export function createFormRenderScheduler(options: {
  defer: boolean
  /** Height of the screen, which the first paint fills. */
  viewport?: () => number
  /** Calls `notify` on each user input while batches render, until the returned stop runs. */
  watchInput?: (notify: () => void) => () => void
}): FormRenderScheduler {
  const deferring = options.defer
  const painted = ref<boolean>(!deferring)
  const queue: PendingSlot[] = []
  const paintTasks: (() => void)[] = []
  let budget = FRAME_WEIGHT
  let batch = 16
  let scheduled = false
  let started = false
  let rendering = false
  let refilling = false
  let draining = false
  let lastInput = Number.NEGATIVE_INFINITY
  let stopWatchingInput: (() => void) | undefined

  if (getCurrentScope()) {
    onScopeDispose(() => {
      queue.length = 0
      stopWatchingInput?.()
      stopWatchingInput = undefined
    })
  }

  function noteInput() {
    lastInput = performance.now()
  }

  function frameBudget() {
    return performance.now() - lastInput < INTERACTION_MS ? FRAME_BUDGET_MS : IDLE_FRAME_BUDGET_MS
  }

  function claim(weight = 1, top?: () => number | undefined): Ref<boolean> {
    if (!deferring || draining) {
      return ref(true)
    }
    if (!rendering && queue.length === 0 && budget > 0) {
      budget -= weight
      refill()
      return ref(true)
    }
    const slot: PendingSlot = { ready: ref(false), top, weight }
    queue.push(slot)
    schedule()
    return slot.ready
  }

  function refill() {
    if (!painted.value || refilling) {
      return
    }
    refilling = true
    nextFrame(() => {
      refilling = false
      budget = FRAME_WEIGHT
    })
  }

  function schedule() {
    if (!painted.value || queue.length === 0) {
      stopWatchingInput?.()
      stopWatchingInput = undefined
      return
    }
    if (scheduled) {
      return
    }
    stopWatchingInput ??= options.watchInput?.(noteInput)
    scheduled = true
    nextFrame(renderBatch)
  }

  function renderBatch() {
    scheduled = false
    rendering = true
    const startedAt = performance.now()
    let spent = 0
    while (queue.length > 0 && spent < batch) {
      const slot = queue.shift()
      if (!slot) {
        break
      }
      slot.ready.value = true
      spent += slot.weight
    }
    void nextTick(() =>
      setTimeout(() => {
        rendering = false
        const elapsed = Math.max(performance.now() - startedAt, 1)
        const estimate = Math.round((spent * frameBudget()) / elapsed)
        batch = Math.min(MAX_BATCH, batch * 2, Math.max(MIN_BATCH, estimate))
        schedule()
      }, 0),
    )
  }

  function flush() {
    if (!deferring) {
      return
    }
    draining = true
    while (queue.length > 0) {
      const slot = queue.shift()
      if (slot) {
        slot.ready.value = true
      }
    }
    nextFrame(() => {
      draining = false
    })
  }

  function afterPaint(task: () => void) {
    if (painted.value) {
      task()
      return
    }
    const scope = getCurrentScope()
    paintTasks.push(() => {
      if (!scope) {
        task()
        return
      }
      if (scope.active) {
        scope.run(task)
      }
    })
  }

  async function fillViewport() {
    let filled = 0
    for (let round = 0; round < FILL_ROUNDS && filled < FILL_WEIGHT; round += 1) {
      // oxlint-disable-next-line no-await-in-loop -- each pass measures what the previous one rendered
      await nextTick()
      const bottom = options.viewport?.() ?? 0
      const visible = queue.filter((slot) => (slot.top?.() ?? bottom) < bottom)
      if (!visible.length) {
        return
      }
      for (const slot of visible) {
        queue.splice(queue.indexOf(slot), 1)
        slot.ready.value = true
        filled += slot.weight
      }
    }
  }

  function start() {
    if (started || painted.value) {
      return
    }
    started = true
    void fillViewport()
    nextFrame(() =>
      nextFrame(() => {
        painted.value = true
        budget = FRAME_WEIGHT
        for (const task of paintTasks.splice(0)) {
          task()
        }
        schedule()
      }),
    )
  }

  return { afterPaint, claim, flush, painted, start }
}
