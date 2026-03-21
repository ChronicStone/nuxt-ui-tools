import { ref, watch, type Ref } from 'vue'

export interface UseFilterTagSessionParams {
  isOpen?: Ref<boolean>
  activationToken?: Ref<number | undefined>
  session?: boolean
  dynamic?: boolean
  hasCommittedState: () => boolean
  onActivated: () => void
  onOpen: () => void
  onClose: () => void
  onSessionClosed: () => void
  onDismiss: () => void
}

export function useFilterTagSession(options: UseFilterTagSessionParams) {
  const isOpen = options.isOpen ?? ref<boolean>(false)
  const lastActivationToken = ref<number | null>(null)

  let dismissLocked = false

  function runCloseEffects() {
    options.onClose()

    if (options.session) {
      options.onSessionClosed()
      return
    }

    if (options.dynamic && !options.hasCommittedState()) options.onDismiss()
  }

  function openWithLock() {
    dismissLocked = true
    setTimeout(() => {
      isOpen.value = true
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          dismissLocked = false
        })
      })
    })
  }

  function handleOpenChange(open: boolean) {
    if (!open && dismissLocked) return
    if (!open && !isOpen.value) return
    isOpen.value = open

    if (open) {
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

  if (options.activationToken) {
    queueMicrotask(() => {
      watch(
        options.activationToken!,
        (value) => {
          if (value == null || value === lastActivationToken.value) return
          lastActivationToken.value = value
          options.onActivated()
        },
        { immediate: true },
      )
    })
  }

  return {
    isOpen,
    openWithLock,
    handleOpenChange,
    close,
  }
}
