import { describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'

import { useFilterTagSession } from '../../src/runtime/table/composables/use-filter-tag-session'

describe('filter tag session', () => {
  it('opens synchronously without a timer or animation-frame handoff', () => {
    const session = useFilterTagSession({
      hasCommittedState: () => false,
      onClose: vi.fn(),
      onDismiss: vi.fn(),
      onOpen: vi.fn(),
      onSessionClosed: vi.fn(),
    })

    session.open()
    expect(session.isOpen.value).toBeTruthy()
  })

  it('initializes an embedded editor without scheduling an overlay handoff', async () => {
    const onOpen = vi.fn()
    const isOpen = ref<boolean>(false)
    const session = useFilterTagSession({
      embedded: true,
      hasCommittedState: () => false,
      isOpen,
      onClose: vi.fn(),
      onDismiss: vi.fn(),
      onOpen,
      onSessionClosed: vi.fn(),
    })

    expect(session.isOpen.value).toBeTruthy()
    expect(isOpen.value).toBeTruthy()
    await Promise.resolve()
    expect(onOpen).toHaveBeenCalledOnce()
  })

  it('dismisses uncommitted dynamic sessions on close', () => {
    const onDismiss = vi.fn()
    const onClose = vi.fn()

    const session = useFilterTagSession({
      dynamic: true,
      hasCommittedState: () => false,
      onClose,
      onDismiss,
      onOpen: vi.fn(),
      onSessionClosed: vi.fn(),
    })

    session.handleOpenChange(true)
    session.handleOpenChange(false)

    expect(onClose).toHaveBeenCalledOnce()
    expect(onDismiss).toHaveBeenCalledOnce()
  })

  it('prefers session close notifications over dynamic dismissals', () => {
    const onSessionClosed = vi.fn()
    const onDismiss = vi.fn()

    const session = useFilterTagSession({
      dynamic: true,
      hasCommittedState: () => false,
      onClose: vi.fn(),
      onDismiss,
      onOpen: vi.fn(),
      onSessionClosed,
      session: true,
    })

    session.handleOpenChange(true)
    session.handleOpenChange(false)

    expect(onSessionClosed).toHaveBeenCalledOnce()
    expect(onDismiss).not.toHaveBeenCalled()
  })
})
