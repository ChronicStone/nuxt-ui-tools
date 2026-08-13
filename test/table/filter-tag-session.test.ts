import { describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'

import { useFilterTagSession } from '../../src/runtime/table/composables/use-filter-tag-session'

describe('filter tag session', () => {
  it('opens synchronously without a timer or animation-frame handoff', () => {
    const session = useFilterTagSession({
      hasCommittedState: () => false,
      onOpen: vi.fn(),
      onClose: vi.fn(),
      onSessionClosed: vi.fn(),
      onDismiss: vi.fn(),
    })

    session.open()
    expect(session.isOpen.value).toBe(true)
  })

  it('initializes an embedded editor without scheduling an overlay handoff', async () => {
    const onOpen = vi.fn()
    const isOpen = ref<boolean>(false)
    const session = useFilterTagSession({
      isOpen,
      embedded: true,
      hasCommittedState: () => false,
      onOpen,
      onClose: vi.fn(),
      onSessionClosed: vi.fn(),
      onDismiss: vi.fn(),
    })

    expect(session.isOpen.value).toBe(true)
    expect(isOpen.value).toBe(true)
    await Promise.resolve()
    expect(onOpen).toHaveBeenCalledTimes(1)
  })

  it('dismisses uncommitted dynamic sessions on close', () => {
    const onDismiss = vi.fn()
    const onClose = vi.fn()

    const session = useFilterTagSession({
      dynamic: true,
      hasCommittedState: () => false,
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
