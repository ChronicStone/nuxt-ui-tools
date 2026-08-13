import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick, ref } from 'vue'

import { useFilterTagSession } from '../../src/runtime/table/composables/use-filter-tag-session'

describe('filter tag session', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) =>
      setTimeout(() => callback(0), 0),
    )
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.useRealTimers()
  })

  it('activates only once per token value and opens through the locked session flow', async () => {
    const activationToken = ref<number | undefined>(undefined)
    const onActivated = vi.fn()

    const session = useFilterTagSession({
      activationToken,
      hasCommittedState: () => false,
      onActivated,
      onOpen: vi.fn(),
      onClose: vi.fn(),
      onSessionClosed: vi.fn(),
      onDismiss: vi.fn(),
    })

    activationToken.value = 1
    await nextTick()
    expect(onActivated).toHaveBeenCalledTimes(1)

    activationToken.value = 1
    await nextTick()
    expect(onActivated).toHaveBeenCalledTimes(1)

    session.openWithLock()
    vi.runAllTimers()
    expect(session.isOpen.value).toBe(true)
  })

  it('dismisses uncommitted dynamic sessions on close', () => {
    const onDismiss = vi.fn()
    const onClose = vi.fn()

    const session = useFilterTagSession({
      dynamic: true,
      hasCommittedState: () => false,
      onActivated: vi.fn(),
      onOpen: vi.fn(),
      onClose,
      onSessionClosed: vi.fn(),
      onDismiss,
    })

    session.handleOpenChange(true)
    session.handleOpenChange(false)

    expect(onClose).toHaveBeenCalledTimes(1)
    expect(onDismiss).toHaveBeenCalledTimes(1)
  })

  it('prefers session close notifications over dynamic dismissals', () => {
    const onSessionClosed = vi.fn()
    const onDismiss = vi.fn()

    const session = useFilterTagSession({
      session: true,
      dynamic: true,
      hasCommittedState: () => false,
      onActivated: vi.fn(),
      onOpen: vi.fn(),
      onClose: vi.fn(),
      onSessionClosed,
      onDismiss,
    })

    session.handleOpenChange(true)
    session.handleOpenChange(false)

    expect(onSessionClosed).toHaveBeenCalledTimes(1)
    expect(onDismiss).not.toHaveBeenCalled()
  })
})
