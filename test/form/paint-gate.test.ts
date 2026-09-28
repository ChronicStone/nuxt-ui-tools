import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { effectScope } from 'vue'

import { createFormPaintGate } from '#ui-tools/form/composables/use-form-paint'

beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
})

describe('form paint gate', () => {
  it('holds work until the form has painted, then runs it in the caller scope', async () => {
    const gate = createFormPaintGate({ defer: true })
    const task = vi.fn<() => void>()
    const disposedTask = vi.fn<() => void>()
    const scope = effectScope()
    scope.run(() => gate.afterPaint(task))
    const disposed = effectScope()
    disposed.run(() => gate.afterPaint(disposedTask))
    disposed.stop()

    expect(gate.painted.value).toBe(false)
    expect(task).not.toHaveBeenCalled()

    gate.start()
    await vi.advanceTimersByTimeAsync(50)

    expect(gate.painted.value).toBe(true)
    expect(task).toHaveBeenCalledOnce()
    expect(disposedTask).not.toHaveBeenCalled()
    scope.stop()
  })

  it('runs work at once when it does not defer or once the form has painted', async () => {
    const immediate = createFormPaintGate({ defer: false })
    const first = vi.fn<() => void>()
    immediate.afterPaint(first)
    expect(first).toHaveBeenCalledOnce()

    const deferred = createFormPaintGate({ defer: true })
    deferred.start()
    await vi.advanceTimersByTimeAsync(50)
    const late = vi.fn<() => void>()
    deferred.afterPaint(late)
    expect(late).toHaveBeenCalledOnce()
  })

  it('allows live rendering until the render of the frame has used its budget', async () => {
    let now = 1000
    vi.spyOn(performance, 'now').mockImplementation(() => now)
    const gate = createFormPaintGate({ defer: true })

    expect(gate.allowsLive()).toBe(true)
    now += 49
    expect(gate.allowsLive()).toBe(true)
    now += 2
    expect(gate.allowsLive()).toBe(false)

    await vi.advanceTimersByTimeAsync(0)
    now += 500
    expect(gate.allowsLive()).toBe(true)
    now += 60
    expect(gate.allowsLive()).toBe(false)
  })

  it('always allows live rendering and schedules nothing when it does not defer', () => {
    const gate = createFormPaintGate({ defer: false })
    vi.spyOn(performance, 'now').mockImplementation(() => 5000)

    expect(gate.allowsLive()).toBe(true)
    expect(gate.allowsLive()).toBe(true)
    expect(vi.getTimerCount()).toBe(0)
  })
})
