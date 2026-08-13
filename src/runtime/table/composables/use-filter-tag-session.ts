import { ref, type Ref } from 'vue'

export interface UseFilterTagSessionParams {
  isOpen?: Ref<boolean>
  session?: boolean
  dynamic?: boolean
  embedded?: boolean
  hasCommittedState: () => boolean
  onOpen: () => void
  onClose: () => void
  onSessionClosed: () => void
  onDismiss: () => void
}

export function useFilterTagSession(options: UseFilterTagSessionParams) {
  const isOpen = options.isOpen ?? ref<boolean>(false)
  if (options.embedded) isOpen.value = true

  function runCloseEffects() {
    options.onClose()

    if (options.session) {
      options.onSessionClosed()
      return
    }

    if (options.dynamic && !options.hasCommittedState()) options.onDismiss()
  }

  function open() {
    if (isOpen.value) return
    isOpen.value = true
    options.onOpen()
  }

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen && !isOpen.value) return
    isOpen.value = nextOpen

    if (nextOpen) {
      options.onOpen()
      return
    }

    runCloseEffects()
  }

  function close() {
    if (!isOpen.value) return
    isOpen.value = false
    runCloseEffects()
  }

  if (options.embedded) queueMicrotask(options.onOpen)

  return {
    isOpen,
    open,
    handleOpenChange,
    close,
  }
}
