import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { effectScope, watch } from 'vue'

import { createFormRenderScheduler } from '#ui-tools/form/composables/use-form-render-scheduler'

beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
})

describe('form render scheduler', () => {
  it('renders the initial budget at once and the rest after the first paint', async () => {
    const scheduler = createFormRenderScheduler({ defer: true })
    const slots = Array.from({ length: 60 }, () => scheduler.claim())

    expect(slots.filter((slot) => slot.value)).toHaveLength(48)
    expect(scheduler.painted.value).toBe(false)

    scheduler.start()
    await vi.advanceTimersByTimeAsync(100)
    expect(scheduler.painted.value).toBe(true)
    await vi.advanceTimersByTimeAsync(1000)
    expect(slots.every((slot) => slot.value)).toBe(true)
  })

  it('grants every pending slot on flush and renders later claims at once', () => {
    const scheduler = createFormRenderScheduler({ defer: true })
    const slots = Array.from({ length: 60 }, () => scheduler.claim())

    scheduler.flush()
    expect(slots.every((slot) => slot.value)).toBe(true)
  })

  it('runs work queued before the paint once it happens, in the caller scope', async () => {
    const scheduler = createFormRenderScheduler({ defer: true })
    const task = vi.fn<() => void>()
    const stopped = vi.fn<() => void>()
    const scope = effectScope()
    scope.run(() => scheduler.afterPaint(task))
    const disposed = effectScope()
    disposed.run(() => scheduler.afterPaint(stopped))
    disposed.stop()

    expect(task).not.toHaveBeenCalled()
    scheduler.start()
    await vi.advanceTimersByTimeAsync(100)

    expect(task).toHaveBeenCalledOnce()
    expect(stopped).not.toHaveBeenCalled()
    expect(scheduler.claim().value).toBe(true)
    scope.stop()
  })

  it('renders a small change at once and a large reveal in batches once painted', async () => {
    const scheduler = createFormRenderScheduler({ defer: true })
    scheduler.start()
    await vi.advanceTimersByTimeAsync(100)

    expect(scheduler.claim(4).value).toBe(true)
    await vi.advanceTimersByTimeAsync(100)
    const rows = Array.from({ length: 100 }, () => scheduler.claim(4))

    expect(rows.filter((row) => row.value)).toHaveLength(12)
    await vi.advanceTimersByTimeAsync(5000)
    expect(rows.every((row) => row.value)).toBe(true)
  })

  it('queues what a batch reveals instead of rendering it with the batch', async () => {
    const scheduler = createFormRenderScheduler({ defer: true })
    Array.from({ length: 48 }, () => scheduler.claim())
    const container = scheduler.claim()
    scheduler.start()
    await vi.advanceTimersByTimeAsync(100)
    await vi.waitUntil(() => container.value, { interval: 1, timeout: 1000 })

    const children = Array.from({ length: 100 }, () => scheduler.claim(4))

    expect(children.some((child) => child.value)).toBe(false)
    await vi.advanceTimersByTimeAsync(5000)
    expect(children.every((child) => child.value)).toBe(true)
  })

  it('renders what a flush reveals in the same frame, for a nested focus target', () => {
    const scheduler = createFormRenderScheduler({ defer: true })
    Array.from({ length: 60 }, () => scheduler.claim())

    scheduler.flush()

    expect(Array.from({ length: 200 }, () => scheduler.claim(4)).every((slot) => slot.value)).toBe(
      true,
    )
  })

  it('renders the slots on screen before the first paint, and what they reveal on screen', async () => {
    const scheduler = createFormRenderScheduler({ defer: true, viewport: () => 800 })
    Array.from({ length: 48 }, () => scheduler.claim())
    const onScreen = scheduler.claim(6, () => 700)
    const below = scheduler.claim(6, () => 900)
    const hidden = scheduler.claim(6, () => undefined)
    let revealed = { value: false }
    watch(onScreen, (ready) => {
      if (ready) {
        revealed = scheduler.claim(6, () => 750)
      }
    })

    scheduler.start()
    await Promise.resolve()
    await Promise.resolve()
    await Promise.resolve()
    await Promise.resolve()

    expect(scheduler.painted.value).toBe(false)
    expect(onScreen.value).toBe(true)
    expect(revealed.value).toBe(true)
    expect(below.value).toBe(false)
    expect(hidden.value).toBe(false)
  })

  it('watches user input while batches render and stops once they are done or disposed', async () => {
    const stop = vi.fn<() => void>()
    const watchInput = vi.fn<(notify: () => void) => () => void>(() => stop)
    const scheduler = createFormRenderScheduler({ defer: true, watchInput })
    const slots = Array.from({ length: 200 }, () => scheduler.claim())
    scheduler.start()
    await vi.advanceTimersByTimeAsync(100)

    expect(watchInput).toHaveBeenCalledOnce()
    expect(stop).not.toHaveBeenCalled()
    await vi.advanceTimersByTimeAsync(10_000)
    expect(slots.every((slot) => slot.value)).toBe(true)
    expect(stop).toHaveBeenCalledOnce()

    const scope = effectScope()
    const disposed = vi.fn<() => void>()
    const pending = scope.run(() => {
      const owned = createFormRenderScheduler({ defer: true, watchInput: () => disposed })
      const claimed = Array.from({ length: 200 }, () => owned.claim())
      owned.start()
      return claimed
    })
    await vi.advanceTimersByTimeAsync(100)
    scope.stop()

    expect(disposed).toHaveBeenCalledOnce()
    await vi.advanceTimersByTimeAsync(10_000)
    expect(pending?.every((slot) => slot.value)).toBe(false)
  })

  it('renders everything at once when it does not defer', () => {
    const scheduler = createFormRenderScheduler({ defer: false })

    expect(Array.from({ length: 80 }, () => scheduler.claim()).every((slot) => slot.value)).toBe(
      true,
    )
    expect(scheduler.painted.value).toBe(true)
  })
})
